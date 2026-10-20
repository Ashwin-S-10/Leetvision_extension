// extracts code, problem description from leetcode

// extract problem name
function getProblemSlug() {
  const url = window.location.href;
  let slug = null;

  // Method 1: Use URL API for reliable parsing
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const isLeetCode = hostname.includes('leetcode.com') || hostname.includes('leetcode.cn');
    if (!isLeetCode) {
      return null;
    }

    const pathParts = urlObj.pathname.split('/').filter(p => p);
    const problemsIndex = pathParts.indexOf('problems');
    if (problemsIndex !== -1 && pathParts[problemsIndex + 1]) {
      slug = pathParts[problemsIndex + 1];
      slug = decodeURIComponent(slug);
    }
  } catch (e) {
  }

  // Method 2: Fallback regex
  if (!slug) {
    const match = url.match(/leetcode\.(?:com|cn)\/problems\/([a-zA-Z0-9_-]+)/i);
    if (match) {
      slug = decodeURIComponent(match[1]);
    }
  }

  // Method 3: Try to extract from page DOM if URL parsing fails
  if (!slug) {
    try {
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink && canonicalLink.href) {
        const canonicalMatch = canonicalLink.href.match(/problems\/([a-zA-Z0-9_-]+)/i);
        if (canonicalMatch) {
          slug = decodeURIComponent(canonicalMatch[1]);
        }
      }
    } catch (e) {
    }
  }

  // Method 4: Try to extract from page title or meta tags
  if (!slug) {
    try {
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl && ogUrl.content) {
        const ogMatch = ogUrl.content.match(/problems\/([a-zA-Z0-9_-]+)/i);
        if (ogMatch) {
          slug = decodeURIComponent(ogMatch[1]);
        }
      }
    } catch (e) {
    }
  }

  // Validate the extracted slug
  if (slug) {
    slug = slug.toLowerCase().trim();
    const isValidSlug = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug);
    if (!isValidSlug) {
      slug = slug.replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');
    }

    if (slug && slug.length > 0) {
      return slug;
    }
  }

  return null;
}

// Wait for LeetCode submission result by watching URL for submission ID
function waitForSubmissionResult(timeoutMs = 30000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let resolved = false;

    // Function to extract submission ID from URL
    const getSubmissionId = () => {
      const url = window.location.href;
      const match = url.match(/\/submissions\/(\d+)/);
      return match ? match[1] : null;
    };

    // Function to fetch submission details from LeetCode API
    const fetchSubmissionResult = async (submissionId) => {
      try {
        const response = await fetch('https://leetcode.com/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com',
          },
          body: JSON.stringify({
            query: `query submissionDetails($submissionId: Int!) { submissionDetails(submissionId: $submissionId) { statusCode runtime memory } }`,
            variables: { submissionId: parseInt(submissionId) },
            operationName: 'submissionDetails'
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        const details = data?.data?.submissionDetails;

        if (details && details.statusCode !== undefined) {
          const statusCodeMap = {
            10: 'Accepted',
            11: 'Wrong Answer',
            12: 'Memory Limit Exceeded',
            13: 'Output Limit Exceeded',
            14: 'Time Limit Exceeded',
            15: 'Runtime Errors',
            20: 'Compile Error'
          };

          return statusCodeMap[details.statusCode] || `Status Code ${details.statusCode}`;
        }

        return null;
      } catch (error) {
        return null;
      }
    };

    // Store initial submission ID to detect NEW submissions
    const initialSubmissionId = getSubmissionId();

    const pollInterval = setInterval(() => {
      if (resolved) {
        clearInterval(pollInterval);
        return;
      }

      const currentSubmissionId = getSubmissionId();
      const isNewSubmission = currentSubmissionId && currentSubmissionId !== initialSubmissionId;

      if (isNewSubmission) {
        clearInterval(pollInterval);

        setTimeout(async () => {
          if (resolved) return;

          for (let attempt = 1; attempt <= 3; attempt++) {
            const result = await fetchSubmissionResult(currentSubmissionId);
            if (result) {
              resolved = true;
              resolve(result);
              return;
            }
            await new Promise(r => setTimeout(r, 1000));
          }

          resolved = true;
          resolve(null);
        }, 3000);
      }

      if (Date.now() - startTime > timeoutMs) {
        resolved = true;
        clearInterval(pollInterval);
        resolve(null);
      }
    }, 300);

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearInterval(pollInterval);
        resolve(null);
      }
    }, timeoutMs);
  });
}

// Primary code extraction using main-world.js
function requestCodeFromMainWorld(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const requestId = 'lv_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', handler);
      clearTimeout(timer);
      resolve(value || '');
    };

    const handler = (event) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const d = event.data;
      if (!d || d.type !== 'LEETVISION_CODE' || d.requestId !== requestId) return;
      finish(d.code);
    };

    const timer = setTimeout(() => finish(''), timeoutMs);
    window.addEventListener('message', handler);
    window.postMessage({ type: 'LEETVISION_GET_CODE', requestId }, window.location.origin);
  });
}

// Secondary code extraction directly from Monaco DOM
function extractFromMonacoDom() {
  const viewLines = document.querySelectorAll('.monaco-editor .view-line');
  if (!viewLines.length) return '';

  return Array.from(viewLines)
    .sort((a, b) => (parseInt(a.style.top) || 0) - (parseInt(b.style.top) || 0))
    .map((line) => {
      const spans = line.querySelectorAll('span');
      return spans.length
        ? Array.from(spans).map((s) => s.textContent).join('')
        : (line.textContent || '');
    })
    .join('\n');
}

// Primary code extraction orchestrator
async function extractFullCodeRobust() {
  const strategies = [
    ['main-world monaco', async () => await requestCodeFromMainWorld()],
    ['monaco DOM', async () => extractFromMonacoDom()],
  ];

  for (const [name, run] of strategies) {
    try {
      const code = await run();
      if (code && code.trim().length > 10) {
        return code;
      }
    } catch (err) {
    }
  }

  return '';
}

// Extract code and language from LeetCode editor
async function extractCodeFromEditor() {
  let code = '';
  let language = 'unknown';

  code = await extractFullCodeRobust();

  const langSelectors = [
    'button[id*="headlessui-listbox-button"]',
    '[data-cy="lang-select"]',
    '.ant-select-selection-item',
    'button[class*="lang"]'
  ];

  for (const selector of langSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && text.length <= 25 && !text.includes('\n') && !text.includes('{')) {
        language = text;
        break;
      }
    }
  }

  if (!language || language.length > 25 || language.includes('{') || language.includes('\n')) {
    language = 'auto-detect';
  }

  return { code, language };
}
