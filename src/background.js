/* ================================================================
   TabFlow — background (MV3 service worker on Chromium,
   event page on Firefox/Zen; both load this same module).

   New-tab takeover is done by *redirect*, not `chrome_url_overrides`:
   a browser new tab is navigated to TabFlow's own page URL, so it loads
   as an ordinary extension page. That's deliberate — an ordinary page
   shows its favicon in the tab strip, whereas the browser never paints
   one for its New Tab Page. On top of that we keep a *single* TabFlow
   tab per window: a duplicate new tab sends the user back to the existing
   tab (and focuses its search box) instead of piling up copies.

   That redirect costs the browser's address-bar focus, so it is opt-in
   (Settings → Advanced → New tab focus → TabFlow search). The default,
   "Address bar", leaves new tabs on the manifest's chrome_url_overrides
   page: the browser opens it with its own address bar focused. To still
   keep one workspace per window, the newest TabFlow tab wins there: when
   a new tab opens, older idle TabFlow tabs in that window are closed
   (never pinned or audible ones, never the new tab).

   Responsibilities:
     • global hotkey slots (commands API)
     • omnibox "to <alias>" navigation
     • toolbar action → focus or open the TabFlow page
     • new-tab redirect + single-instance dedup
     • first-run marker for theme auto-detection
   ================================================================ */

import {
  ext,
  isTabFlowTab,
  IS_CHROMIUM,
  NEWTAB_PAGE,
  focusOrOpen,
  focusTab,
} from './common/ext.js';
import { sameSite } from './common/util.js';

const STORAGE_KEY = 'tabflow_v3';

async function loadDoc() {
  try {
    const result = await ext.storage.local.get(STORAGE_KEY);
    return result?.[STORAGE_KEY] ?? null;
  } catch (err) {
    console.error('TabFlow: storage read failed', err);
    return null;
  }
}

function* allSavedTabs(doc) {
  for (const space of doc?.spaces ?? []) {
    for (const collection of space.collections ?? []) {
      yield* collection.tabs ?? [];
    }
  }
}

/* ---------- Hotkey slots (Alt+1…4 by default) ---------- */
ext.commands.onCommand.addListener(async (command) => {
  const match = /^tabflow-slot-(\d)$/.exec(command);
  if (!match) return;
  const slot = Number(match[1]);
  const doc = await loadDoc();
  if (!doc) return;
  for (const tab of allSavedTabs(doc)) {
    if (tab.hotkeySlot === slot && tab.url) {
      await focusOrOpen(tab.url, (openUrl) => sameSite(openUrl, tab.url));
      return;
    }
  }
});

/* ---------- Omnibox: "to <alias>" ---------- */
ext.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const query = text.trim().toLowerCase();
  if (!query) return;
  const doc = await loadDoc();
  const links = doc?.links ?? [];
  suggest(
    links
      .filter((link) => link.name.toLowerCase().startsWith(query))
      .slice(0, 8)
      .map((link) => ({
        content: link.name,
        description: `Open ${link.name} — ${link.url}`,
      }))
  );
});

ext.omnibox.onInputEntered.addListener(async (text) => {
  const alias = text.trim().toLowerCase();
  if (!alias) return;
  const doc = await loadDoc();
  const links = doc?.links ?? [];
  const link =
    links.find((l) => l.name.toLowerCase() === alias) ??
    links.find((l) => l.name.toLowerCase().includes(alias));
  if (!link?.url) return;
  try {
    const [active] = await ext.tabs.query({ active: true, currentWindow: true });
    if (active) await ext.tabs.update(active.id, { url: link.url });
    else await ext.tabs.create({ url: link.url });
  } catch (err) {
    console.error('TabFlow: omnibox navigation failed', err);
  }
});

/* ---------- Toolbar button: jump to TabFlow ---------- */
ext.action.onClicked.addListener(async () => {
  await focusOrOpen(NEWTAB_PAGE, (openUrl) => openUrl === NEWTAB_PAGE);
});

/* ---------- New-tab redirect + single instance ----------
   Chromium redirects confirmed browser new-tab URLs. Firefox/Zen use the
   packaged manifest override. An empty URL is not evidence of a new tab:
   session restoration and tabs created by other extensions can begin empty.

   A per-window queue and one deterministic keeper prevent overlapping tab
   events from closing each other's chosen survivor. Re-read immediately
   before navigation/removal so a user navigation is never intentionally
   swallowed by a stale lifecycle event. Other extension pages are excluded. */
const NEWTAB_SURFACE_URLS = new Set([
  'chrome://newtab/',
  'chrome://newtab',
  'edge://newtab/',
  'edge://newtab',
  'about:newtab',
]);
const windowQueues = new Map();
/* Tabs the user just opened (id → time). In Address-bar mode only a freshly
   opened tab may close older TabFlow tabs, so switching back to an older
   workspace or reloading it never closes anything. */
const freshTabs = new Map();
const FRESH_MS = 20_000;

