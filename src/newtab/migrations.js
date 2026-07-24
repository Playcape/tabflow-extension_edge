/* ================================================================
   TabFlow — schema, defaults, legacy migration, import sanitizing

   Document schema (v3), stored under storage.local["tabflow_v3"]:
   {
     schemaVersion: 3,
     meta: { rev, writer, savedAt },          // cross-instance sync
     spaces: [{
       id, name, color?, icon?, viewMode,
       collections: [{
         id, name, color?, collapsed, sortMode,
         tabs: [{ id, title, url, favicon?, pinned?, note?, tags?, hotkeySlot? }]
       }]
     }],
     activeSpaceId,
     links:  [{ id, name, url }],             // omnibox aliases
     tasks:  [{ id, title, url?, done }],     // was "nextItems"
     settings: { … see DEFAULT_SETTINGS … },
     ui: { sidebarOpen, rightPanelOpen }
   }
   ================================================================ */

import { uid, normalizeUrl } from '../common/util.js';
import { THEMES } from '../common/themes.js';

export const SCHEMA_VERSION = 3;

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  accent: '#7c6af5',
  font: 'system',
  fontSize: 'normal',          // small | normal | large
  borderRadius: 8,             // px
  density: 'comfortable',      // comfortable | cozy | compact
  defaultView: 'card',         // card | compact | list | grid
  sidebarWidth: 220,           // px
  bgStyle: 'solid',            // solid | gradient-diag | gradient-radial | gradient-sunset | custom
  customBgColor: '',
  bgPattern: 'none',           // none | dots | grid | noise
  showClock: false,
  remoteFavicons: true,        // allow Google favicon service as fallback
  customThemes: [],            // [{ id, name, vars, preview }]
  customCss: '',
  // ---- Advanced feature toggles (all local, all opt-in unless noted) ----
  cmdPalette: true,            // Ctrl/⌘+K quick launcher
  focusExistingTab: false,     // open a saved tab → focus it if already open
  glass: false,                // frosted-glass panels (backdrop blur)
  liquidGlass: true,           // Apple-style material + gooey drag physics
  lgOpacity: 62,               // Liquid Glass surface opacity, % (20–90)
  lgBlur: 12,                  // Liquid Glass backdrop blur, px (0–40)
  lgSpecular: 60,              // edge-highlight strength, % (0–100)
  lgDepth: 60,                 // shadow/rim depth, % (0–100)
  lgPhysics: true,             // drag droplet + goo merge
  lgSheen: true,               // pointer-tracked highlight on cards
  lgGlow: true,                // ambient accent glow behind collections
  lgUnified: true,             // pull the glass language through the whole chrome
  animatedBg: false,           // slow "aurora" gradient behind collections
  reduceMotion: false,         // kill transitions/animations
  zenMode: false,              // hide chrome for a minimal, centered view
  greetingName: '',            // shown in the clock greeting ("Good morning, X")
  clock24h: false,             // 24-hour clock
  clockSeconds: false,         // show seconds in the clock
};

export const DEFAULT_UI = {
  sidebarOpen: true,
  rightPanelOpen: true,
  zenHintDismissed: false,
};

/* ---------- constructors ---------- */

export function makeTab({ title = '', url = '', favicon = '' } = {}) {
  return { id: uid(), title: title || url || 'Untitled', url, favicon };
}

export function makeCollection(name = 'New Collection', tabs = []) {
  return { id: uid(), name, collapsed: false, sortMode: 'manual', tabs };
}

export function makeSpace(name = 'New Space') {
  return { id: uid(), name, viewMode: 'card', collections: [] };
}

export function defaultDoc() {
  const space = makeSpace('My Collections');
  space.collections = [
    makeCollection('Welcome to TabFlow', [
      makeTab({ title: 'TabFlow on GitHub', url: 'https://github.com/Playcape/tabflow-extension' }),
      makeTab({ title: 'Drag tabs here from the Open Tabs panel →', url: 'https://example.com' }),
    ]),
  ];
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { rev: 0, writer: '', savedAt: 0 },
    spaces: [space],
    activeSpaceId: space.id,
    links: [],
    tasks: [],
    settings: { ...DEFAULT_SETTINGS },
    ui: { ...DEFAULT_UI },
  };
}

/* ---------- normalization ----------
   Applied to every loaded/imported document. Guarantees the rest of the
   app never sees missing ids, dangling references, or unsafe URLs. */

const VIEW_MODES = new Set(['card', 'compact', 'list', 'grid']);
const SORT_MODES = new Set(['manual', 'title-asc', 'title-desc', 'domain']);

