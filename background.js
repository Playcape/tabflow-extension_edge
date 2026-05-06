/* ================================================================
   TabFlow — background.js
   Handles global hotkey commands and tab focus/open logic.
   This runs as a service worker, active across ALL browser tabs.
   ================================================================ */

const TABFLOW_URL = chrome.runtime.getURL('newtab.html');

/* ---------- Domain matching ---------- */
function topLevelDomain(rawUrl) {
  if (!rawUrl) return '';
  try {
    const host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
    const parts = host.split('.').filter(Boolean);
    if (parts.length <= 2) return host;
    const multiPartSuffixes = new Set([
      'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
      'com.au', 'net.au', 'org.au',
      'co.jp', 'ne.jp', 'or.jp',
      'com.br', 'com.mx', 'com.tr',
    ]);
    const last2 = parts.slice(-2).join('.');
    if (multiPartSuffixes.has(last2) && parts.length >= 3) return parts.slice(-3).join('.');
    return last2;
  } catch { return ''; }
}

function urlsMatch(a, b) {
  const da = topLevelDomain(a);
  const db = topLevelDomain(b);
  return !!da && da === db;
}

/* ---------- Core: focus existing tab or open new one ---------- */
async function focusOrOpen(url) {
  try {
    const allTabs = await chrome.tabs.query({});
    const match = allTabs.find(t => urlsMatch(t.url, url));
    if (match) {
      await chrome.tabs.update(match.id, { active: true });
      await chrome.windows.update(match.windowId, { focused: true });
    } else {
      await chrome.tabs.create({ url });
    }
  } catch (err) {
    console.error('TabFlow focusOrOpen error:', err);
    try { await chrome.tabs.create({ url }); } catch {}
  }
}

/* ---------- Find tab assigned to a slot ---------- */
async function getTabForSlot(slot) {
  try {
    const result = await chrome.storage.local.get('tabflow_v2');
    const data = result['tabflow_v2'];
    if (!data?.spaces) return null;
    for (const sp of data.spaces) {
      for (const col of (sp.collections || [])) {
        for (const tab of (col.tabs || [])) {
          if (tab.hotkey?.slot === slot) return tab;
        }
      }
    }
  } catch (err) {
    console.error('TabFlow storage error:', err);
  }
  return null;
}

/* ---------- Command listener ---------- */
chrome.commands.onCommand.addListener(async (command) => {
  if (!command.startsWith('tabflow-slot-')) return;
  const slot = parseInt(command.split('-')[2], 10);
  if (isNaN(slot)) return;
  const tab = await getTabForSlot(slot);
  if (!tab) return;
  await focusOrOpen(tab.url);
});

/* ---------- Link alias redirect via Omnibox (to <alias>) ---------- */
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  if (!text) return;
  try {
    const result = await chrome.storage.local.get('tabflow_v2');
    const links = result['tabflow_v2']?.links || [];
    const suggestions = links
      .filter(l => l.name.toLowerCase().startsWith(text.toLowerCase()))
      .map(l => ({ content: l.name, description: `Open: ${l.name} → ${l.url}` }))
      .slice(0, 8);
    suggest(suggestions);
  } catch (err) {
    console.error('TabFlow omnibox error:', err);
  }
});

/* item 6: use async/await consistently — removed legacy callback style */
chrome.omnibox.onInputEntered.addListener(async (text) => {
  const alias = text.trim();
  if (!alias) return;
  try {
    const result = await chrome.storage.local.get('tabflow_v2');
    const links = result['tabflow_v2']?.links || [];
    const link = links.find(l => l.name.toLowerCase() === alias.toLowerCase())
      || links.find(l => l.name.toLowerCase().includes(alias.toLowerCase()));
    if (link?.url) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { url: link.url });
      } else {
        await chrome.tabs.create({ url: link.url });
      }
    } else {
      console.warn(`TabFlow: Alias "${alias}" not found.`);
    }
  } catch (err) {
    console.error('TabFlow omnibox navigation error:', err);
  }
});

