/* ================================================================
   TabFlow — shared utilities (DOM helpers, ids, URLs, favicons)
   ================================================================ */

import { ext, caps } from './ext.js';

/* ---------- ids ---------- */
export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ---------- DOM ---------- */
export const q = (sel, root = document) => root.querySelector(sel);
export const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Tiny element builder. Props: class, dataset, style (cssText), text,
 * html (trusted markup only — our own icon constants), on<event> handlers;
 * everything else becomes a property when possible, else an attribute.
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(props)) {
    if (val == null || val === false) continue;
    if (key === 'class') el.className = val;
    else if (key === 'dataset') Object.assign(el.dataset, val);
    else if (key === 'style') el.style.cssText = val;
    else if (key === 'text') el.textContent = val;
    else if (key === 'html') el.innerHTML = val;
    else if (key.startsWith('on') && typeof val === 'function')
      el.addEventListener(key.slice(2).toLowerCase(), val);
    else if (key in el) el[key] = val;
    else el.setAttribute(key, val === true ? '' : val);
  }
  for (const child of children.flat(Infinity)) {
    if (child != null && child !== false) el.append(child);
  }
  return el;
}

/* ---------- timing ---------- */
export function debounce(fn, ms) {
  let timer = null;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => clearTimeout(timer);
  wrapped.flush = (...args) => {
    clearTimeout(timer);
    fn(...args);
  };
  return wrapped;
}

/* ---------- URLs ---------- */
export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Normalize user-typed URLs; returns '' for unsafe/unusable input. */
export function normalizeUrl(raw) {
  const input = (raw ?? '').trim();
  if (!input) return '';
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
  } catch {
    /* invalid */
  }
  return '';
}

/**
 * Registrable-domain approximation for "focus my Gmail tab"-style matching.
 * Handles common two-part public suffixes without a full PSL dependency.
 */
const MULTI_PART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
  'com.au', 'net.au', 'org.au',
  'co.jp', 'ne.jp', 'or.jp',
  'com.br', 'com.mx', 'com.tr', 'co.nz', 'co.in',
]);

export function siteOf(url) {
  const host = domainOf(url).toLowerCase();
  if (!host) return '';
  const parts = host.split('.').filter(Boolean);
  if (parts.length <= 2) return host;
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_SUFFIXES.has(lastTwo)) return parts.slice(-3).join('.');
  return lastTwo;
}

export function sameSite(a, b) {
  const siteA = siteOf(a);
  return !!siteA && siteA === siteOf(b);
}

/* ---------- favicons ---------- */
/**
 * Resolve a favicon source for a saved tab.
 * Preference order: favicon captured at save time → Chromium's local
 * _favicon endpoint → remote service (only if the user allows it) → ''
 * ('' means: render a letter tile instead).
 */
export function faviconSrc(url, savedIcon, allowRemote) {
  if (savedIcon && /^(https:|data:image\/)/.test(savedIcon)) return savedIcon;
  if (!url) return '';
  if (caps.localFavicons) {
    return ext.runtime.getURL(`_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`);
  }
  if (allowRemote) {
    const domain = domainOf(url);
    if (domain) return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
  }
  return '';
}

/** <img> with automatic letter-tile fallback. */
export function faviconEl(url, savedIcon, allowRemote, cls, fallbackCls) {
  const src = faviconSrc(url, savedIcon, allowRemote);
  if (!src) return letterTile(url, fallbackCls);
  const img = h('img', { class: cls, src, alt: '' });
  img.addEventListener('error', () => img.replaceWith(letterTile(url, fallbackCls)), { once: true });
  return img;
}

export function letterTile(url, cls) {
  const letter = (domainOf(url) || '?')[0].toUpperCase();
  return h('div', { class: cls, text: letter });
}

/* ---------- text ---------- */
/** Build a DocumentFragment of `text` with case-insensitive `query` wrapped in <mark>. */
export function highlight(text, query) {
  const frag = document.createDocumentFragment();
  if (!query) {
    frag.append(text);
    return frag;
  }
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  let pos = 0;
  for (;;) {
    const idx = lower.indexOf(needle, pos);
    if (idx === -1) break;
    if (idx > pos) frag.append(text.slice(pos, idx));
    frag.append(h('mark', { text: text.slice(idx, idx + needle.length) }));
    pos = idx + needle.length;
  }
  if (pos < text.length) frag.append(text.slice(pos));
  return frag;
}

export function timestampLabel(date = new Date()) {
  return (
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

export function deepClone(value) {
  return structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}
