// UI components and notifications for Leetvision extension

function displayAnalysisResults(result, language) {
  document.querySelectorAll('.leetcode-analysis-root').forEach(el => el.remove());

  const analysis = result.analysis || {};
  const displayLang = result.language || (language && language.length <= 25 && !language.includes('{') ? language : 'Auto-detected');

  // Root container
  const root = document.createElement('div');
  root.className = 'leetcode-analysis-root';
  root.innerHTML = `
    <!-- Overlay -->
    <div class="leetcode-overlay"></div>

    <!-- Popup -->
    <div class="leetcode-popup">
      <div class="leetcode-header">
        <div>
          <span class="leetcode-eyebrow">LEETVISION</span>
          <h2>Code Analysis</h2>
        </div>
        <button class="close-icon-btn" title="Close" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="card">
        <div class="label">Language</div>
        <div class="value" data-field="language"></div>
      </div>

      <div class="card">
        <div class="label">Approach</div>
        <div class="text" data-field="approach"></div>
      </div>

      <div class="row">
        <div class="card">
          <div class="label">Time Complexity</div>
          <div class="value monospace" data-field="time-complexity"></div>
        </div>
        <div class="card">
          <div class="label">Space Complexity</div>
          <div class="value monospace" data-field="space-complexity"></div>
        </div>
      </div>

      <div class="card">
        <div class="label">Correctness</div>
        <div class="text" data-field="correctness"></div>
      </div>

      <div class="card">
        <div class="label">Issues Found</div>
        <div class="text" data-field="mistakes"></div>
      </div>

      <div class="card">
        <div class="label">Suggestions</div>
        <div class="text" data-field="improvements"></div>
      </div>

      <div class="footer">
        <button class="close-footer-btn">Close Analysis</button>
      </div>
    </div>
  `;

  // Safely populate all dynamic JSON response fields strictly as text (XSS-safe)
  root.querySelector('[data-field="language"]').textContent = displayLang;
  root.querySelector('[data-field="approach"]').textContent = analysis.approach || 'Analysis approach not available';
  root.querySelector('[data-field="time-complexity"]').textContent = analysis.time_complexity || 'N/A';
  root.querySelector('[data-field="space-complexity"]').textContent = analysis.space_complexity || 'N/A';

  const correctnessEl = root.querySelector('[data-field="correctness"]');
  correctnessEl.style.color = analysis.correctness ? '#34d399' : '#f87171';
  correctnessEl.style.fontWeight = '500';
  correctnessEl.textContent = analysis.correctness ? 'Code appears to be correct' : 'Code may have issues';

  root.querySelector('[data-field="mistakes"]').textContent = analysis.mistakes || 'No specific issues identified';
  root.querySelector('[data-field="improvements"]').textContent = analysis.improvements || 'No specific improvements suggested';

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .leetcode-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9999;
    }
    .leetcode-popup {
      position: fixed;
      top: 24px; right: 24px;
      width: 440px; max-height: 85vh;
      overflow-y: auto;
      padding: 20px 24px;
      border-radius: 12px;
      background: #0d0f12;
      color: #f0f3f6;
      border: 1px solid #21262d;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75), 0 1px 0 rgba(255, 255, 255, 0.05) inset;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
      z-index: 10000;
    }
    .leetcode-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 16px; padding-bottom: 14px;
      border-bottom: 1px solid #1c2128;
    }
    .leetcode-eyebrow {
      display: block;
      font-size: 10px; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: #7d8590; margin-bottom: 2px;
    }
    .leetcode-header h2 {
      margin: 0; font-size: 17px; font-weight: 600;
      color: #f0f3f6; letter-spacing: -0.01em;
    }
    .close-icon-btn {
      background: #161b22; border: 1px solid #21262d; color: #8b949e;
      cursor: pointer; border-radius: 6px;
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .close-icon-btn:hover { background: #21262d; color: #f0f3f6; }
    .card {
      background: #14171c; border: 1px solid #1f242c;
      padding: 12px 14px; border-radius: 8px;
      margin-bottom: 10px;
    }
    .label {
      font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.05em;
      color: #7d8590; margin-bottom: 6px;
    }
    .value { font-size: 13.5px; font-weight: 600; color: #f0f3f6; }
    .monospace { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12.5px; }
    .text { font-size: 13px; line-height: 1.5; color: #c9d1d9; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .row .card { margin-bottom: 10px; }
    .footer {
      display: flex; justify-content: flex-end;
      padding-top: 14px; margin-top: 4px;
      border-top: 1px solid #1c2128;
    }
    .close-footer-btn {
      border-radius: 6px; padding: 7px 16px;
      background: #161b22; color: #f0f3f6; font-size: 12.5px; font-weight: 500;
      border: 1px solid #30363d; cursor: pointer;
      transition: all 0.15s ease;
    }
    .close-footer-btn:hover { background: #21262d; border-color: #3b4350; }
  `;
  document.head.appendChild(style);

  // Add close behavior
  root.querySelectorAll('.close-icon-btn, .close-footer-btn, .leetcode-overlay').forEach(btn => {
    btn.addEventListener('click', () => root.remove());
  });

  document.body.appendChild(root);

  // Animate in
  const popup = root.querySelector('.leetcode-popup');
  popup.style.opacity = '0';
  popup.style.transform = 'scale(0.98)';
  requestAnimationFrame(() => {
    popup.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    popup.style.opacity = '1';
    popup.style.transform = 'scale(1)';
  });

  // Auto remove after 30s
  setTimeout(() => root.remove(), 30000);
}

function showNotification(message, type = 'info') {
  const existingNotifications = document.querySelectorAll('.leetcode-extractor-notification');
  existingNotifications.forEach(notif => notif.remove());

  const cleanMessage = (message || '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();

  let indicatorHtml = '';
  let borderColor = '#262c36';

  if (type === 'error') {
    borderColor = 'rgba(239, 68, 68, 0.4)';
    indicatorHtml = `<span style="width: 7px; height: 7px; border-radius: 50%; background: #f87171; display: inline-block; flex-shrink: 0;"></span>`;
  } else if (type === 'success') {
    borderColor = 'rgba(52, 211, 153, 0.4)';
    indicatorHtml = `<span style="width: 7px; height: 7px; border-radius: 50%; background: #34d399; display: inline-block; flex-shrink: 0;"></span>`;
  } else {
    indicatorHtml = `<span style="width: 12px; height: 12px; border: 2px solid rgba(255, 255, 255, 0.15); border-top-color: #38bdf8; border-radius: 50%; display: inline-block; animation: lvSpin 0.7s linear infinite; flex-shrink: 0;"></span>`;
  }

  const notification = document.createElement('div');
  notification.className = 'leetcode-extractor-notification';
  notification.innerHTML = `
    <style>
      @keyframes lvSpin {
        to { transform: rotate(360deg); }
      }
      @keyframes lvNotificationSlide {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
    <div style="
      position: fixed;
      top: 24px;
      right: 24px;
      padding: 10px 16px;
      border-radius: 8px;
      color: #f0f3f6;
      font-weight: 500;
      font-size: 13px;
      letter-spacing: -0.01em;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
      background: #0d0f12;
      border: 1px solid ${borderColor};
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65), 0 1px 0 rgba(255, 255, 255, 0.05) inset;
      max-width: 360px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      word-wrap: break-word;
      animation: lvNotificationSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      ${indicatorHtml}
      <span class="notification-text"></span>
    </div>
  `;

  // Safely assign message as plain text (XSS-safe)
  notification.querySelector('.notification-text').textContent = cleanMessage;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}
