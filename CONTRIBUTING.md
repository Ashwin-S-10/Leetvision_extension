# Contributing to Leetvision Extension

Thanks for helping improve Leetvision. This guide covers how to report problems, suggest features and send code changes.

## Ways to help

- **Report a bug.** Open an issue and include your browser and version, the LeetCode problem URL, what you expected, what happened, and any errors from the console (see [Debugging](#debugging)).
- **Suggest a feature.** Open an issue that describes the problem you want solved, not only the solution.
- **Send a pull request.** For anything bigger than a small fix, open an issue first so we can agree on the approach before you spend time on it.

Please do not post your access tokens, passwords or API keys in issues or screenshots.

## Security issues

Do not open a public issue for a security problem. Contact the maintainers privately through the [Leetvision website](https://leetvision.in) and give them time to fix it before you share details.

## Development setup

The extension is plain JavaScript on Manifest V3. There is no build step, bundler or package manager.

1. Fork this repository and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/Leetvision_extension.git
   ```
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and choose the cloned folder.
3. Create a Leetvision account at [leetvision.in](https://leetvision.in) and sign in from the popup.
4. Open a LeetCode problem and submit a solution to try your changes.

### Reloading after a change

| You changed | Do this |
|---|---|
| `manifest.json` or `background.js` | Click reload on the extension card in `chrome://extensions`. |
| `content.js`, `extractor.js`, `ui.js`, `main-world.js`, `config.js` | Reload the extension, then refresh the LeetCode tab. |
| `popup.html` or `popup.js` | Close and reopen the popup. |

### Pointing at a local backend

`config.js` holds the API and website URLs. To test against a backend running on your machine, change `BACKEND_URL` there and add the same origin to `host_permissions` in `manifest.json`, for example `http://localhost:3000/*`. **Do not commit these local changes.**

### Debugging

- **Content scripts:** open DevTools on the LeetCode tab. Errors from `content.js`, `extractor.js` and `ui.js` appear in its console.
- **Background service worker:** in `chrome://extensions`, click **service worker** on the Leetvision card.
- **Popup:** right-click the popup and choose **Inspect**.
- **Stored tokens:** in the service worker console, run `chrome.storage.local.get(null, console.log)`.

## Project layout

| File | Role |
|---|---|
| `manifest.json` | Permissions, content scripts and entry points. |
| `config.js` | Backend and website URLs, shared by every script. |
| `background.js` | Service worker that relays API requests from content scripts. |
| `main-world.js` | Runs in LeetCode's page context to read code from the Monaco editor. |
| `extractor.js` | Gets the problem slug and code, and waits for LeetCode's verdict. |
| `content.js` | Hooks the Submit button, refreshes tokens and calls the API. |
| `ui.js` | Analysis panel and on-page notifications. |
| `popup.html`, `popup.js` | Sign-in, sign-out and dashboard link. |
| `icons/` | Extension icons at 16, 48 and 128 px. |

## Guidelines for changes

### Keep the extension small and safe

- **Ask before adding permissions.** Any new entry in `permissions` or `host_permissions` must be explained in the pull request. Users see these when they install.
- **Stay on LeetCode.** Content scripts should only match `https://leetcode.com/*`.
- **Send the minimum.** Only send the API what the analysis needs. Never read or send cookies, browsing history, clipboard contents or data from other sites.
- **Check message origins.** Code that listens to `window.postMessage` must check `event.source` and `event.origin`, as `main-world.js` does.
- **No `eval`, no remote code.** Manifest V3 forbids loading remote scripts, and we do not want `eval` or `new Function`.
- **Avoid `innerHTML` with outside data.** When showing text from the API or the page, use `textContent` or escape it first.
- **Keep API calls in the background worker.** Content scripts should call the backend through `chrome.runtime.sendMessage`, not `fetch` directly.
- **No new dependencies or build tools** without discussing it in an issue first.

### Code style

- Match the style around your change: 2-space indentation in the content scripts, `const`/`let`, `async`/`await`, single quotes.
- Keep functions short and give them clear names.
- Handle failures: show a helpful message with `showNotification` instead of failing silently.
- Leave out `console.log` debugging lines before you open a pull request.

### LeetCode changes their page

LeetCode updates its UI often. If a selector breaks, such as `[data-e2e-locator="console-submit-button"]`, say in the pull request which selector changed and how you checked the new one.

## Pull requests

1. Create a branch from `main` with a short descriptive name, such as `fix/submit-button-selector` or `feat/dark-panel`.
2. Keep each pull request to one change.
3. Write commit messages in the imperative mood with a type prefix:
   ```
   fix: detect the new LeetCode submit button
   feat: show runtime percentile in the analysis panel
   docs: explain how to point at a local backend
   ```
4. Bump `version` in `manifest.json` only when the maintainers ask for it as part of a release.
5. In the pull request description, include:
   - what changed and why
   - the issue it fixes, if any (`Fixes #12`)
   - how you tested it: browser, version and the LeetCode problems you tried
   - screenshots for any visible change

### Before you open the pull request

- [ ] The extension loads with no errors in `chrome://extensions`.
- [ ] Submitting a solution on LeetCode still shows the analysis panel.
- [ ] Sign in, sign out and the token refresh still work.
- [ ] No new permissions, or they are explained in the description.
- [ ] No local URLs, test accounts, tokens or keys are committed.

A maintainer will review your pull request and may ask for changes. Thanks for contributing.
