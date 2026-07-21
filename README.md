# TabFlow 2.0 — Tab Manager

A new-tab page that organizes your browsing into **Spaces → Collections → Tabs**, with
session saving, drag & drop, global hotkeys, omnibox aliases, and deep theming.

Cross-browser by design: **Chrome, Edge, Firefox, and Zen Browser** all load the same
`src/` folder.

## Documentation

| Document | For |
| --- | --- |
| [docs/user-guide.md](docs/user-guide.md) | Every feature, settings reference, keyboard shortcuts |
| [docs/installation.md](docs/installation.md) | Per-browser install (incl. Zen specifics), permanent installs, moving data between browsers |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Known issues, FAQ, bug reporting |
| [docs/architecture.md](docs/architecture.md) | Developers: module map, data schema, cross-browser strategy, how to extend |

## Layout

```
src/                      ← the extension; load this folder directly in any browser
  manifest.json           ← single cross-browser MV3 manifest
  background.js           ← event-driven background (hotkeys, omnibox, action button)
  common/
    ext.js                ← THE platform layer: browser API alias + capability flags
    util.js               ← DOM builder, URL/favicon helpers, debounce, ids
    icons.js              ← inline SVG icon set
    themes.js             ← theme/accent/font data (pure data)
  newtab/
    newtab.html / .css    ← the new tab page
    main.js               ← boot
    store.js              ← single state document, debounced saves, cross-tab sync
    migrations.js         ← schema v3, v2→v3 migration, import sanitizing
    ui/                   ← one module per feature (spaces, collections, opentabs, …)
scripts/package.ps1       ← builds clean per-browser zips for store submission
```

## Running it

No build step is required for development.

| Browser | Steps |
| --- | --- |
| **Chrome** | `chrome://extensions` → enable Developer mode → *Load unpacked* → select `src/` |
| **Edge** | `edge://extensions` → enable Developer mode → *Load unpacked* → select `src/` |
| **Firefox** | `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on…* → select `src/manifest.json` |
| **Zen** | Same as Firefox: `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on…* → `src/manifest.json` |

Open a new tab — TabFlow takes over via the standard `chrome_url_overrides` mechanism.
Firefox/Zen show a one-time "Keep changes?" prompt the first time; accept it.

Prefer the packaged builds for anything beyond quick dev testing — run
`scripts/package.ps1` to produce:

- `dist/chromium` + `tabflow-<v>-chrome-edge.zip` — for Edge/Chrome
- `dist/zen` + `tabflow-<v>-zen-firefox.zip` — for Zen/Firefox (clean manifest,
  no "favicon permission" warning)

## Zen Browser setup (read this if new tabs don't show TabFlow)

Zen ships with **"URL bar replaces new tab"** enabled: pressing Ctrl+T or the new-tab
button opens a floating search popup and *no new-tab page is created at all* — so no
extension's new-tab page (TabFlow included) can ever appear.

Fix: open `about:config`, search `zen.urlbar.replace-newtab`, set it to **false**.
New tabs then open the real new-tab page, which is TabFlow. (TabFlow also shows this
hint inside the app on Firefox-based browsers, with a copy button.)

Other Zen notes:

- **"Background script: Stopped"** in `about:debugging` is normal — event pages sleep
  until a hotkey/omnibox/toolbar event wakes them. It is not a bug.
- The manifest warning about the `favicon` permission only appears when loading `src/`
  directly; the `dist/zen` package strips that Chromium-only permission.
- **Permanent install:** Zen (like release Firefox) enforces extension signing, and
  the `xpinstall.signatures.required` switch does not work there. Sign the
  `tabflow-<v>-zen-firefox.zip` on addons.mozilla.org (a free *unlisted/self-hosted*
  submission returns a signed `.xpi` you can install permanently). Temporary add-ons
  unload on every restart.

### Moving your data from Edge to Zen

1. In **Edge** TabFlow: `Settings → Data → Export JSON` — downloads a backup file.
2. In **Zen** TabFlow: `Settings → Data → Import JSON` — pick that file, confirm.

Everything moves: spaces, collections, saved tabs, hotkey slots, links, tasks, and
appearance settings. Backups from TabFlow v1 are converted automatically too.

## Cross-browser strategy

