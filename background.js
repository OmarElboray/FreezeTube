// ============================================================
// background.js — Service Worker (Manifest V3)
// Handles cross-tab messaging, subscription state, and
// session-level storage coordination.
// ============================================================

const DEFAULT_SETTINGS = {
  freezeEnabled: true,
  proEnabled: false,
  snapshotPersist: false, // Pro: persist across browser restarts
};

// ── Subscription / Monetisation ────────────────────────────
/**
 * Mock subscription check. Replace the body with a real
 * ExtensionPay or Stripe Checkout call in production.
 *
 * ExtensionPay example:
 *   const extpay = ExtPay('your-extension-id');
 *   const user   = await extpay.getUser();
 *   return user.paid;
 */
async function checkSubscriptionStatus() {
  // MOCK — swap for real API call
  const { proEnabled } = await chrome.storage.local.get({ proEnabled: false });
  return proEnabled;
}

// ── Install / Update lifecycle ──────────────────────────────
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.local.set(DEFAULT_SETTINGS);
    console.log('[FeedFreezer] Installed. Default settings written.');
  }
});

// ── Message router ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {

    // Content script asking whether freeze is active
    case 'GET_SETTINGS': {
      chrome.storage.local
        .get(DEFAULT_SETTINGS)
        .then(settings => sendResponse({ ok: true, settings }));
      return true; // keep channel open for async response
    }

    // Popup toggling a setting
    case 'SET_SETTING': {
      const { key, value } = message;
      chrome.storage.local
        .set({ [key]: value })
        .then(async () => {
          // If user just enabled proEnabled, validate subscription
          if (key === 'proEnabled' && value === true) {
            const paid = await checkSubscriptionStatus();
            if (!paid) {
              // revert & tell popup
              await chrome.storage.local.set({ proEnabled: false });
              sendResponse({ ok: false, reason: 'not_subscribed' });
              return;
            }
          }
          sendResponse({ ok: true });

          // Broadcast change to all YouTube tabs so content.js can react
          const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
          for (const tab of tabs) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'SETTINGS_CHANGED',
              key,
              value,
            }).catch(() => {}); // tab may not have content script yet
          }
        });
      return true;
    }

    // Content script asking service worker to clear session snapshot
    case 'CLEAR_SNAPSHOT': {
      chrome.storage.session
        .remove('feedSnapshot')
        .then(() => sendResponse({ ok: true }));
      return true;
    }

    // Popup / content requesting subscription check
    case 'CHECK_SUBSCRIPTION': {
      checkSubscriptionStatus().then(paid => sendResponse({ paid }));
      return true;
    }

    default:
      break;
  }
});