// content_bridge.js - Executes strictly in ISOLATED world at document_start
(function () {
  'use strict';

  // FIX: Look for the exact keys saved by the new popup.js!
  chrome.storage.local.get(['ytFreezeEnabled', 'ytFreezeLimit'], (res) => {
    
    // Sync config to localStorage for seed.js to read instantly
    const config = {
        enabled: res.ytFreezeEnabled !== false, 
        limit: typeof res.ytFreezeLimit === 'number' ? res.ytFreezeLimit : 12
    };
    window.localStorage.setItem('ytFreezeConfig', JSON.stringify(config));

    // Inject CSS Shields to block infinite scroll spinners
    let css = `ytd-continuation-item-renderer, tp-yt-paper-spinner-lite, #ghost-cards { display: none !important; }`;

    const style = document.createElement('style');
    style.textContent = css;
    
    if (document.documentElement) {
      document.documentElement.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.documentElement.appendChild(style));
    }
  });
})();