'use strict'

const SPREADSHEET_ID = '1RtB6XGR0LmLQ4LTn-oI91SJ0q5Igvc2UbCEUEgoNdxY'
const SHEET_NAME = 'Sheet1'
const CLIENT_ID = '330261535237-3chkjt0a82io75auvrv3dotdial9eq2u.apps.googleusercontent.com'

// ─── Cross-browser Shim ───────────────────────────────────────────────────

const ext = typeof browser !== 'undefined' ? browser : chrome
const isFirefox = typeof browser !== 'undefined'

// ─── Auth ─────────────────────────────────────────────────────────────────
//
// Token-cache strategy (Chrome + Firefox):
//   1. After a successful interactive auth, store the access_token in
//      chrome.storage.session — survives popup close / extension reload,
//      and is wiped automatically when the browser restarts.
//   2. Every Sheets call reads from the cache first, never prompting.
//   3. On a 401 from Sheets, clear the cache and re-auth ONCE.
//   4. The "Connect Google Account" button is the only path that intentionally
//      forces a fresh interactive prompt.
//
// Net effect: user signs in exactly once per browser session.

const TOKEN_KEY = 'googleAuthToken'

async function getCachedToken() {
  try {
    const result = await ext.storage.session.get(TOKEN_KEY)
    return result?.[TOKEN_KEY] || null
  } catch (_) {
    return null
  }
}

async function setCachedToken(token) {
  try {
    await ext.storage.session.set({ [TOKEN_KEY]: token })
  } catch (_) { /* storage.session unavailable — fail silently */ }
}

async function clearCachedToken() {
  try {
    await ext.storage.session.remove(TOKEN_KEY)
  } catch (_) {}
}

function chromeGetToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
      else resolve(token)
    })
  })
}

function chromeRemoveCachedToken(token) {
  return new Promise(resolve => {
    if (!token) return resolve()
    chrome.identity.removeCachedAuthToken({ token }, resolve)
  })
}

// Firefox-only — runs the implicit OAuth flow via launchWebAuthFlow.
async function firefoxLaunchAuth() {
  if (!browser.identity || !browser.identity.launchWebAuthFlow) {
    throw new Error('Firefox: browser.identity API unavailable.')
  }

  let redirectURI
  try {
    redirectURI = browser.identity.getRedirectURL()
  } catch (_) {
    redirectURI = `https://${browser.runtime.id}.extensions.allizom.org/`
  }

  const authURL =
    'https://accounts.google.com/o/oauth2/auth?' +
    `client_id=${encodeURIComponent(CLIENT_ID)}&` +
    'response_type=token&' +
    `redirect_uri=${encodeURIComponent(redirectURI)}&` +
    `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets')}`

  let responseURL
  try {
    responseURL = await browser.identity.launchWebAuthFlow({
      url: authURL,
      interactive: true
    })
  } catch (e) {
    if (e.message?.includes('redirect_uri_mismatch') ||
        e.message?.includes('redirect URI')) {
      throw new Error(
        `Firefox OAuth redirect URI not registered. ` +
        `Add "${redirectURI}" to Google Cloud Console → Authorized redirect URIs.`
      )
    }
    throw e
  }

  const hash = new URL(responseURL).hash.slice(1)
  const token = new URLSearchParams(hash).get('access_token')
  if (!token) throw new Error('No access token received from Google')
  return token
}

// Unified token getter.
//   { interactive: false } → returns cached token only, never prompts (used by checkAuth)
//   { interactive: true }  → returns cached token or prompts once (used by save flow + Connect button)
//   { force: true }        → ignores cache and always prompts (used to retry after 401)
async function getAuthToken({ interactive = true, force = false } = {}) {
  if (!force) {
    const cached = await getCachedToken()
    if (cached) return cached
  }

  if (!interactive) return null

  const token = isFirefox
    ? await firefoxLaunchAuth()
    : await chromeGetToken(true)

  if (token) await setCachedToken(token)
  return token
}

// On a 401: drop the stale token from BOTH our cache and Chrome's cache,
// then ask for a fresh one. Called at most once per Sheets request.
async function refreshToken(staleToken) {
  await clearCachedToken()
  if (!isFirefox) await chromeRemoveCachedToken(staleToken)
  return getAuthToken({ interactive: true, force: true })
}

// ─── Duplicate Check ──────────────────────────────────────────────────────
//
// Returns { isDuplicate, rowNumber, existingDomain }.
//   - rowNumber is 1-indexed (matches Sheets UI row numbers)
//   - existingDomain is the value already in column J for that row, or ''
// We read columns A:J so we can spot rows that exist but have an empty
// domain cell, which lets the save flow patch them in place.

