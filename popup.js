// ============================================================
// popup.js — Bulletproof Version
// ============================================================

let isFrozen = false; 

// ── DOM Elements ─────────────
const toggleBtn = document.getElementById('toggleBtn');
const statusText = document.getElementById('statusText');

// ── Safe URL Checker ────────────────────────────────────────
function isYouTubeUrl(url) {
  if (!url) return false;
  return url.toLowerCase().includes('youtube.com');
}

// ── Update Visuals ──────────────
function updateUIState(frozen) {
  if (frozen) {
    toggleBtn.innerText = "Unfreeze Feed";
    toggleBtn.classList.add('frozen');
    statusText.innerText = "Feed Frozen";
    statusText.style.color = "var(--accent-red)";
  } else {
    toggleBtn.innerText = "Freeze Feed";
    toggleBtn.classList.remove('frozen');
    statusText.innerText = "Algorithm Active";
    statusText.style.color = "var(--text-grey)";
  }
}

// ── 1. Load Initial State on Open ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Use Chrome Storage as the absolute source of truth to prevent amnesia
  chrome.storage.local.get(['freezeEnabled'], (result) => {
    isFrozen = !!result.freezeEnabled;
    updateUIState(isFrozen);
  });
});

// ── 2. The Main Button Click ────────────────────────────────
toggleBtn.addEventListener('click', async () => {
  // Flip the state
  isFrozen = !isFrozen;
  
  // Instantly update the UI
  updateUIState(isFrozen);

  // Save the setting locally so it remembers next time you open the popup
  chrome.storage.local.set({ freezeEnabled: isFrozen });

  // Optional: Tell the background script just in case your other files need it
  chrome.runtime.sendMessage({ type: 'SET_SETTING', key: 'freezeEnabled', value: isFrozen }, (response) => {
      // Catch the error quietly if the background script doesn't reply
      if (chrome.runtime.lastError) { /* ignore */ }
  });

  // Send the live command to the YouTube tab safely
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && isYouTubeUrl(tab.url)) {
      chrome.tabs.sendMessage(tab.id, { 
        action: "toggleFeed", 
        isPaused: isFrozen 
      }, (response) => {
        // THIS is the magic line that catches the error and stops the console from crashing
        if (chrome.runtime.lastError) {
          console.log("YouTube tab not fully loaded or content script missing. Try refreshing the YouTube page.");
        }
      });
    }
  } catch (e) {
    console.log("Could not send direct message to tab", e);
  }
});