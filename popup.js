'use strict'

// ─── Cross-browser shim ───────────────────────────────────────────────────

const ext = typeof browser !== 'undefined' ? browser : chrome

// ─── Tab URL (set on init, used when saving) ──────────────────────────────
let currentTabUrl = ''

// ─── DOM references ───────────────────────────────────────────────────────

const states = {
  loading:  document.getElementById('state-loading'),
  'not-job': document.getElementById('state-not-job'),
  form:     document.getElementById('state-form'),
  success:  document.getElementById('state-success')
}

const fieldCompany    = document.getElementById('field-company')
const fieldRole       = document.getElementById('field-role')
const fieldJD         = document.getElementById('field-jd')
const fieldDate       = document.getElementById('field-date')
const confidenceBadge = document.getElementById('confidence-badge')
const lowWarning      = document.getElementById('low-confidence-warning')

const btnSave         = document.getElementById('btn-save')
const btnReextract    = document.getElementById('btn-reextract')
const btnSaveAnother  = document.getElementById('btn-save-another')
const btnConnect      = document.getElementById('btn-connect')
const authBanner      = document.getElementById('auth-banner')

const statusBar       = document.getElementById('status-bar')
const statusSpinner   = document.getElementById('status-spinner')
const statusMessage   = document.getElementById('status-message')
const successDetail   = document.getElementById('success-detail')

// ─── State machine ────────────────────────────────────────────────────────

function showState(name) {
  Object.entries(states).forEach(([key, el]) => {
    el.classList.toggle('hidden', key !== name)
  })
}

// ─── Status bar ───────────────────────────────────────────────────────────

function showStatus(message, type) {
  statusBar.classList.remove('hidden', 'status-success', 'status-warning', 'status-error', 'status-saving')
  statusBar.classList.add(`status-${type}`)
  statusMessage.textContent = message
  statusSpinner.classList.toggle('hidden', type !== 'saving')
}

function hideStatus() {
  statusBar.classList.add('hidden')
  statusSpinner.classList.add('hidden')
}

// ─── Date helpers ─────────────────────────────────────────────────────────

// Populate date input (type="date" uses YYYY-MM-DD internally)
function todayInputValue() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Convert YYYY-MM-DD (input value) to MM/DD/YYYY (for Sheets)
function inputToMMDDYYYY(val) {
  if (!val) return ''
  const [yyyy, mm, dd] = val.split('-')
  return `${mm}/${dd}/${yyyy}`
}

// ─── Confidence badge ─────────────────────────────────────────────────────

function setConfidence(level) {
  confidenceBadge.textContent = level.toUpperCase()
  confidenceBadge.className = `confidence-badge confidence-${level}`
  if (level === 'low') {
    lowWarning.classList.remove('hidden')
  } else {
    lowWarning.classList.add('hidden')
  }
}

// ─── Populate form ────────────────────────────────────────────────────────

function populateForm(data) {
  fieldCompany.value = data.company || ''
  fieldRole.value    = data.role    || ''
  fieldJD.value      = data.jd      || ''

  // Prefer the date from extraction (already MM/DD/YYYY from content.js)
  // but the date <input> needs YYYY-MM-DD
  if (data.date && data.date.includes('/')) {
    const [mm, dd, yyyy] = data.date.split('/')
    fieldDate.value = `${yyyy}-${mm}-${dd}`
  } else {
    fieldDate.value = todayInputValue()
  }

  setConfidence(data.confidence || 'low')
  hideStatus()
  btnSave.disabled = false
}

// ─── Auth banner ─────────────────────────────────────────────────────────
// Silently checks if a Google token is cached. If not, shows a blue
// "Connect Google Account" banner so the user can authenticate BEFORE
// clicking Save (preventing a surprise popup mid-save).
function checkAndShowAuthBanner() {
  ext.runtime.sendMessage({ action: 'checkAuth' }, (resp) => {
    if (ext.runtime.lastError) return
    if (!resp?.authenticated) {
      authBanner.classList.remove('hidden')
    }
  })
}