function cleanUrl(url) {
  if (typeof url !== 'string' || !url) return '';
  return /^https?:\/\//i.test(url) ? url : normalizeUrl(url);
}

function cleanFavicon(src) {
  if (typeof src !== 'string') return '';
  return /^(https:|data:image\/)/.test(src) ? src : '';
}

function normalizeTab(raw) {
  const tab = {
    id: typeof raw?.id === 'string' ? raw.id : uid(),
    title: typeof raw?.title === 'string' && raw.title ? raw.title : (raw?.url || 'Untitled'),
    url: cleanUrl(raw?.url),
    favicon: cleanFavicon(raw?.favicon),
  };
  if (raw?.pinned) tab.pinned = true;
  if (typeof raw?.note === 'string' && raw.note) tab.note = raw.note;
  if (Array.isArray(raw?.tags)) {
    const tags = raw.tags.filter((t) => typeof t === 'string' && t).slice(0, 12);
    if (tags.length) tab.tags = tags;
  }
  const slot = Number(raw?.hotkeySlot ?? raw?.hotkey?.slot);
  if (Number.isInteger(slot) && slot >= 1 && slot <= 4) tab.hotkeySlot = slot;
  return tab;
}

function normalizeCollection(raw) {
  return {
    id: typeof raw?.id === 'string' ? raw.id : uid(),
    name: typeof raw?.name === 'string' && raw.name ? raw.name : 'Untitled',
    color: typeof raw?.color === 'string' ? raw.color : undefined,
    collapsed: !!raw?.collapsed,
    sortMode: SORT_MODES.has(raw?.sortMode ?? raw?.sort) ? (raw.sortMode ?? raw.sort) : 'manual',
    tabs: Array.isArray(raw?.tabs) ? raw.tabs.map(normalizeTab) : [],
  };
}

function normalizeSpace(raw, fallbackView) {
  return {
    id: typeof raw?.id === 'string' ? raw.id : uid(),
    name: typeof raw?.name === 'string' && raw.name ? raw.name : 'Space',
    color: typeof raw?.color === 'string' ? raw.color : undefined,
    icon: typeof raw?.icon === 'string' ? raw.icon : undefined,
    viewMode: VIEW_MODES.has(raw?.viewMode) ? raw.viewMode : fallbackView,
    collections: Array.isArray(raw?.collections) ? raw.collections.map(normalizeCollection) : [],
  };
}

function normalizeSettings(raw) {
  const settings = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return settings;
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (raw[key] !== undefined && typeof raw[key] === typeof DEFAULT_SETTINGS[key]) {
      settings[key] = raw[key];
    }
  }
  // theme must exist (prefab or custom_N into customThemes range)
  const customCount = Array.isArray(settings.customThemes) ? settings.customThemes.length : 0;
  const isCustom = /^custom_\d+$/.test(settings.theme) &&
    Number(settings.theme.split('_')[1]) < customCount;
  if (!THEMES[settings.theme] && !isCustom) settings.theme = DEFAULT_SETTINGS.theme;
  settings.customThemes = (settings.customThemes ?? [])
    .filter((t) => t && typeof t === 'object' && t.vars && typeof t.vars === 'object')
    .map((t) => ({
      id: typeof t.id === 'string' ? t.id : uid(),
      name: typeof t.name === 'string' && t.name ? t.name : 'Custom Theme',
      vars: Object.fromEntries(
        Object.entries(t.vars).filter(
          ([k, v]) => k.startsWith('--') && typeof v === 'string' && v.length < 64
        )
      ),
      preview: t.preview && typeof t.preview === 'object' ? t.preview : undefined,
    }));
  settings.borderRadius = Math.min(20, Math.max(0, Number(settings.borderRadius) || 8));
  settings.sidebarWidth = Math.min(320, Math.max(160, Number(settings.sidebarWidth) || 220));
  settings.lgOpacity = Math.min(90, Math.max(20, Number(settings.lgOpacity) || 62));
  // 0 is valid for these three (no blur / no highlight / no depth).
  const clamp0 = (raw, fallback, max) => {
    const n = Number(raw);
    return Math.min(max, Math.max(0, Number.isFinite(n) ? n : fallback));
  };
  settings.lgBlur = clamp0(settings.lgBlur, 12, 40);
  settings.lgSpecular = clamp0(settings.lgSpecular, 60, 100);
  settings.lgDepth = clamp0(settings.lgDepth, 60, 100);
  return settings;
}

