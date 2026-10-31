# FreezeTube

**A Chrome extension that keeps YouTube from pulling you away from what you came to watch.**

<!-- Add a screenshot or GIF here: ![FreezeTube demo](docs/demo.gif) -->
<!-- Add your Chrome Web Store link here: [Install from the Chrome Web Store](YOUR_LINK) -->

YouTube is built to maximize watch time. FreezeTube removes the parts that do that, and keeps search, subscriptions, and playback working as normal. You use YouTube when you decide what to watch, not what the algorithm pushes next.

## Why I built it

Most productivity tools block YouTube entirely. That doesn't work when you need it for lectures, tutorials, or research. FreezeTube keeps access and removes the distraction.

## What it does

- Stops infinite scroll on the homepage
- Limits how many recommended videos load
- Hides sidebar recommendations during playback
- Optionally hides Shorts and comments
- No login, no tracking, no external servers. Everything runs locally in your browser.

## Results

19,000+ Chrome Web Store impressions in five months with no advertising, and users in 56+ countries.

## How it works

A content script watches DOM changes on YouTube pages and blocks new feed inserts. A background service worker handles extension state, and settings are saved in local browser storage. Built with vanilla JavaScript and Chrome Manifest V3.

## Install (developer mode)

```bash
git clone https://github.com/OmarElboray/FreezeTube.git
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `FreezeTube` folder.
3. Open YouTube and refresh the page.

## Project structure

```
FreezeTube/
├── manifest.json    Extension configuration
├── content.js       DOM controller for YouTube pages
├── background.js    Service worker
├── popup.html       Settings interface
├── popup.js         Settings logic
├── js/              Shared scripts
└── icons/           Extension icons
```

*Adjust this list so it matches your actual files.*

## Roadmap

- Time-based locking presets
- Per-channel whitelist
- Focus-session timer
- Firefox support

## License

MIT
