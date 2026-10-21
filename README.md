# Leetvision Browser Extension

> **Beta.** Leetvision is in public beta. Expect rough edges, and please [report anything that breaks](../../issues).

Leetvision is a LeetCode revision system. This extension watches your LeetCode submissions, sends the code to Leetvision for analysis, and shows the result right on the problem page. Every attempt is saved to your account on [leetvision.in](https://leetvision.in), so you can come back later and revise the approaches you used instead of forgetting them.

## What it does

When you click **Submit** on a LeetCode problem, the extension:

1. Reads your code from the LeetCode editor.
2. Waits for LeetCode's verdict (Accepted, Wrong Answer, Time Limit Exceeded and so on).
3. Sends the code, language, problem slug and verdict to the Leetvision API.
4. Shows an analysis panel on the page with:
   - the approach you used
   - time and space complexity
   - correctness notes
   - mistakes it spotted
   - suggested improvements

You can review all of your past submissions and analyses on the [Leetvision dashboard](https://leetvision.in).

## Install 

The extension is not on the Chrome Web Store yet. During the beta, install it by loading it unpacked. This works in Chrome, Edge, Brave and other Chromium browsers.

1. Download the code: click Code → Download ZIP on this page and unzip it, or **clone it**:
   ```bash
   git clone https://github.com/Ashwin-S-10/Leetvision_extension.git
   ```
2. Open your browser's extensions page (extension works only on Chrome Browser(version 1), excited to build for other browsers? Submit a PR...:
   - Chrome: `chrome://extensions`
   
3. Turn on **Developer mode** (top-right toggle in Chrome).
4. Click **Load unpacked** and pick the folder that contains `manifest.json`.
5. Pin the Leetvision icon to your toolbar so the popup is easy to reach.

To update later, pull or re-download the code, then click the reload icon on the Leetvision card in the extensions page and refresh any open LeetCode tabs.

## Getting started

1. Create an account at [leetvision.in](https://leetvision.in). You can also click **Sign Up** in the extension popup.
2. Click the Leetvision icon and sign in with the same email and password.
3. Open any problem on [leetcode.com](https://leetcode.com), write a solution and click **Submit**.
4. The analysis panel appears on the page once LeetCode returns a verdict.

### Free analyses and your own Gemini key

Each account gets a limited number of free analyses per day. When you run out, the extension tells you so. You can keep going by adding your own Google Gemini API key in [Settings](https://leetvision.in/settings) on the website.

## Privacy

The extension only runs on `leetcode.com`. It sends data to the Leetvision API only when you click **Submit**, and what it sends is:

- the code in the editor
- the language
- the problem slug (for example `two-sum`)
- LeetCode's verdict for that submission

It does not read other sites, your browsing history or your clipboard. Your sign-in tokens are kept in the browser's extension storage (`chrome.storage.local`) and are removed when you sign out.

### Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Keeps you signed in between browser sessions. |
| `activeTab` | Lets the popup interact with the tab you are on. |
| `https://leetcode.com/*` | Reads your code and the submission verdict on LeetCode. |

## How it works

```
LeetCode page
 ├─ main-world.js   reads the Monaco editor (runs in the page's own JS context)
 ├─ extractor.js    finds the problem slug, gets the code, waits for the verdict
 ├─ content.js      hooks the Submit button and manages tokens
 └─ ui.js           draws the analysis panel and notifications
        │
        ▼  chrome.runtime.sendMessage
background.js       service worker that makes the API calls
        │
        ▼
Leetvision API      analyzes the code and stores the submission

popup.html/js       sign in, sign out, link to the dashboard
config.js           API and website URLs
```

The extension is plain JavaScript on Manifest V3. There is no build step and no dependencies.
## Troubleshooting

| Problem | What to try |
|---|---|
| No panel appears after submitting | Refresh the LeetCode tab. If you just installed or reloaded the extension, existing tabs need a refresh. |
| "Extension updated or reloaded. Please refresh this page" | Press F5 on the LeetCode tab. |
| "Please sign in again via the extension popup" | Your session expired. Open the popup and sign in again. |
| "Could not extract code from editor" | Make sure the code editor has finished loading, then submit again. |
| "You have used all free analyses for today" | Wait until tomorrow, or add your own Gemini API key in [Settings](https://leetvision.in/settings). |
| "Network error" | Check your connection. The API can take a few seconds to wake up on the first request. |

If none of these help, [open an issue](../../issues) with your browser, its version and the steps you took.

## Contributing

Bug reports, ideas and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before you start.

## License

A license has not been chosen yet. Until one is added, all rights are reserved by the project authors.
