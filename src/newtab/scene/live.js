/* ================================================================
   TabFlow — Live scene (Glass design)
   A layered landscape that follows the real sky: sun and moon move
   with the clock, the palette follows the sun's height, the trees
   follow the seasons and — when the user opts in — the weather falls
   into the scene. A digital clock glows above the lake. The scene is
   decorative (aria-hidden); the same information is reachable from
   the keyboard through the weather chip in the toolbar.
   ================================================================ */

import { LANDSCAPE as L } from '../scenes/landscape.js';
import { sceneState, sunTimes, estimateLocation, WEATHER_KINDS, SEASONS } from './sky.js';
import { describeWeather, readCache, usableWeather, fetchWeather, formatTemp, preferredUnit, REFRESH_MS } from './weather.js';
import { Particles } from './particles.js';
import { settings } from '../store.js';
import { q, h } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { locationAllowed } from '../../common/locationConsent.js';

const NS = 'http://www.w3.org/2000/svg';
const CLOUDS = [
  [7, 46, 0], [15, 38, 18], [24, 52, 36], [10, 34, 52], [30, 44, 66], [19, 58, 80], [5, 40, 90], [27, 36, 8], [13, 50, 44],
]; // [top vh, width vw, start offset %]

let root = null;
let els = {};
let particles = null;
let active = false;
let tickTimer = 0;
let weatherTimer = 0;
let fetching = null;
let lastKey = '';
let lastMinute = -1;
let state = null;
let weatherData = null;
let weatherError = '';
let pointerFrame = 0;
let lakeBottom = 0;
let weatherKey = '';
let card = null;
let cardReturn = null;
const preview = { minutes: null, season: null, kind: null };

/* ---------- helpers ---------- */

function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  el.append(...children);
  return el;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

function stop(offset, colourVar, opacity = 1) {
  return svg('stop', { offset, style: `stop-color:var(${colourVar});stop-opacity:${opacity}` });
}

export function liveSceneOn() {
  return document.body.dataset.design === 'glass' && document.body.dataset.scene === 'live';
}

function motionLevel() {
  const s = settings();
  if (s.reduceMotion || s.sceneMotion === 'still' || document.body.classList.contains('effects-static')) return 'still';
  return s.sceneMotion === 'calm' ? 'calm' : 'full';
}

function placeOf(s = settings()) {
  const loc = s.sceneLocation;
  return loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lon) ? { lat: loc.lat, lon: loc.lon, name: loc.name } : estimateLocation();
}

function weatherWanted(s = settings()) {
  return !!(s.sceneWeather && s.sceneLocation && locationAllowed());
}

function liveWeather(s = settings()) {
  if (!weatherWanted(s)) return null;
  const data = usableWeather(weatherData);
  if (!data) return null;
  return { ...describeWeather(data.code, data.cloud), wind: data.wind, temp: data.temp };
}

function sceneWeather(s = settings()) {
  if (preview.kind) return { kind: preview.kind, wind: preview.kind === 'storm' ? 45 : preview.kind === 'clear' ? 8 : 16 };
  return liveWeather(s);
}

function sceneDate() {
  if (preview.minutes == null) return new Date();
  const d = new Date();
  d.setHours(0, preview.minutes, 0, 0);
  return d;
}

function timeParts(date, s = settings(), seconds = s.clockSeconds) {
  const parts = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}), hour12: !s.clock24h }).formatToParts(date);
  const main = parts.filter((p) => p.type !== 'dayPeriod').map((p) => p.value).join('').trim();
  const period = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  return { main, period };
}

function shortTime(date, s = settings()) {
  return date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: !s.clock24h }) : '—';
}

const KIND_ICON = { clear: 'sun', partly: 'cloud-sun', cloudy: 'cloud', fog: 'cloud-fog', drizzle: 'cloud-drizzle', rain: 'cloud-rain', snow: 'cloud-snow', storm: 'cloud-lightning' };
function weatherIcon(kind, night = false, size = 16) {
  if (night && kind === 'clear') return icon('moon', size);
  if (night && kind === 'partly') return icon('cloud-moon', size);
  return icon(KIND_ICON[kind] ?? 'sun', size);
}

function moonName(phase) {
  const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  return names[Math.round(phase * 8) % 8];
}

/* ---------- build ---------- */

