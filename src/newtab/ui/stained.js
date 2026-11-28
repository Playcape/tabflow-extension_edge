/* ================================================================
   TabFlow — Stained glass (optional Glass style)
   Saved tabs become panes of coloured glass in their site's own colour,
   read from the site icon (GitHub: smoky clear glass, Spotify: green,
   YouTube: red…). Collections stay clear unless you give them a colour
   (Collection menu → colour); then they become a tinted window. The
   light follows the Live scene (--scene-light, --sun-x).

   Self-contained so it can be removed easily: this module owns its body
   classes, tints cards through a MutationObserver and binds its own
   settings controls; no other module calls into it.

   To remove stained glass, delete:
     · this file, ui/iconTone.js and styles/modes/stained.css
     · the lines marked [stained-glass] in src/newtab/main.js,
       src/newtab/newtab.css, src/newtab/newtab.html (one block) and
       src/newtab/migrations.js (two settings and their validation)
     · the stained tests in tests/data.test.mjs, tests/scene.test.mjs
       and tests/ui.mjs
   Stored glassStyle/stainedIntensity values are then dropped on load.
   ================================================================ */

import { q, qa, siteOf, domainOf } from '../../common/util.js';
import { remoteIconsAllowed } from '../../common/faviconConsent.js';
import { settings, update, findTab } from '../store.js';
import { registerRenderer, render } from './bus.js';
import { dominantTone, knockOutWhite } from './iconTone.js';

const CACHE_KEY = 'tabflow_icon_tones_v2'; // v2: multi-colour logos
const MAX_CACHED = 600;
/** site → {h, c} (c = 0: mono icon) or null (icon unreadable). */
const tones = new Map();
const pending = new Set();
/** site → icon with its white background removed (memory only; rebuilt per page). */
const cleanIcons = new Map();
const checkedSites = new Set();
let saveTimer = 0;

function loadCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
    for (const [site, tone] of Object.entries(raw)) {
      if (tone && Number.isFinite(tone.h) && Number.isFinite(tone.c)) {
        tones.set(site, Array.isArray(tone.multi) ? { ...tone, multi: tone.multi.filter(Number.isFinite).slice(0, 4) } : tone);
      }
    }
  } catch { /* private mode or corrupt cache: start empty */ }
}

function saveCache() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const entries = [...tones].filter(([, tone]) => tone).slice(-MAX_CACHED);
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch { /* quota: colours are recomputed next time */ }
  }, 800);
}

function on() {
  const s = settings();
  return !!s.glassmorphism && s.glassStyle === 'stained';
}

function applyClasses() {
  document.body.classList.toggle('glass-stained', on());
  document.body.classList.toggle('stained-rich', on() && settings().stainedIntensity === 'rich');
}

/* ---------- reading an icon's colour ---------- */

function readTone(img, site) {
  // A fresh canvas every time: drawing one unshared cross-origin icon taints a
  // canvas for good, and a shared one would then refuse every later icon too.
  const canvas = Object.assign(document.createElement('canvas'), { width: 32, height: 32 });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 32, 32);
  const pixels = ctx.getImageData(0, 0, 32, 32); // throws on a cross-origin icon
  const tone = dominantTone(pixels.data);
  // Icons that ship on a white square read as stickers on coloured glass:
  // clear that background so the logo sits directly on the pane.
  if (knockOutWhite(pixels.data, 32, 32)) {
    ctx.putImageData(pixels, 0, 0);
    cleanIcons.set(site, canvas.toDataURL('image/png'));
  }
  return tone;
}

/** A CORS-readable copy of an icon address, or null if the server refuses. */
function corsImage(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const copy = new Image();
    copy.crossOrigin = 'anonymous';
    copy.referrerPolicy = 'no-referrer';
    copy.onload = () => resolve(copy);
    copy.onerror = () => resolve(null);
    copy.src = src;
  });
}

/* Browsers let a page show any icon but only read the pixels of icons the
   server explicitly shares. Try, in order: the icon as shown (stored data:
   icons and Chromium's local favicons always work), the same address again
   with CORS, and — only if you allowed remote icons — Google's favicon
   service for that site, which shares its images. */