function connectGoogle() {
  btnConnect.disabled = true
  btnConnect.textContent = 'Connecting…'
  ext.runtime.sendMessage({ action: 'authInteractive' }, (resp) => {
    if (ext.runtime.lastError || !resp?.success) {
      btnConnect.disabled = false
      btnConnect.textContent = 'Connect Google Account'
      const msg = resp?.error || 'Sign-in failed — try again'
      // If it mentions redirect URI, show the exact URI the user must register
      if (msg.includes('redirect URI') || msg.includes('redirect_uri')) {
        ext.runtime.sendMessage({ action: 'getFirefoxRedirectURI' }, (r) => {
          showStatus(
            `Add this URI to Google Cloud Console → Credentials → Authorized redirect URIs:\n${r?.uri || msg}`,
            'error'
          )
        })
      } else {
        showStatus(msg, 'error')
      }
      return
    }
    authBanner.classList.add('hidden')
    hideStatus()
  })
}

// ─── Extract & populate ───────────────────────────────────────────────────

function extractAndPopulate(tabId) {
  ext.tabs.sendMessage(tabId, { action: 'extractJob' }, (response) => {
    if (ext.runtime.lastError || !response) {
      showState('form')
      fieldDate.value = todayInputValue()
      showStatus('Could not read page — enter details manually', 'warning')
      return
    }
    populateForm(response)
    showState('form')
    checkAndShowAuthBanner()
  })
}

// ─── Save to Sheets ───────────────────────────────────────────────────────

function saveToSheets() {
  const company = fieldCompany.value.trim()
  const role    = fieldRole.value.trim()

  if (!company) {
    fieldCompany.focus()
    showStatus('Company name is required', 'error')
    return
  }
  if (!role) {
    fieldRole.focus()
    showStatus('Role is required', 'error')
    return
  }

  const jobData = {
    company,
    role,
    jd:   fieldJD.value.slice(0, 10000),
    url:  currentTabUrl,
    date: inputToMMDDYYYY(fieldDate.value) || inputToMMDDYYYY(todayInputValue())
  }

  btnSave.disabled = true
  showStatus('Saving…', 'saving')

  ext.runtime.sendMessage({ action: 'saveToSheets', data: jobData }, (response) => {
    if (ext.runtime.lastError) {
      btnSave.disabled = false
      showStatus(ext.runtime.lastError.message || 'Extension error', 'error')
      return
    }

    if (!response) {
      btnSave.disabled = false
      showStatus('No response from background — try again', 'error')
      return
    }

    if (response.success) {
      successDetail.textContent = `${company} · ${role}`
      showState('success')
      return
    }

    if (response.duplicate) {
      btnSave.disabled = false
      showStatus('This job is already in your sheet!', 'warning')
      return
    }

    btnSave.disabled = false
    showStatus(response.error || 'Unknown error', 'error')
  })
}

// ─── Initialization ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  showState('loading')

  let tabs
  try {
    tabs = await ext.tabs.query({ active: true, currentWindow: true })
  } catch (e) {
    showState('not-job')
    return
  }

  const tab = tabs[0]
  if (!tab?.id) {
    showState('not-job')
    return
  }

  // Store tab URL so saveToSheets() can include it as the Job Link
  currentTabUrl = tab.url || ''

  ext.tabs.sendMessage(tab.id, { action: 'checkPage' }, (response) => {
    if (ext.runtime.lastError) {
      // Content script not injected yet — ask user to reload
      showState('form')
      fieldDate.value = todayInputValue()
      showStatus('Refresh the page and try again', 'error')
      return
    }

    if (!response?.isJobPage) {
      showState('not-job')
      return
    }

    extractAndPopulate(tab.id)
  })

  // ── Button bindings ────────────────────────────────────────────────────

  btnSave.addEventListener('click', saveToSheets)
  btnConnect.addEventListener('click', connectGoogle)

  btnReextract.addEventListener('click', () => {
    if (!tab?.id) return
    showStatus('Re-extracting…', 'saving')
    btnReextract.disabled = true
    ext.tabs.sendMessage(tab.id, { action: 'extractJob' }, (response) => {
      btnReextract.disabled = false
      if (ext.runtime.lastError || !response) {
        showStatus('Could not re-extract — try reloading the page', 'error')
        return
      }
      populateForm(response)
    })
  })

  btnSaveAnother.addEventListener('click', () => {
    // Reset form and go back to form state
    fieldCompany.value = ''
    fieldRole.value    = ''
    fieldJD.value      = ''
    fieldDate.value    = todayInputValue()
    hideStatus()
    btnSave.disabled   = false
    setConfidence('low')
    extractAndPopulate(tab.id)
  })
})
