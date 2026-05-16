(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────
  const FEED_SELECTOR   = 'ytd-rich-grid-renderer';
  const SNAPSHOT_KEY    = 'yff_feedSnapshot';
  const MIN_CARDS       = 8; 
  const CAPTURE_DELAY   = 2500; // Time to wait for thumbnails to load

  // ── State ──────────────────────────────────────────────────
  let settings = { freezeEnabled: true };
  let snapshotTaken = false;
  let isRehydrating = false;

  const log = (...args) => console.debug('[FeedFreezer]', ...args);

  // ── Capture Logic ──────────────────────────────────────────
  async function captureAndSaveFeed() {
    const grid = document.querySelector(FEED_SELECTOR);
    if (!grid || snapshotTaken || isRehydrating) return;

    // We only capture if there are enough videos rendered
    const cards = grid.querySelectorAll('ytd-rich-item-renderer');
    if (cards.length < MIN_CARDS) return;

    setTimeout(() => {
      if (isRehydrating) return; // Don't snapshot while we are injecting
      
      log('Capturing feed state...');
      const clone = grid.cloneNode(true);
      
      // Clean up UI noise
      clone.querySelectorAll('ytd-continuation-item-renderer').forEach(el => el.remove());

      sessionStorage.setItem(SNAPSHOT_KEY, clone.innerHTML);
      snapshotTaken = true;
      log('Snapshot saved.');
    }, CAPTURE_DELAY);
  }

  // ── Re-hydration Engine (Fixes Photos & Scroll) ─────────────
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
      grid.innerHTML = html;

      // FIX 1: Restore Thumbnails
      grid.querySelectorAll('img').forEach(img => {
        const realUrl = img.getAttribute('data-thumb') || img.getAttribute('data-src');
        if (realUrl) {
          img.src = realUrl;
          img.removeAttribute('loading');
        }
      });

      // FIX 2: Restore Shadow DOM images
      grid.querySelectorAll('yt-img-shadow').forEach(shadow => {
        const innerImg = shadow.querySelector('img');
        if (innerImg && innerImg.dataset.src) {
          innerImg.src = innerImg.dataset.src;
        }
      });

      // FIX 3: Re-enable Infinite Scroll
      // We manually check if the user is near the bottom
      window.addEventListener('scroll', () => {
        const scrollPos = window.innerHeight + window.scrollY;
        const threshold = document.body.offsetHeight - 1500; // Trigger early
        
        if (scrollPos >= threshold) {
          // Dispatch a fake scroll event to wake up YouTube's internal fetcher
          window.dispatchEvent(new Event('scroll'));
          
          // Allow the extension to capture the new videos that get added
          snapshotTaken = false;
          captureAndSaveFeed();
        }
      }, { passive: true });

      log('Feed restored. Infinite scroll re-connected.');
      isRehydrating = false;
    };

    tryInject();
    return true;
  }

  // ── Navigation Router ──────────────────────────────────────
  async function onNavigate() {
    if (location.pathname !== '/') return;

    const snapshot = sessionStorage.getItem(SNAPSHOT_KEY);
    if (snapshot && settings.freezeEnabled) {
      await injectFrozenFeed();
    } else {
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

  // ── Refresh Button ─────────────────────────────────────────
  function injectRefreshButton() {
    if (document.getElementById('yff-refresh-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'yff-refresh-btn';
    btn.innerHTML = '❄ <b>Refresh Feed</b>';
    
    Object.assign(btn.style, {
      padding: '0 16px',
      height: '36px',
      borderRadius: '18px',
      border: '1px solid #3f3f3f',
      background: '#272727',
      color: '#fff',
      cursor: 'pointer',
      marginLeft: '12px',
      fontSize: '14px',
      fontFamily: 'Roboto, Arial'
    });

    btn.onclick = () => {
      sessionStorage.removeItem(SNAPSHOT_KEY);
      location.reload();
    };

    const masthead = document.querySelector('#end.ytd-masthead');
    if (masthead) masthead.prepend(btn);
  }

  // ── Start ──────────────────────────────────────────────────
  document.addEventListener('yt-navigate-finish', onNavigate);
  document.addEventListener('yt-navigate-finish', injectRefreshButton);
  
  onNavigate();
  injectRefreshButton();

})();