function buildSky() {
  const rand = seeded(7);
  const stars = svg('g', { class: 'lv-stars' });
  for (let i = 0; i < 190; i++) {
    const big = rand() < .07;
    const r = big ? 1.5 : rand() * .9 + .35;
    const star = svg('circle', { cx: (rand() * 1600).toFixed(0), cy: (rand() ** 1.4 * 640).toFixed(0), r: r.toFixed(2), opacity: (rand() * .6 + .3).toFixed(2) });
    if (i % 13 === 0) { star.classList.add('lv-twinkle'); star.style.animationDelay = `${(rand() * -6).toFixed(1)}s`; }
    stars.append(star);
  }
  const moonShadow = svg('circle', { r: '21', cx: '0', fill: '#000' });
  els.moonShadow = moonShadow;
  els.sun = svg('g', { class: 'lv-sun' },
    svg('circle', { r: '130', fill: 'url(#lv-disc)', opacity: '.55' }),
    svg('circle', { r: '24', class: 'lv-sun-core' }));
  els.moon = svg('g', { class: 'lv-moon' },
    svg('circle', { r: '62', class: 'lv-moon-halo' }),
    svg('circle', { r: '20', class: 'lv-moon-dark' }),
    svg('circle', { r: '20', class: 'lv-moon-lit', mask: 'url(#lv-moon-mask)' }));
  els.glow = svg('circle', { r: '620', fill: 'url(#lv-glow)', class: 'lv-glow' });
  return svg('svg', { class: 'lv-layer lv-sky', viewBox: '0 0 1600 1000', preserveAspectRatio: 'xMidYMid slice' },
    svg('defs', {},
      svg('linearGradient', { id: 'lv-sky', x1: '0', y1: '0', x2: '0', y2: '1' },
        stop('0', '--sc-top'), stop('.38', '--sc-mid'), stop('.62', '--sc-low'), stop('.76', '--sc-horizon')),
      svg('radialGradient', { id: 'lv-glow' }, stop('0', '--sc-glow', .9), stop('.3', '--sc-glow', .32), stop('1', '--sc-glow', 0)),
      svg('radialGradient', { id: 'lv-disc' }, stop('0', '--sc-glow', 1), stop('.25', '--sc-glow', .55), stop('1', '--sc-glow', 0)),
      svg('mask', { id: 'lv-moon-mask', maskUnits: 'userSpaceOnUse', x: '-40', y: '-40', width: '80', height: '80' },
        svg('circle', { r: '20', fill: '#fff' }), moonShadow)),
    svg('rect', { x: '-80', y: '-80', width: '1760', height: '1160', fill: 'url(#lv-sky)' }),
    stars, els.glow, els.moon, els.sun);
}

function buildClouds() {
  const wrap = h('div', { class: 'lv-layer lv-clouds' });
  els.clouds = CLOUDS.map(([top, width, offset], i) => {
    const cloud = h('div', { class: `lv-cloud lv-cloud-${i % 3}` });
    // The inline transform is where the cloud rests when motion is off.
    cloud.style.cssText = `top:${top}vh;width:${width}vw;animation-delay:calc(var(--lv-drift) * -${offset / 100});transform:translateX(${(offset * 1.8 - 65).toFixed(0)}vw)`;
    wrap.append(cloud);
    return cloud;
  });
  return wrap;
}

