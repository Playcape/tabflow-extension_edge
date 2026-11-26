import test from 'node:test';
import assert from 'node:assert/strict';

const sky = await import('../src/newtab/scene/sky.js');
const weather = await import('../src/newtab/scene/weather.js');
const { LANDSCAPE } = await import('../src/newtab/scenes/landscape.js');

const BERLIN = { lat: 52.52, lon: 13.41 };
const SYDNEY = { lat: -33.87, lon: 151.21 };
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} not within ${tolerance} of ${expected}`);

test('sun position and day length follow real astronomy', () => {
  // Berlin, summer solstice, solar noon ≈ 11:08 UTC, sun ≈ 61° due south.
  const noon = sky.solarPosition(new Date('2026-06-21T11:08:00Z'), BERLIN.lat, BERLIN.lon);
  near(noon.elevation, 60.9, .6, 'solstice noon elevation');
  near(noon.azimuth, 180, 2, 'solstice noon azimuth');
  // Midwinter noon is low.
  near(sky.solarPosition(new Date('2026-12-21T11:08:00Z'), BERLIN.lat, BERLIN.lon).elevation, 14.1, .6, 'midwinter noon');
  // Night is below the horizon.
  assert.ok(sky.solarPosition(new Date('2026-06-21T23:00:00Z'), BERLIN.lat, BERLIN.lon).elevation < 0);
});

test('sunrise and sunset match published times and handle polar days', () => {
  const day = sky.sunTimes(new Date('2026-06-21T12:00:00Z'), BERLIN.lat, BERLIN.lon);
  // Published: 04:43 and 21:33 CEST → 02:43 and 19:33 UTC.
  near(day.sunrise.getTime(), Date.parse('2026-06-21T02:43:00Z'), 4 * 60_000, 'sunrise');
  near(day.sunset.getTime(), Date.parse('2026-06-21T19:33:00Z'), 4 * 60_000, 'sunset');
  const polarNight = sky.sunTimes(new Date('2026-12-21T12:00:00Z'), 78.2, 15.6); // Svalbard
  assert.equal(polarNight.sunrise, null);
  assert.equal(polarNight.sunset, null);
});

test('moon phase tracks the lunar cycle', () => {
  const full = sky.moonPhase(new Date('2026-11-24T14:53:00Z'));
  near(full.phase, .5, .02, 'full moon phase');
  assert.ok(full.illumination > .99);
  const fresh = sky.moonPhase(new Date('2026-11-09T07:02:00Z'));
  assert.ok(fresh.illumination < .02, 'new moon is dark');
});

test('seasons flip between hemispheres and foliage follows the year', () => {
  const nov = new Date(2026, 10, 26, 12);
  assert.equal(sky.seasonOf(nov, BERLIN.lat), 'autumn');
  assert.equal(sky.seasonOf(nov, SYDNEY.lat), 'spring');
  assert.equal(sky.seasonOf(new Date(2026, 0, 15), BERLIN.lat), 'winter');
  assert.equal(sky.seasonOf(new Date(2026, 6, 15), BERLIN.lat), 'summer');
  const january = sky.foliageAt(new Date(2026, 0, 15), BERLIN.lat);
  const july = sky.foliageAt(new Date(2026, 6, 15), BERLIN.lat);
  const october = sky.foliageAt(new Date(2026, 9, 18), BERLIN.lat);
  const april = sky.foliageAt(new Date(2026, 3, 18), BERLIN.lat);
  assert.ok(january.canopy < .05 && january.snow > .8, 'bare, snowy January');
  assert.ok(july.canopy > .95 && july.snow === 0, 'full summer canopy');
  assert.ok(october.falling > .7, 'October leaves fall');
  assert.ok(april.blossom > .8, 'April blossom');
  // Tropics stay green and snow-free all year.
  const tropical = sky.foliageAt(new Date(2026, 0, 15), 1.35);
  assert.ok(tropical.canopy > .95 && tropical.snow === 0);
  // A previewed season overrides the date.
  assert.ok(sky.foliageAt(new Date(2026, 6, 15), BERLIN.lat, 'winter').snow > .8);
});

test('scene state reacts to time of day, weather and season', () => {
  const day = sky.sceneState(new Date('2026-06-21T11:00:00Z'), BERLIN, null);
  const night = sky.sceneState(new Date('2026-12-21T22:00:00Z'), BERLIN, null);
  assert.ok(day.light > .9 && day.stars === 0, 'bright day, no stars');
  assert.ok(night.light < .2 && night.stars > .9, 'dark night, stars out');
  assert.ok(day.sun.alpha > .9 && night.sun.alpha === 0);
  assert.equal(day.season, 'summer');
  assert.equal(night.season, 'winter');
  // Berlin's midsummer night never gets fully dark (sun ≈ -14°), but fireflies are out.
  const june = sky.sceneState(new Date('2026-06-21T23:30:00Z'), BERLIN, null);
  assert.ok(june.stars > .5 && june.particles.fireflies > 0);
  assert.equal(night.particles.fireflies, 0, 'no fireflies in winter');

  const rain = sky.sceneState(new Date('2026-06-21T11:00:00Z'), BERLIN, { kind: 'rain', intensity: .75 });
  assert.equal(rain.particles.rain, .75);
  assert.ok(rain.light < day.light, 'rain dims the day');
  assert.ok(rain.sun.alpha < .2, 'clouds hide the sun');
  const snow = sky.sceneState(new Date('2026-06-21T11:00:00Z'), BERLIN, { kind: 'snow', intensity: 1 });
  assert.ok(snow.foliage.snow >= .99 && snow.particles.snow === 1);
  const storm = sky.sceneState(new Date('2026-06-21T11:00:00Z'), BERLIN, { kind: 'storm' });
  assert.equal(storm.particles.lightning, true);
  assert.equal(sky.sceneState(new Date('2026-06-21T11:00:00Z'), BERLIN, { kind: 'volcano' }).kind, 'clear');
  const previewWinter = sky.sceneState(new Date('2026-06-21T11:00:00Z'), BERLIN, null, { season: 'winter' });
  assert.equal(previewWinter.season, 'winter');
  for (const value of Object.values(day.colors)) assert.match(value, /^#[0-9a-f]{6}$/);
});

test('the sun climbs left to right in the north and right to left in the south', () => {
  const morningNorth = sky.skyPosition(10, 120, false);
  const eveningNorth = sky.skyPosition(10, 240, false);
  assert.ok(morningNorth.x < eveningNorth.x);
  const morningSouth = sky.skyPosition(10, 60, true);
  const eveningSouth = sky.skyPosition(10, 300, true);
  assert.ok(morningSouth.x > eveningSouth.x);
  assert.ok(sky.skyPosition(60, 180).y < sky.skyPosition(5, 180).y, 'higher sun sits higher on screen');
});

test('time-zone estimate places solar noon near clock noon', () => {
  const place = sky.estimateLocation(new Date(2026, 5, 1), 'Australia/Sydney');
  assert.ok(place.lat < 0 && place.estimated);
  assert.ok(sky.estimateLocation(new Date(2026, 5, 1), 'Europe/Berlin').lat > 0);
});

test('WMO codes map onto scene weather', () => {
  assert.deepEqual(weather.describeWeather(0).kind, 'clear');
  assert.equal(weather.describeWeather(3).kind, 'cloudy');
  assert.equal(weather.describeWeather(45).kind, 'fog');
  assert.equal(weather.describeWeather(53).kind, 'drizzle');
  assert.equal(weather.describeWeather(65).intensity, 1);
  assert.equal(weather.describeWeather(75).kind, 'snow');
  assert.equal(weather.describeWeather(82).kind, 'rain');
  assert.equal(weather.describeWeather(95).kind, 'storm');
  assert.equal(weather.describeWeather(2, 80).cloud, .8, 'measured cloud cover wins');
  assert.equal(weather.describeWeather(1234).kind, 'clear');
});

test('temperature units and formatting', () => {
  assert.equal(weather.preferredUnit('auto', 'en-US'), 'f');
  assert.equal(weather.preferredUnit('auto', 'de-DE'), 'c');
  assert.equal(weather.preferredUnit('auto', 'en'), 'c');
  assert.equal(weather.preferredUnit('c', 'en-US'), 'c');
  assert.equal(weather.formatTemp(-1.4, 'c'), '-1°');
  assert.equal(weather.formatTemp(-1.4, 'f'), '29°');
  assert.equal(weather.formatTemp(NaN), '–');
});

const forecast = {
  current: { temperature_2m: 4.2, apparent_temperature: 1.1, weather_code: 61, cloud_cover: 90, wind_speed_10m: 12 },
  daily: { time: ['2026-11-26', '2026-11-27'], weather_code: [61, 0], temperature_2m_max: [6, 8], temperature_2m_min: [1, 2], precipitation_probability_max: [80, 5] },
};
const memoryStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

test('forecast requests send only rounded coordinates and are cached per place', async () => {
  const storage = memoryStorage();
  const urls = [];
  const fetchImpl = async (url, init) => { urls.push({ url, init }); return { ok: true, json: async () => forecast }; };
  const data = await weather.fetchWeather({ lat: 52.524371, lon: 13.410533 }, { fetchImpl, storage, now: 1000 });
  assert.equal(urls.length, 1);
  const url = new URL(urls[0].url);
  assert.equal(url.origin + url.pathname, weather.FORECAST_URL);
  assert.equal(url.searchParams.get('latitude'), '52.52');
  assert.equal(url.searchParams.get('longitude'), '13.41');
  assert.equal(urls[0].init.credentials, 'omit');
  assert.equal(data.temp, 4.2);
  assert.equal(data.days.length, 2);
  assert.deepEqual(weather.readCache({ lat: 52.52, lon: 13.41 }, storage), data);
  assert.equal(weather.readCache({ lat: 48.85, lon: 2.35 }, storage), null, 'another place misses the cache');
  assert.equal(weather.usableWeather(data, 1000 + weather.EXPIRE_MS + 1), null, 'stale data expires');
  weather.clearWeatherCache(storage);
  assert.equal(weather.readCache({ lat: 52.52, lon: 13.41 }, storage), null);
});

test('bad weather responses are rejected without touching the cache', async () => {
  const storage = memoryStorage();
  await assert.rejects(weather.fetchWeather({ lat: 1, lon: 2 }, { storage, fetchImpl: async () => ({ ok: false, status: 500 }) }));
  await assert.rejects(weather.fetchWeather({ lat: 1, lon: 2 }, { storage, fetchImpl: async () => ({ ok: true, json: async () => ({ error: true }) }) }));
  assert.equal(weather.readCache({ lat: 1, lon: 2 }, storage), null);
});

test('city search returns clean, rounded results', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ results: [
    { name: 'Berlin', latitude: 52.52437, longitude: 13.41053, country: 'Germany', admin1: 'Land Berlin' },
    { name: 'Broken', latitude: 'x', longitude: 1 },
  ] }) });
  assert.deepEqual(await weather.searchPlaces('Berlin', { fetchImpl, language: 'de-DE' }),
    [{ name: 'Berlin', detail: 'Land Berlin, Germany', lat: 52.52, lon: 13.41 }]);
  let called = false;
  assert.deepEqual(await weather.searchPlaces(' a ', { fetchImpl: async () => { called = true; } }), []);
  assert.equal(called, false, 'too-short queries never hit the network');
});

test('generated landscape geometry is complete', () => {
  assert.equal(LANDSCAPE.ridges.length, 4);
  assert.equal(LANDSCAPE.reflections.length, 2);
  assert.equal(LANDSCAPE.pines.length, 36);
  assert.ok(LANDSCAPE.pines.every((p) => p.d.startsWith('M') && p.snow.startsWith('M')));
  assert.ok(LANDSCAPE.broadleaves.length >= 8);
  assert.equal(LANDSCAPE.banks.length, 2);
  assert.ok(LANDSCAPE.broadleaves.every((t) => t.canopy.length === 5));
});
