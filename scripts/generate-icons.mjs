/**
 * Rebuild the extension icons from the canonical vector.
 * Development only: install Sharp (`npm install --no-save sharp`), then run
 * `node scripts/generate-icons.mjs`. No dependency is shipped in the extension.
 * NODE_PATH may point to an existing Sharp installation.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('Icon generation requires Sharp: npm install --no-save sharp');
  process.exit(1);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const iconDir = path.join(root, 'src/icons');
const assetsDir = path.join(root, 'docs/assets');
const source = await readFile(path.join(iconDir, 'tabflow.svg'));
const sizes = [16, 32, 48, 128, 256];

await mkdir(assetsDir, { recursive: true });
for (const size of sizes) {
  // Supersample once and downsample with Lanczos for crisp small diagonals.
  const png = await sharp(source, { density: 384 })
    .resize(size, size, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  await writeFile(path.join(iconDir, `icon${size}.png`), png);
  console.log(`icons/icon${size}.png`);
}

// Reproducible identity board: real pixel sizes on both light and dark surfaces.
const svgImage = `data:image/svg+xml;base64,${source.toString('base64')}`;
const images = sizes.map((size, i) => {
  const x = [372, 442, 528, 632, 810][i];
  const display = size === 256 ? 152 : size;
  return `<image href="${svgImage}" x="${x}" y="${206 - display / 2}" width="${display}" height="${display}"/>
    <text x="${x + display / 2}" y="304" text-anchor="middle" fill="#9CAAC2" font-size="13">${size === 256 ? '256 / vector' : `${size}px`}</text>`;
}).join('');
const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="552" viewBox="0 0 1040 552">
  <rect width="1040" height="552" rx="24" fill="#0B1120"/>
  <text x="48" y="53" font-family="Arial,sans-serif" font-size="12" fill="#8CF9D7" letter-spacing="3">TABFLOW / IDENTITY</text>
  <image href="${svgImage}" x="44" y="109" width="164" height="164"/>
  <text x="46" y="314" font-family="Arial,sans-serif" font-size="31" fill="#EDF5FF" font-weight="700">TabFlow</text>
  <text x="48" y="342" font-family="Arial,sans-serif" font-size="14" fill="#9CAAC2">A little space. A better flow.</text>
  <g font-family="Arial,sans-serif">${images}</g>
  <rect x="24" y="378" width="992" height="150" rx="16" fill="#F1F4FA"/>
  <image href="${svgImage}" x="56" y="413" width="80" height="80"/>
  <text x="158" y="454" font-family="Arial,sans-serif" font-size="31" fill="#101B30" font-weight="700">TabFlow</text>
  <text x="160" y="479" font-family="Arial,sans-serif" font-size="13" fill="#55647D">FLOWFOLD — LAYERED WORKSPACES IN MOTION</text>
  <rect x="684" y="429" width="40" height="40" rx="12" fill="#111A2D"/>
  <rect x="740" y="429" width="40" height="40" rx="12" fill="#8CF9D7"/>
  <rect x="796" y="429" width="40" height="40" rx="12" fill="#3BB7F5"/>
  <rect x="852" y="429" width="40" height="40" rx="12" fill="#A69AFF"/>
</svg>`;
await sharp(Buffer.from(board)).png().toFile(path.join(assetsDir, 'identity.png'));
console.log('docs/assets/identity.png');
