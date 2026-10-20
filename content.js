// main orchestrator content script for Leetvision extension

const AUTH_KEYS = [
  'access_token',
  'authenticated_user',
  'access_token_expires_at',
  'session_expires_at',
  'refresh_token',
  'user_email'
];

// helper to safely check if the extension context is still alive
function isExtensionValid() {
  try {
    return typeof chrome !== 'undefined' && !!chrome?.runtime?.id;
  } catch (e) {
    return false;
  }
}

// Refresh access token via backend
async function refreshAccessToken() {
  return new Promise((resolve) => {
    if (!isExtensionValid()) {
      resolve(null);
      return;
    }

    try {
      chrome.storage.local.get(['refresh_token'], async (result) => {
        if (!result || !result.refresh_token) {
          resolve(null);
          return;
        }

        try {
          const relayed = await chrome.runtime.sendMessage({
            type: 'LEETVISION_BACKEND_REQUEST',
            request: {
              path: '/auth/refresh',
              method: 'POST',
              body: { refresh_token: result.refresh_token }
            }
          });

          const data = relayed?.data;

          if (relayed?.ok && data?.access_token) {
            const tokenExpiresAt = data.expires_at
              ? data.expires_at * 1000
              : Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000);

            if (isExtensionValid()) {
              await chrome.storage.local.set({
                access_token: data.access_token,
                access_token_expires_at: tokenExpiresAt,
                refresh_token: data.refresh_token || result.refresh_token
              });
            }

            resolve(data.access_token);
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      });
    } catch (storageErr) {
      resolve(null);
    }
  });
}

// Get a valid token, refreshing if necessary
async function getValidToken() {
  return new Promise((resolve) => {
    if (!isExtensionValid()) {
      resolve(null);
      return;
    }

    try {
      chrome.storage.local.get([
        'access_token',
        'access_token_expires_at',
        'refresh_token',
        'supabase_token',
        'token_expires_at'
      ], async (result) => {
        try {
          const now = Date.now();
          const token = result?.access_token || result?.supabase_token;
          const expiresAt = result?.access_token_expires_at || result?.token_expires_at;

          // Check if token is still valid (with 60s buffer)
          const bufferMs = 60 * 1000;
          if (token && expiresAt && (expiresAt - bufferMs) > now) {
            resolve(token);
            return;
          }

          // Token expired or expiring soon, try to refresh
          if (result && result.refresh_token) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              resolve(newToken);
              return;
            }
          }

          // Token expired and cannot be refreshed: remove only auth keys
          if (isExtensionValid()) {
            await chrome.storage.local.remove(AUTH_KEYS);
          }
          resolve(null);
        } catch (innerErr) {
          resolve(null);
        }
      });
    } catch (storageErr) {
      resolve(null);
    }
  });
}

// Send extracted code to backend for analysis
async function sendCodeToBackend(code, language, token, problemSlug, submissionResult) {
  const settingsUrl = `${CONFIG.WEBSITE_URL}/settings`;

  try {
    if (!problemSlug || typeof problemSlug !== 'string' || problemSlug.trim().length === 0) {
      showNotification('Cannot identify the problem. Please refresh and try again.', 'error');
      return;
    }

    if (!token) {
      showNotification('Authentication token is missing.', 'error');
      return;
    }

    let sanitizedLanguage = language;
    if (language && language.length > 50) {
      sanitizedLanguage = 'auto-detect';
    }

    const requestBody = {
      code: code,
      language: sanitizedLanguage,
      platform: 'leetcode',
      problemSlug: problemSlug.trim(),
      submissionResult: submissionResult || null
    };

    // Routed through background service worker to avoid mixed-content blocking
    const relayed = await chrome.runtime.sendMessage({
      type: 'LEETVISION_BACKEND_REQUEST',
      request: { path: '/analyze', method: 'POST', token, body: requestBody },
    });

    if (!relayed || !relayed.success) {
      throw new Error(relayed?.error || 'Background service worker did not respond');
    }

    const response = { ok: relayed.ok, status: relayed.status };
    const payload = relayed.data;

    if (response.ok) {
      displayAnalysisResults(payload, language);
    } else {
      const error = payload;

      if (response.status === 402 && error.code === 'FREE_QUOTA_EXHAUSTED') {
        showNotification(
          `You have used all ${error.limit ?? ''} free analyses for today. ` +
          `Add your own Gemini API key at ${settingsUrl} to keep going.`,
          'error'
        );
        return;
      }

      if (response.status === 400 && error.code === 'USER_KEY_REJECTED') {
        showNotification(
          `Your saved Gemini API key was rejected by Google. Update it at ${settingsUrl}.`,
          'error'
        );
        return;
      }

      showNotification('Failed to analyze code: ' + (error.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    showNotification('Network error. Please check your connection.', 'error');
  }
}

// Handler triggered on clicking LeetCode Submit button
async function onSubmitClick(e) {
  try {
    const { code, language } = await extractCodeFromEditor();
    const problemSlug = getProblemSlug();

    if (!problemSlug) {
      showNotification('Could not identify the problem. Please make sure you are on a LeetCode problem page.', 'error');
      return;
    }

    if (code && code.length > 10) {
      showNotification('Waiting for LeetCode result...', 'info');
      const submissionResult = await waitForSubmissionResult(30000);

      if (submissionResult) {
        showNotification(`Got result: ${submissionResult}. Analyzing...`, 'info');
      } else {
        showNotification('Could not detect result. Analyzing code...', 'info');
      }

      if (!isExtensionValid() || !chrome?.storage) {
        showNotification('Extension updated or reloaded. Please refresh this page (F5).', 'error');
        return;
      }

      const token = await getValidToken();
      if (!token) {
        showNotification('Please sign in again via the extension popup.', 'error');
        return;
      }

      await sendCodeToBackend(code, language, token, problemSlug, submissionResult);
    } else {
      showNotification('Could not extract code from editor. Please try again.', 'error');
    }
  } catch (error) {
    showNotification('Error extracting code: ' + error.message, 'error');
  }
}

// Attach listener to LeetCode submit button
function attachSubmitListener() {
  const btn = document.querySelector('[data-e2e-locator="console-submit-button"]');
  if (btn && !btn._extractorAttached) {
    btn.addEventListener('click', onSubmitClick, true);
    btn._extractorAttached = true;
  }
}

const observer = new MutationObserver(() => {
  attachSubmitListener();
});
observer.observe(document.body, { childList: true, subtree: true });

attachSubmitListener();