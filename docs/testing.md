# Testing TabFlow

## Run the checks

Use Node.js 20 or later and install development dependencies with `npm install`. No npm packages ship in the extension.

```powershell
npm test
npx playwright install chromium
npm run test:ui
npm run test:extension
npm run test:collections
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

For an existing Edge installation, set `$env:BROWSER_EXECUTABLE = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'` before the browser commands. An existing Playwright installation can be supplied through `PLAYWRIGHT_MODULE`. The extension test creates a disposable profile inside ignored `test-results/`; it never opens your personal profile.

`tests/ui.mjs` starts and closes its own HTTP preview on port 4173. `tests/extension.mjs` loads the actual unpacked extension and exercises its service worker, storage, CSP and tabs. Screenshots and the UI result JSON are written to `test-results/`. `npm run preview` serves the UI separately for manual inspection.

## Verified on 19 September 2026

Windows, Node 24.19, Playwright 1.62.1, Edge 153.0.4234.32:

- **10 Node regressions passed:** new-tab redirect/deduplication and overlapping events, normalization, v2 migration, import parsing, three-way merge, Page payload round trips, failed reads/writes, reset ordering, and snapshot-read failure preservation.
- **UI suite passed:** Normal/Tonal/Aurora in dark and light themes; switching through Settings; custom theme/CSS; live-tab filtering; palette selection and focus return; Pages with an `id="app"`; viewer refresh after edits; failed Page-save retry without duplicates; saved-card and live-tab drag-and-drop; large IndexedDB Page export/import; search; narrow/laptop layouts; reduced motion, transparency, increased contrast and forced colors.
- **Actual Edge extension suite passed:** clean workspace boot, inline Page scripts in the isolated sandbox, absent extension APIs inside that frame, standalone Page wrapper, per-window new-tab deduplication, search-focus activation, independent windows, untouched blank tabs, and concurrent Link/Task writes from two windows.
- A stress fixture rendered **148 saved cards**, including one Collection with 140. The synchronous DOM construction measured approximately **11 ms** on this machine; this is not a frame-rate, paint-time, or universal performance guarantee. Per-card backdrop blur remained disabled and the effect budget selected static enhancement.

Screenshots use synthetic demonstration data. Theme screenshots wait for color transitions to settle. No page exceptions occurred in the passing browser suites.

## Collection layout follow-up — 29 September 2026

`tests/collections.mjs` verifies unequal-height packing, native Collection drag previews and committed positions in Normal/Tonal/Aurora/Glass, cancellation with Escape, switching between single and multiple columns, collapsing Collections, and full-width search summaries. The preview must leave stored order unchanged and match final geometry after drop animations settle. It uses synthetic data on a separate HTTP preview port (4174). The existing UI suite also covers saved-card/live-tab drops and 140+ cards.

## Glass design mode — 4 November 2026

Linux, Node 22, Playwright Chromium (headless):

- **17 Node regressions passed**, including Glass settings normalization (scene enum, blur/frost clamps, exclusivity with Aurora/Tonal).
- **UI suite passed** with Glass added to the dark/light mode loop and custom theme/CSS checks, plus switching Normal ↔ Tonal ↔ Aurora ↔ Glass through Settings while the single navigation element moves between its homes, the Glass settings tab, scene pills, the icon rail width and hover label, and Tonal switching Glass off.
- **Collection suite passed** in four modes. The mode loop waits for `#app` column transitions to finish, because the Glass rail resizes the sidebar column.
- `tests/extension.mjs` could not start the extension service worker in this headless container; it fails the same way on the previous commit, so it remains a release check on a desktop browser.

## Live scene — 26 November 2026

Linux, Node 22, Playwright Chromium (headless):

- **31 Node regressions passed**, including Live scene settings normalization (legacy `auto` → `live`, location validation and rounding, motion and unit enums) and `tests/scene.test.mjs`: solar elevation and azimuth against published values, Berlin solstice sunrise/sunset within 4 minutes, Svalbard polar night, moon phase, hemisphere seasons and foliage, tropics, weather effects on light and particles, sun direction in each hemisphere, WMO code mapping, °C/°F, forecast URL rounding, caching, expiry and rejection of bad responses, and city search.
- **UI suite passed** with the Live scene added: no Open-Meteo request before opt-in, the in-scene clock, the toolbar chip opening the details card from the keyboard, season and weather preview, Back to live, Escape returning focus to the chip, and switching to a fixed scene stopping the Live scene.
- **Collection suite passed** in four modes.
- A separate scripted check with mocked Open-Meteo responses verified the whole opt-in path (Settings → Live weather → city search → forecast), exactly one geocoding and one forecast request, the five-day card, and opening the card by clicking the clock. Real Open-Meteo traffic was not exercised: this container's network policy blocks the host.
- Reduced motion and **Still** ran no animation-frame loop; the seconds clock ticked; a 390 px phone layout had no horizontal overflow.
- `tests/extension.mjs` still cannot start the extension service worker in this headless container (also on the previous commit).

