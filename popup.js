// ============================================================
// popup.js — Popup UI logic
// ============================================================

const SNAPSHOT_KEY = 'yff_feedSnapshot';

// ── DOM refs ───────────────────────────────────────────────
const toggleFreeze   = document.getElementById('toggleFreeze');
const togglePersist  = document.getElementById('togglePersist');
const togglePro      = document.getElementById('togglePro');
const statusBadge    = document.getElementById('statusBadge');
const snapDot        = document.getElementById('snapDot');
const snapLabel      = document.getElementById('snapLabel');
const snapSub        = document.getElementById('snapSub');
const proPanelFree   = document.getElementById('proPanelFree');
const proSectionPaid = document.getElementById('proSectionPaid');
const btnGoHome      = document.getElementById('btnGoHome');
const btnClear       = document.getElementById('btnClear');
const btnRefresh     = document.getElementById('btnRefresh');
const btnUpgrade     = document.getElementById('btnUpgrade');
const toast          = document.getElementById('toast');

// ── Toast helper ────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Safe URL Checker ────────────────────────────────────────
function isYouTubeUrl(url) {
  if (!url) return false;
  return url.toLowerCase().includes('youtube.com');
}

// ── Update snapshot status UI ───────────────────────────────
async function refreshSnapshotStatus(settings) {
  let html = null;

  try {
    if (settings.proEnabled && settings.snapshotPersist) {
      // Pro users: read from extension's local storage
      const r = await chrome.storage.local.get(SNAPSHOT_KEY);
      html = r[SNAPSHOT_KEY] || null;
    } else {
      // Free users: read from the active tab's session memory
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && isYouTubeUrl(tab.url)) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (key) => sessionStorage.getItem(key),
          args: [SNAPSHOT_KEY],
        }).catch(() => null);
        html = results?.[0]?.result || null;
      }
    }
  } catch (e) { 
    console.log("Status check bypassed: Not on an active YouTube tab."); 
  }

  // Update the UI based on whether we found a snapshot
  if (html) {
    const kb = ((html.length * 2) / 1024).toFixed(0);
    if (snapDot) snapDot.className   = 'snapshot-dot active';
    if (snapLabel) snapLabel.textContent = `Snapshot saved (${kb} KB)`;
    if (snapSub) snapSub.textContent   = 'Feed is currently frozen ❄';
    if (btnClear) btnClear.disabled   = false;
  } else {
    if (snapDot) snapDot.className   = 'snapshot-dot inactive';
    if (snapLabel) snapLabel.textContent = 'No snapshot saved';
    if (snapSub) snapSub.textContent   = 'Visit YouTube\'s home page to capture a feed';
    if (btnClear) btnClear.disabled   = true;
  }
}

// ── Apply settings to UI ────────────────────────────────────
async function applySettings(settings) {
  if (toggleFreeze) toggleFreeze.checked = !!settings.freezeEnabled;
  const isPro = !!settings.proEnabled;

  if (statusBadge) {
    if (settings.freezeEnabled) {
      statusBadge.textContent = 'Active';
      statusBadge.className   = 'status-badge active';
    } else {
      statusBadge.textContent = 'Paused';
      statusBadge.className   = 'status-badge inactive';
    }
  }

  if (isPro) {
    if (proPanelFree) proPanelFree.style.display   = 'none';
    if (proSectionPaid) proSectionPaid.style.display = 'block';
    if (togglePersist) togglePersist.disabled       = false;
    if (togglePro) togglePro.checked            = true;
  } else {
    if (proPanelFree) proPanelFree.style.display   = 'block';
    if (proSectionPaid) proSectionPaid.style.display = 'none';
    if (togglePersist) togglePersist.disabled       = true;
  }

  if (togglePersist) togglePersist.checked = !!settings.snapshotPersist;
  await refreshSnapshotStatus(settings);
}

// ── Load initial state ──────────────────────────────────────
chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, async res => {
  if (res?.ok) await applySettings(res.settings);
});

