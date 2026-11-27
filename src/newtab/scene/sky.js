/* ================================================================
   TabFlow — Live scene: sky model
   Pure functions (no DOM, no network) that turn a moment, a place and
   the weather into everything the Live scene draws: where the sun and
   moon sit, the colour of every layer, the season's foliage and which
   particles fall. Kept pure so tests can pin any date/place/weather.
   ================================================================ */

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- astronomy ---------- */

/** Sun elevation/azimuth in degrees (azimuth clockwise from north). ~0.5° accuracy. */
export function solarPosition(date, lat, lon) {
  const n = date.getTime() / DAY_MS + 2440587.5 - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24;
  const ha = (gmst * 15 + lon) * RAD - ra;
  const phi = lat * RAD;
  const elevation = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha)) / RAD;
  const azimuth = (Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(ha)) / RAD + 360) % 360;
  return { elevation, azimuth };
}

/**
 * Sunrise, solar noon and sunset for the local calendar day containing
 * `date`. Found numerically, so polar days/nights simply return null.
 */
export function sunTimes(date, lat, lon) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  const alt = (t) => solarPosition(new Date(t), lat, lon).elevation + 0.833;
  const refine = (a, b) => {
    for (let i = 0; i < 24; i++) { const m = (a + b) / 2; (alt(a) <= 0) === (alt(m) <= 0) ? a = m : b = m; }
    return new Date(Math.round((a + b) / 2));
  };
  let sunrise = null, sunset = null, noon = null, best = -Infinity;
  const step = 10 * 60_000;
  for (let t = t0; t < t0 + DAY_MS; t += step) {
    const a = alt(t), b = alt(t + step);
    if (a <= 0 && b > 0 && !sunrise) sunrise = refine(t, t + step);
    if (a > 0 && b <= 0 && !sunset) sunset = refine(t, t + step);
    if (a > best) { best = a; noon = new Date(t); }
  }
  return { sunrise, sunset, noon };
}

/** Moon phase: 0 = new, .5 = full. Illumination is the lit fraction 0–1. */
export function moonPhase(date) {
  const days = date.getTime() / DAY_MS + 2440587.5 - 2451550.1;
  const phase = ((days / 29.530588853) % 1 + 1) % 1;
  return { phase, illumination: (1 - Math.cos(2 * Math.PI * phase)) / 2 };
}

/* ---------- place ---------- */

const SOUTHERN_ZONES = ['Australia/', 'Antarctica/', 'Pacific/Auckland', 'Pacific/Chatham', 'Pacific/Fiji', 'Pacific/Tongatapu',
  'Pacific/Apia', 'Pacific/Noumea', 'Pacific/Efate', 'America/Argentina', 'America/Buenos_Aires', 'America/Sao_Paulo',
  'America/Santiago', 'America/Punta_Arenas', 'America/Montevideo', 'America/Asuncion', 'America/La_Paz', 'America/Lima',
  'Africa/Johannesburg', 'Africa/Maputo', 'Africa/Harare', 'Africa/Windhoek', 'Africa/Gaborone', 'Africa/Lusaka',
  'Africa/Maseru', 'Africa/Mbabane', 'Indian/Antananarivo', 'Indian/Mauritius', 'Indian/Reunion', 'Atlantic/Stanley'];

/**
 * Without a chosen city, place the viewer by time zone alone: the
 * standard UTC offset gives a longitude whose solar noon matches the
 * clock, and the zone name picks the hemisphere. Nothing leaves the device.
 */
export function estimateLocation(date = new Date(), timeZone = safeTimeZone()) {
  const y = date.getFullYear();
  const standard = Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
  const south = SOUTHERN_ZONES.some((zone) => timeZone.startsWith(zone));
  return { lat: south ? -34 : 42, lon: clamp(-standard / 4, -180, 180), estimated: true };
}

function safeTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; }
}

