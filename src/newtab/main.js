/* ================================================================
   TabFlow — new tab page entry point
   ================================================================ */

import { initStore, onExternalChange } from './store.js';
import { renderAll } from './ui/bus.js';
import { initAppearance } from './ui/appearance.js';
import { initLayout, setNav } from './ui/layout.js';
import { initSpaces } from './ui/spaces.js';
import { initCollections } from './ui/collections.js';
import { initOpenTabs } from './ui/opentabs.js';
import { initLinks } from './ui/links.js';
import { initTasks } from './ui/tasks.js';
import { initSettings } from './ui/settings.js';

async function boot() {
  await initStore();

  initAppearance();
  initLayout();
  initSpaces();
  initCollections();
  initOpenTabs();
  initLinks();
  initTasks();
  initSettings();

  renderAll();
  setNav('collections');

  // Another TabFlow page saved changes — reflect them here.
  onExternalChange(() => renderAll());
}

boot().catch((err) => {
  console.error('TabFlow failed to start:', err);
  document.body.insertAdjacentHTML(
    'beforeend',
    '<div style="position:fixed;inset:auto 16px 16px;padding:12px 16px;background:#402;color:#fdd;border-radius:8px;font:13px system-ui">TabFlow could not load its data. Try reloading, or check the console for details.</div>'
  );
});
