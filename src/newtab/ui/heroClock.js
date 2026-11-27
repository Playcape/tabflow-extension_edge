/* ================================================================
   TabFlow — Glass header clock
   A large clock beside the greeting with today's date underneath.
   With the Live scene it glows in the scene's light (--scene-glow,
   set by scene/live.js) and opens the scene card on click.
   ================================================================ */

import { settings } from '../store.js';
import { q } from '../../common/util.js';

let timer = 0;

/** Split a time into its digits and its AM/PM marker (empty in 24-hour locales). */
export function timeParts(date, { clock24h = false, clockSeconds = false } = {}) {
  const parts = new Intl.DateTimeFormat([], {
    hour: 'numeric', minute: '2-digit', ...(clockSeconds ? { second: '2-digit' } : {}), hour12: !clock24h,
  }).formatToParts(date);
  const main = parts.filter((p) => p.type !== 'dayPeriod').map((p) => p.value).join('').trim();
  const period = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  return { main, period };
}

function tick() {
  const s = settings();
  const now = new Date();
  const { main, period } = timeParts(now, s);
  const time = q('#hero-clock .hero-time');
  if (time && time.textContent !== main) {
    time.textContent = main;
    q('#hero-clock .hero-period').textContent = period;
    q('#hero-clock').setAttribute('datetime', now.toISOString());
  }
  const date = q('#hero-date');
  const day = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  if (date && date.textContent !== day) date.textContent = day;
}

/** Called on every appearance pass: shows, hides and re-times the clock. */
export function renderHeroClock() {
  const clock = q('#hero-clock');
  if (!clock) return;
  const s = settings();
  const glass = document.body.dataset.design === 'glass';
  clock.hidden = !(glass && s.sceneClock);
  clearInterval(timer);
  timer = 0;
  if (!glass) return;
  tick();
  timer = setInterval(() => { if (!document.hidden) tick(); }, s.clockSeconds ? 1000 : 5000);
}