/* ---------- colour ---------- */

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex([r, g, b]) {
  return `#${[r, g, b].map((c) => Math.round(clamp(c, 0, 255)).toString(16).padStart(2, '0')).join('')}`;
}
export function mix(a, b, t) {
  const x = hexRgb(a), y = hexRgb(b);
  return rgbHex(x.map((c, i) => lerp(c, y[i], clamp(t))));
}
function luminance(hex) {
  const [r, g, b] = hexRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
/** Desaturate toward a cool grey of the same brightness (overcast skies). */
function overcast(hex, amount, darken = 0) {
  const l = luminance(hex) * (1 - darken);
  const grey = rgbHex([l * 236, l * 242, l * 252]);
  return mix(hex, grey, amount);
}

/* Sky keyframes by sun elevation (degrees). Evening and morning differ:
   dusk burns orange, dawn stays pink and pale. */
const KEYS = ['top', 'mid', 'low', 'horizon', 'glow', 'cloud', 'ridge', 'shore', 'lake', 'deep'];
const EVENING = [
  [-18, ['#04060f', '#0b1230', '#1b2550', '#2b3a6a', '#9fb6ff', '#36406a', '#141a36', '#04050b', '#1e2a52', '#05070f'], .12, 1, .35],
  [-9, ['#0e1534', '#252b5a', '#4c4677', '#7c5f86', '#d59aa6', '#5c5478', '#251f3c', '#0b0912', '#45406a', '#0d0b16'], .22, .55, .35],
  [-2, ['#1b2440', '#46496e', '#a97a7f', '#f3b07e', '#ffc98f', '#f0b09a', '#3e3450', '#15111a', '#c78c79', '#2a2430'], .45, .08, .8],
  [4, ['#2f4c84', '#6f82b4', '#d6a88e', '#ffcf94', '#ffd59a', '#ffd8b8', '#4f4868', '#1c1a24', '#d9a282', '#3a3a4a'], .68, 0, .85],
  [14, ['#3c6fb6', '#78a2d8', '#bcd2ea', '#e6eef2', '#fff2d2', '#f7f4ee', '#5d6a8c', '#1f2a24', '#9db8d0', '#3c4a5c'], .9, 0, .5],
  [40, ['#336bbd', '#6c9fdd', '#acc9ec', '#d8e8f5', '#ffffff', '#ffffff', '#62749a', '#22302a', '#8eb0d4', '#38506a'], 1, 0, .35],
];
const MORNING = [
  EVENING[0],
  [-9, ['#121a3c', '#2c3564', '#5f5f8c', '#9a86a8', '#e8b7c0', '#6f6a90', '#2a2a48', '#0c0c16', '#55547c', '#0f0f1c'], .24, .5, .35],
  [-2, ['#4a5b92', '#8f96c4', '#e0bfc8', '#fbd8bf', '#fff1d8', '#ffffff', '#6c6a92', '#25243a', '#e6cbc8', '#4a4a68'], .55, .06, .9],
  [4, ['#7d9bd0', '#b7c6e4', '#f0d8d4', '#fde6c9', '#fff1d8', '#ffffff', '#7a7ca2', '#2a2c40', '#e9d6cf', '#585a7a'], .76, 0, .85],
  EVENING[4], EVENING[5],
];

function skyAt(elevation, rising) {
  const frames = rising ? MORNING : EVENING;
  const e = clamp(elevation, frames[0][0], frames.at(-1)[0]);
  let i = 1;
  while (i < frames.length - 1 && frames[i][0] < e) i++;
  const [e0, c0, l0, s0, g0] = frames[i - 1], [e1, c1, l1, s1, g1] = frames[i];
  const t = e1 === e0 ? 0 : (e - e0) / (e1 - e0);
  const out = Object.fromEntries(KEYS.map((k, j) => [k, mix(c0[j], c1[j], t)]));
  return { ...out, light: lerp(l0, l1, t), stars: lerp(s0, s1, t), glowAlpha: lerp(g0, g1, t) };
}

/* ---------- seasons ---------- */

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

/** Day of year (0-based) in local time. */
export function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date - start) / DAY_MS + (start.getTimezoneOffset() - date.getTimezoneOffset()) / 1440);
}

/** Meteorological season, flipped for the southern hemisphere. */
export function seasonOf(date, lat = 42) {
  const month = (date.getMonth() + (lat < 0 ? 6 : 0)) % 12;
  return month < 2 || month === 11 ? 'winter' : month < 5 ? 'spring' : month < 8 ? 'summer' : 'autumn';
}

/* Northern-hemisphere foliage through the year: [dayOfYear, leaf colour,
   canopy (0 bare – 1 full), blossom, ground snow, falling leaves]. */