function buildLand() {
  const { lakeTop } = L;
  const ridge = (i, extra = {}) => svg('path', { d: L.ridges[i], class: `lv-ridge lv-ridge${i}`, ...extra });
  const caps = (i) => svg('path', { d: L.ridges[i], fill: 'url(#lv-snowcap)', class: `lv-snowcap lv-snowcap${i}` });
  const reflections = svg('g', { 'clip-path': 'url(#lv-water)' },
    svg('g', { filter: 'url(#lv-mist)', opacity: '.3' }, ...L.reflections.map((d, i) =>
      svg('path', { d, class: `lv-ridge${i}`, transform: `translate(0 ${2 * lakeTop}) scale(1 -1)` }))));
  els.glint = svg('g', { class: 'lv-glint' },
    svg('ellipse', { cx: '0', cy: String(lakeTop + 70), rx: '46', ry: '120', class: 'lv-glint-soft', filter: 'url(#lv-soft)' }),
    svg('g', { class: 'lv-glint-lines' }, ...[0, 1, 2, 3, 4, 5].map((i) =>
      svg('line', { x1: String(-120 + i * 17), x2: String(40 + i * 15), y1: String(lakeTop + 24 + i * 18), y2: String(lakeTop + 24 + i * 18) }))));
  const broadleaves = svg('g', { class: 'lv-broadleaves' }, ...L.broadleaves.map(({ trunk, branches, canopy }, t) => {
    const rand = seeded(100 + t);
    const blossom = svg('g', { class: 'lv-blossom' });
    for (const [cx, cy, r] of canopy) {
      for (let k = 0; k < 5; k++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * .85;
        blossom.append(svg('circle', { cx: (cx + Math.cos(a) * d).toFixed(0), cy: (cy + Math.sin(a) * d).toFixed(0), r: (1.6 + rand() * 1.8).toFixed(1) }));
      }
    }
    return svg('g', {},
      svg('path', { d: trunk, class: 'lv-trunk' }),
      svg('path', { d: branches, class: 'lv-branches' }),
      svg('g', { class: 'lv-canopy' },
        svg('g', { class: 'lv-canopy-shade' }, ...canopy.map(([cx, cy, r]) => svg('circle', { cx, cy, r }))),
        svg('g', { class: 'lv-canopy-lit' }, ...canopy.map(([cx, cy, r]) =>
          svg('circle', { cx: (cx - r * .16).toFixed(0), cy: (cy - r * .2).toFixed(0), r: (r * .74).toFixed(0) })))),
      blossom);
  }));
  return svg('svg', { class: 'lv-layer lv-land', viewBox: '0 0 1600 1000', preserveAspectRatio: 'xMidYMid slice' },
    svg('defs', {},
      svg('linearGradient', { id: 'lv-snowcap', gradientUnits: 'userSpaceOnUse', x1: '0', y1: '300', x2: '0', y2: '680' },
        stop('0', '--sc-snow', 1), stop('.4', '--sc-snow', .85), stop('.68', '--sc-snow', 0)),
      svg('linearGradient', { id: 'lv-lake', x1: '0', y1: '0', x2: '0', y2: '1' }, stop('0', '--sc-lake'), stop('.4', '--sc-lake', .88), stop('1', '--sc-deep')),
      svg('linearGradient', { id: 'lv-haze', x1: '0', y1: '0', x2: '0', y2: '1' }, stop('0', '--sc-glow', 0), stop('.7', '--sc-glow', .22), stop('1', '--sc-glow', 0)),
      svg('filter', { id: 'lv-mist', x: '-10%', y: '-50%', width: '120%', height: '200%' }, svg('feGaussianBlur', { stdDeviation: '3' })),
      svg('filter', { id: 'lv-soft', x: '-50%', y: '-200%', width: '200%', height: '500%' }, svg('feGaussianBlur', { stdDeviation: '28' })),
      svg('filter', { id: 'lv-near', x: '-10%', y: '-10%', width: '120%', height: '120%' }, svg('feGaussianBlur', { stdDeviation: '1.1' })),
      svg('clipPath', { id: 'lv-water' }, svg('rect', { y: String(lakeTop), width: '1600', height: String(1000 - lakeTop) }))),
    svg('g', { class: 'lv-far' }, ridge(0, { filter: 'url(#lv-mist)' }), caps(0), ridge(1, { filter: 'url(#lv-mist)' }), caps(1)),
    svg('g', { class: 'lv-mid' }, ridge(2), caps(2), ridge(3)),
    svg('rect', { y: String(lakeTop - 120), width: '1600', height: '170', fill: 'url(#lv-haze)', class: 'lv-haze' }),
    svg('g', { class: 'lv-lake' },
      svg('rect', { x: '-60', y: String(lakeTop), width: '1720', height: String(1060 - lakeTop), fill: 'url(#lv-lake)' }),
      reflections, els.glint,
      svg('rect', { x: '-60', y: String(lakeTop), width: '1720', height: String(1060 - lakeTop), class: 'lv-ice' })),
    svg('g', { class: 'lv-near', filter: 'url(#lv-near)' },
      svg('path', { d: L.shore, class: 'lv-shore' }),
      broadleaves,
      ...L.banks.map((d) => svg('path', { d, class: 'lv-shore lv-bank' })),
      svg('g', { class: 'lv-pines' }, ...L.pines.map(({ d }) => svg('path', { d }))),
      svg('g', { class: 'lv-pine-snow' }, ...L.pines.map(({ snow }) => svg('path', { d: snow })))));
}

