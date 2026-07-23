# TabFlow Architecture (developer documentation)

Vanilla-JS WebExtension, Manifest V3, ES modules, **no build step, no
dependencies**. One `src/` folder loads unchanged in Edge, Chrome, Firefox,
and Zen.

## Module map

```
src/
  manifest.json            single cross-browser MV3 manifest
  background.js            event-driven background (hotkeys, omnibox, action)
  common/                  shared between background and page
    ext.js                 ← the ONLY browser-aware module (see below)
    util.js                DOM builder h(), q/qa, uid, URL/favicon helpers,
                           debounce, deepClone, safe <mark> highlighter
    icons.js               inline SVG icon map (no icon font, no CDN)
    themes.js              pure data: themes, accents, font stacks, palettes
  newtab/
    newtab.html / .css     the page; CSS is themed via custom properties
    main.js                boot: initStore → init modules → renderAll
    store.js               state document, persistence, cross-instance sync
    migrations.js          schema v3, defaults, v2→v3 migration, sanitizing
    ui/
      bus.js               render registry (name → function)
      layout.js            panels, nav, clock, global keys
      appearance.js        settings → CSS custom properties / body classes
      spaces.js            sidebar spaces + customize modal
      collections.js       collections grid, cards, search, DnD, modals
      opentabs.js          right panel: live tabs, recently closed, capture
      links.js / tasks.js  the two small views
      settings.js          the settings screens
      modals.js            overlay stack + confirmDialog/promptDialog
      contextmenu.js       declarative context menu
      toast.js             snackbar with undo
      dnd.js               shared drag payload (one drag at a time)
      inline.js            contenteditable rename helper
scripts/package.ps1        store packaging (see Packaging)
```

## Cross-browser strategy

All of it lives in [`common/ext.js`](../src/common/ext.js):

- **`ext`** — `browser ?? chrome`, but detected via `runtime.getURL` presence
  (Chromium exposes a bare useless `chrome` object on ordinary web pages).
  Firefox's `browser` and Chromium's MV3 `chrome` are both promise-based, so
  one alias gives one async API. No polyfill.
- **`caps`** — capability flags (`tabGroups`, `sessions`, `bookmarks`,
  `localFavicons`) checked at runtime. Features gate on capabilities, never
  on browser names.
- **Dev shim** — when no extension API exists (page opened over plain HTTP),
  a mock backed by `localStorage` + demo tabs activates. This is how the UI
  is developed and tested without loading an extension.
- **Manifest** — `src/manifest.json` is Chromium-native so it loads unpacked
  in Edge/Chrome without warnings (Chromium rejects the MV2-style
  `background.scripts` key):

  ```json
  "background": { "service_worker": "background.js", "type": "module" }
  ```

  Firefox has no MV3 service worker, so [`package.ps1`](../scripts/package.ps1)
  swaps in `"scripts": ["background.js"]` for the `dist/zen` build. The same
  step drops `browser_specific_settings.gecko` for Chromium and the
  Chromium-only `favicon` permission for Firefox — foreign keys stripped per
  target.
- **New tab takeover** is declarative via `chrome_url_overrides`, plus a small
  `tabs.onCreated` guard in [`background.js`](../src/background.js) that keeps a
  **single TabFlow tab per window**: a duplicate new tab is closed and the user
  is sent back to the existing one (which then focuses its search box). The
  guard is deliberately per-window — it never crosses windows and never closes
  the sole tab of a freshly-opened window.

## State & persistence

One JSON document holds everything, stored under
`storage.local["tabflow_v3"]`:

```js
{
  schemaVersion: 3,
  meta: { rev, writer, savedAt },     // cross-instance sync bookkeeping
  spaces: [{ id, name, color?, icon?, viewMode,
    collections: [{ id, name, color?, collapsed, sortMode,
      tabs: [{ id, title, url, favicon?, pinned?, note?, tags?, hotkeySlot? }] }] }],
  activeSpaceId,
  links:  [{ id, name, url }],
  tasks:  [{ id, title, url?, done }],
  settings: { theme, accent, font, fontSize, borderRadius, density,
              defaultView, sidebarWidth, bgStyle, customBgColor, bgPattern,
              showClock, remoteFavicons, customThemes, customCss },
  ui: { sidebarOpen, rightPanelOpen, zenHintDismissed }
}
```

Rules enforced by [`store.js`](../src/newtab/store.js):

- **All mutations go through `update(fn)`** — it mutates the live doc,
  marks it dirty, and saves after a 300 ms debounce. `flush()` forces the
  write (used before export and on `pagehide`).
- Every write bumps `meta.rev` and stamps `meta.writer` with this page
  instance's id. A `storage.onChanged` listener adopts documents written by
  *other* instances (and re-renders via `onExternalChange`); writes from the
  own instance are ignored. If local unsaved edits exist, the pending local
  write wins.
- Snapshots live under a separate key `tabflow_snapshots`
  (`[{ id, name, date, spaces }]`, capped at 20) — shape-compatible with v1.

### Normalization & migration ([`migrations.js`](../src/newtab/migrations.js))

