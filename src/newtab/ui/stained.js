/* ================================================================
   TabFlow — Stained glass colours
   Stable hues for the Glass "Stained" style: every website gets one of
   eight jewel tones (so the same site is recognisable everywhere), every
   Collection a frame hue, every Space a rose-window hue. Colours are
   OKLCH hues; lightness and chroma come from CSS so all tones sit at the
   same brightness and text contrast stays even.
   ================================================================ */

import { siteOf } from '../../common/util.js';

/** Ruby, amber, gold, emerald, teal, sapphire, violet, rose. */
export const STAINED_HUES = [25, 62, 92, 150, 192, 248, 292, 345];

/* Collection colour keys (themes.js COLLECTION_COLORS) as hues. */
const KEY_HUES = { red: 25, orange: 55, yellow: 92, green: 150, cyan: 205, blue: 248, purple: 292, pink: 345 };

function hash(text) {
  let h = 2166136261; // FNV-1a
  for (const char of String(text)) h = Math.imul(h ^ char.codePointAt(0), 16777619) >>> 0;
  return h;
}

/** The pane hue of a saved tab: one per site, so all of learn.microsoft.com match. */
export function paneHue(url) {
  return STAINED_HUES[hash(siteOf(url) || url || '') % STAINED_HUES.length];
}

/** Frame hue of a Collection: its chosen colour, else a stable hue from its name. */
export function frameHue(collection) {
  return KEY_HUES[collection?.color] ?? STAINED_HUES[hash(collection?.name ?? '') % STAINED_HUES.length];
}

/** Hue of a #rrggbb colour (for Spaces with a custom colour). */
export function hueOfHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

export function spaceHue(space) {
  return hueOfHex(space?.color) ?? STAINED_HUES[hash(space?.name ?? '') % STAINED_HUES.length];
}

/** The two most common pane hues in a Collection: the colours its light spills. */
export function spillHues(tabs = []) {
  const counts = new Map();
  for (const tab of tabs) {
    const h = paneHue(tab.url);
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  const sorted = [...counts].sort((a, b) => b[1] - a[1]).map(([h]) => h);
  return [sorted[0] ?? 248, sorted[1] ?? sorted[0] ?? 248];
}

/* Touched glass illuminates from within, starting under the pointer
   (WWDC25 "Meet Liquid Glass"). Only the hovered pane is updated, once per
   frame, and nothing runs unless the Stained style is on. */
let litCard = null;
let frame = 0;
export function initStainedLight() {
  document.addEventListener('pointermove', (event) => {
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
  }, { passive: true });
}