function build() {
  const atmosphere = q('.atmosphere');
  if (!atmosphere) return false;
  root = h('div', { class: 'scene-live' });
  els.clockTime = h('span', { class: 'lv-clock-time' });
  els.clockPeriod = h('span', { class: 'lv-clock-period' });
  els.clockMeta = h('div', { class: 'lv-clock-meta' });
  els.mirror = h('div', { class: 'lv-clock-mirror' });
  els.clock = h('div', { class: 'lv-clock' },
    h('div', { class: 'lv-clock-stack' }, els.clockMeta, h('div', { class: 'lv-clock-face' }, els.clockTime, els.clockPeriod)),
    els.mirror);
  els.canvas = h('canvas', { class: 'lv-layer lv-particles' });
  root.append(
    buildSky(), buildClouds(), buildLand(),
    h('div', { class: 'lv-layer lv-fog' }, h('div', { class: 'lv-fog-band' }), h('div', { class: 'lv-fog-band lv-fog-band-2' })),
    els.clock, els.canvas);
  atmosphere.append(root);
  particles = new Particles(els.canvas);
  // Panels opening or closing move the workspace; keep the clock centred on it.
  const main = q('#main-content');
  if (main && globalThis.ResizeObserver) new ResizeObserver(() => { if (active) layout(); }).observe(main);
  return true;
}

/* ---------- apply ---------- */

function layout() {
  const vw = innerWidth, vh = innerHeight;
  const scale = Math.max(vw / 1600, vh / 1000);
  const offset = (vh - 1000 * scale) / 2;
  const lakeY = offset + L.lakeTop * scale;
  lakeBottom = offset + 860 * scale; // where the near shore starts to cover the water
  const main = q('#main-content')?.getBoundingClientRect();
  const cx = main && main.width > 0 ? main.left + main.width / 2 : vw / 2;
  root.style.setProperty('--lv-lake-y', `${lakeY.toFixed(1)}px`);
  root.style.setProperty('--lv-clock-x', `${cx.toFixed(1)}px`);
  return lakeY;
}

/** Weather belongs to one place. When the place or the opt-in changes —
 *  here or in another TabFlow tab — drop the old data and fetch again. */
function syncWeatherSource(s) {
  const loc = s.sceneLocation;
  const key = weatherWanted(s) ? `${loc.lat},${loc.lon}` : '';
  if (key === weatherKey) return;
  weatherKey = key;
  weatherData = key ? readCache(loc) : null;
  weatherError = '';
  if (key) ensureWeather();
  else clearTimeout(weatherTimer);
}

function render(force = false) {
  if (!active) return;
  const s = settings();
  syncWeatherSource(s);
  const date = sceneDate();
  const place = placeOf(s);
  const wx = sceneWeather(s);
  const minute = Math.floor(date.getTime() / 60_000);
  const key = [minute, place.lat, place.lon, wx?.kind, wx?.cloud, wx?.intensity, wx?.wind, preview.season, motionLevel(), innerWidth, innerHeight].join('|');
  renderClock(date, s);
  if (!force && key === lastKey) return;
  lastKey = key;
  lastMinute = minute;
  state = sceneState(date, place, wx, { season: preview.season });
  applyState(state, s);
  renderChip(s);
  if (card) renderCard();
}