`normalizeDoc()` runs on **every** loaded or imported document and
guarantees: ids exist, `activeSpaceId` resolves, enums are valid, settings
are type-checked against `DEFAULT_SETTINGS`, URLs are http(s)-only
(`javascript:`/`data:` are stripped), favicons are https/data-image only.
The rest of the app never defends against malformed data.

`migrateV2()` converts the v1 document (`tabflow_v2`): `viewModes` map →
per-space `viewMode`, `nextItems` → `tasks`, `hotkey.slot` → `hotkeySlot`,
Google-font names → nearest system stack, dropped settings discarded. The
v2 record is left in storage as a rollback.

`parseImport()` accepts three shapes: the v3 export envelope
(`{app:'tabflow', doc}`), a raw v3 doc, or v1 exports/docs.

## Rendering model

No framework. Views build DOM with the `h()` helper and re-render their own
region wholesale — state size makes diffing unnecessary.

- Every view registers named renderers on the **bus**
  (`registerRenderer('collections', fn)`); anyone triggers them by name
  (`render('collections', 'spaces')`). This is what keeps the modules free
  of circular imports.
- The renderer names: `appearance, layout, spaces, collections, viewmenu,
  opentabs, recentlyClosed, links, tasks, settings`.
- `renderAll()` runs them all (boot, import, external change).

### Drag & drop

One shared payload in `dnd.js` (`card` | `collection` | `open-tab`).
`dragstart`/`dragend` are bound per element; the hot `dragover`/`drop` path
is **delegated once** on `#collections-area`. Sidebar spaces and tasks use
scoped custom MIME types (`application/x-tabflow-space`, `…-task`) so foreign
drags are ignored. Collection/space drags only start from their grip handle
(armed on `mousedown`).

### Overlays

`modals.js` keeps an overlay stack: Escape closes the topmost, backdrop
click dismisses, `confirmDialog()`/`promptDialog()` build themed one-off
dialogs returning promises. Feature-specific modals (tab edit, hotkey slots,
space picker, …) are static HTML wired by their feature module.

## Background script

Small and event-driven ([`background.js`](../src/background.js)):
`commands.onCommand` (hotkey slots → focus-or-open by site),
`omnibox` (`to <alias>`), `action.onClicked` (focus-or-open the TabFlow
page), `onInstalled` (first-run flag for light/dark auto-detection).
It reads the same `tabflow_v3` document, read-only. No keep-alive tricks —
event wakeups are the design.

## Security & privacy invariants

- CSP: `script-src 'self'; object-src 'self'`; no remote code, fonts, or
  analytics — keep it that way (also an AMO requirement).
- Never assign user data to `innerHTML`. `h()` uses `textContent`; the only
  `html:` inputs are the constant SVG strings from `icons.js`. Search
  highlighting builds `<mark>` nodes from text, not regex-into-HTML.
- All external input (imports, storage, bookmarks) passes `normalizeDoc`.
- The favicon service call is the single optional network request, gated by
  `settings.remoteFavicons`.

## Packaging ([`scripts/package.ps1`](../scripts/package.ps1))

Produces `dist/chromium` (drops `background.scripts`,
`browser_specific_settings`) and `dist/zen` (drops
`background.service_worker`, the `favicon` permission), then zips both.

Two hard-won rules encoded in the script:

1. **Zip entries must use forward slashes.** `Compress-Archive` writes
   backslashes; Firefox then 404s every nested file. The script zips via
   `System.IO.Compression` with explicit `/` entry names.
2. **Read/write the manifest as explicit UTF-8 (no BOM).** Windows
   PowerShell's default ANSI decoding corrupts non-ASCII (the "—" in the
   extension name).

## How to…

**Add a setting** — add the key+default to `DEFAULT_SETTINGS`
(migrations.js); add the control to the settings panel in `newtab.html`;
wire it in `settings.js` (`renderPills`/`renderSlider`/custom); apply it in
`appearance.js` if it affects presentation. Persistence, export, import, and
sanitizing are automatic — that's the point of the single settings object.

**Add a theme** — one entry in `THEMES` (themes.js): 15 CSS variables plus a
4-color preview. Nothing else.

**Add an icon** — add the SVG string to `icons.js` (24×24 viewBox,
`stroke="currentColor"`).

**Add a card/collection action** — extend the builders in `collections.js`;
mutate only via `update()`; call `render('collections')`.

**Bump the schema** — increment `SCHEMA_VERSION`, extend `normalizeDoc` to
accept both shapes, and add a migration path in `initStore`. Never break
`parseImport` for older export files.

## Testing

No test framework (deliberate for a dependency-free repo). Three layers:

1. **Dev preview** — serve `src/` over HTTP (`python -m http.server`); the
   dev shim provides storage + demo tabs. Fastest loop for UI work.
2. **Per-browser smoke** — the checklist in [README.md](../README.md#test-checklist-per-browser).
3. **Migration check** — seed `tabflow_v2` in the dev shim's localStorage,
   reload, verify the v3 doc.
