/* ================================================================
   TabFlow — Liquid Glass physics (Settings → Advanced)

   The material itself is pure CSS (body.fx-liquid, newtab.css).
   This module adds what CSS can't:

     • a drag "droplet" replacing the browser's static drag screenshot —
       it trails the pointer with velocity stretch, and an SVG goo
       filter melts it into the hovered drop target, iOS-style
     • spring attraction on the hovered card + a splash on drop
     • the pointer-tracked specular highlight on cards

   Fully self-contained: it only listens to bubbled/captured events on
   document, so no feature module needs to know it exists. Everything
   is skipped while the toggle is off or Reduce motion is on.
   ================================================================ */

import { q } from '../../common/util.js';
import { settings } from '../store.js';
import { getDrag } from './dnd.js';

/* Static markup (own constants only — safe for innerHTML).
   The goo filter: blur widens each shape's alpha, the color matrix
   sharpens it back at a threshold — overlapping shapes fuse into one
   silhouette with a liquid bridge. Compositing the source back "atop"
   keeps icon and label crisp while the melt happens underneath. */
const LAYER_HTML = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="lg-goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/>
      <feColorMatrix in="b" type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12" result="goo"/>
      <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
    </filter>
  </defs>
</svg>
<div id="lg-goo-layer">
  <div id="lg-dock"></div>
  <div id="lg-blob"><img id="lg-blob-ic" alt="" /><span id="lg-blob-label"></span></div>