export function normalizeDoc(raw) {
  const base = defaultDoc();
  if (!raw || typeof raw !== 'object') return base;

  const settings = normalizeSettings(raw.settings);
  const spaces = Array.isArray(raw.spaces) && raw.spaces.length
    ? raw.spaces.map((space) => normalizeSpace(space, settings.defaultView))
    : base.spaces;

  const activeSpaceId = spaces.some((space) => space.id === raw.activeSpaceId)
    ? raw.activeSpaceId
    : spaces[0].id;

  const links = (Array.isArray(raw.links) ? raw.links : [])
    .map((link) => ({
      id: typeof link?.id === 'string' ? link.id : uid(),
      name: typeof link?.name === 'string' ? link.name.trim() : '',
      url: cleanUrl(link?.url),
    }))
    .filter((link) => link.name && link.url);

  const tasks = (Array.isArray(raw.tasks) ? raw.tasks : [])
    .map((task) => ({
      id: typeof task?.id === 'string' ? task.id : uid(),
      title: typeof task?.title === 'string' ? task.title.trim() : '',
      url: cleanUrl(task?.url),
      done: !!task?.done,
    }))
    .filter((task) => task.title);

  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { rev: Number(raw.meta?.rev) || 0, writer: '', savedAt: 0 },
    spaces,
    activeSpaceId,
    links,
    tasks,
    settings,
    ui: {
      sidebarOpen: raw.ui?.sidebarOpen !== false,
      rightPanelOpen: raw.ui?.rightPanelOpen !== false,
      zenHintDismissed: !!raw.ui?.zenHintDismissed,
    },
  };
}

/* ---------- v2 → v3 migration ----------
   v2 was a flat document under "tabflow_v2" with ~25 top-level setting
   keys, a viewModes map keyed by space id, and "nextItems". */

const LEGACY_FONT_MAP = { 'JetBrains Mono': 'mono', Nunito: 'rounded', Outfit: 'geometric' };
const LEGACY_PATTERNS = new Set(['none', 'dots', 'grid', 'noise']);

export function migrateV2(v2) {
  if (!v2 || typeof v2 !== 'object') return null;

  const spaces = (Array.isArray(v2.spaces) ? v2.spaces : []).map((space) => ({
    ...space,
    viewMode: v2.viewModes?.[space?.id] ?? v2.defaultView ?? 'card',
  }));

  return normalizeDoc({
    spaces,
    activeSpaceId: v2.activeSpaceId,
    links: v2.links,
    tasks: v2.nextItems, // rename
    settings: {
      theme: v2.theme,
      accent: v2.accent,
      font: LEGACY_FONT_MAP[v2.font] ?? 'system',
      fontSize: v2.fontSize,
      borderRadius: v2.borderRadius,
      density: v2.cardDensity,
      defaultView: v2.defaultView,
      sidebarWidth: v2.sidebarWidth,
      bgStyle: v2.bgStyle,
      customBgColor: v2.customBgColor,
      bgPattern: LEGACY_PATTERNS.has(v2.bgPattern) ? v2.bgPattern : 'none',
      showClock: v2.showClock === 'on',
      customThemes: v2.customThemes,
      customCss: v2.customCss,
    },
    ui: {
      sidebarOpen: v2.sidebarOpen !== false,
      rightPanelOpen: v2.rightPanelOpen !== false,
    },
  });
}

/* ---------- import (backup files) ----------
   Accepts: v3 exports, v2 exports ({version:3, spaces, settings, nextItems}),
   and raw v2/v3 documents. Returns a normalized doc or null. */

export function parseImport(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;

  // v3 export envelope
  if (data.app === 'tabflow' && data.doc && typeof data.doc === 'object') {
    return normalizeDoc(data.doc);
  }
  if (!Array.isArray(data.spaces)) return null;

  // raw v3 doc
  if (data.schemaVersion === SCHEMA_VERSION) return normalizeDoc(data);

  // v2 export: settings nested under "settings", rest at top level
  if (data.settings && typeof data.settings === 'object') {
    return migrateV2({ ...data, ...data.settings, nextItems: data.nextItems });
  }

  // raw v2 doc
  return migrateV2(data);
}

export function buildExport(doc) {
  return {
    app: 'tabflow',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    doc: {
      spaces: doc.spaces,
      activeSpaceId: doc.activeSpaceId,
      links: doc.links,
      tasks: doc.tasks,
      settings: doc.settings,
      ui: doc.ui,
    },
  };
}
