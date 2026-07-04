/* ================================================================
   TabFlow — background (MV3 service worker on Chromium,
   event page on Firefox/Zen; both load this same module).

   The new-tab takeover is handled declaratively by
   `chrome_url_overrides.newtab` in the manifest — no tab-created
   redirect or dedup logic is needed (or wanted) here.

   Responsibilities:
     • global hotkey slots (commands API)
     • omnibox "to <alias>" navigation
     • toolbar action → focus or open the TabFlow page
     • first-run marker for theme auto-detection
   ================================================================ */

import { ext, NEWTAB_PAGE, focusOrOpen } from './common/ext.js';
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

/* ---------- Install / update ---------- */
ext.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Lets the new-tab page pick light/dark from prefers-color-scheme once.
    await ext.storage.local.set({ tabflow_first_run: true });
  }
});
