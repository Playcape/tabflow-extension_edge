/* ================================================================
   TabFlow — new tab page entry point
   ================================================================ */

import { initStore, onExternalChange, settings } from './store.js';
import { warmFavicons } from '../common/util.js';
import { renderAll } from './ui/bus.js';
import { initAppearance } from './ui/appearance.js';
import { initLayout, setNav, focusSearch } from './ui/layout.js';
import { initSpaces } from './ui/spaces.js';
import { initCollections } from './ui/collections.js';
import { initPages } from './ui/pages.js';
import { initOpenTabs } from './ui/opentabs.js';
import { initLinks } from './ui/links.js';
import { initTasks } from './ui/tasks.js';
import { initSettings } from './ui/settings.js';
import { initPalette } from './ui/palette.js';
import { initLiquid } from './ui/liquid.js';
import { initFaviconConsent } from '../common/faviconConsent.js';
import { initLocationConsent } from '../common/locationConsent.js';

async function boot() {
  await initFaviconConsent(() => renderAll());
  await initLocationConsent(() => renderAll());
  await initStore();

  initAppearance();
  initLayout();
  initSpaces();
  initCollections();
  initPages();
  initOpenTabs();
  initLinks();
  initTasks();
  initSettings();
  initPalette();
  initLiquid();

  renderAll();
  setNav('collections');

  // "Address bar" (default): TabFlow is the browser's new-tab page and the
  // browser focuses its own address bar — never take focus from it.
  // "TabFlow search": the new tab was redirected here (see background.js), so
  // put the cursor in the search launcher for a query, URL or Links alias.
  if (settings().newTabFocus === 'search') focusSearch();

  // Another TabFlow page saved changes — reflect them here.
  onExternalChange(() => renderAll());

  // First paint after a browser start can hit a cold favicon cache; nudge
  // the saved-tab icons so they appear without a manual refresh.
  setTimeout(warmFavicons, 600);
  setTimeout(warmFavicons, 1800);
}

boot().catch((err) => {
  console.error('TabFlow failed to start:', err);
  document.body.insertAdjacentHTML(
    'beforeend',
    '<div style="position:fixed;inset:auto 16px 16px;padding:12px 16px;background:#402;color:#fdd;border-radius:8px;font:13px system-ui">TabFlow could not load its data. Try reloading, or check the console for details.</div>'
  );
});
