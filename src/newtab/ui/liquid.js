/* ================================================================
   TabFlow — Liquid Glass physics (Settings → Advanced)

   The material itself is pure CSS (body.fx-liquid, newtab.css).
   This module adds what CSS can't:

     • a drag ghost replacing the browser's static drag screenshot —
       a translucent glass copy of the card (backdrop-blurred, so the
       content behind stays readable) that trails the pointer with a
       subtle velocity stretch
     • an SVG goo silhouette underneath it that melts into the hovered
       drop target, iOS-style
     • spring attraction on the hovered card + a splash on drop
     • the pointer-tracked specular highlight on cards

   Two layers on purpose: an element inside an SVG-filtered parent
   cannot use backdrop-filter (the filter creates its own backdrop
   root), so the goo silhouettes live in #lg-goo-layer while the
   readable glass card (#lg-card) floats unfiltered above them.

   Cleanup never relies on dragend alone: a successful drop re-renders
   the grid and detaches the drag source, so its dragend never reaches
   document. We finish on drop (capture runs before the re-render) and
   keep a watchdog for drags that end with no event at all.

   Fully self-contained: capture-phase document listeners only, so no
   feature module needs to know it exists. Everything is skipped while
   the toggle is off or Reduce motion is on.
   ================================================================ */

import { q } from '../../common/util.js';
import { settings } from '../store.js';
import { getDrag } from './dnd.js';

/* Static markup (own constants only — safe for innerHTML).
   The goo filter: blur widens each shape's alpha, the color matrix
   sharpens it back at a threshold — overlapping shapes fuse into one
   silhouette with a liquid bridge. */
const LAYER_HTML = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="lg-goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/>
      <feColorMatrix in="b" type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"/>
    </filter>
  </defs>
</svg>
<div id="lg-goo-layer">
  <div id="lg-dock"></div>
  <div id="lg-blob"></div>
</div>
<div id="lg-card">
  <img id="lg-card-ic" alt="" />
  <div id="lg-card-txt">
    <span id="lg-card-title"></span>
    <span id="lg-card-url"></span>
  </div>