function applyState(st, s) {
  const style = root.style;
  for (const [name, value] of Object.entries(st.colors)) style.setProperty(name, value);
  const { sun, moon, foliage, particles: fx } = st;
  const frozen = st.season === 'winter' && foliage.snow > .8 ? 1 : 0;
  const cloudCount = st.kind === 'clear' ? Math.round(st.cloud * 6) : Math.max(2, Math.round(st.cloud * CLOUDS.length));
  const motion = motionLevel();
  root.dataset.motion = motion;
  root.dataset.season = st.season;
  root.dataset.weather = st.kind;
  root.dataset.frozen = String(frozen);
  root.dataset.bright = st.light > .6 && st.grey < .5 ? '1' : '0';
  style.setProperty('--lv-stars', st.stars.toFixed(3));
  style.setProperty('--lv-light', st.light.toFixed(3));
  style.setProperty('--lv-canopy', foliage.canopy.toFixed(3));
  style.setProperty('--lv-blossom', foliage.blossom.toFixed(3));
  style.setProperty('--lv-snowcap', Math.max(.12, foliage.snow * .95).toFixed(3));
  style.setProperty('--lv-pine-snow', Math.max(0, (foliage.snow - .25) / .75).toFixed(3));
  style.setProperty('--lv-ice', (frozen * .55).toFixed(3));
  style.setProperty('--lv-fog', fx.fog.toFixed(3));
  style.setProperty('--lv-cloud-alpha', (.35 + st.cloud * .6).toFixed(3));
  style.setProperty('--lv-drift', `${Math.round(300 - st.wind * 220)}s`);
  els.clouds.forEach((cloud, i) => { cloud.hidden = i >= cloudCount; });

  els.sun.setAttribute('transform', `translate(${sun.x.toFixed(1)} ${sun.y.toFixed(1)})`);
  els.sun.style.opacity = sun.alpha.toFixed(3);
  const r = 20, p = moon.phase;
  const dx = p < .5 ? -4 * r * p : 4 * r * (1 - p);
  els.moonShadow.setAttribute('cx', dx.toFixed(2));
  els.moon.setAttribute('transform', `translate(${moon.x.toFixed(1)} ${moon.y.toFixed(1)})${st.place.lat < 0 ? ' scale(-1 1)' : ''}`);
  els.moon.style.opacity = moon.alpha.toFixed(3);
  const sunLed = sun.elevation > -10;
  const gx = sunLed ? sun.x : moon.x, gy = sunLed ? Math.min(sun.y, 730) : moon.y;
  els.glow.setAttribute('cx', gx.toFixed(1));
  els.glow.setAttribute('cy', gy.toFixed(1));
  els.glow.setAttribute('r', sunLed ? '620' : '260');
  els.glow.style.opacity = (sunLed ? st.glowAlpha : moon.alpha * .5).toFixed(3);
  // Only a body clear of the mountains (y < ~640) lights a path on the water.
  const clear = (y) => Math.min(1, Math.max(0, (660 - y) / 90));
  const glintX = sun.alpha > .05 ? sun.x : moon.x;
  const glint = sun.alpha > .05 ? sun.alpha * (sun.elevation < 30 ? .6 : .3) * clear(sun.y) : moon.alpha * .45 * clear(moon.y);
  els.glint.setAttribute('transform', `translate(${glintX.toFixed(1)} 0)`);
  els.glint.style.opacity = (glint * (1 - frozen * .6) * (1 - st.grey * .8)).toFixed(3);

  const lakeY = layout();
  particles.configure({ ...fx, stars: st.stars, wind: st.wind, light: st.light, lakeY: frozen ? 0 : lakeY, lakeBottom, motion });
}

function renderClock(date = sceneDate(), s = settings()) {
  if (!root) return;
  els.clock.hidden = !s.sceneClock;
  if (!s.sceneClock) return;
  const { main, period } = timeParts(date, s);
  if (els.clockTime.textContent !== main) {
    els.clockTime.textContent = main;
    els.clockPeriod.textContent = period;
    els.mirror.textContent = `${main}${period ? ` ${period}` : ''}`;
  }
  const day = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const wx = liveWeather(s);
  const meta = wx && !preview.kind
    ? `${day} · ${formatTemp(wx.temp, preferredUnit(s.tempUnit))} ${wx.label}`
    : preview.kind ? `${day} · ${WEATHER_KINDS[preview.kind].label} (preview)` : day;
  if (els.clockMeta.textContent !== meta) els.clockMeta.textContent = meta;
  root.classList.toggle('is-preview', preview.minutes != null || !!preview.season || !!preview.kind);
}

/* ---------- toolbar chip ---------- */

function renderChip(s = settings()) {
  const chip = q('#scene-chip');
  if (!chip) return;
  chip.hidden = !active;
  if (!active || !state) return;
  const night = state.sun.elevation < -2;
  const wx = liveWeather(s);
  const unit = preferredUnit(s.tempUnit);
  const label = h('span', { class: 'scene-chip-label' });
  let text;
  if (preview.minutes != null || preview.season || preview.kind) text = 'Previewing scene';
  else if (wx) text = `${formatTemp(wx.temp, unit)} · ${wx.label}`;
  else {
    const place = placeOf(s);
    const times = sunTimes(new Date(), place.lat, place.lon);
    const now = new Date();
    const tomorrow = sunTimes(new Date(now.getTime() + 86_400_000), place.lat, place.lon);
    const next = times.sunrise && now < times.sunrise ? ['Sunrise', times.sunrise]
      : times.sunset && now < times.sunset ? ['Sunset', times.sunset]
        : tomorrow.sunrise ? ['Sunrise', tomorrow.sunrise] : null;
    text = next ? `${next[0]} ${shortTime(next[1], s)}` : `${state.season[0].toUpperCase()}${state.season.slice(1)}`;
  }
  label.textContent = text;
  chip.replaceChildren(weatherIcon(state.kind, night, 15), label);
  chip.setAttribute('aria-label', `${text}. Open scene and weather details`);
}