const FOLIAGE = [
  [0, '#4a5a3a', 0, 0, .9, 0],
  [59, '#4a5a3a', 0, 0, .55, 0],
  [80, '#9cc56a', .3, .25, .1, 0],
  [105, '#a8d27a', .78, 1, 0, 0],
  [135, '#6faa4f', 1, .15, 0, 0],
  [172, '#3f7f3a', 1, 0, 0, 0],
  [232, '#4c7f35', 1, 0, 0, 0],
  [262, '#8a9a3a', 1, 0, 0, .2],
  [286, '#df8a2a', 1, 0, 0, .8],
  [304, '#c8572a', .82, 0, 0, 1],
  [322, '#94573a', .4, 0, .05, .7],
  [338, '#6e5a44', .06, 0, .4, .15],
  [366, '#4a5a3a', 0, 0, .9, 0],
];
// A representative day for each season, used when previewing a season.
const SEASON_SEASONAL_DAY = { spring: 110, summer: 190, autumn: 295, winter: 10 };

export function foliageAt(date, lat = 42, season = null) {
  let doy;
  if (season) doy = SEASON_SEASONAL_DAY[season];
  else if (Math.abs(lat) < 23.5) doy = 190; // tropics: evergreen, no snow
  else doy = (dayOfYear(date) + (lat < 0 ? 183 : 0)) % 366;
  let i = 1;
  while (i < FOLIAGE.length - 1 && FOLIAGE[i][0] < doy) i++;
  const [d0, c0, n0, b0, s0, f0] = FOLIAGE[i - 1], [d1, c1, n1, b1, s1, f1] = FOLIAGE[i];
  const t = clamp((doy - d0) / (d1 - d0));
  return { leaf: mix(c0, c1, t), canopy: lerp(n0, n1, t), blossom: lerp(b0, b1, t), snow: lerp(s0, s1, t), falling: lerp(f0, f1, t) };
}

/* ---------- weather ---------- */

/** Defaults for each weather kind; live data refines cloud/intensity. */
export const WEATHER_KINDS = {
  clear: { cloud: .05, intensity: 0, label: 'Clear' },
  partly: { cloud: .45, intensity: 0, label: 'Partly cloudy' },
  cloudy: { cloud: .95, intensity: 0, label: 'Cloudy' },
  fog: { cloud: .8, intensity: .8, label: 'Fog' },
  drizzle: { cloud: .9, intensity: .35, label: 'Drizzle' },
  rain: { cloud: .95, intensity: .75, label: 'Rain' },
  snow: { cloud: .95, intensity: .7, label: 'Snow' },
  storm: { cloud: 1, intensity: 1, label: 'Thunderstorm' },
};

/* ---------- the whole scene ---------- */

/**
 * Everything the renderer needs for one moment.
 * @param {Date} date
 * @param {{lat:number, lon:number}} place
 * @param {{kind:string, cloud?:number, intensity?:number, wind?:number}|null} weather
 * @param {{season?:string}} [overrides] preview a season instead of the date's own
 */
