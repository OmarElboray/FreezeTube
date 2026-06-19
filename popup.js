(() => {
  'use strict';

  const KEYS = ['freezeFeed', 'hideRecommendations', 'hideEndScreen', 'blockShorts'];
  const DEFAULTS = { freezeFeed: true, hideRecommendations: true, hideEndScreen: false, blockShorts: true, maxVideos: 12 };

  // This now waits for local.set to finish BEFORE reloading
  function updateSettingsAndReload(wipeVault = false) {
    const newSettings = {
      freezeFeed: document.getElementById('freezeFeed').checked,
      hideRecommendations: document.getElementById('hideRecommendations').checked,
      hideEndScreen: document.getElementById('hideEndScreen').checked,
      blockShorts: document.getElementById('blockShorts').checked,
      maxVideos: parseInt(document.getElementById('maxVideos').value, 10)
    };

    chrome.storage.local.set(newSettings, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        if (tab && tab.url && tab.url.includes('youtube.com')) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (shouldWipe, settings) => {
              window.localStorage.setItem('ytFreezeConfig', JSON.stringify({ 
                  enabled: settings.freezeFeed, 
                  limit: settings.maxVideos 
              }));
              if (shouldWipe) window.localStorage.removeItem('ytFrozenVault');
              window.location.reload();
            },
            args: [wipeVault, newSettings]
          });
        }
      });
    });
  }

  function applyPreset(presetName) {
    const presets = {
      study: { freezeFeed: true, maxVideos: 6, hideRecommendations: true, blockShorts: true, hideEndScreen: true },
      research: { freezeFeed: true, maxVideos: 18, hideRecommendations: false, blockShorts: true, hideEndScreen: false },
      deep: { freezeFeed: true, maxVideos: 0, hideRecommendations: true, blockShorts: true, hideEndScreen: true }
    };
    
    const p = presets[presetName];
    
    // Update UI toggles visually before saving
    KEYS.forEach(key => { if (p[key] !== undefined) document.getElementById(key).checked = p[key]; });
    if (p.maxVideos !== undefined) document.getElementById('maxVideos').value = p.maxVideos.toString();
    
    updateSettingsAndReload(false);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Load Stats
    chrome.storage.local.get(['stats'], res => {
      const s = res.stats || { blocked: 0, hidden: 0, timeSaved: 0 };
      document.getElementById('stat-blocked').innerText = s.blocked > 999 ? (s.blocked/1000).toFixed(1) + 'k' : s.blocked;
      document.getElementById('stat-hidden').innerText = s.hidden;
      const hours = Math.floor(s.timeSaved / 60);
      document.getElementById('stat-time').innerText = hours > 0 ? `${hours}h` : `${s.timeSaved}m`;
    });

    // Load Settings and attach instant-reload listeners
    chrome.storage.local.get([...KEYS, 'maxVideos'], stored => {
      KEYS.forEach(key => {
        const checkbox = document.getElementById(key);
        if (!checkbox) return;
        checkbox.checked = stored[key] !== undefined ? stored[key] : DEFAULTS[key];
        
        checkbox.addEventListener('change', () => updateSettingsAndReload(false));

     document.getElementById(`row-${key}`).addEventListener('click', e => {
          // BUG FIX: Check for .switch instead of .toggle to prevent double-firing
          if (e.target.closest('.switch')) return; 
          checkbox.checked = !checkbox.checked;
          updateSettingsAndReload(false);
        });
      });

      const maxVideosSelect = document.getElementById('maxVideos');
      maxVideosSelect.value = (stored.maxVideos !== undefined ? stored.maxVideos : DEFAULTS.maxVideos).toString();
      maxVideosSelect.addEventListener('change', () => updateSettingsAndReload(true)); // Wipe vault on limit change
    });

    // The manual refresh button is now purely to fetch a new batch of videos
    document.getElementById('forceRefreshBtn').addEventListener('click', () => updateSettingsAndReload(true));
    
    document.getElementById('pre-study').addEventListener('click', () => applyPreset('study'));
    document.getElementById('pre-research').addEventListener('click', () => applyPreset('research'));
    document.getElementById('pre-deep').addEventListener('click', () => applyPreset('deep'));
  });
})();