- **One API alias.** `common/ext.js` exports `ext = browser ?? chrome`. Firefox's
  `browser` is promise-based; Chromium's `chrome` is promise-based in MV3 — so a plain
  alias gives one async API everywhere. No polyfill dependency.
- **One manifest.** `background` declares both `service_worker` (Chromium) and
  `scripts` (Firefox event page); each browser uses its key and ignores the other
  (supported in Chrome 121+/Firefox 106+). `browser_specific_settings.gecko` is
  ignored by Chromium with a harmless install-time note; the `favicon` permission is
  Chromium-only and skipped by Firefox. `scripts/package.ps1` strips the foreign keys
  for store uploads.
- **Capability flags, not UA sniffing.** `caps.tabGroups`, `caps.sessions`,
  `caps.bookmarks`, `caps.localFavicons` gate features at runtime; e.g. "Open as tab
  group" simply doesn't appear on browsers without the API.
- **New-tab takeover is declarative.** v1 removed `chrome_url_overrides` and fought
  duplicate-tab race conditions in the background script across six bugfix PRs. v2
  restores the standard override, which works identically on all four browsers, and
  deletes all of that code.

### Known browser-specific limitations

- **Firefox/Zen shortcuts:** there is no linkable shortcuts page; the hotkey dialog
  shows instructions instead (Add-ons Manager → gear → Manage Extension Shortcuts).
  On some Linux setups Alt+1–4 collide with the browser's own tab switching.
- **Favicons:** Chromium resolves icons locally through the `favicon` permission.
  Firefox has no equivalent, so saved tabs without a stored icon fall back to Google's
  favicon service *only if* "Remote favicon fallback" (Settings → Advanced) is on;
  otherwise letter tiles are shown.
- **Tab groups:** "Open as tab group" appears on Chromium (and Firefox ≥139 once
  `tabs.group` ships there); elsewhere collections open as plain tabs.
- **Zen:** Zen has its own workspaces feature; TabFlow's Spaces are internal to the
  page and coexist fine. If Zen's start page setting overrides new tabs, choose the
  extension page when prompted, or set the TabFlow URL (Settings → Data → Homepage).

## Data & migration

State is one document under `storage.local["tabflow_v3"]`, written debounced and
stamped per page instance; other open TabFlow pages adopt external writes via
`storage.onChanged` (v1 lost data here — last writer clobbered silently).

On first run, v1 data (`tabflow_v2`) is migrated automatically — spaces, collections,
tabs, hotkey slots, links, "Next" items (now *Tasks*), snapshots, and the settings
that still exist. The v2 record is left untouched as a rollback. Import accepts both
v2 and v3 backup files; all imported URLs and structures are sanitized.

## Test checklist (per browser)

**Smoke**
1. Load the extension; open a new tab → TabFlow renders, no console errors.
2. First run on a light-mode OS → Light theme auto-selected.

**Core flows**
3. Create a space, rename (double-click), assign color/emoji, reorder via handle, delete (confirm dialog).
4. Add a collection; add a tab via the + card; edit title/URL/note/tags; pin one.
5. Drag an open tab from the right panel into a collection; drag cards within/between collections; reorder collections by handle.
6. Click a card → opens in current tab. Ctrl+click / middle-click → background tab.
7. "Open all", "Window", and (Chromium) "Open as tab group" from a collection.
8. Save Session and per-window save; row click focuses that tab; Recently Closed restores.
9. Search with `/`, matches highlight, Esc clears; searches across all spaces.
10. Delete a tab and a collection → toast Undo restores them.

**Background features**
11. Assign hotkey slot 1 to a tab; press Alt+1 from another tab → focuses/opens the target.
12. Add a Link alias; type `to <alias>` in the address bar → navigates.
13. Click the toolbar icon from any page → jumps to the TabFlow tab.

**Settings & data**
14. Switch themes/accent/font/density/radius; reload → persisted.
15. Create a custom theme with live preview; delete it.
16. Snapshot save/restore; bookmarks import; export JSON; re-import it; import a v1 backup.
17. Open two TabFlow tabs in two windows; edit in one → the other updates.
18. Reset settings (keeps collections/custom themes); Clear all data (confirm dialog).

## Privacy

- No analytics, no remote code, no remote fonts.
- The only optional network call is the favicon fallback (Google s2), off-switchable
  in Settings → Advanced and unnecessary on Chromium.
