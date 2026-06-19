```markdown
# FreezeTube

FreezeTube is a lightweight (<12KB), zero-bloat browser extension built in vanilla JavaScript using Manifest V3. It protects your deep-work and study blocks by eliminating infinite scroll on YouTube, capping the homepage grid, and hiding distracting recommendation sidebars and Shorts without completely blocking access to the platform.

---

## 🚀 Features

* **Infinite Scroll Killer:** Prevents YouTube from continuously loading new recommendations.
* **Recommendation Caps:** Limits the initial number of videos displayed on your homepage.
* **Distraction Shield:** Option to hide sidebars, comments, and the Shorts tab.
* **Minimalist & Lightweight:** Built with pure vanilla JS under 12KB—zero dependencies, maximum performance.

---

## 📂 Project Structure

```text
├── manifest.json        # Extension configuration (Manifest V3)
├── popup.html          # Extension popup UI
├── popup.js            # Popup interactive behavior & settings management
├── background.js       # Background service worker
├── content.js          # Main content script injecting DOM modifications
├── content_bridge.js   # Execution bridge for script isolation handling
└── seed.js             # Initial state/preset configuration definitions

```

---

## 🛠️ Development Setup

To load and test the extension locally:

1. **Clone the repository:**

```bash
   git clone [https://github.com/your-username/freezetube.git](https://github.com/your-username/freezetube.git)
   cd freezetube

```

2. **Load the extension in Chrome:**
* Open Chrome and navigate to `chrome://extensions/`.
* Enable **Developer mode** using the toggle switch in the top right corner.
* Click **Load unpacked** in the top left corner.
* Select the root directory containing your project files.


3. **Modify & Reload:**
* Make changes to the codebase.
* Click the **Refresh icon** on the FreezeTube card in `chrome://extensions/` to apply updates instantly.



---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

```

```