/* ---------- details card ---------- */

function openCard(anchor) {
  if (card) { closeCard(); return; }
  cardReturn = anchor ?? document.activeElement;
  card = h('div', { class: 'scene-card', role: 'dialog', 'aria-modal': 'false', 'aria-label': 'Scene and weather' });
  document.body.append(card);
  renderCard();
  positionCard(anchor);
  q('#scene-chip')?.setAttribute('aria-expanded', 'true');
  card.querySelector('button, input')?.focus({ preventScroll: true });
  setTimeout(() => document.addEventListener('pointerdown', outsideClose, true));
  document.addEventListener('keydown', escClose, true);
}

function closeCard() {
  if (!card) return;
  card.remove();
  card = null;
  q('#scene-chip')?.setAttribute('aria-expanded', 'false');
  document.removeEventListener('pointerdown', outsideClose, true);
  document.removeEventListener('keydown', escClose, true);
  if (cardReturn?.isConnected) cardReturn.focus({ preventScroll: true });
  cardReturn = null;
}

function outsideClose(event) {
  if (card && !card.contains(event.target) && !event.target.closest?.('#scene-chip')) closeCard();
}
function escClose(event) {
  if (event.key === 'Escape' && card) { event.stopPropagation(); closeCard(); }
}

function positionCard(anchor) {
  if (!card) return;
  const rect = (anchor?.isConnected ? anchor : els.clock).getBoundingClientRect();
  const w = card.offsetWidth, hgt = card.offsetHeight;
  const left = Math.min(innerWidth - w - 12, Math.max(12, anchor ? rect.left : rect.left + rect.width / 2 - w / 2));
  const top = anchor ? rect.bottom + 10 : Math.max(12, rect.top - hgt - 12);
  card.style.left = `${left}px`;
  card.style.top = `${Math.min(innerHeight - hgt - 12, Math.max(12, top))}px`;
}

function pillGroup(label, options, current, onPick) {
  return h('div', { class: 'scene-card-group', role: 'group', 'aria-label': label },
    h('span', { class: 'scene-card-label', text: label }),
    h('div', { class: 'scene-card-pills' }, ...options.map(([value, text]) =>
      h('button', { type: 'button', class: `scene-pill${current === value ? ' active' : ''}`, 'aria-pressed': String(current === value), text, onclick: () => onPick(value) }))));
}

