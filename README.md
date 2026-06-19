# FreezeTube

FreezeTube is a browser extension that removes YouTube’s recommendation loops and infinite scrolling while keeping search and video playback fully functional.

It turns YouTube into a controlled tool instead of a feed designed for continuous browsing.

---

## What it does

YouTube is built to maximize watch time through recommendations and endless scroll.

FreezeTube changes that behavior:

- Stops infinite scroll on the homepage
- Limits the number of recommended videos loaded
- Hides sidebar recommendations during playback
- Optional hiding of Shorts, comments, and related feeds
- Keeps search, subscriptions, and playback unchanged

You use YouTube when you decide what to watch, not what the algorithm pushes next.

---

## Why it exists

Most productivity tools block YouTube completely.

That creates friction when you need YouTube for:

- Tutorials
- Lectures
- Coding walkthroughs
- Research

FreezeTube keeps access but removes the parts that waste time.

---

## Features

- Infinite scroll blocking on homepage feed
- Recommendation cap control
- Optional UI cleanup
  - Sidebar recommendations
  - Shorts tab
  - Comments section
- Lightweight content script
- No login required
- No tracking
- Runs locally in browser

---

## Tech stack

- Vanilla JavaScript
- Chrome Manifest V3
- Content scripts for DOM control
- Background service worker for state handling
- Local storage for settings

---

## Project structure

```text
FreezeTube/
├── manifest.json        Extension configuration
├── content.js           Main DOM controller for YouTube pages
├── background.js        Service worker for extension lifecycle
├── popup.html           Settings interface
├── popup.js             Settings logic and UI behavior
├── content_bridge.js    Safe bridge between scripts
├── seed.js              Default configuration presets
└── styles.css           Optional UI styling

Installation (developer mode)
Download or clone the repository
git clone https://github.com/your-username/freezetube.git
cd freezetube
Open Chrome extensions page
Go to chrome://extensions
Enable Developer Mode
Load the extension
Click Load unpacked
Select the FreezeTube folder
Test it
Open YouTube
Refresh the page
Feed should stop behaving normally
How it works

FreezeTube runs a content script on YouTube pages.

It:

Observes DOM changes
Blocks new feed inserts
Removes recommendation containers
Limits render cycles for homepage grid
Overrides infinite scroll triggers

It does not modify YouTube servers.

Everything happens locally in your browser.

Privacy
No data collection
No external servers
No analytics
No tracking scripts

Everything stays on-device.

Roadmap
Custom study modes
Time-based locking presets
Usage analytics (local only)
Per-channel whitelist
Focus sessions timer integration
Firefox support
Use cases
Studying with YouTube lectures
Coding tutorials without distraction loops
Research sessions
Controlled entertainment browsing
License

MIT License
