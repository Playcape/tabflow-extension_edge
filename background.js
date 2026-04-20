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

/* ---------- Link alias redirect via Omnibox (to <alias>) ---------- */
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  if (!text || text.length === 0) return;
  
  try {
    const result = await chrome.storage.local.get('tabflow_v2');
    const data = result['tabflow_v2'];
    const links = (data?.links || []);
    
    // Filter links that start with the user's input (case-insensitive)
    const suggestions = links
      .filter(l => l.name.toLowerCase().startsWith(text.toLowerCase()))
      .map(l => ({
        content: l.name,
        description: `Open: ${l.name} → ${l.url}`
      }))
      .slice(0, 8); // Limit to 8 suggestions
    
    suggest(suggestions);
  } catch (err) {
    console.error('TabFlow omnibox error:', err);
  }
});

chrome.omnibox.onInputEntered.addListener(async (text) => {
  const alias = text.trim();
  if (!alias) return;
  
  try {
    const result = await chrome.storage.local.get('tabflow_v2');
    const data = result['tabflow_v2'];
    const links = (data?.links || []);
    
    // Find exact match (case-insensitive)
    const link = links.find(l => l.name.toLowerCase() === alias.toLowerCase());
    if (link && link.url) {
      // Open in current tab or new tab
      await chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { url: link.url });
        } else {
          chrome.tabs.create({ url: link.url });
        }
      });
    } else {
      console.warn(`TabFlow: Alias "${alias}" not found. Available: ${links.map(l => l.name).join(', ')}`);
      // Open a suggestion anyway - first partial match
      const partial = links.find(l => l.name.toLowerCase().includes(alias.toLowerCase()));
      if (partial && partial.url) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { url: partial.url });
          } else {
            chrome.tabs.create({ url: partial.url });
          }
        });
      }
    }
  } catch (err) {
    console.error('TabFlow omnibox navigation error:', err);
  }
});

/* ---------- Keep service worker alive ---------- */
chrome.runtime.onInstalled.addListener(() => {
  console.log('TabFlow installed / updated.');
});

/* ---------- Reuse existing TabFlow tab on new-tab open ---------- */
chrome.tabs.onCreated.addListener(async (newTab) => {
  try {
    const extensionUrl = chrome.runtime.getURL('newtab.html');
    // Only intercept browser "new tab" opens (no explicit URL).
    // In Edge/Chrome the pendingUrl may be set directly to the extension URL
    // when the extension overrides the new-tab page, so we must include it.
    const pendingUrl = newTab.pendingUrl || newTab.url || '';
    const isNewTab = !pendingUrl ||
      pendingUrl === 'chrome://newtab/' ||
      pendingUrl === 'edge://newtab/' ||
      pendingUrl === 'about:newtab' ||
      pendingUrl === extensionUrl;
    if (!isNewTab) return;

    // Find an existing TabFlow tab in the same window
    const allTabs = await chrome.tabs.query({ windowId: newTab.windowId });
    const existing = allTabs.find(t =>
      t.id !== newTab.id &&
      (t.url === extensionUrl || t.pendingUrl === extensionUrl)
    );

    if (existing) {
      // Switch to the existing TabFlow tab and close the new one
      await chrome.tabs.update(existing.id, { active: true });
      await chrome.tabs.remove(newTab.id);
      // Ask the existing TabFlow page to focus its search bar
      chrome.tabs.sendMessage(existing.id, { type: 'focusSearch' }).catch(err => console.debug('TabFlow focusSearch message failed:', err));
    }
    // If no existing TabFlow tab, let the new tab load normally
  } catch (err) {
    console.error('TabFlow onCreated handler error:', err);
  }
});