/* ---------- Install / keep-alive (items 52, 63) ---------- */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('TabFlow installed / updated.');
  // item 63: recurring alarm keeps the service worker from being evicted
  chrome.alarms.create('tabflow-keepalive', { periodInMinutes: 1 });
  // item 52: mark first run so newtab.js can auto-detect prefers-color-scheme
  if (details.reason === 'install') {
    await chrome.storage.local.set({ tabflow_first_run: true });
  }
});

/* item 63: heartbeat — waking the worker is sufficient */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tabflow-keepalive') { /* intentionally empty */ }
});

/* ---------- Reuse existing TabFlow tab on new-tab open ---------- */

// Returns true if a tab is TabFlow (loaded/loading) or is a new-tab page
// that the browser will route to TabFlow before it finishes loading.
// This covers the race where a second new tab opens before the first one's
// pendingUrl has transitioned from 'chrome://newtab/' to TABFLOW_URL.
function isTabflowBound(t) {
  const u = t.url || '';
  const p = t.pendingUrl || '';
  if (u === TABFLOW_URL || p === TABFLOW_URL) return true;
  const isNewTabUrl = s => !s || s === 'chrome://newtab/' || s === 'edge://newtab/' || s === 'about:newtab';
  return isNewTabUrl(u) && isNewTabUrl(p);
}

chrome.tabs.onCreated.addListener(async (newTab) => {
  try {
    const pendingUrl = newTab.pendingUrl || newTab.url || '';
    const isNewTab = !pendingUrl ||
      pendingUrl === 'chrome://newtab/' ||
      pendingUrl === 'edge://newtab/' ||
      pendingUrl === 'about:newtab' ||
      pendingUrl === TABFLOW_URL;
    if (!isNewTab) return;

    // Search all windows for an existing or pending TabFlow tab,
    // including tabs still sitting at the browser's new-tab URL.
    const allTabs = await chrome.tabs.query({});
    const existing = allTabs.find(t =>
      t.id !== newTab.id && isTabflowBound(t)
    );

    if (existing) {
      await chrome.windows.update(existing.windowId, { focused: true });
      await chrome.tabs.update(existing.id, { active: true });
      await chrome.tabs.remove(newTab.id);
      chrome.tabs.sendMessage(existing.id, { type: 'focusSearch' })
        .catch(() => {});
    }
  } catch (err) {
    console.error('TabFlow onCreated handler error:', err);
  }
});

/* ---------- Deduplicate TabFlow tabs as they finish loading ----------
   Handles the race condition where multiple new tabs are opened before
   any of them has loaded newtab.html (so onCreated can't find an existing
   one). Triggers both when the URL changes to TABFLOW_URL and when any
   TabFlow tab finishes loading (status=complete), covering the case where
   the new-tab override sets the URL directly without a URL-change event.
   ------------------------------------------------------------------- */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const isTabflowComplete =
    changeInfo.url === TABFLOW_URL ||
    (changeInfo.status === 'complete' && tab.url === TABFLOW_URL);
  if (!isTabflowComplete) return;
  try {
    const allTabs = await chrome.tabs.query({});
    const tabflowTabs = allTabs.filter(t =>
      t.url === TABFLOW_URL || t.pendingUrl === TABFLOW_URL
    );
    if (tabflowTabs.length <= 1) return;

    // Keep the oldest tab (lowest id), close all duplicates
    tabflowTabs.sort((a, b) => a.id - b.id);
    const keep = tabflowTabs[0];
    const toClose = tabflowTabs.slice(1).map(t => t.id);

    await chrome.windows.update(keep.windowId, { focused: true });
    await chrome.tabs.update(keep.id, { active: true });
    for (const id of toClose) {
      try { await chrome.tabs.remove(id); } catch {}
    }
    if (keep.id !== tabId) {
      chrome.tabs.sendMessage(keep.id, { type: 'focusSearch' }).catch(() => {});
    }
  } catch (err) {
    console.error('TabFlow onUpdated dedup error:', err);
  }
});
