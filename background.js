// acts as a backend for extension
importScripts('config.js');

async function callBackend({ path, method = 'POST', token, body }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${CONFIG.BACKEND_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { error: raw.slice(0, 300) || `Backend returned ${response.status}` };
  }

  return { ok: response.ok, status: response.status, data };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'LEETVISION_BACKEND_REQUEST') return;

  callBackend(message.request)
    .then((result) => sendResponse({ success: true, ...result }))
    .catch((err) => {
      sendResponse({ success: false, error: err.message || 'Network error' });
    });

  // Keep the message channel open for the async sendResponse above.
  return true;
});