/* Cached `newTabFocus` setting; refreshed whenever the workspace changes. */
let newTabFocus = null;
async function newTabMode() {
  if (newTabFocus) return newTabFocus;
  const doc = await loadDoc();
  newTabFocus = doc?.settings?.newTabFocus === 'search' ? 'search' : 'address';
  return newTabFocus;
}
ext.storage.onChanged?.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) newTabFocus = null;
});

function isBrowserNewTab(tab) {
  return NEWTAB_SURFACE_URLS.has(tab?.pendingUrl || tab?.url || '');
}

/** Address-bar mode: keep the newly opened TabFlow tab (its address bar is
 *  focused) and close older idle TabFlow tabs in the same window. */
async function keepNewest(tabId) {
  const opened = freshTabs.get(tabId);
  if (!opened || Date.now() - opened > FRESH_MS) return;
  const tab = await ext.tabs.get(tabId).catch(() => null);
  if (!tab || !tab.active || !(isTabFlowTab(tab) || isBrowserNewTab(tab))) return;
  freshTabs.delete(tabId);
  const tabs = await ext.tabs.query({ windowId: tab.windowId });
  for (const other of tabs) {
    if (other.id === tab.id || other.pinned || other.audible) continue;
    if (!(isTabFlowTab(other) || isBrowserNewTab(other))) continue;
    // Re-read right before closing: it may have navigated away meanwhile.
    const live = await ext.tabs.get(other.id).catch(() => null);
    if (live && !live.active && !live.pinned && (isTabFlowTab(live) || isBrowserNewTab(live))) {
      await ext.tabs.remove(live.id).catch(() => {});
    }
  }
}

async function reconcileWindow(tabId) {
  // Address-bar mode: the new tab stays the browser's own, focused surface.
  if (await newTabMode() !== 'search') return keepNewest(tabId);
  let tab = await ext.tabs.get(tabId).catch(() => null);
  if (!tab || !(isTabFlowTab(tab) || (IS_CHROMIUM && isBrowserNewTab(tab)))) return;
  const tabs = await ext.tabs.query({ windowId: tab.windowId });
  const flows = tabs.filter(isTabFlowTab).sort((a, b) => a.id - b.id);
  const keep = flows[0];

  if (!keep) {
    // Recheck after query: tabs may have navigated while the API was pending.
    tab = await ext.tabs.get(tabId).catch(() => null);
    if (IS_CHROMIUM && tab && isBrowserNewTab(tab)) {
      await ext.tabs.update(tabId, { url: NEWTAB_PAGE });
    }
    return;
  }

  const duplicates = tabs.filter((candidate) => candidate.id !== keep.id &&
    (isTabFlowTab(candidate) || (IS_CHROMIUM && isBrowserNewTab(candidate))));
  if (!duplicates.length) return;

  // Do not close anything if focusing the keeper fails.
  await focusTab(keep);
  for (const duplicate of duplicates) {
    const [liveKeep, liveDuplicate] = await Promise.all([
      ext.tabs.get(keep.id).catch(() => null),
      ext.tabs.get(duplicate.id).catch(() => null),
    ]);
    if (!liveKeep || !isTabFlowTab(liveKeep) || !liveDuplicate ||
        liveKeep.windowId !== liveDuplicate.windowId) continue;
    if (isTabFlowTab(liveDuplicate) || (IS_CHROMIUM && isBrowserNewTab(liveDuplicate))) {
      await ext.tabs.remove(liveDuplicate.id).catch(() => {});
    }
  }
  // Extension pages receive runtime messages; tabs.sendMessage targets content scripts.
  ext.runtime.sendMessage({ type: 'tabflow:activate', tabId: keep.id }).catch(() => {});
}

function queueNewTab(tab) {
  if (tab?.id == null || tab.windowId == null) return Promise.resolve();
  // Browser new-tab surfaces pass on every engine; only the redirect itself is Chromium-only.
  if (!(isTabFlowTab(tab) || isBrowserNewTab(tab))) return Promise.resolve();
  const previous = windowQueues.get(tab.windowId) ?? Promise.resolve();
  const next = previous.then(() => reconcileWindow(tab.id)).catch(() => {
    // Closing/moving a tab during an event is an expected lifecycle race.
  });
  windowQueues.set(tab.windowId, next);
  next.finally(() => {
    if (windowQueues.get(tab.windowId) === next) windowQueues.delete(tab.windowId);
  });
  return next;
}

ext.tabs.onCreated.addListener((tab) => {
  if (tab?.id != null) {
    freshTabs.set(tab.id, Date.now());
    for (const [id, at] of freshTabs) if (Date.now() - at > FRESH_MS) freshTabs.delete(id);
  }
  return queueNewTab(tab);
});
ext.tabs.onRemoved?.addListener((tabId) => freshTabs.delete(tabId));
ext.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') return queueNewTab(tab);
});
/* ---------- Install / update ---------- */
ext.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Lets the new-tab page pick light/dark from prefers-color-scheme once.
    await ext.storage.local.set({ tabflow_first_run: true });
  }
});