</div>`;

let layer = null;
let blob = null;
let dock = null;
let blobIcon = null;
let blobLabel = null;
let spacer = null; // 1×1 canvas that hides the native drag image

let dragging = false;
let didDrop = false;
let raf = 0;
let px = 0, py = 0; // pointer position
let gx = 0, gy = 0; // droplet position (eased toward pointer)
let target = null;  // hovered .tab-card
let dockRect = null;

const active = () => settings().liquidGlass && !settings().reduceMotion;

function ensureLayer() {
  if (layer) return;
  layer = document.createElement('div');
  layer.id = 'liquid-layer';
  layer.innerHTML = LAYER_HTML;
  document.body.append(layer);
  blob = q('#lg-blob', layer);
  dock = q('#lg-dock', layer);
  blobIcon = q('#lg-blob-ic', layer);
  blobLabel = q('#lg-blob-label', layer);
  spacer = document.createElement('canvas');
  spacer.width = spacer.height = 1;
}

/* ---------- droplet ---------- */

function onDragStart(event) {
  if (!active() || !event.dataTransfer) return;
  const src = event.target?.closest?.('.tab-card, .collection, .tab-row');
  if (!src) return;
  ensureLayer();
  try {
    event.dataTransfer.setDragImage(spacer, 0, 0);
  } catch {
    /* native ghost stays — droplet still works */
  }

  const img = src.querySelector('img');
  if (img?.src) {
    blobIcon.src = img.src;
    blobIcon.style.display = '';
  } else {
    blobIcon.style.display = 'none';
  }
  const label = (src.querySelector('.card-title, .col-name, .tab-row-title')?.textContent
    ?? src.textContent).trim();
  blobLabel.textContent = label.length > 30 ? label.slice(0, 29) + '…' : label;

  dragging = true;
  didDrop = false;
  px = gx = event.clientX;
  py = gy = event.clientY;
  blob.style.transition = '';
  blob.style.opacity = '1';
  layer.classList.add('active');
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

function loop() {
  if (!dragging) return;
  const prevX = gx;
  const prevY = gy;
  gx += (px - gx) * 0.3;
  gy += (py - gy) * 0.3;
  // Stretch along the movement vector — the faster it moves, the more
  // the droplet smears, snapping back round when it settles.
  const vx = gx - prevX;
  const vy = gy - prevY;
  const stretch = Math.min(Math.hypot(vx, vy) * 0.012, 0.3);
  const angle = Math.atan2(vy, vx);
  blob.style.transform =
    `translate(${gx}px, ${gy}px) translate(-50%, -110%) ` +
    `rotate(${angle}rad) scale(${1 + stretch}, ${1 - stretch * 0.6}) rotate(${-angle}rad)`;
  if (target && !target.isConnected) setTarget(null); // re-render replaced it
  raf = requestAnimationFrame(loop);
}

/* ---------- target attraction + goo dock ---------- */

function onDragOver(event) {
  if (!dragging) return;
  px = event.clientX;
  py = event.clientY;
  // A dragged collection reorders by header position — docking onto a
  // card would suggest a drop that isn't going to happen.
  const card = getDrag()?.type === 'collection'
    ? null
    : event.target?.closest?.('.tab-card:not(.dragging)');
  setTarget(card ?? null);
}

function setTarget(el) {
  if (el === target) return;
  target?.classList.remove('lg-attract');
  target = el;
  dockRect = null;
  if (target) {
    target.classList.add('lg-attract');
    dockRect = target.getBoundingClientRect();
    dock.style.left = `${dockRect.left}px`;
    dock.style.top = `${dockRect.top}px`;
    dock.style.width = `${dockRect.width}px`;
    dock.style.height = `${dockRect.height}px`;
    dock.style.opacity = '1';
  } else {
    dock.style.opacity = '0';
  }
}

/* ---------- drop splash + absorb ---------- */

function onDrop(event) {
  if (!dragging) return;
  didDrop = true;
  // The app's drop handler re-renders the grid, so aim the splash at the
  // dragged item's *new* element, found by its data id after the render.
  const drag = getDrag();
  const colEl = event.target?.closest?.('.collection');
  const sel =
    drag?.type === 'card' ? `.tab-card[data-tab-id="${drag.tabId}"]`
    : drag?.type === 'collection' ? `.collection[data-id="${drag.collectionId}"]`
    : colEl ? `.collection[data-id="${colEl.dataset.id}"]`
    : null;
  if (!sel) return;
  setTimeout(() => {
    const el = q(sel);
    if (!el) return;
    el.classList.add('lg-splash');
    setTimeout(() => el.classList.remove('lg-splash'), 600);
  }, 50);
}

function onDragEnd() {
  if (!dragging) return;
  dragging = false;
  cancelAnimationFrame(raf);
  const absorbTo = didDrop && dockRect
    ? { x: dockRect.left + dockRect.width / 2, y: dockRect.top + dockRect.height / 2 }
    : null;
  setTarget(null);
  blob.style.transition = 'transform 220ms ease, opacity 220ms ease';
  if (absorbTo) {
    blob.style.transform = `translate(${absorbTo.x}px, ${absorbTo.y}px) translate(-50%, -50%) scale(0.1)`;
  }
  blob.style.opacity = '0';
  setTimeout(() => {
    layer.classList.remove('active');
    blob.style.transition = '';
  }, 240);
}

/* ---------- pointer-tracked specular highlight ---------- */

let sheenRaf = 0;

function onPointerMove(event) {
  if (sheenRaf || !settings().liquidGlass) return;
  const card = event.target?.closest?.('.tab-card');
  if (!card) return;
  const { clientX, clientY } = event;
  sheenRaf = requestAnimationFrame(() => {
    sheenRaf = 0;
    const r = card.getBoundingClientRect();
    if (!r.width) return;
    card.style.setProperty('--lg-mx', `${((clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty('--lg-my', `${((clientY - r.top) / r.height) * 100}%`);
  });
}

/* ---------- init ---------- */

export function initLiquid() {
  // Everything on capture: feature modules stopPropagation() inside their
  // own drag handlers (cards do, on dragstart), and the drop must be read
  // before the app's handler re-renders the DOM. Capture sees all of it
  // without interfering.
  document.addEventListener('dragstart', onDragStart, true);
  document.addEventListener('dragover', onDragOver, true);
  document.addEventListener('drop', onDrop, true);
  document.addEventListener('dragend', onDragEnd, true);
  document.addEventListener('pointermove', onPointerMove, { passive: true });
}
