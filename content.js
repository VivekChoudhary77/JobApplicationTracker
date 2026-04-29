;(function () {
  'use strict'

  // ─── Site Detection ───────────────────────────────────────────────────────

  function getSite() {
    const host = window.location.hostname.toLowerCase()
    if (host.includes('linkedin'))       return 'linkedin'
    if (host.includes('indeed'))         return 'indeed'
    if (host.includes('glassdoor'))      return 'glassdoor'
    if (host.includes('ziprecruiter'))   return 'ziprecruiter'
    if (host.includes('dice'))           return 'dice'
    if (host.includes('oracle'))         return 'oracle'
    if (host.includes('greenhouse'))     return 'greenhouse'
    if (host.includes('lever'))          return 'lever'
    if (host.includes('workday') || host.includes('myworkdayjobs')) return 'workday'
    if (host.includes('taleo'))          return 'taleo'
    if (host.includes('icims'))          return 'icims'
    if (host.includes('smartrecruiters')) return 'smartrecruiters'
    if (host.includes('bamboohr'))       return 'bamboohr'
    if (host.includes('ashbyhq'))        return 'ashby'
    if (host.includes('rippling'))       return 'rippling'
    if (host.includes('wellfound'))      return 'wellfound'
    if (host.includes('weworkremotely')) return 'weworkremotely'
    if (host.includes('remoteok'))       return 'remoteok'
    if (host.includes('flexjobs'))       return 'flexjobs'
    if (host.includes('careerbuilder'))  return 'careerbuilder'
    if (host.includes('monster'))        return 'monster'
    if (host.includes('usajobs'))        return 'usajobs'
    if (host.includes('joinhandshake') || host.includes('handshake')) return 'handshake'
    if (host.includes('paycomonline') || host.includes('paycom')) return 'paycom'
    if (host.includes('ultipro') || host.includes('ukg')) return 'ultipro'
    if (host.includes('eightfold'))      return 'eightfold'
    if (host.includes('netflix'))        return 'netflix'
    return null
  }

  // ─── Selector Maps ────────────────────────────────────────────────────────

  const SELECTORS = {
    linkedin: {
      company: [
        // Dedicated job page (linkedin.com/jobs/view/...)
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name',
        // Feed / collections page panel
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name',
        // Older layouts
        '.topcard__org-name-link',
        '.topcard__flavor a',
        // Generic fallback
        '[data-test-app-aware-link]',
        'a[data-control-name="employer_org_image_link"]'
      ],
      role: [
        // Dedicated job page
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title',
        // Feed / collections page panel
        '.jobs-unified-top-card__job-title h1',
        '.jobs-unified-top-card__job-title',
        // Older layouts
        '.topcard__title',
        'h1.job-title',
        'h1[class*="job-title"]'
      ],
      jd: [
        // Dedicated job page
        '.jobs-description__content .jobs-box__html-content',
        '.jobs-description-content__text',
        // Feed / collections page panel
        '.jobs-description__container',
        '.jobs-description',
        // Common fallbacks
        '#job-details',
        '.description__text',
        '[class*="jobs-box__html-content"]'
      ]
    },

    indeed: {
      company: [
        '[data-company-name]',
        '.jobsearch-CompanyInfoWithoutHeaderImage span',
        '.css-1ioi40n',
        '[data-testid="inlineHeader-companyName"]'
      ],
      role: [
        '.jobsearch-JobInfoHeader-title span',
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        'h1.jobTitle'
      ],
      jd: [
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '[id="jobDescriptionText"]'
      ]
    },

    glassdoor: {
      company: [
        '[data-test="employer-name"]',
        '.employerName',
        '.css-16nw49e',
        'h4.jobLink'
      ],
      role: [
        '[data-test="job-title"]',
        '.job-title',
        'h1.title',
        '.css-1j389vi'
      ],
      jd: [
        '[class*="JobDescription_jobDescriptionContainer"]',
        '.jobDescriptionContent',
        '#JobDescriptionContainer',
        '.desc'
      ]
    },

    ziprecruiter: {
      company: [
        '[data-testid="job-detail-company"]',
        '.hiring_company_text',
        'a.t_org_link',
        '.job_details_header .t_org_link'
      ],
      role: [
        '[data-testid="job-detail-title"]',
        'h1.job_title',
        '.job_details_header h1'
      ],
      jd: [
        '[data-testid="job-description"]',
        '.job_description',
        '#job_desc',
        '.jobDescriptionSection'
      ]
    },

    dice: {
      company: [
        '[data-cy="companyNameLink"]',
        '.employer-name',
        'a[data-cy="company-name"]',
        '.company-name-label'
      ],
      role: [
        '[data-cy="jobTitle"]',
        'h1.jobTitle',
        '.job-overview-title'
      ],
      jd: [
        '[data-cy="jobDescription"]',
        '.job-description',
        '#jobdescSec'
      ]
    },

    greenhouse: {
      company: [
        // Hosted Greenhouse: boards.greenhouse.io/{slug}/jobs/{id}
        // or {slug}.greenhouse.io/jobs/{id}
        () => {
          // Try "Role at Company" page title pattern
          if (document.title.includes(' at ')) {
            return document.title.split(' at ').slice(1).join(' at ').trim()
          }
          return null
        },
        () => {
          // boards.greenhouse.io/{companySlug}/... → extract slug from path
          const host = window.location.hostname
          if (host.includes('boards.greenhouse') || host.includes('job-boards.greenhouse')) {
            const slug = window.location.pathname.split('/').filter(Boolean)[0]
            // Capitalise first letter and replace hyphens with spaces
            return slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null
          }
          // {company}.greenhouse.io → extract subdomain
          if (host.includes('.greenhouse.io')) {
            const sub = host.split('.')[0]
            return sub !== 'boards' && sub !== 'job' ? sub.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null
          }
          return null
        },
        // DOM selectors (hosted & embedded boards)
        '.company-name',
        '#header .company-name',
        '[class*="company"]'
      ],
      role: [
        '.app-title',
        'h1.app-title',
        '#header h1',
        '.posting-headline h2',
        'h1.job-title',
        'h1[class*="title"]',
        // Last resort: first H1
        'h1'
      ],
      jd: [
        '#content .section',
        '#job_description',
        '.job-description',
        '#content',
        '.content',
        '[class*="description"]'
      ]
    },

    lever: {
      company: [
        // Lever DOM element (most precise when present)
        '.main-header-name a',
        '.main-header-name',
        // Title parsing — Lever uses TWO formats:
        //   "Company - Role"  (e.g. "Age of Learning - AI Chatbot Engineer Intern")
        //   "Role at Company" (some custom boards)
        () => {
          const t = document.title
          if (t.includes(' at ')) {
            return t.split(' at ').slice(1).join(' at ').trim()
          }
          // "Company - Role" — take the FIRST segment
          const parts = t.split(' - ').map(s => s.trim()).filter(Boolean)
          if (parts.length >= 2 && parts[0].length > 1 && parts[0].length < 80) {
            return parts[0]
          }
          return null
        },
        // Last resort: URL path slug — only if it looks like a readable name
        () => {
          const slug = window.location.pathname.split('/').filter(Boolean)[0]
          if (slug && slug.includes('-') && slug.length > 4) {
            return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          }
          return null
        }
      ],
      role: [
        '.posting-headline h2',
        'h2[data-qa="posting-name"]',
        '.posting-name',
        'h2[class*="posting"]',
        () => {
          const t = document.title
          if (t.includes(' at ')) return t.split(' at ')[0].trim()
          // "Company - Role" — take the SECOND segment
          const parts = t.split(' - ').map(s => s.trim()).filter(Boolean)
          if (parts.length >= 2) return parts[1]
          return null
        },
        'h2'
      ],
      jd: [
        // Use the parent .posting-description container first — it contains
        // all sections and avoids picking up the posting header/metadata
        '.posting-description',
        // Scoped multi-concatenation as fallback for split-section layouts
        { multi: '.posting-description .section-wrapper', sep: '\n\n' },
        { multi: '.posting-description .section', sep: '\n\n' },
        '[data-qa="job-description"]',
        '[class*="posting-description"]',
        '#content'
      ]
    },

    workday: {
      company: [
        // 1. URL subdomain — Workday always has the company slug as the first
        //    subdomain segment: cambiumlearning.wd1.myworkdayjobs.com → "Cambium Learning".
        //    This is the most reliable signal because it's part of the URL itself.
        () => {
          const host = window.location.hostname.toLowerCase()
          const slug = host.split('.')[0]
          if (!slug || slug === 'www') return null
          // Title-case, splitting on dashes/underscores: "cambium-learning" → "Cambium Learning"
          return slug
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim()
        },
        // 2. Page title — usually "Role - Company Careers" or "Company - Role"
        () => {
          const t = document.title
          const parts = t.split(/[|\-\u2013\u2014]/).map(s => s.trim()).filter(Boolean)
          // Common pattern: last segment with "Careers" suffix is the company
          const careers = parts.find(p => /\bcareers?\b/i.test(p))
          if (careers) return careers.replace(/\bcareers?\b/i, '').trim()
          // Otherwise the LAST non-role segment is usually the company
          return parts.length >= 2 ? parts[parts.length - 1] : null
        }
      ],
      role: [
        '[data-automation-id="jobPostingHeader"] h2',
        '[data-automation-id="jobPostingHeader"] h1',
        '[data-automation-id="jobPostingHeader"]',
        'h2.css-nbb0qz',
        'h1[data-automation-id="jobPostingHeader"]'
      ],
      jd: [
        '[data-automation-id="jobPostingDescription"]',
        '.css-cygeeu',
        '[data-automation-id="job-posting-details"]'
      ]
    },

    taleo: {
      company: [
        '.organizationName',
        '[class*="company"]',
        () => document.title.split('-').pop()?.trim() || null
      ],
      role: [
        '.requisitionTitle',
        'h1[class*="title"]',
        '.jobTitle'
      ],
      jd: [
        '#requisitionDescriptionInterface',
        '.jobdescription',
        '[class*="description"]'
      ]
    },

    icims: {
      company: [
        '.iCIMS_Header .iCIMS_PageTitle h1',
        '.iCIMS_Logo img[alt]',
        () => {
          const img = document.querySelector('.iCIMS_Logo img')
          return img?.alt || null
        }
      ],
      role: [
        '.iCIMS_JobTitle h1',
        'h1.iCIMS_PageTitle',
        '.iCIMS_JobTitle'
      ],
      jd: [
        '#iCIMS_Content',
        '.iCIMS_JobContent',
        '[class*="iCIMS_"]'
      ]
    },

    smartrecruiters: {
      company: [
        '.company-name',
        '[itemprop="hiringOrganization"] [itemprop="name"]',
        'h2.company-name'
      ],
      role: [
        'h1.job-title',
        '[itemprop="title"]',
        '.job-detail h1'
      ],
      jd: [
        '[itemprop="description"]',
        '.job-sections',
        '#job-description'
      ]
    },

    bamboohr: {
      company: [
        '.BambooHR-ATS-board-title',
        '.company-name',
        () => document.title.split(' - ').pop()?.trim() || null
      ],
      role: [
        '.BambooHR-ATS-Jobs-item h2',
        'h2.BambooHR-ATS-Jobs-item-title',
        'h1[class*="title"]'
      ],
      jd: [
        '.BambooHR-ATS-board',
        '#content',
        '[class*="description"]'
      ]
    },

    ashby: {
      company: [
        // DOM selectors first
        '._company_name',
        '.ashby-job-posting-brief-company-name',
        '[class*="CompanyName"]',
        '[class*="companyName"]',
        // Ashby URL format: jobs.ashbyhq.com/{CompanySlug}/...
        // The slug is in the PATH, not the subdomain
        () => {
          const slug = window.location.pathname.split('/').filter(Boolean)[0]
          if (slug && slug.length > 1) {
            // Convert slug to readable name: "open-light" → "Open Light"
            return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          }
          return null
        },
        // Fallback: page title often has company name
        () => {
          const t = document.title
          if (t.includes(' - ')) return t.split(' - ').pop().trim()
          if (t.includes(' | ')) return t.split(' | ').pop().trim()
          return null
        }
      ],
      role: [
        // Ashby uses hashed CSS modules — target by tag + common patterns
        'h1._title',
        'h1[class*="title"]',
        'h1[class*="Title"]',
        '.ashby-job-posting-brief-title',
        // Fallback: first h1 on page
        'h1'
      ],
      jd: [
        '._jobDescription',
        '[class*="jobDescription"]',
        '[class*="JobDescription"]',
        '.ashby-job-posting-description',
        '[class*="description"]',
        'main'
      ]
    },

    rippling: {
      company: [
        '[class*="company-name"]',
        '.job-company-name',
        () => document.title.split(' - ').pop()?.trim() || null
      ],
      role: [
        'h1[class*="job-title"]',
        '.job-title',
        'h1[class*="title"]'
      ],
      jd: [
        '[class*="job-description"]',
        '[class*="description"]',
        '#job-description'
      ]
    },

    wellfound: {
      company: [
        '[data-test="company-name"]',
        '.startup-link',
        'a.u-regularLink[href*="/company"]'
      ],
      role: [
        'h1[data-test="job-title"]',
        '.role-title',
        'h1.title'
      ],
      jd: [
        '[data-test="job-description"]',
        '.job-description',
        '.description'
      ]
    },

    weworkremotely: {
      company: [
        'header.company-card h2 a',
        '.company-card .listing-company-name',
        'span.company-name'
      ],
      role: [
        'h1.listing-header-container',
        'h2.listing-header',
        '.job-listing-title h1'
      ],
      jd: [
        '[id="job-listing-show-container"] .listing-container',
        '.job-description',
        '#job-listing-show'
      ]
    },

    remoteok: {
      company: [
        'h2[itemprop="hiringOrganization"]',
        '.company_and_position h2',
        '[class*="company"]'
      ],
      role: [
        'h2[itemprop="title"]',
        '.company_and_position h1',
        'h2[class*="position"]'
      ],
      jd: [
        '[class*="description"]',
        '.job-description',
        '[itemprop="description"]'
      ]
    },

    flexjobs: {
      company: [
        '.sc-beqWAB',
        '[class*="company-name"]',
        '.job-company'
      ],
      role: [
        'h1[class*="job-title"]',
        'h1.job-title',
        'h1[itemprop="title"]'
      ],
      jd: [
        '[class*="job-description"]',
        '.job-description',
        '[itemprop="description"]'
      ]
    },

    careerbuilder: {
      company: [
        '.data-display-header__title a',
        '[class*="employer"]',
        '.company-name'
      ],
      role: [
        'h1[class*="job-title"]',
        '.job-title',
        'h1.title'
      ],
      jd: [
        '[class*="job-description"]',
        '#job-description',
        '.description-details'
      ]
    },

    monster: {
      company: [
        '[class*="company-name"]',
        '.company',
        '[itemprop="hiringOrganization"] [itemprop="name"]'
      ],
      role: [
        'h1[class*="job-title"]',
        'h1[itemprop="title"]',
        '.title'
      ],
      jd: [
        '[class*="job-description"]',
        '[itemprop="description"]',
        '#JobDescription'
      ]
    },

    usajobs: {
      company: [
        '.usajobs-joa-header__agency',
        '[class*="agency-name"]',
        '.hiring-agency'
      ],
      role: [
        'h1.usajobs-joa-header__position-title',
        '.position-title h1',
        'h1[class*="title"]'
      ],
      jd: [
        '#duties',
        '.usajobs-joa-section__body',
        '#job-summary'
      ]
    },

    handshake: {
      company: [
        '[class*="employer-name"]',
        '.employer-profile-name',
        '[data-testid="employer-name"]'
      ],
      role: [
        'h1[class*="job-title"]',
        '.job-listing-title',
        'h1[data-testid="job-title"]'
      ],
      jd: [
        '[class*="job-description"]',
        '.job-posting-content',
        '[data-testid="description"]'
      ]
    },

    // Oracle Recruiting Cloud — eeho.fa.us2.oraclecloud.com / careers.oracle.com
    oracle: {
      company: [
        // Oracle-hosted company career pages use the subdomain or page title
        () => {
          const t = document.title
          if (t.includes(' | ')) return t.split(' | ').slice(1).join(' | ').trim()
          if (t.includes(' - ')) return t.split(' - ').pop().trim()
          return null
        },
        '[class*="company-name"]',
        '[class*="companyName"]',
        '.company-name',
        // Oracle's own careers site
        () => window.location.hostname.includes('oracle') ? 'Oracle' : null
      ],
      role: [
        // Oracle Recruiting Cloud
        'h1[data-bind*="jobTitle"]',
        '[data-bind*="jobTitle"]',
        'h1[class*="title"]',
        'h1[class*="Title"]',
        // Page title first segment
        () => {
          const parts = document.title.split(' | ')
          return parts.length >= 2 ? parts[0].trim() : null
        },
        'h1'
      ],
      jd: [
        // Oracle Recruiting Cloud — data-bind="html: description" is the
        // Knockout.js binding for the actual description HTML content
        '[data-bind*="jobDescription"]',
        '[data-bind*="description"]',
        // Try next sibling of any element whose text is exactly "JOB DESCRIPTION"
        () => {
          const headings = document.querySelectorAll('h1,h2,h3,h4,span,div,p')
          for (const h of headings) {
            if (h.childElementCount === 0 &&
                h.textContent.trim().toUpperCase() === 'JOB DESCRIPTION') {
              const content = h.nextElementSibling || h.parentElement?.nextElementSibling
              const text = content?.innerText?.trim()
              if (text && text.length >= 80) return text
            }
          }
          return null
        },
        // Oracle section containers
        'section[aria-label*="escription"]',
        'section[aria-label*="escription"] p',
        '.oj-flex-item[class*="description"]',
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '#job-description',
        // Wide fallback — main content area, skipping nav/header
        'main article',
        'main section',
        'article'
      ]
    },

    // Paycom ATS — recruiting.paycomonline.net
    paycom: {
      company: [
        '.client-name',
        '[class*="clientName"]',
        '[class*="company-name"]',
        // Page title format: "Job Title | Company | Paycom"
        () => {
          const parts = document.title.split('|').map(s => s.trim())
          return parts.length >= 2 ? parts[parts.length - 2] : null
        }
      ],
      role: [
        'h1[class*="job-title"]',
        '.job-title',
        'h1[class*="title"]',
        // Page title: first segment before |
        () => {
          const parts = document.title.split('|').map(s => s.trim())
          return parts.length >= 2 ? parts[0] : null
        },
        'h1'
      ],
      jd: [
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '#jobDescription',
        '.job-description',
        '[class*="description"]'
      ]
    },

    // UltiPro / UKG — recruiting.ultipro.com / *.ultipro.com / *.ukg.com
    ultipro: {
      company: [
        // 1. Page title is most reliable: "Role | Company" or "Role - Company"
        //    e.g. "AI Intern | MVB" → "MVB"
        () => {
          const skip = /ultipro|ukg|job details|careers|apply|opportunity/i
          const parts = document.title.split(/[|\u2013\u2014]/).map(s => s.trim()).filter(Boolean)
          // Reverse so we check the last segment first (usually the company name)
          const company = [...parts].reverse().find(p => !skip.test(p) && p.length >= 2 && p.length < 60)
          return company || null
        },
        // 2. URL path: recruiting.ultipro.com/{companyCode}/...
        //    e.g. "mvb1000mvbb" → leading alpha chars → "MVB"
        () => {
          const code = window.location.pathname.split('/').filter(Boolean)[0]
          if (code) {
            const letters = code.match(/^[a-zA-Z]+/)
            if (letters && letters[0].length >= 2) return letters[0].toUpperCase()
          }
          return null
        },
        // 3. Specific DOM elements (lower priority)
        '.employer-name',
        '[class*="employer-name"]',
        // 4. Header logo alt text — header/nav only to avoid footer EEO images
        () => {
          const logo = document.querySelector('header img[alt], nav img[alt], .navbar img[alt]')
          if (logo?.alt && logo.alt.length > 1 && logo.alt.length < 80) {
            const alt = logo.alt.trim()
            if (!/^(logo|icon|home|site|banner|equal|opportunity)$/i.test(alt)) return alt
          }
          return null
        }
      ],
      role: [
        // UltiPro standard selectors
        'h1[class*="title"]',
        'h1[class*="opportunity"]',
        '.opportunity-title',
        '[class*="job-title"]',
        'h1',
        // Page title first segment
        () => {
          const parts = document.title.split('|').map(s => s.trim()).filter(Boolean)
          return parts.length >= 1 ? parts[0] : null
        }
      ],
      jd: [
        // UltiPro job description containers
        '.opportunity-description',
        '[class*="opportunity-detail"]',
        '[class*="opportunityDetail"]',
        '#opportunityDetailBody',
        '.job-description',
        '[class*="job-description"]',
        // Try the description section specifically
        () => {
          const heading = Array.from(document.querySelectorAll('h2,h3,h4'))
            .find(el => /description|details|about/i.test(el.textContent))
          if (heading) {
            const content = heading.nextElementSibling
            const text = content?.innerText?.trim()
            if (text && text.length >= 80) return text
          }
          return null
        },
        'main'
      ]
    },

    // Eightfold AI — *.eightfold.ai/careers/job/...
    // The company subdomain is the company slug, and the URL often contains
    // a `?domain=companyname.com` parameter that gives us the domain directly.
    eightfold: {
      company: [
        // 1. URL subdomain: ralliant.eightfold.ai → "Ralliant"
        () => {
          const host = window.location.hostname.toLowerCase()
          const slug = host.split('.')[0]
          if (!slug || slug === 'www' || slug === 'careers') return null
          return slug
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim()
        },
        // 2. Page title — usually "Role at Company" or "Company - Role"
        () => {
          const t = document.title
          if (/\bat\s+/.test(t)) return t.split(/\s+at\s+/).pop()?.trim() || null
          const parts = t.split(/[|\-\u2013\u2014]/).map(s => s.trim()).filter(Boolean)
          return parts.length >= 2 ? parts[parts.length - 1] : null
        },
        '.company-name',
        '[class*="company-name"]'
      ],
      role: [
        'h1.position-title',
        'h1[class*="position-title"]',
        'h1[class*="job-title"]',
        '[data-test-id="position-title"]',
        'h1'
      ],
      jd: [
        '[data-test-id="position-description"]',
        '.position-description',
        '[class*="position-description"]',
        '[class*="job-description"]',
        'main'
      ]
    },

    // Netflix Careers — explore.jobs.netflix.net / jobs.netflix.com
    netflix: {
      company: [
        () => 'Netflix' // The company is always Netflix on these domains
      ],
      role: [
        'h1.job-title',
        'h1[class*="job-title"]',
        'h1[class*="position"]',
        'h1'
      ],
      jd: [
        '[class*="job-description"]',
        '[class*="position-description"]',
        'main',
        'article'
      ]
    },

    generic: {
      company: [
        '[class*="company-name"]',
        '[class*="employer-name"]',
        '[class*="organization-name"]',
        '[itemprop="hiringOrganization"] [itemprop="name"]',
        'meta[property="og:site_name"]'
      ],
      role: [
        'h1[class*="job-title"]',
        'h1[class*="position-title"]',
        'h1[class*="posting-title"]',
        '[itemprop="title"]',
        'h1'
      ],
      jd: [
        '[class*="job-description"]',
        '[class*="job-details"]',
        '[id*="job-description"]',
        '[id*="description"]',
        '[itemprop="description"]'
      ]
    }
  }

  // ─── Job page detection keywords ──────────────────────────────────────────

  const JOB_PAGE_HINTS = [
    'job', 'career', 'position', 'role', 'opening', 'vacancy',
    'requisition', 'apply', 'hiring', 'posting'
  ]

  function isJobPage() {
    const site = getSite()
    if (!site) return false

    // Extra URL / title check for known boards that have non-job pages too
    const url = window.location.href.toLowerCase()
    const title = document.title.toLowerCase()
    const combined = url + ' ' + title

    // For platforms where every page under our match pattern is a job page,
    // just return true. For others, check for common hints.
    const alwaysJobSites = ['greenhouse', 'lever', 'ashby', 'taleo', 'icims', 'bamboohr', 'paycom', 'oracle', 'ultipro', 'eightfold']
    if (alwaysJobSites.includes(site)) return true

    // Netflix careers — only treat specific job pages as job pages, not landing/search pages
    if (site === 'netflix') {
      return url.includes('/careers/job/') || url.includes('/jobs/') || url.includes('pid=')
    }

    // LinkedIn feed pages with a selected job (e.g. /jobs/collections/...?currentJobid=...)
    if (site === 'linkedin' && url.includes('currentjobid')) return true
    // LinkedIn direct job view pages
    if (site === 'linkedin' && url.includes('/jobs/view/')) return true

    return JOB_PAGE_HINTS.some(hint => combined.includes(hint))
  }

  // ─── Selector Runner ──────────────────────────────────────────────────────

  // Supports three selector types:
  //   string           → document.querySelector(selector).innerText
  //   function         → call it, use returned string
  //   { multi, sep }   → querySelectorAll(multi), join all innerTexts with sep
  // options.minLength  → skip results shorter than this (useful for JD to skip labels)
  function trySelectors(selectors, options) {
    const minLen = (options && options.minLength) || 0
    for (const selector of selectors) {
      try {
        // Multi-element concatenation (e.g. for Lever's split sections)
        if (selector && typeof selector === 'object' && selector.multi) {
          const els = document.querySelectorAll(selector.multi)
          if (els.length > 0) {
            const sep = selector.sep || '\n\n'
            const combined = Array.from(els)
              .map(el => el.innerText?.trim())
              .filter(Boolean)
              .join(sep)
            if (combined && combined.length >= minLen) return combined
          }
          continue
        }
        if (typeof selector === 'function') {
          const result = selector()
          if (result) {
            const s = result.toString().trim()
            if (s.length >= minLen) return s
          }
          continue
        }
        if (selector.startsWith('meta[')) {
          const el = document.querySelector(selector)
          if (el?.content && el.content.trim().length >= minLen) return el.content.trim()
          continue
        }
        const el = document.querySelector(selector)
        if (el?.innerText?.trim()) {
          const text = el.innerText.trim()
          if (text.length >= minLen) return text
        }
      } catch (_) {
        continue
      }
    }
    return null
  }

  // ─── Domain Extractor ─────────────────────────────────────────────────────
  //
  // Strategy: collect every URL/email already visible on the page (from links,
  // images, JD text, and meta tags), throw out the obvious junk (job boards,
  // ATS providers, social media, common 3rd-party services), then return the
  // domain whose first segment matches the company name we already extracted.
  //
  // No external API calls. No naïve `companyName + ".com"`. Naturally handles
  // .ai / .io / .co / .edu / .in domains because we read real hostnames from
  // the page rather than constructing them.

  const DOMAIN_BLACKLIST = new Set([
    // Job boards
    'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
    'dice.com', 'monster.com', 'careerbuilder.com', 'wellfound.com',
    'weworkremotely.com', 'remoteok.com', 'flexjobs.com', 'usajobs.gov',
    'joinhandshake.com', 'handshake.com',
    // ATS / HRIS platforms
    'greenhouse.io', 'lever.co', 'myworkdayjobs.com', 'workday.com',
    'taleo.net', 'icims.com', 'smartrecruiters.com', 'bamboohr.com',
    'ashbyhq.com', 'rippling.com', 'paycomonline.net', 'oraclecloud.com',
    'oracle.com', 'ultipro.com', 'ukg.com', 'jobvite.com', 'breezy.hr',
    // Social / messaging / video
    'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'youtube.com',
    'youtu.be', 'tiktok.com', 'reddit.com', 'pinterest.com', 'snapchat.com',
    'whatsapp.com', 'telegram.org', 'discord.com', 'discord.gg',
    // Generic email providers
    'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
    'yahoo.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com',
    // Tech giants (almost never the actual employer in JDs)
    'google.com', 'microsoft.com', 'apple.com', 'amazon.com',
    // CDNs / cloud / analytics noise
    'amazonaws.com', 'cloudfront.net', 'googleapis.com', 'gstatic.com',
    'doubleclick.net', 'googletagmanager.com', 'google-analytics.com',
    'hubspot.com', 'cookielaw.org', 'recaptcha.net', 'cloudflare.com',
    // Misc 3rd-party
    'github.com', 'gitlab.com', 'bitbucket.org', 'medium.com',
    'crunchbase.com', 'producthunt.com', 'stackoverflow.com', 'quora.com',
    'wikipedia.org', 'mozilla.org', 'w3.org', 'schema.org',
    'simplifyjobs.com', 'simplify.jobs'
  ])

  function isBlacklisted(domain) {
    if (!domain) return true
    if (DOMAIN_BLACKLIST.has(domain)) return true
    for (const bad of DOMAIN_BLACKLIST) {
      if (domain.endsWith('.' + bad)) return true
    }
    return false
  }

  function normalizeHost(host) {
    if (!host) return null
    return host.toLowerCase().replace(/^www\./, '').trim()
  }

  // Strip leading/trailing punctuation and common legal-entity suffixes so
  // "Hugging Face, Inc." → "huggingface" for similarity comparison.
  function normalizeCompany(name) {
    if (!name) return ''
    return name
      .toLowerCase()
      .replace(/[®©™]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .replace(/(inc|incorporated|llc|ltd|limited|corp|corporation|gmbh|ag|sa|plc|co|company|holdings)$/, '')
  }

  function collectCandidateDomains(jdText) {
    const found = new Set()

    // 1. Every <a href> on the page
    document.querySelectorAll('a[href]').forEach(a => {
      try {
        const u = new URL(a.href, window.location.href)
        if (u.protocol === 'http:' || u.protocol === 'https:') {
          const h = normalizeHost(u.hostname)
          if (h) found.add(h)
        }
      } catch (_) {}
    })

    // 2. Every <img src> — company logos often come from the company's own CDN
    document.querySelectorAll('img[src]').forEach(img => {
      try {
        const u = new URL(img.src, window.location.href)
        const h = normalizeHost(u.hostname)
        if (h) found.add(h)
      } catch (_) {}
    })

    // 3. <meta property="og:url"> and <link rel="canonical">
    const og = document.querySelector('meta[property="og:url"]')?.content
    const canon = document.querySelector('link[rel="canonical"]')?.href
    for (const url of [og, canon]) {
      if (!url) continue
      try {
        const u = new URL(url, window.location.href)
        const h = normalizeHost(u.hostname)
        if (h) found.add(h)
      } catch (_) {}
    }

    // 4. URLs embedded as text inside the JD: "Visit us at https://huggingface.co"
    const text = jdText || ''
    const urlRe = /https?:\/\/(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/gi
    let m
    while ((m = urlRe.exec(text)) !== null) {
      const h = normalizeHost(m[1])
      if (h) found.add(h)
    }

    // 5. Email domains in JD: "Contact careers@openai.com"
    const emailRe = /[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})/gi
    while ((m = emailRe.exec(text)) !== null) {
      const h = normalizeHost(m[1])
      if (h) found.add(h)
    }

    return [...found]
  }

  function extractDomain(company, jdText) {
    // 0. URL query parameters often contain the company domain directly:
    //    Eightfold: ?domain=ralliant.com
    //    Greenhouse referrer: ?from=companyname.com
    //    Custom ATS pages frequently include similar hints.
    try {
      const params = new URLSearchParams(window.location.search)
      const directKeys = ['domain', 'company_domain', 'company', 'from', 'site']
      for (const key of directKeys) {
        const val = params.get(key)
        if (val && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(val)) {
          const clean = normalizeHost(val)
          if (clean && !isBlacklisted(clean)) return clean
        }
      }
    } catch (_) {}

    const normCompany = normalizeCompany(company)
    if (!normCompany || normCompany.length < 2) return ''

    const candidates = collectCandidateDomains(jdText)
      .filter(d => !isBlacklisted(d))

    if (candidates.length === 0) return ''

    // Compare each candidate's first segment to the normalized company name.
    // Highest-confidence match wins. Ties broken by shorter domain (less
    // likely to be a long sub-property domain).
    let best = null
    let bestScore = 0

    for (const domain of candidates) {
      const root = domain.split('.')[0].toLowerCase()
      let score = 0
      if (root === normCompany)              score = 100  // exact: stripe ↔ stripe.com
      else if (root.startsWith(normCompany)) score = 60   // stripe ↔ stripeenterprise.com
      else if (normCompany.startsWith(root)) score = 50   // huggingface ↔ huggingface.co
      else if (root.includes(normCompany))   score = 30   // stripe ↔ getstripe.io
      else if (normCompany.includes(root) && root.length >= 3) score = 25

      // Tie-break: prefer shorter domains
      score += Math.max(0, 20 - domain.length)

      if (score > bestScore) {
        bestScore = score
        best = domain
      }
    }

    // Only return if the match is reasonably confident — otherwise leave blank
    // so the user fills it manually rather than seeing a wrong guess.
    return bestScore >= 25 ? (best || '') : ''
  }

  // ─── Date Formatter ───────────────────────────────────────────────────────

  function todayMMDDYYYY() {
    const d = new Date()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${mm}/${dd}/${yyyy}`
  }

  // ─── Main Extractor ───────────────────────────────────────────────────────

  function extractJob() {
    const site = getSite()
    const selectorSet = SELECTORS[site] || SELECTORS.generic

    const company = trySelectors(selectorSet.company) || 'Unknown Company'
    const role    = trySelectors(selectorSet.role)    || 'Unknown Role'
    // Require at least 80 chars for JD — skips label-only elements like "JOB DESCRIPTION"
    const rawJD   = trySelectors(selectorSet.jd, { minLength: 80 }) || ''
    const jd      = rawJD.slice(0, 10000)

    const extracted = [company, role, jd].filter(
      v => v && v !== 'Unknown Company' && v !== 'Unknown Role' && v.length > 0
    ).length

    let confidence
    if (extracted === 3)      confidence = 'high'
    else if (extracted === 2) confidence = 'medium'
    else                      confidence = 'low'

    const domain = extractDomain(company, jd)

    return {
      company,
      role,
      jd,
      domain,
      date: todayMMDDYYYY(),
      url: window.location.href,
      site: site || 'unknown',
      confidence
    }
  }

  // ─── Message Listener ─────────────────────────────────────────────────────

  const ext = typeof browser !== 'undefined' ? browser : chrome

  ext.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkPage') {
      sendResponse({ isJobPage: isJobPage() })
      return false
    }
    if (request.action === 'extractJob') {
      sendResponse(extractJob())
      return false
    }
  })
})()