function renderCard() {
  if (!card || !state) return;
  const s = settings();
  const unit = preferredUnit(s.tempUnit);
  const place = placeOf(s);
  const times = sunTimes(new Date(), place.lat, place.lon);
  const data = weatherWanted(s) ? usableWeather(weatherData) : null;
  const wx = liveWeather(s);
  const night = state.sun.elevation < -2;
  const focusedKey = document.activeElement && card.contains(document.activeElement) ? document.activeElement.dataset.key : null;

  const head = h('div', { class: 'scene-card-head' },
    h('div', {},
      h('div', { class: 'scene-card-place' }, icon('map-pin', 13), h('span', { text: s.sceneLocation?.name || 'Your time zone' })),
      h('div', { class: 'scene-card-sub', text: s.sceneLocation ? `${state.season[0].toUpperCase()}${state.season.slice(1)}` : 'Sun position estimated from your time zone' })),
    h('button', { type: 'button', class: 'icon-btn scene-card-close', 'aria-label': 'Close', dataset: { key: 'close' }, onclick: closeCard }, icon('x', 14)));

  let now;
  if (wx) {
    now = h('div', { class: 'scene-card-now' },
      h('div', { class: 'scene-card-icon' }, weatherIcon(wx.kind, night, 30)),
      h('div', {},
        h('div', { class: 'scene-card-temp', text: formatTemp(wx.temp, unit) }),
        h('div', { class: 'scene-card-cond', text: wx.label })),
      h('div', { class: 'scene-card-facts' },
        h('span', { text: `Feels ${formatTemp(data.feels, unit)}` }),
        h('span', {}, icon('wind', 12), ` ${Math.round(unit === 'f' ? data.wind * .621 : data.wind)} ${unit === 'f' ? 'mph' : 'km/h'}`)));
  } else {
    const why = !s.sceneWeather ? 'Live weather is off.'
      : !s.sceneLocation ? 'Choose a city to see its weather.'
        : !locationAllowed() ? 'Firefox needs your permission to share your location.'
          : weatherError || 'Loading weather…';
    now = h('div', { class: 'scene-card-now scene-card-empty' },
      h('div', { class: 'scene-card-icon' }, weatherIcon(state.kind, night, 26)),
      h('div', { class: 'scene-card-cond', text: why }),
      h('button', { type: 'button', class: 'scene-pill', dataset: { key: 'settings' }, text: 'Weather settings', onclick: openSettings }));
  }

  const sky = h('div', { class: 'scene-card-sky' },
    h('span', {}, icon('sunrise', 13), ` ${shortTime(times.sunrise, s)}`),
    h('span', {}, icon('sunset', 13), ` ${shortTime(times.sunset, s)}`),
    h('span', {}, icon('moon', 13), ` ${moonName(state.moon.phase)}`));

  const days = data?.days?.length
    ? h('div', { class: 'scene-card-days' }, ...data.days.slice(0, 5).map((day, i) => {
      const d = new Date(`${day.date}T12:00:00`);
      const info = describeWeather(day.code);
      return h('div', { class: 'scene-day', title: info.label },
        h('span', { class: 'scene-day-name', text: i === 0 ? 'Today' : d.toLocaleDateString([], { weekday: 'short' }) }),
        weatherIcon(info.kind, false, 18),
        h('span', { class: 'scene-day-temp' }, h('strong', { text: formatTemp(day.max, unit) }), ` ${formatTemp(day.min, unit)}`));
    }))
    : null;

  const minutes = preview.minutes ?? (new Date().getHours() * 60 + new Date().getMinutes());
  const slider = h('input', { type: 'range', min: '0', max: '1439', step: '5', value: String(minutes), class: 'scene-slider', 'aria-label': 'Preview time of day', dataset: { key: 'time' } });
  const sliderValue = h('span', { class: 'scene-card-value', text: shortTime(sceneDate(), s) });
  slider.oninput = () => {
    preview.minutes = Number(slider.value);
    sliderValue.textContent = shortTime(sceneDate(), s);
    render(true);
  };
  const isPreview = preview.minutes != null || preview.season || preview.kind;
  const previewBox = h('div', { class: 'scene-card-preview' },
    h('div', { class: 'scene-card-row' },
      h('span', { class: 'scene-card-title', text: 'Time travel' }),
      h('button', { type: 'button', class: 'scene-link', dataset: { key: 'live' }, disabled: !isPreview, text: 'Back to live', onclick: () => { preview.minutes = null; preview.season = null; preview.kind = null; render(true); } })),
    h('div', { class: 'scene-card-row' }, slider, sliderValue),
    pillGroup('Season', [[null, 'Live'], ...SEASONS.map((x) => [x, x[0].toUpperCase() + x.slice(1)])], preview.season, (v) => { preview.season = v; render(true); }),
    pillGroup('Weather', [[null, 'Live'], ['clear', 'Clear'], ['cloudy', 'Cloudy'], ['rain', 'Rain'], ['snow', 'Snow'], ['storm', 'Storm'], ['fog', 'Fog']], preview.kind, (v) => { preview.kind = v; render(true); }));
  for (const [i, b] of [...previewBox.querySelectorAll('.scene-card-group button')].entries()) b.dataset.key = `pill-${i}`;

  // Keep the slider element alive while dragging so the drag isn't interrupted.
  if (focusedKey === 'time' && card.querySelector('.scene-slider')) {
    card.querySelector('.scene-card-value').textContent = shortTime(sceneDate(), s);
    const live = card.querySelector('[data-key="live"]');
    if (live) live.disabled = !isPreview;
    return;
  }
  card.replaceChildren(head, now, sky, ...(days ? [days] : []), previewBox);
  if (focusedKey) card.querySelector(`[data-key="${focusedKey}"]`)?.focus({ preventScroll: true });
}

function openSettings() {
  closeCard();
  q('.nav-item[data-view="settings"]')?.click();
  q('.stab[data-stab="glass"]')?.click();
  q('#scene-section')?.scrollIntoView({ block: 'start' });
}

/* ---------- weather ---------- */