async function checkDuplicate(token, company, role) {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `/values/${encodeURIComponent(SHEET_NAME)}!A:J`

  let response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (response.status === 401) {
    token = await refreshToken(token)
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  }

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || `Sheets API error ${response.status}`)
  }

  const data = await response.json()
  const rows = data.values || []

  const compLower = company.toLowerCase().trim()
  const roleLower = role.toLowerCase().trim()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if ((row[0] || '').toLowerCase().trim() === compLower &&
        (row[1] || '').toLowerCase().trim() === roleLower) {
      return {
        isDuplicate: true,
        rowNumber: i + 1,                  // 1-indexed for the Sheets API range
        existingDomain: (row[9] || '').trim()
      }
    }
  }

  return { isDuplicate: false, rowNumber: null, existingDomain: '' }
}

// ─── Update a single cell ────────────────────────────────────────────────

async function updateCell(token, range, value) {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`

  const doUpdate = (tok) => fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${tok}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [[value]] })
  })

  let response = await doUpdate(token)
  if (response.status === 401) {
    token = await refreshToken(token)
    response = await doUpdate(token)
  }

  const result = await response.json()
  if (result.error) throw new Error(result.error.message)
  return true
}

// ─── Append Row ───────────────────────────────────────────────────────────

async function appendToSheets(jobData) {
  try {
    let token = await getAuthToken()

    const dup = await checkDuplicate(token, jobData.company, jobData.role)
    if (dup.isDuplicate) {
      // If the user typed a domain and the existing row's J cell is empty,
      // patch that single cell in place rather than rejecting as a duplicate.
      const newDomain = (jobData.domain || '').trim()
      if (newDomain && !dup.existingDomain) {
        await updateCell(token, `${SHEET_NAME}!J${dup.rowNumber}`, newDomain)
        return { success: true, updated: true, message: 'Domain added to existing entry' }
      }
      return { success: false, duplicate: true, error: 'Already tracked!' }
    }

    // Column order: A=Company B=Role C=JD D=Job Link E=Date Applied
    //               F=HR Name G=HR Email H=Email Sent I=Date Sent J=Company Domain
    const values = [[
      jobData.company,
      jobData.role,
      jobData.jd,
      jobData.url,
      jobData.date,
      '',
      '',
      'No',
      '',
      jobData.domain || ''
    ]]

    const appendURL =
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
      `/values/${encodeURIComponent(SHEET_NAME)}!A:J:append?valueInputOption=USER_ENTERED`

    const doAppend = (tok) => fetch(appendURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tok}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    })

    let response = await doAppend(token)

    // Cached token rejected by Google → refresh once and retry
    if (response.status === 401) {
      token = await refreshToken(token)
      response = await doAppend(token)
    }

    const result = await response.json()

    if (result.error) throw new Error(result.error.message)
    return { success: true }

  } catch (error) {
    const msg = error.message || String(error)
    if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
      return { success: false, error: 'No internet — check your connection' }
    }
    return { success: false, error: msg }
  }
}

// ─── Message Handler ──────────────────────────────────────────────────────

ext.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveToSheets') {
    appendToSheets(request.data).then(sendResponse)
    return true // keep channel open for async response
  }

  if (request.action === 'checkAuth') {
    // Pure cache check — never prompts. Works identically on Chrome + Firefox.
    getCachedToken()
      .then(token => sendResponse({ authenticated: !!token }))
      .catch(() => sendResponse({ authenticated: false }))
    return true
  }

  if (request.action === 'authInteractive') {
    // User clicked "Connect Google Account" — force a fresh prompt and
    // overwrite any cached token. This is the ONLY path that intentionally
    // shows the Google sign-in popup on demand.
    getAuthToken({ interactive: true, force: true })
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }

  if (request.action === 'signOut') {
    // Lets the user clear the cached token without restarting the browser.
    clearCachedToken()
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: true }))
    return true
  }

  if (request.action === 'getFirefoxRedirectURI') {
    // Lets the popup display the exact redirect URI the user must register
    // in Google Cloud Console for Firefox OAuth to work.
    try {
      const uri = browser.identity.getRedirectURL()
      sendResponse({ uri })
    } catch (_) {
      sendResponse({ uri: `https://${browser.runtime.id}.extensions.allizom.org/` })
    }
    return false
  }
})