async function measure(site, img, host) {
  if (pending.has(site)) return;
  pending.add(site);
  const tryRead = (image) => { try { return image ? readTone(image, site) : undefined; } catch { return undefined; } };
  if (!(img.complete && img.naturalWidth)) {
    const ok = await new Promise((resolve) => {
      img.addEventListener('load', () => resolve(true), { once: true });
      img.addEventListener('error', () => resolve(false), { once: true });
    });
    if (!ok) { pending.delete(site); checkedSites.delete(site); return; } // another card may have a working icon
  }
  let tone = tryRead(img);
  if (tone === undefined) tone = tryRead(await corsImage(img.currentSrc || img.src));
  if (tone === undefined && host && settings().remoteFavicons && remoteIconsAllowed()) {
    // gstatic serves the images directly (www.google.com/s2 redirects there, and a
    // redirect can drop the sharing header), so ask it first.
    const page = encodeURIComponent(`https://${host}`);
    tone = tryRead(await corsImage(`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${page}&size=64`));
    if (tone === undefined) tone = tryRead(await corsImage(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`));
  }
  pending.delete(site);
  tones.set(site, tone ?? null); // null: unreadable this session (not saved; retried next time)
  if (tone) saveCache();
  paintAll();
}

/** Background check only, for sites whose colour came from the cache. */
function measureClean(site, img) {
  const run = () => { try { readTone(img, site); if (cleanIcons.has(site)) paintAll(); } catch { /* cross-origin: leave as is */ } };
  if (img.complete && img.naturalWidth) run();
  else img.addEventListener('load', run, { once: true });
}

/* ---------- painting cards ---------- */

function paintCard(card) {
  const found = findTab(card.dataset.colId, card.dataset.tabId);
  const site = found ? siteOf(found.tab.url) : '';
  if (!site) return;
  const tone = tones.get(site);
  const img = card.querySelector('img.card-fav');
  if (img && !checkedSites.has(site)) {
    // Cached colours skip the read, but the white-background check runs once per site and page.
    checkedSites.add(site);
    if (tone === undefined) measure(site, img, domainOf(found.tab.url)); else measureClean(site, img);
  }
  if (tone === undefined) return;
  const clean = cleanIcons.get(site);
  if (img && clean && img.src !== clean) img.src = clean;
  if (!tone) { delete card.dataset.toneIc; return; }
  const value = tone.multi?.length >= 3 ? 'multi' : tone.c ? 'color' : 'mono';
  if (card.dataset.toneIc !== value) card.dataset.toneIc = value;
  card.style.setProperty('--ic-h', String(tone.h));
  card.style.setProperty('--ic-c', String(tone.c));
  if (value === 'multi') {
    // The logo's own colours run around the pane's rim (repeat the first to fill four stops).
    const m = [...tone.multi, ...tone.multi].slice(0, 4);
    m.forEach((hue, i) => card.style.setProperty(`--ic-m${i + 1}`, String(hue)));
  }
}

/* Open tabs and Recently Closed: same white-background clean-up for their icons. */
function paintRowIcon(img) {
  const url = img.closest('[title]')?.getAttribute('title') ?? '';
  const site = /^https?:/i.test(url) ? siteOf(url) : '';
  if (!site) return;
  if (!checkedSites.has(site)) { checkedSites.add(site); measureClean(site, img); return; }
  const clean = cleanIcons.get(site);
  if (clean && img.src !== clean) img.src = clean;
}

function paintAll() {
  if (!on()) return;
  for (const card of qa('#collections-area .tab-card[data-tab-id]')) paintCard(card);
  for (const img of qa('#right-panel .tab-row img.tab-fav-img')) paintRowIcon(img);
}

/* ---------- settings ---------- */

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
  paintAll();
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
  loadCache();
  registerRenderer('stained', renderStained);
  // Collections re-render often; tint whatever was just added.
  for (const sel of ['#collections-area', '#open-tabs-list', '#recently-closed-list']) {
    const el = q(sel);
    if (el) new MutationObserver(paintAll).observe(el, { childList: true, subtree: true });
  }
  // Design switches go through the appearance pass; keep the classes in step.
  new MutationObserver(() => { applyClasses(); paintAll(); }).observe(document.body, { attributeFilter: ['data-design'] });
  document.addEventListener('pointermove', onPointer, { passive: true });
}