## New tab focus — 27 November 2026

- **34 Node regressions passed**, including `newTabFocus` normalization and background tests: in the default Address bar mode (and for a workspace without the setting) new tabs are neither redirected nor deduplicated, and switching to TabFlow search takes effect on the next new tab without a restart. The existing redirect/dedupe tests run in search mode.
- In the preview, the page leaves focus alone by default and focuses its search box in search mode. UI and Collection suites passed.
- `tests/extension.mjs` now also asserts that a new tab is kept unredirected in Address bar mode before switching to search mode for the dedupe checks. It still cannot start in this headless container. Address-bar focus itself is browser UI and must be checked by hand: press Ctrl+T in Chrome and Edge and confirm the cursor is in the address bar.

## Glass Liquid Glass pass — 27 November 2026

- Fixed a duplicated Glass settings panel (introduced with the Live scene) that showed Aurora-only effect controls in the Glass tab and duplicated element ids. `tests/ui.mjs` now fails on any duplicate id; it fails on the previous commit and passes now.
- The UI suite also checks that the clock sits beside the greeting and that pointer movement no longer moves the scene. The weather opt-in path was re-checked with mocked Open-Meteo responses, opening the card from the chip and the clock.
- Checked visually at 2560×1392 (three full-width Collection columns; previously capped at 1600 px), 1440×900 in dark and light themes, and the Glass settings tab. 34 Node regressions, UI and Collection suites passed.

## Icons, clock format, stats strip, water — 27 November 2026

- **36 Node regressions passed**, including `storableFavicon` (Firefox `data:` icons kept within a size limit, other schemes rejected) and the browser-language 12/24-hour default.
- The UI suite now checks that a saved tab without an icon takes the icon of an open tab on the same host, keeps it, and is not rewritten again.
- Water reflections (Live scene and the fixed Dusk/Night/Dawn SVGs) were checked by screenshot at night (moonlight) and with a low sun. The header stats strip was checked at 2560 px (with labels) and 1440 px (icons and numbers). UI and Collection suites passed.
- The Firefox icon permission prompt (**Allow icons**) needs a manual check in Firefox/Zen; this container has no Firefox.

## Stained glass v2 and Glass UX fixes — 27 November 2026

- Stained glass was rebuilt after review as a calm, removable module: one tinted window per Collection, neutral cards, no lead lines, rosettes or textures. `spaces.js`, `appearance.js` and `settings.js` are back to their pre-stained state, and `collections.js` has no stained code.
- Glass UX: a Collection-header **+** replaces Save-a-tab tiles when a Collection has tabs; the stats strip lost its own capsule; the Space name joins the date row; titles reserve two lines; the live-panel hint is readable; closing the scene card ends a time-travel preview.
- 38 Node regressions, UI and Collection suites passed. Checked visually at 2560×1440: clear (night), stained subtle (night and day) and rich.

## Stained glass v3 (icon colours) — 27 November 2026

- `dominantTone` unit tests: green and red brand icons give their hue; black/white and mostly-grey icons give mono; transparent icons give none. The UI suite checks that a red `data:` icon makes a red pane.
- Checked visually at 2560×1440 with brand-coloured test icons, night and day, plus a hover close-up. 38 Node regressions, UI and Collection suites passed.
- Remote icons in Firefox (Google's favicon service) may not be readable by canvas; those cards stay neutral. Verify in Firefox/Zen with real icons.

## Review round — 27 November 2026

- New unit tests: multi-colour logos (Google's G) give clear glass with three to four rim hues while two-colour logos keep their colour; the white-background knock-out clears the frame but keeps white inside the logo and leaves solid icons untouched.
- `collectionLayout` now clears the old packing before counting lanes and ignores collapsed (0px) `auto-fit` tracks. Glass uses `auto-fit`, so two Collections share the width. The Collection suite passed in all four modes.
- A scripted Zen-like check covered icons with white squares, `about:` pages in Open tabs, and TabFlow entries in Recently Closed (filtered out). 38 Node regressions and the UI suite passed.

## Remaining browser release checks

Chrome, Firefox and Zen runtime certification remains manual. The installed consumer Chrome executable did not expose the loaded extension's service worker to this harness; it was not counted as a pass. Firefox/Zen package structure is checked separately, but their CSP, new-tab preferences and event background must still be exercised in those browsers. Use the generated `dist/zen` manifest.

Before store publication, manually exercise browser-managed keyboard shortcuts and omnibox input, toolbar activation across windows, recently closed/session restoration, bookmark selection, upload/embed Pages, and OS keyboard/screen-reader behavior. The full product matrix is in [architecture](architecture.md#development-and-verification). Browser capability differences and sandbox script restrictions are documented in the [installation](installation.md) and [user](user-guide.md) guides.

Versioned, unreferenced Page payloads currently remain until Clear All. Reference-aware cleanup is deferred to avoid deleting data still referenced by another window. Same-field edits and simultaneous whole-document replacements are not collaborative conflict resolution.
