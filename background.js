/* ================================================================
   TabFlow — background.js
   Handles global hotkey commands and tab focus/open logic.
   This runs as a service worker, active across ALL browser tabs.
   ================================================================ */

/* ---------- Domain matching ---------- */
// Plain chrome.tabs.query({url: x}) requires match patterns.
// Instead we query all tabs and compare manually.
function topLevelDomain(rawUrl) {
  if (!rawUrl) return '';
  try {
    const host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
    const parts = host.split('.').filter(Boolean);
    if (parts.length <= 2) return host;

    // Handle common multi-part country suffixes (e.g. example.co.uk).
    const multiPartSuffixes = new Set([
      'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
      'com.au', 'net.au', 'org.au',
      'co.jp', 'ne.jp', 'or.jp',
      'com.br', 'com.mx', 'com.tr',
    ]);
    const last2 = parts.slice(-2).join('.');
    if (multiPartSuffixes.has(last2) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }

    return last2;
  } catch {
    return '';
  }
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
  if (!tab) return; // slot not assigned, do nothing

  await focusOrOpen(tab.url);
});

/* ---------- Keep service worker alive ---------- */
chrome.runtime.onInstalled.addListener(() => {
  console.log('TabFlow installed / updated.');
});