export function sceneState(date, place, weather = null, overrides = {}) {
  const { lat, lon } = place;
  const sun = solarPosition(date, lat, lon);
  const south = lat < 0;
  // Rising before solar noon: compare with the position ten minutes on.
  const rising = solarPosition(new Date(date.getTime() + 600_000), lat, lon).elevation > sun.elevation;
  const sky = skyAt(sun.elevation, rising);

  const kind = WEATHER_KINDS[weather?.kind] ? weather.kind : 'clear';
  const base = WEATHER_KINDS[kind];
  const cloud = clamp(weather?.cloud ?? base.cloud);
  const intensity = clamp(weather?.intensity ?? base.intensity);
  const wind = clamp((weather?.wind ?? (kind === 'storm' ? 45 : 10)) / 60);
  const wet = ['drizzle', 'rain', 'snow', 'storm'].includes(kind);
  const grey = clamp(wet ? .7 + intensity * .2 : kind === 'fog' ? .75 : (cloud - .35) * 1.1);
  const darken = kind === 'storm' ? .38 : wet ? .16 + intensity * .1 : kind === 'cloudy' ? .08 : 0;
  const tint = (hex, k = 1) => overcast(hex, grey * k, darken * k);

  const season = SEASONS.includes(overrides.season) ? overrides.season : seasonOf(date, lat);
  const foliage = foliageAt(date, lat, SEASONS.includes(overrides.season) ? season : null);
  const freshSnow = kind === 'snow' ? .5 + intensity * .5 : 0;
  const snow = clamp(Math.max(foliage.snow, freshSnow));
  // Light reaching the ground: sun height, then clouds dim it.
  const light = clamp(sky.light * (1 - grey * .35 - darken * .6));
  const shade = (hex, floor = .1) => mix(sky.shore, hex, clamp(floor + light * (1 - floor)));
  const snowColour = mix('#c7d2ea', '#ffffff', light);

  const colors = {
    '--sc-top': tint(sky.top), '--sc-mid': tint(sky.mid), '--sc-low': tint(sky.low), '--sc-horizon': tint(sky.horizon),
    '--sc-glow': sky.glow, '--sc-cloud': tint(sky.cloud, .6),
    '--sc-ridge0': mix(tint(sky.ridge), tint(sky.horizon), .55),
    '--sc-ridge1': mix(tint(sky.ridge), tint(sky.horizon), .36),
    '--sc-ridge2': mix(tint(sky.ridge), tint(sky.horizon), .16),
    '--sc-ridge3': mix(tint(sky.ridge), tint(sky.shore), .3),
    '--sc-lake': mix(tint(sky.lake), snowColour, snow > .8 && season === 'winter' ? .45 : 0),
    '--sc-deep': tint(sky.deep),
    '--sc-shore': mix(sky.shore, mix(sky.shore, snowColour, .75), snow),
    '--sc-pine': mix(sky.shore, '#1f3a2c', light * .55),
    '--sc-trunk': mix(sky.shore, '#4a3426', light * .7),
    '--sc-leaf': mix(shade(foliage.leaf, .06), tint(sky.horizon), .12),
    '--sc-leaf-shade': mix(shade(foliage.leaf, .04), sky.shore, .42),
    '--sc-blossom': shade('#f6b8cf', .08),
    '--sc-snow': snowColour,
    '--sc-ink': light > .6 && grey < .5 ? '#1f2433' : '#ffffff',
  };

  const sunPos = skyPosition(sun.elevation, sun.azimuth, south);
  const moon = moonPhase(date);
  const nightT = nightProgress(date, lat, lon);
  return {
    date, place, season, rising, light, grey, wind, kind, cloud, intensity, foliage: { ...foliage, snow },
    sun: { ...sun, ...sunPos, alpha: clamp((sun.elevation + 4) / 6) * (1 - grey * .9) ** 2 },
    moon: {
      ...moon,
      x: 1600 * (south ? .86 - nightT * .72 : .14 + nightT * .72),
      y: 700 - Math.sin(Math.PI * nightT) * 470,
      alpha: clamp((-sun.elevation - 1) / 6) * clamp(moon.illumination * 4) * (1 - grey * .95),
    },
    glowAlpha: sky.glowAlpha * (1 - grey * .85),
    stars: sky.stars * (1 - clamp(cloud * 1.2)),
    colors,
    particles: {
      rain: ['drizzle', 'rain', 'storm'].includes(kind) ? intensity : 0,
      snow: kind === 'snow' ? intensity : 0,
      lightning: kind === 'storm',
      leaves: wet ? 0 : foliage.falling * (.5 + wind * .5),
      petals: wet ? 0 : foliage.blossom * .7,
      fireflies: season === 'summer' && !wet && sun.elevation < -3 ? clamp((-sun.elevation - 3) / 6) : 0,
      fog: kind === 'fog' ? intensity : wet ? .2 : 0,
    },
  };
}

/** Map the sun's sky position onto the scene's 1600×1000 canvas. The view
 *  looks toward the equator, so the sun climbs from left to right in the
 *  north and from right to left in the south. */
export function skyPosition(elevation, azimuth, south = false) {
  const off = south ? ((azimuth + 180) % 360) - 180 : azimuth - 180;
  const x = 1600 * clamp(.5 + off / 170, -.1, 1.1);
  const y = clamp(735 - elevation * 11, 90, 900);
  return { x, y };
}

/** 0 at sunset → 1 at sunrise; used to carry the moon across the night. */
function nightProgress(date, lat, lon) {
  const now = date.getTime();
  const today = sunTimes(date, lat, lon);
  const yesterday = sunTimes(new Date(now - DAY_MS), lat, lon);
  const tomorrow = sunTimes(new Date(now + DAY_MS), lat, lon);
  let start, end;
  if (today.sunset && now >= today.sunset.getTime()) { start = today.sunset; end = tomorrow.sunrise; }
  else { start = yesterday.sunset; end = today.sunrise; }
  if (!start || !end) {
    // Polar night or midnight sun: sweep with the clock instead.
    const h = (date.getHours() + date.getMinutes() / 60 + 6) % 24;
    return h / 24;
  }
  return clamp((now - start.getTime()) / (end.getTime() - start.getTime()));
}
