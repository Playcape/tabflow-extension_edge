/* Mode composition and a bounded effects budget. No data/schema migration. */
import { settings, getDoc, activeSpace } from '../store.js';
import { q } from '../../common/util.js';

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const transparency = matchMedia('(prefers-reduced-transparency: reduce)');
const contrast = matchMedia('(prefers-contrast: more)');
const forced = matchMedia('(forced-colors: active)');
let navAnchor;
let pointerFrame = 0;
let currentCard;

export function effectPolicy(s, count = 0, env = {}) {
  const low = (env.memory > 0 && env.memory <= 4) || (env.cores > 0 && env.cores <= 2) || env.saveData;
  return {
    opaque: !!(env.transparency || env.contrast || env.forced || low || count > 250),
    static: !!(s.reduceMotion || env.motion || env.transparency || env.contrast || env.forced || low || count > 120 || env.hidden),
  };
}

export function applyDesign() {
  const s = settings();
  const mode = s.materialYou ? 'tonal' : s.liquidGlass ? 'aurora' : 'normal';
  document.body.dataset.design = mode;
  const nav = q('.sidebar-nav');
  if (nav && !navAnchor) { navAnchor = document.createComment('navigation home'); nav.before(navAnchor); }
  const target = mode === 'tonal' ? q('#mode-navigation') : navAnchor?.parentElement;
  if (target && nav.parentElement !== target) {
    const focused = nav.contains(document.activeElement) ? document.activeElement : null;
    mode === 'tonal' ? target.append(nav) : navAnchor.after(nav);
    focused?.focus();
  }
  const count = getDoc().spaces.reduce((sum, space) => sum + space.collections.reduce((n, c) => n + c.tabs.length, 0), 0);
  const policy = effectPolicy(s, count, { motion: motion.matches, transparency: transparency.matches, contrast: contrast.matches, forced: forced.matches, memory: navigator.deviceMemory, cores: navigator.hardwareConcurrency, saveData: navigator.connection?.saveData, hidden: document.hidden });
  document.body.classList.toggle('effects-static', policy.static);
  document.body.classList.toggle('effects-opaque', policy.opaque);
  q('#design-status').textContent = {normal:'Normal', tonal:'Tonal', aurora:'Aurora'}[mode];
  q('#btn-command-palette').hidden = !s.cmdPalette;
  updateOverview();
}

export function updateOverview() {
  const collections = activeSpace()?.collections ?? [];
  const tabs = collections.flatMap(c => c.tabs);
  q('#metric-collections').textContent = collections.length;
  q('#metric-tabs').textContent = tabs.length;
  q('#metric-pinned').textContent = tabs.filter(t => t.pinned).length;
}

export function richEffectsAllowed() {
  return document.body.dataset.design === 'aurora' && !document.body.classList.contains('effects-static');
}

function resetCard() {
  if (currentCard) for (const key of ['--tilt-x','--tilt-y','--lg-mx','--lg-my']) currentCard.style.removeProperty(key);
  currentCard = null;
}

export function initDesign() {
  for (const query of [motion, transparency, contrast, forced]) query.addEventListener('change', applyDesign);
  document.addEventListener('visibilitychange', applyDesign);
  document.addEventListener('pointermove', event => {
    if (!richEffectsAllowed() || !settings().lgSheen || event.pointerType === 'touch') { resetCard(); return; }
    const card = event.target.closest?.('.tab-card');
    if (card !== currentCard) { resetCard(); currentCard = card; }
    if (!card || pointerFrame) return;
    const { clientX, clientY } = event;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (card !== currentCard || !card.isConnected || !richEffectsAllowed()) return;
      const rect = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      card.style.setProperty('--lg-mx', `${x * 100}%`);
      card.style.setProperty('--lg-my', `${y * 100}%`);
      card.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
      card.style.setProperty('--tilt-y', `${(x - 0.5) * 3}deg`);
    });
  }, { passive: true });
  document.addEventListener('pointerleave', resetCard);
}
