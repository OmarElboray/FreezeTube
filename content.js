(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────
  const FEED_SELECTOR   = 'ytd-rich-grid-renderer';
  const FEED_CONTENTS   = 'ytd-rich-grid-renderer #contents'; 
  const SNAPSHOT_KEY    = 'yff_feedSnapshot';
  const MIN_CARDS       = 8; 
  const CAPTURE_DELAY   = 2500; 

  // ── State ──────────────────────────────────────────────────
  // Default to false so it only freezes when you click the popup button
  let settings = { freezeEnabled: false }; 
  let snapshotTaken = false;
  let isRehydrating = false;
  let feedObserver = null; 

  const log = (...args) => console.debug('[FeedFreezer]', ...args);

  // ── Communication with Popup ───────────────────────────────
  // THIS IS THE MISSING LINK: Listening for the popup button click
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "toggleFeed") {
        settings.freezeEnabled = request.isPaused;
        
        if (settings.freezeEnabled) {
          log("Popup commanded: FREEZE");
          captureAndSaveFeed();
          startInfiniteScrollBlocker();
        } else {
          log("Popup commanded: UNFREEZE");
          stopInfiniteScrollBlocker();
          sessionStorage.removeItem(SNAPSHOT_KEY);
          snapshotTaken = false;
          // Trigger a scroll to wake YouTube back up
          window.dispatchEvent(new Event('scroll'));
        }
        sendResponse({ status: "success" });
      }
    });
  }

  // ── Method 2: Smart Infinite Scroll Blocker ────────────────
  function startInfiniteScrollBlocker() {
    if (feedObserver) return; 

    const feed = document.querySelector(FEED_CONTENTS) || document.querySelector(FEED_SELECTOR);
    if (!feed) return;

    log('Starting Infinite Scroll Blocker...');
    
    feedObserver = new MutationObserver((mutations) => {
      if (!settings.freezeEnabled) return; 

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.tagName) {
              const tag = node.tagName.toUpperCase();
              if (tag === 'YTD-RICH-GRID-ROW' || tag === 'YTD-CONTINUATION-ITEM-RENDERER') {
                node.remove(); 
              }
            }
          });
        }
      });
    });

    feedObserver.observe(feed, { childList: true });
  }

  function stopInfiniteScrollBlocker() {
    if (feedObserver) {
      feedObserver.disconnect();
      feedObserver = null;
      log('Infinite Scroll Blocker stopped.');
    }
  }

  // ── Capture Logic ──────────────────────────────────────────
  async function captureAndSaveFeed() {
    if (!settings.freezeEnabled) return;

    const grid = document.querySelector(FEED_SELECTOR);
    if (!grid || snapshotTaken || isRehydrating) return;

    const cards = grid.querySelectorAll('ytd-rich-item-renderer');
    if (cards.length < MIN_CARDS) return;

    setTimeout(() => {
      if (isRehydrating || !settings.freezeEnabled) return; 
      
      log('Capturing feed state...');
      const clone = grid.cloneNode(true);
      
      clone.querySelectorAll('ytd-continuation-item-renderer').forEach(el => el.remove());

      sessionStorage.setItem(SNAPSHOT_KEY, clone.innerHTML);
      snapshotTaken = true;
      log('Snapshot saved.');

      startInfiniteScrollBlocker();
    }, CAPTURE_DELAY);
  }

  // ── Re-hydration Engine ─────────────────────────────────────
  async function injectFrozenFeed() {
    const html = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!html) return false;

    isRehydrating = true;
    let attempts = 0;

    const tryInject = () => {
      const grid = document.querySelector(FEED_SELECTOR);
      if (!grid) {
        if (attempts++ < 30) setTimeout(tryInject, 100);
        return;
      }

      log('Injecting frozen feed...');

      let currentEl = grid;
      while (currentEl && currentEl.tagName) {
        currentEl.removeAttribute('hidden');
        if (currentEl.style.display === 'none') {
          currentEl.style.display = ''; 
        }
        if (currentEl.tagName.toLowerCase() === 'ytd-app') break;
        currentEl = currentEl.parentElement;
      }

      grid.innerHTML = html;

      grid.querySelectorAll('img').forEach(img => {
        const realUrl = img.getAttribute('data-thumb') || img.getAttribute('data-src');
        if (realUrl) {
          img.src = realUrl;
          img.removeAttribute('loading');
        }
      });

      grid.querySelectorAll('yt-img-shadow').forEach(shadow => {
        const innerImg = shadow.querySelector('img');
        if (innerImg && innerImg.dataset.src) {
          innerImg.src = innerImg.dataset.src;
        }
      });

      startInfiniteScrollBlocker();
      log('Feed restored.');
      isRehydrating = false;
    };

    setTimeout(tryInject, 50);
    return true;
  }

  // ── Navigation Router ──────────────────────────────────────
  async function onNavigate() {
    if (location.pathname !== '/') {
        stopInfiniteScrollBlocker();
        return;
    }

    const snapshot = sessionStorage.getItem(SNAPSHOT_KEY);
    if (snapshot && settings.freezeEnabled) {
      await injectFrozenFeed();
    } else if (settings.freezeEnabled) {
      snapshotTaken = false;
      const observer = new MutationObserver(() => {
        if (document.querySelector(FEED_SELECTOR)) {
          captureAndSaveFeed(); 
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ── Start ──────────────────────────────────────────────────
  document.addEventListener('yt-navigate-finish', onNavigate);
  onNavigate();

})();