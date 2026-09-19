# Testing TabFlow

## Run the checks

Use Node.js 20 or later and install development dependencies with `npm install`. No npm packages ship in the extension.

```powershell
npm test
npx playwright install chromium
npm run test:ui
npm run test:extension
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

## Remaining release checks

Chrome, Firefox and Zen runtime certification remains manual. The installed consumer Chrome executable did not expose the loaded extension's service worker to this harness; it was not counted as a pass. Firefox/Zen package structure is checked separately, but their CSP, new-tab preferences and event background must still be exercised in those browsers. Use the generated `dist/zen` manifest.

Before store publication, manually exercise browser-managed keyboard shortcuts and omnibox input, toolbar activation across windows, recently closed/session restoration, bookmark selection, upload/embed Pages, and OS keyboard/screen-reader behavior. The full product matrix is in [architecture](architecture.md#development-and-verification). Browser capability differences and sandbox script restrictions are documented in the [installation](installation.md) and [user](user-guide.md) guides.

Versioned, unreferenced Page payloads currently remain until Clear All. Reference-aware cleanup is deferred to avoid deleting data still referenced by another window. Same-field edits and simultaneous whole-document replacements are not collaborative conflict resolution.