async function ensureWeather(force = false) {
  const s = settings();
  clearTimeout(weatherTimer);
  if (!active || !weatherWanted(s)) return;
  const place = s.sceneLocation;
  // Another tab may have refreshed the shared cache since this one last looked.
  const cached = readCache(place);
  if (cached && (!weatherData || cached.fetchedAt > weatherData.fetchedAt)) weatherData = cached;
  if (!force && weatherData && Date.now() - weatherData.fetchedAt < REFRESH_MS) {
    schedule(REFRESH_MS - (Date.now() - weatherData.fetchedAt));
    return;
  }
  if (document.hidden) return;
  if (!fetching) {
    fetching = fetchWeather(place)
      .then((data) => { weatherData = data; weatherError = ''; })
      .catch(() => { weatherError = 'Weather is unavailable right now.'; })
      .finally(() => { fetching = null; });
  }
  await fetching;
  render(true);
  schedule(weatherError ? 5 * 60_000 : REFRESH_MS);
}

function schedule(ms) {
  clearTimeout(weatherTimer);
  weatherTimer = setTimeout(() => ensureWeather(), Math.max(60_000, ms));
}

/** Preview a time of day (minutes after midnight), season and/or weather kind.
 *  Pass nulls (or nothing) to return to live. Used by the details card and tests. */
export function setScenePreview({ minutes = null, season = null, kind = null } = {}) {
  preview.minutes = Number.isFinite(minutes) ? Math.max(0, Math.min(1439, Math.round(minutes))) : null;
  preview.season = SEASONS.includes(season) ? season : null;
  preview.kind = WEATHER_KINDS[kind] ? kind : null;
  render(true);
}

/** Settings changed the place or turned weather on: forget the old data. */
export function refreshSceneWeather() {
  weatherKey = '';
  lastKey = '';
  if (active) render(true);
}

/* ---------- lifecycle ---------- */

function start() {
  if (!root && !build()) return;
  active = true;
  root.hidden = false;
  particles.resize();
  weatherKey = '';
  render(true);
}

function stopScene() {
  active = false;
  clearInterval(tickTimer); tickTimer = 0;
  clearTimeout(weatherTimer);
  closeCard();
  if (root) { root.hidden = true; particles.destroy(); }
  renderChip();
  lastKey = '';
  weatherKey = '';
}

/** Called after every appearance pass. Starts, updates or stops the scene. */
export function syncLiveScene() {
  if (!liveSceneOn()) { if (active || root) stopScene(); return; }
  if (!active) start(); else render(true);
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (document.hidden) return;
    const minute = Math.floor(sceneDate().getTime() / 60_000);
    if (minute !== lastMinute) render(); else renderClock();
  }, settings().clockSeconds ? 1000 : 5000);
}

function onPointer(event) {
  if (!active || motionLevel() !== 'full' || event.pointerType === 'touch') return;
  const { clientX, clientY } = event;
  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = 0;
    root.style.setProperty('--lv-px', ((clientX / innerWidth) * 2 - 1).toFixed(3));
    root.style.setProperty('--lv-py', ((clientY / innerHeight) * 2 - 1).toFixed(3));
  });
}

/* The clock sits behind the workspace layers. A click on empty workspace
   that lands on the clock opens the details card, as if it were on top. */
const SCENE_SURFACE = '#app, #main-content, .view-panel, #collections-area, #collections-area > :not(.collection)';
function overClock(event) {
  if (!active || !settings().sceneClock || els.clock.hidden || document.body.dataset.view !== 'collections') return false;
  if (!event.target.matches?.(SCENE_SURFACE)) return false;
  const r = els.clock.querySelector('.lv-clock-stack').getBoundingClientRect();
  return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
}

export function initLiveScene() {
  document.addEventListener('pointermove', (event) => {
    onPointer(event);
    if (active) document.body.classList.toggle('scene-clock-hover', overClock(event));
  }, { passive: true });
  document.addEventListener('click', (event) => { if (overClock(event)) openCard(null); });
  document.addEventListener('visibilitychange', () => {
    if (!active) return;
    if (document.hidden) particles.stop();
    else { render(true); ensureWeather(); }
  });
  addEventListener('resize', () => {
    if (!active) return;
    particles.resize();
    render(true);
    if (card) positionCard(q('#scene-chip'));
  });
  q('#scene-chip')?.addEventListener('click', (event) => openCard(event.currentTarget));
}
