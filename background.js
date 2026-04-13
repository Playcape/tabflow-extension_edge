/* ================================================================
   TabFlow — background.js
   Handles global hotkey commands and tab focus/open logic.
   This runs as a service worker, active across ALL browser tabs.
   ================================================================ */

/* ---------- URL matching ---------- */
// Plain chrome.tabs.query({url: x}) requires match patterns.
// Instead we query all tabs and compare manually.
function urlsMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  try {
    const pa = new URL(a);
    const pb = new URL(b);
    // Match on protocol + host + pathname (ignore query/hash)
    const norm = u => u.protocol + '//' + u.hostname + u.pathname.replace(/\/$/, '');
    return norm(pa) === norm(pb);
  } catch { return false; }
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
  if (!tab) return; // slot not assigned, do nothing

  await focusOrOpen(tab.url);
});

/* ---------- Keep service worker alive ---------- */
chrome.runtime.onInstalled.addListener(() => {
  console.log('TabFlow installed / updated.');
});
