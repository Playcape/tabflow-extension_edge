/* ================================================================
   TabFlow — appearance
   Translates the settings object into CSS custom properties and a
   small set of body/main classes. One entry point (applyAppearance)
   keeps every knob in sync — no per-setting applier drift.
   ================================================================ */

import { q } from '../../common/util.js';
import { THEMES, fontStackFor } from '../../common/themes.js';
import { settings } from '../store.js';
import { registerRenderer } from './bus.js';

const FONT_SIZES = { small: '12px', normal: '13px', large: '14px' };
const BG_STYLES = ['gradient-diag', 'gradient-radial', 'gradient-sunset'];
const BG_PATTERNS = ['dots', 'grid', 'noise'];
const DENSITIES = ['comfortable', 'cozy', 'compact'];

export function themeVars(themeId, customThemes) {
  if (/^custom_\d+$/.test(themeId)) {
    const custom = customThemes?.[Number(themeId.split('_')[1])];
    if (custom?.vars) return custom.vars;
  }
  return (THEMES[themeId] ?? THEMES.dark).vars;
}

/** Whether a theme's background is light (for prefers-color-scheme aware UI). */
export function applyThemeVars(vars) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
}

function applyAccent(hex) {
  const root = document.documentElement;
  root.style.setProperty('--accent', hex);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (![r, g, b].some(Number.isNaN)) root.style.setProperty('--accent-rgb', `${r},${g},${b}`);
}

export function applyAppearance() {
  const s = settings();
  const root = document.documentElement;
  const main = q('#main-content');

  applyThemeVars(themeVars(s.theme, s.customThemes));
  applyAccent(s.accent);

  root.style.setProperty('--font', fontStackFor(s.font));
  root.style.setProperty('--font-size-base', FONT_SIZES[s.fontSize] ?? FONT_SIZES.normal);
  root.style.setProperty('--radius', `${s.borderRadius}px`);
  root.style.setProperty('--sidebar-w', `${s.sidebarWidth}px`);

  for (const density of DENSITIES) {
    document.body.classList.toggle(`density-${density}`, s.density === density);
  }

  // Background style + pattern live on #main-content.
  for (const style of BG_STYLES) {
    main.classList.toggle(`bg-style-${style}`, s.bgStyle === style);
  }
  main.style.backgroundColor = s.bgStyle === 'custom' && s.customBgColor ? s.customBgColor : '';
  for (const pattern of BG_PATTERNS) {
    main.classList.toggle(`bg-${pattern}`, s.bgPattern === pattern);
  }

  // Advanced visual toggles (see Settings → Advanced).
  document.body.classList.toggle('fx-glass', !!s.glass);
  document.body.classList.toggle('fx-liquid', !!s.liquidGlass);
  root.style.setProperty('--lg-alpha', `${s.lgOpacity}%`);
  root.style.setProperty('--lg-blur', `${s.lgBlur}px`);
  root.style.setProperty('--lg-spec', String(s.lgSpecular / 100));
  root.style.setProperty('--lg-depth', String(s.lgDepth / 100));
  document.body.classList.toggle('fx-lg-glow', !!s.liquidGlass && !!s.lgGlow);
  document.body.classList.toggle('fx-lg-unified', !!s.liquidGlass && !!s.lgUnified);

  // Material You (Pixel) design language — mutually exclusive with liquid.
  document.body.classList.toggle('m3', !!s.materialYou);
  document.body.classList.toggle('m3-motion', !!s.materialYou && !!s.myMotion && !s.reduceMotion);
  document.body.classList.toggle('m3-bold', !!s.materialYou && !!s.myBold);
  root.style.setProperty('--m3-tint', String(s.myTint / 100));
  root.style.setProperty('--m3-radius', `${s.myRadius}px`);
  document.body.classList.toggle('fx-animated-bg', !!s.animatedBg);
  document.body.classList.toggle('fx-reduce-motion', !!s.reduceMotion);
  document.body.classList.toggle('zen', !!s.zenMode);

  applyCustomCss(s.customCss);
}

export function applyCustomCss(css) {
  let styleEl = document.getElementById('custom-css');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-css';
    document.head.append(styleEl);
  }
  styleEl.textContent = css || '';
}

export function initAppearance() {
  registerRenderer('appearance', applyAppearance);
}