// ── Toggles ─────────────────────────────────────────────────
if (toggleFreeze) {
  toggleFreeze.addEventListener('change', async () => {
    const value = toggleFreeze.checked;
    chrome.runtime.sendMessage({ type: 'SET_SETTING', key: 'freezeEnabled', value }, res => {
      if (res?.ok) {
        if (statusBadge) {
          statusBadge.textContent = value ? 'Active'  : 'Paused';
          statusBadge.className   = `status-badge ${value ? 'active' : 'inactive'}`;
        }
        showToast(value ? 'Feed freezing enabled ❄' : 'Feed freezing paused');
      }
    });
  });
}

if (togglePersist) {
  togglePersist.addEventListener('change', async () => {
    const value = togglePersist.checked;
    chrome.runtime.sendMessage({ type: 'SET_SETTING', key: 'snapshotPersist', value }, res => {
      if (res?.ok) showToast(value ? 'Snapshot persistence on ✦' : 'Persistence off');
    });
  });
}

if (togglePro) {
  togglePro.addEventListener('change', async () => {
    const value = togglePro.checked;
    chrome.runtime.sendMessage({ type: 'SET_SETTING', key: 'proEnabled', value }, async res => {
      if (res?.ok) {
        showToast(value ? '⚡ Pro mode active!' : 'Pro mode disabled');
      } else if (res?.reason === 'not_subscribed') {
        togglePro.checked = false;
        showToast('⚠ No active subscription found');
      }
    });
  });
}

// ── Buttons ─────────────────────────────────────────────────
if (btnGoHome) {
  btnGoHome.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && isYouTubeUrl(tab.url)) {
        chrome.tabs.update(tab.id, { url: 'https://www.youtube.com/' });
      } else {
        chrome.tabs.create({ url: 'https://www.youtube.com/' });
      }
    } catch (e) {
      chrome.tabs.create({ url: 'https://www.youtube.com/' });
    }
    window.close();
  });
}

if (btnClear) {
  btnClear.addEventListener('click', async () => {
    await chrome.storage.local.remove(SNAPSHOT_KEY);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && isYouTubeUrl(tab.url)) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (key) => sessionStorage.removeItem(key),
          args: [SNAPSHOT_KEY],
        });
      }
    } catch (e) {
      console.log("Could not clear session storage from tab.");
    }

    if (snapDot) snapDot.className   = 'snapshot-dot inactive';
    if (snapLabel) snapLabel.textContent = 'Snapshot cleared';
    if (snapSub) snapSub.textContent   = 'Visit home to capture a new feed';
    btnClear.disabled   = true;
    showToast('Snapshot cleared ✓');
  });
}

if (btnRefresh) {
  btnRefresh.addEventListener('click', async () => {
    await chrome.storage.local.remove(SNAPSHOT_KEY);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && isYouTubeUrl(tab.url)) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (key) => {
            sessionStorage.removeItem(key);
            window.location.href = '/?yff_refresh=1';
          },
          args: [SNAPSHOT_KEY],
        });
      } else {
        chrome.tabs.create({ url: 'https://www.youtube.com/?yff_refresh=1' });
      }
      showToast('Loading fresh feed…');
      setTimeout(() => window.close(), 1000); 
    } catch (e) {
      showToast('Could not reach YouTube tab');
      console.error(e);
    }
  });
}

if (btnUpgrade) {
  btnUpgrade.addEventListener('click', () => {
    showToast('Redirecting to checkout… (mock)');
    setTimeout(async () => {
      await chrome.storage.local.set({ proEnabled: true });
      const res = await new Promise(r =>
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, r)
      );
      if (res?.ok) await applySettings(res.settings);
      showToast('⚡ Pro activated! (mock)');
    }, 1500);
  });
}

// ── Feedback link ────────────────────────────────────────────
const linkFeedback = document.getElementById('linkFeedback');
if (linkFeedback) {
  linkFeedback.addEventListener('click', e => {
    e.preventDefault();
    chrome.tabs.create({ url: 'mailto:support@example.com?subject=Feed+Freezer+Feedback' });
  });
}