</div>`;

let layer = null;
let blob = null;      // goo silhouette (filtered layer)
let dock = null;      // goo target echo (filtered layer)
let ghost = null;     // readable glass card (unfiltered)
let ghostIcon = null;
let ghostTitle = null;
let ghostUrl = null;
let spacer = null;    // 1×1 canvas that hides the native drag image

let dragging = false;
let raf = 0;
let px = 0, py = 0;   // pointer position
let gx = 0, gy = 0;   // ghost position (eased toward pointer)
let lastOver = 0;     // watchdog: last dragover timestamp
let target = null;    // hovered .tab-card
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
  ghost = q('#lg-card', layer);
  ghostIcon = q('#lg-card-ic', layer);
  ghostTitle = q('#lg-card-title', layer);
  ghostUrl = q('#lg-card-url', layer);
  spacer = document.createElement('canvas');
  spacer.width = spacer.height = 1;
}

/* ---------- ghost ---------- */

function onDragStart(event) {
  if (!active() || !event.dataTransfer) return;
  const src = event.target?.closest?.('.tab-card, .collection, .tab-row');
  if (!src) return;
  ensureLayer();
  try {
    event.dataTransfer.setDragImage(spacer, 0, 0);
  } catch {
    /* native ghost stays — the glass ghost still works */
  }

  // The ghost keeps the source card's shape — just capped so huge
  // collections don't drag a wall of glass around.
  const rect = src.getBoundingClientRect();
  const w = Math.round(Math.min(Math.max(rect.width, 120), 230));
  const hSize = Math.round(Math.min(Math.max(rect.height, 36), 100));
  for (const el of [ghost, blob]) {
    el.style.width = `${w}px`;
    el.style.height = `${hSize}px`;
  }

  const img = src.querySelector('img');
  if (img?.src) {
    ghostIcon.src = img.src;
    ghostIcon.style.display = '';
  } else {
    ghostIcon.style.display = 'none';
  }
  const title = (src.querySelector('.card-title, .col-name, .tab-row-title')?.textContent
    ?? src.textContent).trim();
  ghostTitle.textContent = title;
  const url = src.querySelector('.card-url')?.textContent.trim() ?? '';
  ghostUrl.textContent = url;
  ghostUrl.style.display = url ? '' : 'none';

  dragging = true;
  px = gx = event.clientX;
  py = gy = event.clientY;
  lastOver = performance.now();
  ghost.style.transition = blob.style.transition = '';
  ghost.style.opacity = blob.style.opacity = '1';
  layer.classList.add('active');
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

function applyTransforms(stretch, angle) {
  const base = `translate(${gx}px, ${gy}px) translate(-50%, -55%) `;
  blob.style.transform = base
    + `rotate(${angle}rad) scale(${1 + stretch}, ${1 - stretch * 0.6}) rotate(${-angle}rad)`;
  // The readable card stretches half as much — it should feel lifted,
  // not rubbery.
  const half = stretch * 0.5;
  ghost.style.transform = base
    + `rotate(${angle}rad) scale(${1 + half}, ${1 - half * 0.6}) rotate(${-angle}rad)`;
}

function loop() {
  if (!dragging) return;
  // Watchdog: dragover fires continuously during a drag (~every 350 ms
  // even when holding still). Silence means the drag ended without us
  // getting a usable drop/dragend — fade out instead of sticking around.
  if (performance.now() - lastOver > 900) {
    finish(null);
    return;
  }
  const prevX = gx;
  const prevY = gy;
  gx += (px - gx) * 0.3;
  gy += (py - gy) * 0.3;
  const vx = gx - prevX;
  const vy = gy - prevY;
  const stretch = Math.min(Math.hypot(vx, vy) * 0.01, 0.16);
  applyTransforms(stretch, Math.atan2(vy, vx));
  if (target && !target.isConnected) setTarget(null); // re-render replaced it
  raf = requestAnimationFrame(loop);
}

/* ---------- target attraction + goo dock ---------- */

function onDragOver(event) {
  if (!dragging) return;
  lastOver = performance.now();
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

/* ---------- finishing (drop, cancel, watchdog) ---------- */

function finish(absorbTo) {
  if (!dragging) return;
  dragging = false;
  cancelAnimationFrame(raf);
  setTarget(null);
  for (const el of [ghost, blob]) {
    el.style.transition = 'transform 200ms ease, opacity 200ms ease';
    if (absorbTo) {
      el.style.transform =
        `translate(${absorbTo.x}px, ${absorbTo.y}px) translate(-50%, -50%) scale(0.1)`;
    }
    el.style.opacity = '0';
  }
  setTimeout(() => {
    layer.classList.remove('active');
    ghost.style.transition = blob.style.transition = '';
  }, 220);
}

function onDrop(event) {
  if (!dragging) return;
  // Finish NOW: the app's drop handler re-renders and detaches the drag
  // source, so its dragend never reaches document.
  const absorbTo = dockRect
    ? { x: dockRect.left + dockRect.width / 2, y: dockRect.top + dockRect.height / 2 }
    : null;
  // Aim the splash at the dragged item's *new* element, found by its
  // data id after the app has re-rendered.
  const drag = getDrag();
  const colEl = event.target?.closest?.('.collection');
  const sel =
    drag?.type === 'card' ? `.tab-card[data-tab-id="${drag.tabId}"]`
    : drag?.type === 'collection' ? `.collection[data-id="${drag.collectionId}"]`
    : colEl ? `.collection[data-id="${colEl.dataset.id}"]`
    : null;
  finish(absorbTo);
  if (!sel) return;
  setTimeout(() => {
    const el = q(sel);
    if (!el) return;
    el.classList.add('lg-splash');
    setTimeout(() => el.classList.remove('lg-splash'), 600);
  }, 50);
}

function onDragEnd() {
  finish(null); // no-op if a drop already finished this drag
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
