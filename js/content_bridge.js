(function () {
  'use strict';

  chrome.storage.local.get(['freezeFeed', 'maxVideos', 'hideRecommendations', 'hideEndScreen', 'blockShorts'], (res) => {
    
    const config = {
        enabled: res.freezeFeed !== false, 
        limit: typeof res.maxVideos === 'number' ? res.maxVideos : 12
    };
    window.localStorage.setItem('ytFreezeConfig', JSON.stringify(config));

    let css = '';
    
    // BUG FIX: Only hide loading spinners if freeze is actually ON
    if (config.enabled) {
        css += `ytd-continuation-item-renderer, tp-yt-paper-spinner-lite, #ghost-cards { display: none !important; } `;
    }
    
    if (res.hideRecommendations !== false) {
        css += `#secondary, #secondary-inner, ytd-watch-next-secondary-results-renderer { display: none !important; } #primary { width: 100% !important; max-width: none !important; } `;
    }
    
    // BUG FIX: Stronger CSS specificity for End Cards
    if (res.hideEndScreen === true) {
        css += `.html5-video-player .ytp-endscreen-content, .html5-video-player .ytp-ce-element, .html5-video-player .ytp-ce-covering-overlay { display: none !important; } `;
    }

    // FEATURE: Block Shorts
    if (res.blockShorts !== false) {
        css += `
        ytd-reel-shelf-renderer, 
        ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]), 
        a[title="Shorts"], 
        #endpoint[title="Shorts"] { display: none !important; }
        `;
        
        // Kill shorts URLs instantly
        if (window.location.pathname.startsWith('/shorts')) window.location.replace('/');
        window.addEventListener('yt-navigate-start', (e) => {
            if (e.detail?.url && e.detail.url.includes('/shorts/')) window.location.replace('/');
        });
    }

    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);

    // STATS LISTENER: Listen for video drops from seed.js
    window.addEventListener('YTF_INCREMENT_STATS', (e) => {
        chrome.storage.local.get(['stats'], (data) => {
            let stats = data.stats || { blocked: 0, hidden: 0, timeSaved: 0 };
            if (e.detail.blockedCount) {
                stats.blocked += e.detail.blockedCount;
                stats.timeSaved += (e.detail.blockedCount * 5); // 5 mins avg per block
            }
            chrome.storage.local.set({ stats });
        });
    });

    // STATS LISTENER: Track Sidebar Hides on navigation
    window.addEventListener('yt-navigate-finish', () => {
        if (res.hideRecommendations !== false && window.location.pathname === '/watch') {
            chrome.storage.local.get(['stats'], (data) => {
                let stats = data.stats || { blocked: 0, hidden: 0, timeSaved: 0 };
                stats.hidden += 1;
                chrome.storage.local.set({ stats });
            });
        }
    });
  });
})();