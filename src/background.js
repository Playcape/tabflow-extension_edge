/* ================================================================
   TabFlow — background (MV3 service worker on Chromium,
   event page on Firefox/Zen; both load this same module).

   The new-tab takeover is declarative via `chrome_url_overrides.newtab`.
   On top of that we keep a *single* TabFlow tab per window: opening
   another new tab while one is already open sends the user back to the
   existing tab (and focuses its search box) instead of piling up
   duplicate copies of the same page.

   Responsibilities:
     • global hotkey slots (commands API)
     • omnibox "to <alias>" navigation
     • toolbar action → focus or open the TabFlow page
     • single-instance new-tab dedup
     • first-run marker for theme auto-detection
   ================================================================ */

import {
  ext,
  EXT_ORIGIN,
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

/* ---------- Single-instance new tab ----------
   Every new tab renders TabFlow (chrome_url_overrides.newtab), so without
   this each Ctrl+T spawns a *second* identical TabFlow tab. When one is
   already open in the same window we send the user there and drop the fresh
   duplicate — then ask that page to focus its search box so they can type
   right away. Scope is deliberately per-window: we never jump the user to
   another window, and never close the sole tab of a just-opened window
   (Ctrl+N), which would take the window down with it.

   URL matching is intentionally loose: an overridden new-tab page reports
   its URL inconsistently across Chromium builds — sometimes the extension
   URL, sometimes `edge://newtab/` / `chrome://newtab/`, and a *just*-created
   tab can briefly report no URL at all. We accept all of those. (about:blank
   / about:home are deliberately excluded so we never grab an unrelated blank
   tab.) */
const NEWTAB_SURFACE_URLS = new Set([
  'chrome://newtab/',
  'edge://newtab/',
  'about:newtab',
]);

/** A loaded TabFlow new-tab page — the tab we keep and focus. */
function isLoadedTabFlow(tab) {
  const url = tab.url ?? '';
  const pending = tab.pendingUrl ?? '';
  return (
    url.startsWith(EXT_ORIGIN) ||
    pending.startsWith(EXT_ORIGIN) ||
    NEWTAB_SURFACE_URLS.has(url) ||
    NEWTAB_SURFACE_URLS.has(pending)
  );
}

/** The freshly-created tab we might drop — tolerates the empty-URL instant. */
function isFreshNewTab(tab) {
  const url = tab.url ?? '';
  const pending = tab.pendingUrl ?? '';
  if (url === '' && pending === '') return true;
  return isLoadedTabFlow(tab);
}

ext.tabs.onCreated.addListener(async (created) => {
  if (created.id == null) return;
  let tabs;
  try {
    // Re-read the window's tabs: the created tab's URL has usually resolved
    // by the time this query returns, even when the event fired with none.
    tabs = await ext.tabs.query({ windowId: created.windowId });
  } catch {
    return;
  }
  const self = tabs.find((t) => t.id === created.id) ?? created;
  if (!isFreshNewTab(self)) return;
  // An already-open TabFlow tab in the *same* window (never cross windows).
  const twin = tabs.find((t) => t.id !== created.id && isLoadedTabFlow(t));
  if (!twin) return; // first/only TabFlow tab here — leave it (and the omnibox) alone
  try {
    await focusTab(twin);
    await ext.tabs.remove(created.id);
    ext.tabs.sendMessage(twin.id, { type: 'tabflow:activate' }).catch(() => {});
  } catch (err) {
    console.error('TabFlow: new-tab dedup failed', err);
  }
});

/* ---------- Install / update ---------- */
ext.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Lets the new-tab page pick light/dark from prefers-color-scheme once.
    await ext.storage.local.set({ tabflow_first_run: true });
  }
});
