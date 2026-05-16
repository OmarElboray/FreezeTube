# YouTube Feed Freezer — Chrome Extension

> **Freeze your YouTube home feed.** Stop the algorithm from resetting your feed every time you navigate back from a video.

---

## Project Structure

```
youtube-feed-freezer/
├── manifest.json        — MV3 manifest
├── background.js        — Service worker: settings, subscription, messaging
├── content.js           — DOM manipulation, feed freeze & injection
├── popup.html           — Extension popup UI
├── popup.js             — Popup logic
├── generate-icons.js    — (dev) One-time icon generator
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Quick Setup

### 1. Generate Icons
```bash
npm install canvas
node generate-icons.js
```
Or replace `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` with your own PNGs.

### 2. Load in Chrome
1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `youtube-feed-freezer/` folder

---

## How It Works

### Back-Button / SPA Navigation Interception

YouTube is a Single-Page Application (SPA) built on the History API. When
the user presses the browser back button from a video to the home feed:

1. `popstate` fires on `window`.
2. YouTube's internal Polymer-based router catches it and dispatches two
   custom DOM events in sequence: `yt-navigate-start` → `yt-navigate-finish`.
3. After `yt-navigate-finish`, the `<ytd-rich-grid-renderer>` web component
   is torn down and rebuilt with fresh data fetched from YouTube's private
   browse API.

**Our approach** hooks into `yt-navigate-finish` (not `popstate`, which fires
too early) to check if the URL has settled on `/` (home). If a snapshot
exists, we race YouTube's own render by replacing the grid's `innerHTML`
before it can repaint, re-injecting our frozen HTML. Because we listen for
`yt-navigate-finish`, the DOM container already exists and we can write into
it immediately.

A `MutationObserver` watches for the first N ≥ 8 video cards to be rendered
(lazy-loaded thumbnails included) before taking the snapshot — ensuring we
never store a skeleton/loading state.

### Storage Strategy

| Mode | Storage | Persists across restarts? |
|------|---------|--------------------------|
| Free | `sessionStorage` | ✗ |
| Pro  | `chrome.storage.local` | ✓ |

### Subscription / Pro Gating

`checkSubscriptionStatus()` in `background.js` is a mock. To wire up real
payments, replace it with one of:

**ExtensionPay:**
```js
import ExtPay from 'extpay';
const extpay = ExtPay('your-extension-id');
const user = await extpay.getUser();
return user.paid;
```

**Stripe (via your own backend):**
```js
const r = await fetch('https://your-api.com/check-sub', {
  headers: { Authorization: `Bearer ${token}` }
});
const { active } = await r.json();
return active;
```

---

## Permissions Explained

| Permission | Reason |
|-----------|--------|
| `storage` | Save settings and Pro feed snapshots |
| `tabs` | Identify active YouTube tab from popup |
| `*://*.youtube.com/*` | Host permission to run content script |
| `scripting` | Popup clears sessionStorage in active tab (optional) |

---

## Development Notes

- **No build step required.** Plain ES2020 — works directly in Chrome.
- YouTube periodically renames its web component selectors. If `ytd-rich-grid-renderer` stops working, inspect the DOM and update `FEED_SELECTOR` in `content.js`.
- The `yt-navigate-finish` event is internal to YouTube's Polymer framework and has been stable since 2018, but may change. Monitor Chrome DevTools' Events panel if behaviour breaks after a YouTube update.