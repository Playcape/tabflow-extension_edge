/* ================================================================
   TabFlow — Stained glass (optional Glass style)
   Each Collection becomes a softly tinted glass window in one hue
   (its chosen colour, else a stable hue from its name). Saved tabs and
   the navigation stay neutral, so colour means "this group". The tint
   follows the Live scene's light (--scene-light, --sun-x).

   Self-contained so it can be removed easily. This module owns its
   body classes, decorates Collections through a MutationObserver and
   binds its own settings controls; no other module calls into it.

   To remove stained glass, delete:
     · this file and src/newtab/styles/modes/stained.css
     · the lines marked [stained-glass] in src/newtab/main.js,
       src/newtab/newtab.css, src/newtab/newtab.html (one block) and
       src/newtab/migrations.js (two settings and their validation)
     · the stained tests in tests/data.test.mjs, tests/scene.test.mjs
       and tests/ui.mjs
   Stored glassStyle/stainedIntensity values are then dropped on load.
   ================================================================ */

import { q, qa } from '../../common/util.js';
import { settings, update, findCollection } from '../store.js';
import { registerRenderer, render } from './bus.js';

/* Window hues that stay clear when deep and translucent (amber and gold
   turn brown at this depth), spread so neighbours differ: sapphire,
   emerald, violet, rose, teal, wine. A Collection's own colour wins. */
export const STAINED_HUES = [248, 160, 292, 345, 205, 20];
/* Collection colour keys (themes.js COLLECTION_COLORS) as hues. */
const KEY_HUES = { red: 25, orange: 55, yellow: 92, green: 150, cyan: 205, blue: 248, purple: 292, pink: 345 };

function hash(text) {
  let h = 2166136261; // FNV-1a
  for (const char of String(text)) h = Math.imul(h ^ char.codePointAt(0), 16777619) >>> 0;
  return h;
}

/** Window hue of a Collection: its chosen colour, else a stable hue from its name. */
export function windowHue(collection) {
  return KEY_HUES[collection?.color] ?? STAINED_HUES[hash(collection?.name ?? '') % STAINED_HUES.length];
}

function on() {
  const s = settings();
  return !!s.glassmorphism && s.glassStyle === 'stained';
}

function applyClasses() {
  const s = settings();
  document.body.classList.toggle('glass-stained', on());
  document.body.classList.toggle('stained-rich', on() && s.stainedIntensity === 'rich');
}

/** Give every rendered Collection its window hue. Cheap: one style write per Collection. */
function decorate(root = document) {
  if (!on()) return;
  for (const el of qa('.collection[data-id]', root)) {
    const hue = String(windowHue(findCollection(el.dataset.id)?.collection));
    if (el.style.getPropertyValue('--st-h') !== hue) el.style.setProperty('--st-h', hue);
  }
}

function bindPills(sel, key) {
  const wrap = q(sel);
  if (!wrap) return;
  for (const pill of qa('.pill', wrap)) {
    pill.classList.toggle('active', pill.dataset.val === settings()[key]);
    pill.onclick = () => {
      update((doc) => (doc.settings[key] = pill.dataset.val));
      render('appearance', 'stained');
    };
  }
}

function renderStained() {
  applyClasses();
  decorate();
  bindPills('#glassstyle-pills', 'glassStyle');
  bindPills('#stainedintensity-pills', 'stainedIntensity');
}

/* Touched glass illuminates from within, starting under the pointer
   (WWDC25 "Meet Liquid Glass"): only the hovered card, once per frame. */
let litCard = null;
let frame = 0;
function onPointer(event) {
  if (!document.body.classList.contains('glass-stained') || event.pointerType === 'touch') return;
  const card = event.target.closest?.('.tab-card');
  if (card !== litCard) { litCard?.style.removeProperty('--lx'); litCard?.style.removeProperty('--ly'); litCard = card; }
  if (!card || frame) return;
  const { clientX, clientY } = event;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (card !== litCard || !card.isConnected) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--lx', `${(((clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    card.style.setProperty('--ly', `${(((clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  });
}

export function initStained() {
  registerRenderer('stained', renderStained);
  // Collections re-render often; decorate whatever was just added.
  const area = q('#collections-area');
  if (area) new MutationObserver(() => decorate(area)).observe(area, { childList: true });
  // Design switches go through the appearance pass; keep the classes in step.
  new MutationObserver(applyClasses).observe(document.body, { attributeFilter: ['data-design'] });
  document.addEventListener('pointermove', onPointer, { passive: true });
}
