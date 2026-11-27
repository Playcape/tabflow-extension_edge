/* ================================================================
   TabFlow — icon tone  [stained-glass]
   Reads the brand colour of a site icon: the dominant hue of its
   coloured pixels, as an OKLCH hue + chroma. Icons that are black,
   white or grey (GitHub, Notion…) come back as "mono", so their card
   becomes clear smoky glass instead of a made-up colour.
   Pure functions; the DOM side lives in ui/stained.js.
   ================================================================ */

/** sRGB 0–255 → OKLCH {l, c, h}. */
export function rgbToOklch(r, g, b) {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l_ = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m_ = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s_ = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return { l: L, c: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

const BINS = 18; // 20° hue buckets

/**
 * Dominant tone of RGBA pixel data (e.g. a 32×32 canvas read).
 * @returns {{h:number, c:number, multi?:number[]}} — c = 0 for mono icons;
 *   multi-colour logos (three or more strong, distinct hues, like Google's
 *   G) return c = 0 plus their hues in `multi`, so no single colour is
 *   picked arbitrarily. null if the icon is empty.
 */
export function dominantTone(data) {
  const weight = new Float64Array(BINS), sx = new Float64Array(BINS), sy = new Float64Array(BINS), sc = new Float64Array(BINS);
  let opaque = 0, colored = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 140) continue;
    opaque++;
    const { l, c, h } = rgbToOklch(data[i], data[i + 1], data[i + 2]);
    if (c < 0.05 || l < 0.18 || l > 0.97) continue; // black, white and greys carry no brand hue
    colored++;
    const w = c * (alpha / 255);
    const bin = Math.floor(h / (360 / BINS)) % BINS;
    weight[bin] += w;
    sx[bin] += Math.cos((h * Math.PI) / 180) * w;
    sy[bin] += Math.sin((h * Math.PI) / 180) * w;
    sc[bin] += c * w;
  }
  if (!opaque) return null;
  if (colored < opaque * 0.12) return { h: 0, c: 0 };
  const multi = distinctHues(weight, sx, sy);
  if (multi.length >= 3) return { h: 0, c: 0, multi };
  // Pick the strongest hue region (a bucket plus its neighbours), then average inside it.
  let best = 0, bestW = -1;
  for (let b = 0; b < BINS; b++) {
    const w = weight[b] + 0.5 * (weight[(b + 1) % BINS] + weight[(b + BINS - 1) % BINS]);
    if (w > bestW) { bestW = w; best = b; }
  }
  let x = 0, y = 0, cw = 0, ww = 0;
  for (const b of [best - 1, best, best + 1].map((n) => (n + BINS) % BINS)) { x += sx[b]; y += sy[b]; cw += sc[b]; ww += weight[b]; }
  const h = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return { h: Math.round(h), c: Math.round(Math.min(0.16, Math.max(0.07, cw / ww)) * 1000) / 1000 };
}

/* Strong hue regions at least 60° apart, strongest first (max four). */
function distinctHues(weight, sx, sy) {
  const total = weight.reduce((a, b) => a + b, 0);
  const peaks = [];
  for (let b = 0; b < BINS; b++) {
    const w = weight[b] + weight[(b + 1) % BINS];
    if (w < total * 0.14) continue;
    const x = sx[b] + sx[(b + 1) % BINS], y = sy[b] + sy[(b + 1) % BINS];
    peaks.push({ w, h: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 });
  }
  peaks.sort((a, b) => b.w - a.w);
  const picked = [];
  for (const peak of peaks) {
    if (picked.every((h) => Math.min(Math.abs(h - peak.h), 360 - Math.abs(h - peak.h)) >= 60)) picked.push(peak.h);
    if (picked.length === 4) break;
  }
  return picked.map(Math.round);
}

/**
 * Make an icon's baked-in white background transparent: flood-fill from the
 * edges through near-white pixels and clear them. White inside the logo
 * (not connected to the edge) is kept. Mutates `data`; returns whether any
 * background was removed.
 */
export function knockOutWhite(data, width, height) {
  const near = (i) => data[i + 3] > 200 && data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 232;
  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  let cleared = 0;
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!near(p * 4)) continue;
    data[p * 4 + 3] = 0;
    cleared++;
    const x = p % width, y = (p - x) / width;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - width);
    if (y < height - 1) stack.push(p + width);
  }
  // Only call it a background if it frames the icon (a decent share of the edge).
  return cleared >= width * 2;
}
