/* ================================================================
   TabFlow — Live scene: weather
   Optional, off by default. When the user turns it on and picks a
   city, current conditions and a short forecast come from Open-Meteo
   (free, no account or key). Coordinates are rounded to ~1 km before
   they leave the device; nothing else is sent. Results are cached in
   localStorage so new tabs paint the right weather instantly.
   ================================================================ */

export const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
export const CACHE_KEY = 'tabflow_weather_v1';
export const REFRESH_MS = 30 * 60_000;   // fetch again after 30 minutes
export const EXPIRE_MS = 6 * 60 * 60_000; // stop showing data older than 6 hours
const TIMEOUT_MS = 8000;

/* WMO weather interpretation codes (as used by Open-Meteo). */
const WMO = {
  0: ['clear', 'Clear sky', 0, .02], 1: ['clear', 'Mainly clear', 0, .2], 2: ['partly', 'Partly cloudy', 0, .5],
  3: ['cloudy', 'Overcast', 0, .95], 45: ['fog', 'Fog', .8, .85], 48: ['fog', 'Rime fog', .9, .85],
  51: ['drizzle', 'Light drizzle', .25], 53: ['drizzle', 'Drizzle', .4], 55: ['drizzle', 'Dense drizzle', .55],
  56: ['drizzle', 'Freezing drizzle', .35], 57: ['drizzle', 'Freezing drizzle', .55],
  61: ['rain', 'Light rain', .5], 63: ['rain', 'Rain', .75], 65: ['rain', 'Heavy rain', 1],
  66: ['rain', 'Freezing rain', .55], 67: ['rain', 'Freezing rain', .85],
  71: ['snow', 'Light snow', .4], 73: ['snow', 'Snow', .7], 75: ['snow', 'Heavy snow', 1], 77: ['snow', 'Snow grains', .3],
  80: ['rain', 'Rain showers', .55], 81: ['rain', 'Rain showers', .8], 82: ['rain', 'Violent showers', 1],
  85: ['snow', 'Snow showers', .6], 86: ['snow', 'Heavy snow showers', 1],
  95: ['storm', 'Thunderstorm', 1], 96: ['storm', 'Thunderstorm, hail', 1], 99: ['storm', 'Thunderstorm, hail', 1],
};

/** Turn a WMO code (+ optional cloud cover %) into the scene's weather vocabulary. */
export function describeWeather(code, cloudCover = null) {
  const [kind, label, intensity = 0, cloud = .95] = WMO[code] ?? ['clear', 'Clear sky', 0, .05];
  const measured = Number.isFinite(cloudCover) ? Math.min(1, Math.max(0, cloudCover / 100)) : null;
  return { kind, label, intensity, cloud: measured ?? cloud };
}

/** Fahrenheit for the few regions that use it; Celsius everywhere else. */
export function preferredUnit(setting = 'auto', locale = globalThis.navigator?.language ?? 'en') {
  if (setting === 'c' || setting === 'f') return setting;
  const region = (locale.split(/[-_]/)[1] ?? '').toUpperCase();
  return ['US', 'LR', 'MM', 'BS', 'BZ', 'KY', 'PW', 'FM', 'MH'].includes(region) ? 'f' : 'c';
}

export function formatTemp(celsius, unit = 'c') {
  if (!Number.isFinite(celsius)) return '–';
  return `${Math.round(unit === 'f' ? celsius * 9 / 5 + 32 : celsius)}°`;
}

export function roundCoord(n) {
  return Math.round(Number(n) * 100) / 100;
}

export function forecastUrl(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(roundCoord(lat)),
    longitude: String(roundCoord(lon)),
    current: 'temperature_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '6',
  });
  return `${FORECAST_URL}?${params}`;
}

/** Validate and slim an Open-Meteo forecast response. Throws on junk. */
export function normalizeForecast(raw, now = Date.now()) {
  const c = raw?.current;
  if (!c || !Number.isFinite(c.temperature_2m) || !Number.isFinite(c.weather_code)) throw new Error('Unexpected weather response');
  const d = raw.daily ?? {};
  const days = (Array.isArray(d.time) ? d.time : []).slice(0, 6).map((date, i) => ({
    date: String(date).slice(0, 10),
    code: Number(d.weather_code?.[i]),
    max: Number(d.temperature_2m_max?.[i]),
    min: Number(d.temperature_2m_min?.[i]),
    rain: Number.isFinite(d.precipitation_probability_max?.[i]) ? d.precipitation_probability_max[i] : null,
  })).filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date));
  return {
    fetchedAt: now,
    temp: c.temperature_2m,
    feels: Number.isFinite(c.apparent_temperature) ? c.apparent_temperature : c.temperature_2m,
    code: c.weather_code,
    cloud: Number.isFinite(c.cloud_cover) ? c.cloud_cover : null,
    wind: Number.isFinite(c.wind_speed_10m) ? c.wind_speed_10m : 0,
    days,
  };
}

/* ---------- cache ---------- */

const keyFor = (place) => `${roundCoord(place.lat)},${roundCoord(place.lon)}`;

export function readCache(place, storage = globalThis.localStorage) {
  try {
    const entry = JSON.parse(storage?.getItem(CACHE_KEY) ?? 'null');
    return entry && entry.key === keyFor(place) && entry.data ? entry.data : null;
  } catch { return null; }
}

function writeCache(place, data, storage = globalThis.localStorage) {
  try { storage?.setItem(CACHE_KEY, JSON.stringify({ key: keyFor(place), data })); } catch { /* private mode / quota */ }
}

export function clearWeatherCache(storage = globalThis.localStorage) {
  try { storage?.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

/** Cached data, unless it is too old to describe the sky any more. */
export function usableWeather(data, now = Date.now()) {
  return data && now - data.fetchedAt < EXPIRE_MS ? data : null;
}

/* ---------- network ---------- */

async function getJson(url, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
    if (!res.ok) throw new Error(`Weather service answered ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch fresh conditions for a place and cache them. */
export async function fetchWeather(place, { fetchImpl = globalThis.fetch, storage = globalThis.localStorage, now = Date.now() } = {}) {
  const data = normalizeForecast(await getJson(forecastUrl(place.lat, place.lon), fetchImpl), now);
  writeCache(place, data, storage);
  return data;
}

/** Search cities by name. Returns up to five {name, detail, lat, lon}. */
export async function searchPlaces(query, { fetchImpl = globalThis.fetch, language = globalThis.navigator?.language ?? 'en' } = {}) {
  const name = String(query ?? '').trim().slice(0, 80);
  if (name.length < 2) return [];
  const params = new URLSearchParams({ name, count: '5', language: language.split('-')[0] || 'en', format: 'json' });
  const raw = await getJson(`${GEOCODE_URL}?${params}`, fetchImpl);
  return (Array.isArray(raw?.results) ? raw.results : [])
    .filter((r) => typeof r?.name === 'string' && Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => ({
      name: r.name.slice(0, 60),
      detail: [r.admin1, r.country].filter((s) => typeof s === 'string' && s).join(', ').slice(0, 80),
      lat: roundCoord(r.latitude),
      lon: roundCoord(r.longitude),
    }));
}
