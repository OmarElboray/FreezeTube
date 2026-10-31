# FreezeTube

FreezeTube is a Chrome extension that makes YouTube less distracting without blocking access to videos you intentionally choose to watch.

## What it does

- Freezes the YouTube homepage feed so it does not continuously refresh.
- Limits recommendation inserts while browsing and watching.
- Keeps YouTube search, subscriptions, and playback available.
- Stores settings locally in the browser.
- Requires no account, backend, analytics, or external service.

The extension uses Chrome Manifest V3, a content bridge, and a page-context seed script to control YouTube's dynamically rendered interface.

## Install locally

1. Clone this repository:

   ```bash
   git clone https://github.com/OmarElboray/FreezeTube.git
   cd FreezeTube
   ```

2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose this directory.
5. Open or refresh YouTube.

## Project structure

```text
FreezeTube/
├── manifest.json        # Manifest V3 configuration and permissions
├── background.js        # Extension background logic
├── content.js           # YouTube page behavior
├── js/
│   ├── content_bridge.js
│   └── seed.js
├── popup.html/.js       # Settings popup
└── icons/               # Extension icons
```

## Development

This is a no-build vanilla JavaScript extension. Edit the source files, then use **Reload** on the extension card in `chrome://extensions` to test changes.

## Privacy

FreezeTube operates locally in the browser. It does not collect browsing history, require login, or send YouTube activity to a server.

## License

MIT
