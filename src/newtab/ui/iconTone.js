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
 * @returns {{h:number, c:number}} with c = 0 for mono icons, or null if empty.
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
