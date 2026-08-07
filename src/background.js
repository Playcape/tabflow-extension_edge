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

   Responsibilities:
     • global hotkey slots (commands API)
     • omnibox "to <alias>" navigation
     • toolbar action → focus or open the TabFlow page
     • new-tab redirect + single-instance dedup
     • first-run marker for theme auto-detection
   ================================================================ */

import {
  ext,
  EXT_ORIGIN,
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
   A browser new tab (edge://newtab/, chrome://newtab/, or a blank tab from
   the new-tab button) is redirected to TabFlow's own page URL so it loads as
   an ordinary extension page — which is what makes the favicon show. If a
   TabFlow tab is already open in that window we go there instead and drop the
   duplicate, then focus its search box so the user can type right away.

   Scope is per-window on purpose: we never jump the user to another window,
   and never close the sole tab of a freshly-opened window (Ctrl+N), which
   would take the window down with it.

   URL matching is loose because a just-created tab reports its URL
   inconsistently — the browser new-tab URL, or nothing at all for a tick.
   about:blank / about:home are excluded so we never grab an unrelated tab. */
const NEWTAB_SURFACE_URLS = new Set([
  'chrome://newtab/',
  'edge://newtab/',
  'about:newtab',
]);

function isBrowserNewTab(url) {
  return NEWTAB_SURFACE_URLS.has(url ?? '');
}

/** A loaded/loading TabFlow page — the tab we keep and focus. */
function isTabFlowPage(tab) {
  const url = tab?.url ?? '';
  const pending = tab?.pendingUrl ?? '';
  return url.startsWith(EXT_ORIGIN) || pending.startsWith(EXT_ORIGIN);
}

/** Redirect fresh browser new tab to TabFlow's page URL (ordinary page → renders favicon icon in tab strip). */
async function redirectToTabFlow(tabId) {
  if (!IS_CHROMIUM || tabId == null) return;
  try {
    const tab = await ext.tabs.get(tabId).catch(() => null);
    if (!tab || isTabFlowPage(tab)) return;
    await ext.tabs.update(tabId, { url: NEWTAB_PAGE }).catch(() => {});
  } catch {
    /* tab closed or navigated before update */
  }
}

/** Focus an existing TabFlow tab and drop the freshly-created duplicate. */
async function dedupeInto(twin, duplicateId) {
  try {
    await focusTab(twin).catch(() => {});
    const dup = await ext.tabs.get(duplicateId).catch(() => null);
    if (dup) {
      await ext.tabs.remove(duplicateId).catch(() => {});
    }
    ext.tabs.sendMessage(twin.id, { type: 'tabflow:activate' }).catch(() => {});
  } catch {
    /* tab closed or already removed */
  }
}

/* Handle new-tab redirection & single-instance deduplication */
ext.tabs.onCreated.addListener(async (created) => {
  if (created.id == null) return;
  try {
    const tab = await ext.tabs.get(created.id).catch(() => null);
    if (!tab) return;

    const url = tab.url ?? '';
    const pending = tab.pendingUrl ?? '';
    const blank = url === '' && pending === '';
    if (blank && tab.openerTabId != null) return;

    const isNewTab = blank || isBrowserNewTab(url) || isBrowserNewTab(pending) || isTabFlowPage(tab);
    if (!isNewTab) return;

    const tabs = (await ext.tabs.query({ windowId: tab.windowId }).catch(() => [])) ?? [];
    const twin = tabs.find((t) => t.id !== tab.id && isTabFlowPage(t));
    if (twin) {
      await dedupeInto(twin, tab.id);
    } else if (!isTabFlowPage(tab)) {
      await redirectToTabFlow(tab.id);
    }
  } catch {
    /* ignore transient tab lifecycle errors */
  }
});

/* Catch duplicates that become visible once a TabFlow page finishes loading */
ext.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && isBrowserNewTab(changeInfo.url)) {
    await redirectToTabFlow(tabId);
    return;
  }
  const loaded =
    changeInfo.url?.startsWith(EXT_ORIGIN) ||
    (changeInfo.status === 'complete' && isTabFlowPage(tab));
  if (!loaded) return;
  try {
    const tabs = (await ext.tabs.query({ windowId: tab.windowId }).catch(() => [])) ?? [];
    const flowTabs = tabs.filter(isTabFlowPage);
    if (flowTabs.length <= 1) return;
    const keep = flowTabs.find((t) => t.id === tabId) ?? flowTabs[0];
    for (const t of flowTabs) {
      if (t.id !== keep.id) {
        ext.tabs.remove(t.id).catch(() => {});
      }
    }
  } catch {
    /* ignore */
  }
});

/* ---------- Install / update ---------- */
ext.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Lets the new-tab page pick light/dark from prefers-color-scheme once.
    await ext.storage.local.set({ tabflow_first_run: true });
  }
});
