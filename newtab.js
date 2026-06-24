/* ================================================================
   TabFlow — newtab.js  (complete rewrite)
   ================================================================ */

/* ============================================================
   THEMES
   ============================================================ */
const THEMES = {
  dark: {
    name: 'Dark',
    vars: {
      '--bg':            '#16151a',
      '--sidebar-bg':    '#1c1b22',
      '--main-bg':       '#1a1920',
      '--card-bg':       '#252330',
      '--card-hover':    '#2e2b40',
      '--border':        '#2e2c3a',
      '--text':          '#e2e0ee',
      '--text-muted':    '#8b899a',
      '--text-faint':    '#55536a',
      '--divider':       '#2a2836',
      '--sidebar-active':'#2a2738',
      '--shadow':        'rgba(0,0,0,.4)',
      '--scrollbar':     '#3a3852',
      '--input-bg':      '#1e1d25',
    },
    preview: { sidebar:'#1c1b22', main:'#1a1920', card:'#252330', card2:'#2e2b40' }
  },
  light: {
    name: 'Light',
    vars: {
      '--bg':            '#f4f3f8',
      '--sidebar-bg':    '#eceaf4',
      '--main-bg':       '#f4f3f8',
      '--card-bg':       '#ffffff',
      '--card-hover':    '#f0effe',
      '--border':        '#dcdae8',
      '--text':          '#1c1a2e',
      '--text-muted':    '#6b6880',
      '--text-faint':    '#aaa8bc',
      '--divider':       '#e2e0f0',
      '--sidebar-active':'#e6e3f8',
      '--shadow':        'rgba(0,0,0,.08)',
      '--scrollbar':     '#c8c5df',
      '--input-bg':      '#f8f7fc',
    },
    preview: { sidebar:'#eceaf4', main:'#f4f3f8', card:'#ffffff', card2:'#f0effe' }
  },
  dracula: {
    name: 'Dracula',
    vars: {
      '--bg':            '#282a36',
      '--sidebar-bg':    '#21222c',
      '--main-bg':       '#282a36',
      '--card-bg':       '#343746',
      '--card-hover':    '#3d3f52',
      '--border':        '#44475a',
      '--text':          '#f8f8f2',
      '--text-muted':    '#a0a0b8',
      '--text-faint':    '#6272a4',
      '--divider':       '#44475a',
      '--sidebar-active':'#373a50',
      '--shadow':        'rgba(0,0,0,.5)',
      '--scrollbar':     '#44475a',
      '--input-bg':      '#21222c',
    },
    preview: { sidebar:'#21222c', main:'#282a36', card:'#343746', card2:'#3d3f52' }
  },
  nord: {
    name: 'Nord',
    vars: {
      '--bg':            '#2e3440',
      '--sidebar-bg':    '#272c37',
      '--main-bg':       '#2e3440',
      '--card-bg':       '#3b4252',
      '--card-hover':    '#434c5e',
      '--border':        '#434c5e',
      '--text':          '#eceff4',
      '--text-muted':    '#9099ab',
      '--text-faint':    '#5a6475',
      '--divider':       '#3b4252',
      '--sidebar-active':'#3b4252',
      '--shadow':        'rgba(0,0,0,.45)',
      '--scrollbar':     '#434c5e',
      '--input-bg':      '#272c37',
    },
    preview: { sidebar:'#272c37', main:'#2e3440', card:'#3b4252', card2:'#434c5e' }
  },
  monokai: {
    name: 'Monokai',
    vars: {
      '--bg':            '#272822',
      '--sidebar-bg':    '#1e1f1a',
      '--main-bg':       '#272822',
      '--card-bg':       '#3e3d32',
      '--card-hover':    '#49483e',
      '--border':        '#49483e',
      '--text':          '#f8f8f2',
      '--text-muted':    '#a59f85',
      '--text-faint':    '#75715e',
      '--divider':       '#3e3d32',
      '--sidebar-active':'#3e3d32',
      '--shadow':        'rgba(0,0,0,.5)',
      '--scrollbar':     '#49483e',
      '--input-bg':      '#1e1f1a',
    },
    preview: { sidebar:'#1e1f1a', main:'#272822', card:'#3e3d32', card2:'#49483e' }
  },
  solarized: {
    name: 'Solarized',
    vars: {
      '--bg':            '#002b36',
      '--sidebar-bg':    '#073642',
      '--main-bg':       '#002b36',
      '--card-bg':       '#073642',
      '--card-hover':    '#0d4556',
      '--border':        '#124052',
      '--text':          '#fdf6e3',
      '--text-muted':    '#839496',
      '--text-faint':    '#586e75',
      '--divider':       '#073642',
      '--sidebar-active':'#0d4556',
      '--shadow':        'rgba(0,0,0,.5)',
      '--scrollbar':     '#124052',
      '--input-bg':      '#002028',
    },
    preview: { sidebar:'#073642', main:'#002b36', card:'#073642', card2:'#0d4556' }
  },
  rose: {
    name: 'Rosé Pine',
    vars: {
      '--bg':            '#191724',
      '--sidebar-bg':    '#1f1d2e',
      '--main-bg':       '#191724',
      '--card-bg':       '#26233a',
      '--card-hover':    '#2e2b42',
      '--border':        '#393552',
      '--text':          '#e0def4',
      '--text-muted':    '#9893b8',
      '--text-faint':    '#6e6a86',
      '--divider':       '#393552',
      '--sidebar-active':'#2e2b42',
      '--shadow':        'rgba(0,0,0,.45)',
      '--scrollbar':     '#393552',
      '--input-bg':      '#1a1829',
    },
    preview: { sidebar:'#1f1d2e', main:'#191724', card:'#26233a', card2:'#2e2b42' }
  },
  forest: {
    name: 'Forest',
    vars: {
      '--bg':            '#1a1f1a',
      '--sidebar-bg':    '#1e241e',
      '--main-bg':       '#1a1f1a',
      '--card-bg':       '#252c25',
      '--card-hover':    '#2d362d',
      '--border':        '#2d362d',
      '--text':          '#d4e8d4',
      '--text-muted':    '#8aaa8a',
      '--text-faint':    '#4a6a4a',
      '--divider':       '#252c25',
      '--sidebar-active':'#2d362d',
      '--shadow':        'rgba(0,0,0,.5)',
      '--scrollbar':     '#2d362d',
      '--input-bg':      '#151a15',
    },
    preview: { sidebar:'#1e241e', main:'#1a1f1a', card:'#252c25', card2:'#2d362d' }
  },
  catppuccin: {
    name: 'Catppuccin',
    vars: {
      '--bg':            '#1e1e2e',
      '--sidebar-bg':    '#181825',
      '--main-bg':       '#1e1e2e',
      '--card-bg':       '#313244',
      '--card-hover':    '#45475a',
      '--border':        '#45475a',
      '--text':          '#cdd6f4',
      '--text-muted':    '#a6adc8',
      '--text-faint':    '#585b70',
      '--divider':       '#313244',
      '--sidebar-active':'#45475a',
      '--shadow':        'rgba(0,0,0,.5)',
      '--scrollbar':     '#45475a',
      '--input-bg':      '#181825',
    },
    preview: { sidebar:'#181825', main:'#1e1e2e', card:'#313244', card2:'#45475a' }
  },
  'catppuccin-latte': {
    name: 'Catppuccin Latte',
    vars: {
      '--bg':            '#eff1f5',
      '--sidebar-bg':    '#e6e9ef',
      '--main-bg':       '#eff1f5',
      '--card-bg':       '#dce0e8',
      '--card-hover':    '#ccd0da',
      '--border':        '#bcc0cc',
      '--text':          '#4c4f69',
      '--text-muted':    '#6c6f85',
      '--text-faint':    '#9ca0b0',
      '--divider':       '#ccd0da',
      '--sidebar-active':'#ccd0da',
      '--shadow':        'rgba(76,79,105,.12)',
      '--scrollbar':     '#bcc0cc',
      '--input-bg':      '#dce0e8',
    },
    preview: { sidebar:'#e6e9ef', main:'#eff1f5', card:'#dce0e8', card2:'#ccd0da' }
  },
  'tokyo-night': {
    name: 'Tokyo Night',
    vars: {
      '--bg':            '#1a1b26',
      '--sidebar-bg':    '#16161e',
      '--main-bg':       '#1a1b26',
      '--card-bg':       '#24283b',
      '--card-hover':    '#2f3354',
      '--border':        '#292e42',
      '--text':          '#c0caf5',
      '--text-muted':    '#787c99',
      '--text-faint':    '#414868',
      '--divider':       '#292e42',
      '--sidebar-active':'#2f3354',
      '--shadow':        'rgba(0,0,0,.5)',
      '--scrollbar':     '#292e42',
      '--input-bg':      '#16161e',
    },
    preview: { sidebar:'#16161e', main:'#1a1b26', card:'#24283b', card2:'#2f3354' }
  },
  'one-dark': {
    name: 'One Dark',
    vars: {
      '--bg':            '#282c34',
      '--sidebar-bg':    '#21252b',
      '--main-bg':       '#282c34',
      '--card-bg':       '#2c313c',
      '--card-hover':    '#3a3f4b',
      '--border':        '#3a3f4b',
      '--text':          '#abb2bf',
      '--text-muted':    '#636d83',
      '--text-faint':    '#4b5263',
      '--divider':       '#3a3f4b',
      '--sidebar-active':'#3a3f4b',
      '--shadow':        'rgba(0,0,0,.45)',
      '--scrollbar':     '#3a3f4b',
      '--input-bg':      '#21252b',
    },
    preview: { sidebar:'#21252b', main:'#282c34', card:'#2c313c', card2:'#3a3f4b' }
  },
  gruvbox: {
    name: 'Gruvbox',
    vars: {
      '--bg':            '#282828',
      '--sidebar-bg':    '#1d2021',
      '--main-bg':       '#282828',
      '--card-bg':       '#3c3836',
      '--card-hover':    '#504945',
      '--border':        '#504945',
      '--text':          '#ebdbb2',
      '--text-muted':    '#a89984',
      '--text-faint':    '#665c54',
      '--divider':       '#3c3836',
      '--sidebar-active':'#504945',
      '--shadow':        'rgba(0,0,0,.5)',
      '--scrollbar':     '#504945',
      '--input-bg':      '#1d2021',
    },
    preview: { sidebar:'#1d2021', main:'#282828', card:'#3c3836', card2:'#504945' }
  },
  'ayu-mirage': {
    name: 'Ayu Mirage',
    vars: {
      '--bg':            '#1f2430',
      '--sidebar-bg':    '#1a1f2e',
      '--main-bg':       '#1f2430',
      '--card-bg':       '#2a3140',
      '--card-hover':    '#343e51',
      '--border':        '#343e51',
      '--text':          '#cccac2',
      '--text-muted':    '#707a8c',
      '--text-faint':    '#3d4756',
      '--divider':       '#2a3140',
      '--sidebar-active':'#343e51',
      '--shadow':        'rgba(0,0,0,.5)',
      '--scrollbar':     '#343e51',
      '--input-bg':      '#1a1f2e',
    },
    preview: { sidebar:'#1a1f2e', main:'#1f2430', card:'#2a3140', card2:'#343e51' }
  },
  'material-ocean': {
    name: 'Material Ocean',
    vars: {
      '--bg':            '#0f111a',
      '--sidebar-bg':    '#090b11',
      '--main-bg':       '#0f111a',
      '--card-bg':       '#1a1c25',
      '--card-hover':    '#222537',
      '--border':        '#2a2d3b',
      '--text':          '#8f93a2',
      '--text-muted':    '#5a5f78',
      '--text-faint':    '#3a3d50',
      '--divider':       '#1a1c25',
      '--sidebar-active':'#222537',
      '--shadow':        'rgba(0,0,0,.6)',
      '--scrollbar':     '#2a2d3b',
      '--input-bg':      '#090b11',
    },
    preview: { sidebar:'#090b11', main:'#0f111a', card:'#1a1c25', card2:'#222537' }
  },
  synthwave: {
    name: 'Synthwave',
    vars: {
      '--bg':            '#1a0533',
      '--sidebar-bg':    '#12012a',
      '--main-bg':       '#1a0533',
      '--card-bg':       '#2a1040',
      '--card-hover':    '#3a1d52',
      '--border':        '#4a2060',
      '--text':          '#f0d0ff',
      '--text-muted':    '#a070c0',
      '--text-faint':    '#6040a0',
      '--divider':       '#2a1040',
      '--sidebar-active':'#3a1d52',
      '--shadow':        'rgba(0,0,0,.6)',
      '--scrollbar':     '#4a2060',
      '--input-bg':      '#12012a',
    },
    preview: { sidebar:'#12012a', main:'#1a0533', card:'#2a1040', card2:'#3a1d52' }
  },
  midnight: {
    name: 'Midnight',
    vars: {
      '--bg':            '#0a0e1a',
      '--sidebar-bg':    '#070b14',
      '--main-bg':       '#0a0e1a',
      '--card-bg':       '#111827',
      '--card-hover':    '#1e2740',
      '--border':        '#1e2740',
      '--text':          '#c9d1e0',
      '--text-muted':    '#5d6b8a',
      '--text-faint':    '#2e3a50',
      '--divider':       '#111827',
      '--sidebar-active':'#1e2740',
      '--shadow':        'rgba(0,0,0,.7)',
      '--scrollbar':     '#1e2740',
      '--input-bg':      '#070b14',
    },
    preview: { sidebar:'#070b14', main:'#0a0e1a', card:'#111827', card2:'#1e2740' }
  },
  paper: {
    name: 'Paper',
    vars: {
      '--bg':            '#f7f4ef',
      '--sidebar-bg':    '#ede8e0',
      '--main-bg':       '#f7f4ef',
      '--card-bg':       '#ffffff',
      '--card-hover':    '#f0ebe0',
      '--border':        '#ddd8cc',
      '--text':          '#2d2a25',
      '--text-muted':    '#6b6560',
      '--text-faint':    '#a09a90',
      '--divider':       '#e5e0d5',
      '--sidebar-active':'#e0d8c8',
      '--shadow':        'rgba(0,0,0,.07)',
      '--scrollbar':     '#c8c0b0',
      '--input-bg':      '#f0ebe0',
    },
    preview: { sidebar:'#ede8e0', main:'#f7f4ef', card:'#ffffff', card2:'#f0ebe0' }
  },
};

const ACCENT_COLORS = [
  { name:'Violet',  hex:'#7c6af5' },
  { name:'Blue',    hex:'#4f8ef7' },
  { name:'Cyan',    hex:'#22d3ee' },
  { name:'Green',   hex:'#4ade80' },
  { name:'Yellow',  hex:'#facc15' },
  { name:'Orange',  hex:'#fb923c' },
  { name:'Red',     hex:'#f87171' },
  { name:'Pink',    hex:'#f472b6' },
  { name:'Rose',    hex:'#e11d48' },
  { name:'Teal',    hex:'#2dd4bf' },
  { name:'Indigo',  hex:'#6366f1' },
  { name:'Emerald', hex:'#10b981' },
  { name:'Amber',   hex:'#f59e0b' },
  { name:'Fuchsia', hex:'#d946ef' },
  { name:'Lime',    hex:'#84cc16' },
  { name:'Sky',     hex:'#0ea5e9' },
];

/* ============================================================
   STORAGE
   ============================================================ */
const storage = {
  async get(key) {
    return new Promise(resolve => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(key, data => resolve(data[key]));
        } else {
          const v = localStorage.getItem(key);
          resolve(v !== null ? JSON.parse(v) : undefined);
        }
      } catch { resolve(undefined); }
    });
  },
  async set(key, value) {
    return new Promise(resolve => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ [key]: value }, resolve);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
          resolve();
        }
      } catch { resolve(); }
    });
  },
  async clear() {
    return new Promise(resolve => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.clear(resolve);
        } else {
          localStorage.clear();
          resolve();
        }
      } catch { resolve(); }
    });
  }
};

/* ============================================================
   STATE
   ============================================================ */
let S = {
  spaces: [],
  activeSpaceId: null,
  viewModes: {},
  sidebarOpen: true,
  rightPanelOpen: true,
  dndEnabled: true,
  activeNav: 'collections',
  links: [],
  nextItems: [],
  theme: 'dark',
  accent: '#7c6af5',
};

let openTabs = [];
let dragData = null;
let colDropTarget = null; // { colId, before: boolean } — for collection reordering
let cardEditState = null; // { tab, col, sp } — for card edit modal
let cardAddState  = null; // { col, sp } — for add-tab modal
let saveTimer = null;
let snackTimer = null;
let undoBuf = null;
let ctxTarget = null;
let searchQ = '';
let clockInterval  = null;        // setInterval handle for clock widget
let pendingAddTab  = null;        // { title, url } — tab awaiting collection pick

/* ============================================================
   ID / DEFAULTS
   ============================================================ */
const uid = () => '_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36);

function defaultData() {
  const sid = uid(), cid = uid();
  return {
    spaces: [{ id:sid, name:'My Collections', collections:[{
      id:cid, name:'Getting Started', collapsed:false, tabs:[
        { id:uid(), title:'Google', url:'https://www.google.com', favicon:'' },
        { id:uid(), title:'GitHub', url:'https://github.com', favicon:'' },
      ]
    }] }],
    activeSpaceId: sid,
    viewModes: { [sid]:'card' },
    links: [],
    nextItems: [],
    theme: 'dark',
    accent: '#7c6af5',
    sidebarOpen: true,
    rightPanelOpen: true,
    dndEnabled: true,
  };
}

/* ============================================================
   SAVE / LOAD
   ============================================================ */
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    storage.set('tabflow_v2', {
      spaces: S.spaces,
      activeSpaceId: S.activeSpaceId,
      viewModes: S.viewModes,
      links: S.links,
      nextItems: S.nextItems,
      theme: S.theme,
      accent: S.accent,
      font: S.font,
      fontSize: S.fontSize,
      fontWeight: S.fontWeight,
      borderRadius: S.borderRadius,
      cardGap: S.cardGap,
      cardMinWidth: S.cardMinWidth,
      sidebarWidth: S.sidebarWidth,
      defaultView: S.defaultView,
      shadowIntensity: S.shadowIntensity,
      cardHover: S.cardHover,
      animSpeed: S.animSpeed,
      bgPattern: S.bgPattern,
      cardStyle: S.cardStyle,
      scrollbar: S.scrollbar,
      customThemes: S.customThemes,
      bgStyle: S.bgStyle,
      customBgColor: S.customBgColor,
      toolbarStyle: S.toolbarStyle,
      cardDensity: S.cardDensity,
      sidebarStyle: S.sidebarStyle,
      customCss: S.customCss,
      sidebarOpen: S.sidebarOpen,
      rightPanelOpen: S.rightPanelOpen,
      dndEnabled: S.dndEnabled,
      showClock: S.showClock,
    });
  }, 300);
}

async function loadData() {
  let d = await storage.get('tabflow_v2');
  if (!d || !d.spaces || !d.spaces.length) {
    d = defaultData();
    await storage.set('tabflow_v2', d);
  }
  // Merge defaults first, then override with stored values
  Object.assign(S, SETTING_DEFAULTS, d);

  // item 52: On very first install, auto-detect prefers-color-scheme
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const fr = await new Promise(res => chrome.storage.local.get('tabflow_first_run', res));
      if (fr.tabflow_first_run) {
        if (!window.matchMedia('(prefers-color-scheme: dark)').matches) S.theme = 'light';
        chrome.storage.local.remove('tabflow_first_run');
        scheduleSave();
      }
    }
  } catch {}

  // ensure IDs
  S.spaces.forEach(sp => {
    if (!sp.id) sp.id = uid();
    (sp.collections||[]).forEach(c => {
      if (!c.id) c.id = uid();
      (c.tabs||[]).forEach(t => { if (!t.id) t.id = uid(); });
    });
    if (!S.viewModes[sp.id]) S.viewModes[sp.id] = 'card';
  });
  if (!S.activeSpaceId || !S.spaces.find(s=>s.id===S.activeSpaceId)) {
    S.activeSpaceId = S.spaces[0]?.id;
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
function activeSpace() { return S.spaces.find(s=>s.id===S.activeSpaceId) || S.spaces[0] || null; }
function viewMode() { const sp=activeSpace(); return sp ? (S.viewModes[sp.id]||'card') : 'card'; }
function domain(url) { try { return new URL(url).hostname.replace(/^www\./,''); } catch { return ''; } }
function favUrl(url) { const d=domain(url); return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=32` : ''; }
function isTabFlowTab(tab) {
  const url = (tab?.url || '').toLowerCase();
  const title = (tab?.title || '').toLowerCase();

  if (url.includes('/newtab.html')) return true;
  if (url.startsWith('edge://newtab')) return true;
  if (url.startsWith('chrome://newtab')) return true;
  if (url === 'about:newtab') return true;
  if (title.includes('tabflow')) return true;

  const extId = (typeof chrome !== 'undefined' && chrome.runtime?.id)
    ? chrome.runtime.id.toLowerCase()
    : '';

  if (extId) {
    if (url.startsWith(`chrome-extension://${extId}/`)) return true;
    if (url.startsWith(`edge-extension://${extId}/`)) return true;
  }

  return false;
}
function findCol(cid) {
  for (const sp of S.spaces) {
    const c = (sp.collections||[]).find(c=>c.id===cid);
    if (c) return { col:c, space:sp };
  }
  return null;
}

/* ============================================================
   APPLY THEME & ACCENT
   ============================================================ */
function applyTheme(themeId) {
  // Custom theme?
  if (themeId && themeId.startsWith('custom_')) {
    const idx = parseInt(themeId.split('_')[1]);
    const ct = (S.customThemes||[])[idx];
    if (ct) {
      const root = document.documentElement;
      Object.entries(ct.vars).forEach(([k,v]) => root.style.setProperty(k,v));
      return;
    }
  }
  const t = THEMES[themeId] || THEMES.dark;
  const root = document.documentElement;
  Object.entries(t.vars).forEach(([k,v]) => root.style.setProperty(k,v));
}

function applyAccent(hex) {
  const root = document.documentElement;
  root.style.setProperty('--accent', hex);
  // calculate hover (slightly darker)
  root.style.setProperty('--accent-hover', darkenHex(hex, 14));
  // rgb triplet for rgba usage
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  root.style.setProperty('--accent-rgb', `${r},${g},${b}`);
}

function darkenHex(hex, pct) {
  let r=parseInt(hex.slice(1,3),16);
  let g=parseInt(hex.slice(3,5),16);
  let b=parseInt(hex.slice(5,7),16);
  r=Math.max(0,r-pct); g=Math.max(0,g-pct); b=Math.max(0,b-pct);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

/* ============================================================
   ICONS
   ============================================================ */
function ic(name, size) { return icon(name, size); } // delegate to icons.js

function setIcon(el, name, size) { if (el) el.innerHTML = ic(name, size||14); }

function initStaticIcons() {
  // Sidebar toggle
  setIcon(q('#btn-sidebar-toggle'), 'panel-left');
  setIcon(q('#sidebar-show-btn'), 'panel-left', 13);
  // Search clear
  setIcon(q('#search-clear'), 'x', 12);
  // Search icon wrap
  setIcon(q('.search-icon-wrap'), 'search', 13);
  // Nav icons
  qa('.nav-icon[data-icon]').forEach(el => setIcon(el, el.dataset.icon, 14));
  // Add space
  setIcon(q('#btn-add-space'), 'plus', 12);
  // Toolbar
  setBtn('#btn-expand-all',     'chevron-down', 'Expand All');
  setBtn('#btn-collapse-all',   'chevron-up',   'Collapse All');
  setBtn('#btn-add-collection', 'plus',         'Add Collection');
  // Right panel
  setIcon(q('#btn-refresh-tabs'),  'refresh', 14);
  setIcon(q('#btn-save-session'),  'download', 14);
  setIcon(q('#btn-right-toggle'),  'panel-right', 14);
  setIcon(q('#btn-add-current-tab'), 'plus-circle', 14);
  setIcon(q('#btn-rc-refresh'), 'refresh', 11);
  // Right show btn
  setIcon(q('#right-panel-show-btn'), 'panel-right', 13);
  // Export/import btns get text from HTML directly, just add icon
  q('#btn-export') && (q('#btn-export').innerHTML = ic('download',13) + ' Export JSON');
  q('#btn-import') && (q('#btn-import').innerHTML = ic('upload',13) + ' Import JSON');
}

function setBtn(sel, iconName, label) {
  const el = q(sel);
  if (el) el.innerHTML = ic(iconName, 12) + ' ' + label;
}

function q(sel) { return document.querySelector(sel); }
function qa(sel) { return Array.from(document.querySelectorAll(sel)); }

/* ============================================================
   RENDER MAIN
   ============================================================ */
function renderAll() {
  applyAllSettings();
  updateLayoutClasses();
  renderSpaces();
  renderBreadcrumb();
  renderCollections();
  renderLinks();
  renderNextItems();
  renderViewMenu();
  updateDndBtn();
  updateNavActive(S.activeNav);
}

function updateLayoutClasses() {
  const app = q('#app');
  app.classList.toggle('sidebar-collapsed', !S.sidebarOpen);
  app.classList.toggle('right-hidden', !S.rightPanelOpen);
  // right-panel class
  q('#right-panel').classList.toggle('open', S.rightPanelOpen);
  const showBtn = q('#right-panel-show-btn');
  showBtn.style.display = S.rightPanelOpen ? 'none' : 'flex';
  const sidebarShowBtn = q('#sidebar-show-btn');
  sidebarShowBtn.style.display = S.sidebarOpen ? 'none' : 'flex';
  applySidebarWidth(S.sidebarWidth);
}

/* ============================================================
   SPACES
   ============================================================ */
function renderSpaces() {
  const list = q('#spaces-list');
  list.innerHTML = '';
  S.spaces.forEach((sp, idx) => {
    const el = document.createElement('div');
    el.className = 'space-item' + (sp.id===S.activeSpaceId ? ' active' : '');
    el.dataset.id = sp.id;

    // item 35: drag handle for space reordering
    const dh = document.createElement('div');
    dh.className = 'space-drag-handle';
    dh.innerHTML = ic('grip-vertical', 10);
    dh.title = 'Drag to reorder';
    let spDhActive = false;
    dh.addEventListener('mousedown', e => {
      e.stopPropagation();
      spDhActive = true;
      document.addEventListener('mouseup', () => { spDhActive = false; }, { once: true });
    });

    el.draggable = true;
    el.addEventListener('dragstart', e => {
      if (!spDhActive) { e.preventDefault(); return; }
      spDhActive = false;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', sp.id);
      el.classList.add('dragging-src');
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging-src');
      list.querySelectorAll('.space-item').forEach(n => {
        n.classList.remove('space-drop-before', 'space-drop-after');
      });
    });
    el.addEventListener('dragover', e => {
      e.preventDefault();
      const over = e.currentTarget;
      list.querySelectorAll('.space-item').forEach(n => n.classList.remove('space-drop-before','space-drop-after'));
      const rect = over.getBoundingClientRect();
      const half = rect.top + rect.height / 2;
      over.classList.add(e.clientY < half ? 'space-drop-before' : 'space-drop-after');
    });
    el.addEventListener('drop', e => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === sp.id) return;
      const fromIdx = S.spaces.findIndex(s => s.id === draggedId);
      if (fromIdx === -1) return;
      const [moved] = S.spaces.splice(fromIdx, 1);
      const toIdx = S.spaces.findIndex(s => s.id === sp.id);
      const rect = el.getBoundingClientRect();
      const insertAfter = e.clientY >= rect.top + rect.height / 2;
      S.spaces.splice(insertAfter ? toIdx + 1 : toIdx, 0, moved);
      scheduleSave();
      renderSpaces();
    });

    const dot = document.createElement('div');
    dot.className = 'space-dot';
    if (sp.color) dot.style.background = sp.color;
    if (sp.icon) { dot.className = 'space-dot space-icon'; dot.textContent = sp.icon; }

    const nm = document.createElement('span');
    nm.className = 'space-name';
    nm.textContent = sp.name;

    nm.addEventListener('dblclick', e => { e.stopPropagation(); editInline(nm, sp, 'name', renderSpaces); });

    const del = document.createElement('button');
    del.className = 'space-del-btn';
    del.innerHTML = ic('x', 11);
    del.title = 'Delete space';
    del.addEventListener('click', e => { e.stopPropagation(); deleteSpace(sp.id); });

    el.appendChild(dh);
    el.appendChild(dot);
    el.appendChild(nm);
    el.appendChild(del);
    el.addEventListener('click', () => switchSpace(sp.id));
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      showCtx(e.clientX, e.clientY, {
        rename: () => editInline(nm, sp, 'name', renderSpaces),
        delete: () => deleteSpace(sp.id),
        customize: () => openSpaceCustomize(sp.id),
      });
    });
    list.appendChild(el);
  });
}

function switchSpace(id) {
  S.activeSpaceId = id;
  searchQ = '';
  q('#search-input').value = '';
  q('#search-clear').style.display = 'none';
  scheduleSave();
  renderSpaces();
  renderBreadcrumb();
  renderCollections();
  renderViewMenu();
}

function addSpace() {
  const id = uid();
  S.spaces.push({ id, name:'New Space', collections:[] });
  S.viewModes[id] = 'card';
  S.activeSpaceId = id;
  scheduleSave();
  renderSpaces();
  renderBreadcrumb();
  renderCollections();
  // auto-edit name
  setTimeout(() => {
    const items = qa('.space-item');
    const last = items[items.length-1];
    if (last) {
      const nm = last.querySelector('.space-name');
      const sp = S.spaces.find(s=>s.id===id);
      if (nm && sp) editInline(nm, sp, 'name', renderSpaces);
    }
  }, 30);
}

function deleteSpace(id) {
  if (S.spaces.length <= 1) { showSnack('Cannot delete the last space.'); return; }
  S.spaces = S.spaces.filter(s=>s.id!==id);
  if (S.activeSpaceId === id) S.activeSpaceId = S.spaces[0]?.id;
  scheduleSave();
  renderSpaces();
  renderBreadcrumb();
  renderCollections();
}

/* ============================================================
   BREADCRUMB
   ============================================================ */
function renderBreadcrumb() {
  const sp = activeSpace();
  q('#space-breadcrumb').textContent = sp?.name || '';
}

/* ============================================================
   COLLECTIONS
   ============================================================ */
function renderCollections() {
  const area = q('#collections-area');
  if (S.activeNav !== 'collections') return;

  area.innerHTML = '';
  const vm = viewMode();
  area.className = 'view-'+vm;

  if (searchQ) { renderSearchResults(area, vm); return; }

  const sp = activeSpace();
  if (!sp || !(sp.collections||[]).length) {
    const e = document.createElement('div');
    e.className = 'col-empty';
    e.textContent = 'No collections yet. Click Add Collection to get started.';
    area.appendChild(e);
    return;
  }
  sp.collections.forEach(col => area.appendChild(buildColEl(col, sp, vm)));
  initDropZones();
}

function buildColEl(col, sp, vm) {
  const el = document.createElement('div');
  el.className = 'collection' + (col.collapsed ? ' collapsed' : '');
  el.dataset.id = col.id;
  if (col.color) el.dataset.color = col.color;

  // header
  const hdr = document.createElement('div');
  hdr.className = 'collection-header';

  const chev = document.createElement('button');
  chev.className = 'col-chevron icon-btn';
  chev.innerHTML = ic('chevron-down', 13);
  chev.addEventListener('click', () => { col.collapsed = !col.collapsed; scheduleSave(); renderCollections(); });

  const nameWrap = document.createElement('div');
  nameWrap.className = 'col-name-wrap';
  const nm = document.createElement('span');
  nm.className = 'col-name';
  nm.textContent = col.name;
  nm.addEventListener('dblclick', () => editInline(nm, col, 'name', renderCollections));
  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'col-restore-btn';
  restoreBtn.innerHTML = ic('refresh', 11) + ' Restore';
  restoreBtn.title = 'Restore all tabs in this collection';
  restoreBtn.addEventListener('click', e => {
    e.stopPropagation();
    restoreCollection(sp.id, col.id);
  });
  const cnt = document.createElement('span');
  cnt.className = 'col-count';
  cnt.textContent = (col.tabs||[]).length;
  // item 38: open all in new window button (shown on hover, left side)
  const winBtn = document.createElement('button');
  winBtn.className = 'col-new-win-btn';
  winBtn.innerHTML = ic('monitor', 11) + ' Window';
  winBtn.title = 'Open all tabs in new window';
  winBtn.addEventListener('click', e => {
    e.stopPropagation();
    openColInNewWindow(col);
  });
  nameWrap.appendChild(nm);
  nameWrap.appendChild(cnt);
  nameWrap.appendChild(restoreBtn);
  nameWrap.appendChild(winBtn);

  const acts = document.createElement('div');
  acts.className = 'col-actions';

  // item 51: sort button
  const sortBtn = document.createElement('button');
  sortBtn.className = 'sort-btn icon-btn';
  sortBtn.innerHTML = ic('arrow-up-down', 11);
  sortBtn.title = 'Sort tabs';
  sortBtn.addEventListener('click', e => {
    e.stopPropagation();
    showSortMenu(e.clientX, e.clientY, col, sp);
  });
  acts.appendChild(sortBtn);

  const moreBtn = document.createElement('button');
  moreBtn.className = 'icon-btn';
  moreBtn.innerHTML = ic('more-horizontal', 13);
  moreBtn.addEventListener('click', e => {
    e.stopPropagation();
    showCtx(e.clientX, e.clientY, {
      rename: () => editInline(nm, col, 'name', renderCollections),
      delete: () => deleteCol(sp.id, col.id),
      moveToSpace: S.spaces.length > 1 ? () => openSpacePicker(col.id, sp.id) : null,
      color: (c) => { if (c) col.color = c; else delete col.color; scheduleSave(); renderCollections(); },
      tabGroup: () => openAsTabGroup(col),
    });
  });
  acts.appendChild(moreBtn);

  hdr.appendChild(chev);
  hdr.appendChild(nameWrap);
  hdr.appendChild(acts);

  // Collection drag handle (shown only when DnD is enabled)
  if (S.dndEnabled) {
    const colDh = document.createElement('span');
    colDh.className = 'col-drag-handle';
    colDh.innerHTML = ic('grip-vertical', 11);
    colDh.title = 'Drag to reorder';

    let colHandleActive = false;
    colDh.addEventListener('mousedown', () => {
      colHandleActive = true;
      document.addEventListener('mouseup', () => { colHandleActive = false; }, { once: true });
    });

    el.draggable = true;
    el.addEventListener('dragstart', e => {
      if (!colHandleActive) { e.preventDefault(); return; }
      colHandleActive = false;
      e.stopPropagation();
      dragData = { type: 'collection', colId: col.id, spId: sp.id };
      el.classList.add('col-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', col.id);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('col-dragging');
      colHandleActive = false;
      clearColDropIndicators();
      if (dragData?.type === 'collection') { dragData = null; colDropTarget = null; }
    });

    hdr.insertBefore(colDh, chev);
  }

  // drop zone
  const dz = document.createElement('div');
  dz.className = 'drop-zone';
  dz.dataset.colId = col.id;
  dz.dataset.spId = sp.id;

  el.appendChild(hdr);

  const cw = document.createElement('div');
  cw.className = 'cards-wrap';

  if (!col.collapsed) {
    if (!(col.tabs||[]).length) {
      const empty = document.createElement('div');
      empty.className = 'col-empty';
      empty.textContent = 'Drop tabs here…';
      cw.appendChild(empty);
    } else {
      getSortedTabs(col).forEach(tab => cw.appendChild(buildCard(tab, col, sp)));
    }
    // Plus card — visible on collection hover, opens add-tab modal
    const addCard = document.createElement('div');
    addCard.className = 'add-tab-card';
    addCard.title = 'Add tab to collection';
    addCard.innerHTML = ic('plus', 18);
    addCard.addEventListener('click', () => openAddTabModal(col, sp));
    cw.appendChild(addCard);
  }
  dz.appendChild(cw);
  el.appendChild(dz);
  return el;
}

/* item 51: helper — return tabs sorted per col.sort, pinned always first */
function getSortedTabs(col) {
  const tabs = [...(col.tabs || [])];
  const pinned = tabs.filter(t => t.pinned);
  const rest   = tabs.filter(t => !t.pinned);
  const sort = col.sort || 'manual';
  const cmp =
    sort === 'title-asc'  ? (a,b) => (a.title||'').localeCompare(b.title||'') :
    sort === 'title-desc' ? (a,b) => (b.title||'').localeCompare(a.title||'') :
    sort === 'domain'     ? (a,b) => domain(a.url||'').localeCompare(domain(b.url||'')) :
    null;
  if (cmp) { pinned.sort(cmp); rest.sort(cmp); }
  return [...pinned, ...rest];
}

/* item 51: sort context menu */
let sortMenuTarget = null;
function showSortMenu(x, y, col, sp) {
  // reuse context menu for sort options
  sortMenuTarget = { col, sp };
  const menu = q('#context-menu');
  // Temporarily replace items
  const opts = [
    { label: '↑ Title A→Z', sort: 'title-asc' },
    { label: '↓ Title Z→A', sort: 'title-desc' },
    { label: '⊞ By Domain',  sort: 'domain' },
    { label: '⠿ Manual',     sort: 'manual' },
  ];
  menu.innerHTML = '';
  opts.forEach(o => {
    const btn = document.createElement('button');
    btn.className = 'context-item' + ((col.sort||'manual') === o.sort ? ' active' : '');
    btn.textContent = o.label;
    btn.addEventListener('click', () => {
      col.sort = o.sort;
      scheduleSave(); renderCollections(); rebuildContextMenu(); hideCtx();
    });
    menu.appendChild(btn);
  });
  const vw = window.innerWidth, vh = window.innerHeight;
  menu.style.cssText = `display:block;left:${Math.min(x,vw-180)}px;top:${Math.min(y,vh-160)}px`;
}

function rebuildContextMenu() {
  const menu = q('#context-menu');
  menu.innerHTML = `
    <button class="context-item" id="ctx-rename">Rename</button>
    <button class="context-item" id="ctx-color" style="display:none">Color…</button>
    <div id="ctx-color-picker" class="ctx-color-picker" style="display:none">
      <button class="ctx-cp-swatch ctx-cp-none" data-color="" title="None">✕</button>
      <button class="ctx-cp-swatch" data-color="red"    style="background:#f87171" title="Red"></button>
      <button class="ctx-cp-swatch" data-color="orange" style="background:#fb923c" title="Orange"></button>
      <button class="ctx-cp-swatch" data-color="yellow" style="background:#facc15" title="Yellow"></button>
      <button class="ctx-cp-swatch" data-color="green"  style="background:#4ade80" title="Green"></button>
      <button class="ctx-cp-swatch" data-color="cyan"   style="background:#22d3ee" title="Cyan"></button>
      <button class="ctx-cp-swatch" data-color="blue"   style="background:#60a5fa" title="Blue"></button>
      <button class="ctx-cp-swatch" data-color="purple" style="background:#a78bfa" title="Purple"></button>
      <button class="ctx-cp-swatch" data-color="pink"   style="background:#f472b6" title="Pink"></button>
    </div>
    <button class="context-item" id="ctx-customize" style="display:none">Customize…</button>
    <button class="context-item" id="ctx-move-space" style="display:none">Move to space…</button>
    <button class="context-item" id="ctx-tab-group" style="display:none">Open as Tab Group</button>
    <button class="context-item danger" id="ctx-delete">Delete</button>`;
  // Re-bind context-menu events
  q('#ctx-rename').addEventListener('click', () => { if(ctxTarget?.rename){ctxTarget.rename();} hideCtx(); });
  q('#ctx-move-space').addEventListener('click', () => { if(ctxTarget?.moveToSpace){ctxTarget.moveToSpace();} hideCtx(); });
  q('#ctx-delete').addEventListener('click', () => { if(ctxTarget?.delete){ctxTarget.delete();} hideCtx(); });
  q('#ctx-tab-group').addEventListener('click', () => { if(ctxTarget?.tabGroup){ctxTarget.tabGroup();} hideCtx(); });
  q('#ctx-color').addEventListener('click', () => { const ccp=q('#ctx-color-picker'); if(ccp) ccp.style.display=ccp.style.display==='flex'?'none':'flex'; });
  q('#ctx-color-picker').addEventListener('click', e => { const sw=e.target.closest('.ctx-cp-swatch'); if(!sw) return; if(ctxTarget?.color) ctxTarget.color(sw.dataset.color||undefined); hideCtx(); });
  q('#ctx-customize').addEventListener('click', () => { if(ctxTarget?.customize){ctxTarget.customize();} hideCtx(); });
}

/* item 38: open all tabs in a new window */
function openColInNewWindow(col) {
  const urls = (col.tabs||[]).map(t=>t.url).filter(Boolean);
  if (!urls.length) { showSnack('No tabs to open.'); return; }
  if (typeof chrome !== 'undefined' && chrome.windows) {
    chrome.windows.create({ url: urls });
  } else {
    urls.forEach(u => window.open(u, '_blank'));
  }
}

/* item 49: open collection as Chrome tab group */
async function openAsTabGroup(col) {
  const urls = (col.tabs||[]).map(t=>t.url).filter(Boolean);
  if (!urls.length) { showSnack('No tabs to open.'); return; }
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    urls.forEach(u => window.open(u, '_blank')); return;
  }
  try {
    const tabIds = await Promise.all(urls.map(url => new Promise(res => chrome.tabs.create({ url, active:false }, t => res(t.id)))));
    if (chrome.tabs.group) {
      const groupId = await new Promise(res => chrome.tabs.group({ tabIds }, res));
      if (chrome.tabGroups?.update) chrome.tabGroups.update(groupId, { title: col.name, collapsed: false });
    }
    showSnack(`Opened "${col.name}" as tab group.`);
  } catch { urls.forEach(u => window.open(u, '_blank')); }
}

function buildCard(tab, col, sp) {
  const card = document.createElement('div');
  card.className = 'tab-card' + (tab.pinned ? ' pinned' : '');
  card.dataset.tabId = tab.id;
  card.dataset.colId = col.id;
  card.dataset.spId = sp.id;

  if (S.dndEnabled) {
    card.draggable = true;
    card.addEventListener('dragstart', onCardDragStart);
    card.addEventListener('dragend',   onCardDragEnd);
  }

  card.addEventListener('click', e => {
    if (e.target.closest('button') || e.target.closest('[contenteditable]') || e.target.closest('input')) return;
    try { window.open(tab.url, '_blank'); } catch {}
  });

  // remove btn
  const rm = document.createElement('button');
  rm.className = 'card-remove';
  rm.innerHTML = ic('x', 11);
  rm.addEventListener('click', e => { e.stopPropagation(); removeTab(sp.id, col.id, tab.id); });

  // body
  const body = document.createElement('div');
  body.className = 'card-body';

  // favicon
  const favRow = document.createElement('div');
  favRow.className = 'card-fav-row';
  favRow.appendChild(buildFav(tab.url, tab.favicon, 'card-fav'));

  // item 47: pin indicator
  if (tab.pinned) {
    const pinInd = document.createElement('span');
    pinInd.className = 'card-pin-indicator';
    pinInd.title = 'Pinned';
    pinInd.innerHTML = ic('pin', 10);
    favRow.appendChild(pinInd);
  }

  // item 42: note indicator
  if (tab.note) {
    const noteInd = document.createElement('span');
    noteInd.className = 'card-note-indicator';
    noteInd.title = tab.note;
    noteInd.innerHTML = ic('file-text', 10);
    favRow.appendChild(noteInd);
  }

  // title
  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = tab.title;
  title.addEventListener('dblclick', e => { e.stopPropagation(); editTabTitle(tab, title); });

  // url
  const url = document.createElement('div');
  url.className = 'card-url';
  url.textContent = domain(tab.url) || tab.url;

  // item 46: tag pills below url
  if ((tab.tags||[]).length) {
    const tagsRow = document.createElement('div');
    tagsRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;margin-top:3px';
    tab.tags.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.textContent = tag;
      tagsRow.appendChild(pill);
    });
    body.appendChild(favRow);
    body.appendChild(title);
    body.appendChild(url);
    body.appendChild(tagsRow);
  } else {
    body.appendChild(favRow);
    body.appendChild(title);
    body.appendChild(url);
  }

  // bottom actions
  const acts = document.createElement('div');
  acts.className = 'card-actions';

  const mkAct = (iconName, tip, fn) => {
    const b = document.createElement('button');
    b.className = 'card-act-btn';
    b.innerHTML = ic(iconName, 11);
    b.title = tip;
    b.addEventListener('click', e => { e.stopPropagation(); fn(); });
    return b;
  };

  acts.appendChild(mkAct('pencil',        'Edit tab',    () => openCardEditModal(tab, col, sp)));
  acts.appendChild(mkAct('copy',          'Copy URL',    () => { try { navigator.clipboard.writeText(tab.url); showSnack('URL copied!'); } catch {} }));
  acts.appendChild(mkAct('external-link', 'Open',        () => window.open(tab.url, '_blank')));

  // item 47: pin/unpin action
  const pinBtn = mkAct(tab.pinned ? 'pin-off' : 'pin', tab.pinned ? 'Unpin' : 'Pin to top', () => {
    tab.pinned = !tab.pinned;
    scheduleSave(); renderCollections();
  });
  if (tab.pinned) pinBtn.classList.add('hk-active');
  acts.appendChild(pinBtn);

  // Hotkey assign button
  const hkBtn = document.createElement('button');
  hkBtn.className = 'card-act-btn' + (tab.hotkey ? ' hk-active' : '');
  hkBtn.innerHTML = ic('keyboard', 11);
  hkBtn.title = tab.hotkey ? `Hotkey: ${comboLabel(tab.hotkey)} (click to change)` : 'Assign hotkey';
  hkBtn.addEventListener('click', e => { e.stopPropagation(); openHkModal(tab.id, col.id, sp.id); });
  acts.appendChild(hkBtn);

  // Hotkey badge shown in fav row (only when assigned)
  if (tab.hotkey) {
    const badge = document.createElement('span');
    badge.className = 'hotkey-badge';
    const slotNum = tab.hotkey.slot;
    badge.textContent = `Alt+${slotNum}`;
    badge.title = `Hotkey slot ${slotNum} (${SLOT_DEFAULT_KEYS[slotNum-1]}) — click to edit`;
    badge.addEventListener('click', e => { e.stopPropagation(); openHkModal(tab.id, col.id, sp.id); });
    favRow.appendChild(badge);
  }

  card.appendChild(rm);
  card.appendChild(body);
  card.appendChild(acts);
  return card;
}

function buildFav(url, saved, cls) {
  const src = saved || favUrl(url);
  if (!src) return buildFavFallback(url, cls);
  const img = document.createElement('img');
  img.className = cls;
  img.src = src;
  img.onerror = () => { const f=buildFavFallback(url,cls); img.parentNode?.replaceChild(f, img); };
  return img;
}

function buildFavFallback(url, cls) {
  const d = document.createElement('div');
  d.className = (cls==='card-fav') ? 'fav-fallback' : 'tab-fav-fallback';
  d.textContent = (domain(url)||'?')[0].toUpperCase();
  return d;
}

/* ============================================================
   COLLECTION ACTIONS
   ============================================================ */
function addCollection() {
  const sp = activeSpace();
  if (!sp) return;
  const col = { id:uid(), name:'New Collection', collapsed:false, tabs:[] };
  if (!sp.collections) sp.collections = [];
  sp.collections.unshift(col);
  scheduleSave();
  renderCollections();
  setTimeout(() => {
    const el = q('.collection');
    if (el) {
      const nm = el.querySelector('.col-name');
      if (nm) editInline(nm, col, 'name', renderCollections);
    }
  }, 30);
}

function deleteCol(spId, colId) {
  const sp = S.spaces.find(s=>s.id===spId); if (!sp) return;
  const idx = sp.collections.findIndex(c=>c.id===colId); if (idx===-1) return;
  undoBuf = { type:'col', spId, col:JSON.parse(JSON.stringify(sp.collections[idx])), idx };
  sp.collections.splice(idx,1);
  scheduleSave(); renderCollections();
  showSnack('Collection deleted.', true);
}

function restoreCollection(spId, colId) {
  const sp = S.spaces.find(s=>s.id===spId); if (!sp) return;
  const col = sp.collections?.find(c=>c.id===colId); if (!col) return;

  const urls = (col.tabs || [])
    .map(t => (t.url || '').trim())
    .filter(Boolean);

  if (!urls.length) {
    showSnack('This collection has no tabs to restore.');
    return;
  }

  let opened = 0;
  urls.forEach(url => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
      opened += 1;
    } catch {}
  });

  showSnack(`Restored ${opened} tab${opened !== 1 ? 's' : ''} from "${col.name}".`);
}

function editTabTitle(tab, el) {
  const orig = tab.title;
  el.contentEditable = 'true';
  el.style.webkitLineClamp = 'unset';
  el.focus();
  selAll(el);
  const done = () => {
    el.contentEditable = 'false';
    el.style.webkitLineClamp = '';
    const v = el.textContent.trim();
    if (v) { tab.title = v; scheduleSave(); }
    else el.textContent = orig;
  };
  el.addEventListener('keydown', e => { if (e.key==='Enter'||e.key==='Escape') { e.preventDefault(); done(); } }, { once:true });
  el.addEventListener('blur', done, { once:true });
}

function removeTab(spId, colId, tabId) {
  const sp = S.spaces.find(s=>s.id===spId); if (!sp) return;
  const col = sp.collections?.find(c=>c.id===colId); if (!col) return;
  const idx = col.tabs.findIndex(t=>t.id===tabId); if (idx===-1) return;
  undoBuf = { type:'tab', spId, colId, tab:col.tabs[idx], idx };
  col.tabs.splice(idx,1);
  scheduleSave(); renderCollections();
  showSnack('Tab removed.', true);
}

/* ============================================================
   CARD EDIT MODAL
   ============================================================ */
function openCardEditModal(tab, col, sp) {
  cardEditState = { tab, col, sp };
  cardAddState  = null;
  const titleEl = q('#card-edit-overlay-title');
  if (titleEl) titleEl.textContent = 'Edit Tab';
  q('#card-edit-title').value = tab.title || '';
  q('#card-edit-url').value = tab.url || '';
  const noteInput = q('#card-edit-note-input');
  if (noteInput) noteInput.value = tab.note || '';
  const tagsInput = q('#card-edit-tags-input');
  if (tagsInput) tagsInput.value = (tab.tags||[]).join(', ');
  // Show note/tags labels only in edit mode
  q('#card-edit-note-label') && (q('#card-edit-note-label').style.display = '');
  q('#card-edit-note-input') && (q('#card-edit-note-input').style.display = '');
  q('#card-edit-tags-label') && (q('#card-edit-tags-label').style.display = '');
  q('#card-edit-tags-input') && (q('#card-edit-tags-input').style.display = '');
  q('#card-edit-overlay').style.display = 'flex';
  setTimeout(() => { q('#card-edit-title').focus(); q('#card-edit-title').select(); }, 30);
}

function openAddTabModal(col, sp) {
  cardAddState  = { col, sp };
  cardEditState = null;
  const titleEl = q('#card-edit-overlay-title');
  if (titleEl) titleEl.textContent = 'Add Tab';
  q('#card-edit-title').value = '';
  q('#card-edit-url').value = '';
  const noteInput = q('#card-edit-note-input');
  if (noteInput) noteInput.value = '';
  const tagsInput = q('#card-edit-tags-input');
  if (tagsInput) tagsInput.value = '';
  // Hide note/tags in add mode for simplicity
  q('#card-edit-note-label') && (q('#card-edit-note-label').style.display = 'none');
  q('#card-edit-note-input') && (q('#card-edit-note-input').style.display = 'none');
  q('#card-edit-tags-label') && (q('#card-edit-tags-label').style.display = 'none');
  q('#card-edit-tags-input') && (q('#card-edit-tags-input').style.display = 'none');
  q('#card-edit-overlay').style.display = 'flex';
  setTimeout(() => { q('#card-edit-title').focus(); }, 30);
}

function saveCardEdit() {
  if (cardAddState) {
    const title  = q('#card-edit-title').value.trim();
    const rawUrl = q('#card-edit-url').value.trim();
    if (!title && !rawUrl) { showSnack('Enter a title and/or URL.'); return; }
    const url = rawUrl ? (/^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl) : '';
    const fallbackTitle = url ? (domain(url) || url) : 'New Tab';
    addTabToCol(cardAddState.sp.id, cardAddState.col.id, { title: title || fallbackTitle, url });
    showSnack('Tab added!');
    closeCardEditModal();
    return;
  }
  if (!cardEditState) return;
  const { tab } = cardEditState;
  const title = q('#card-edit-title').value.trim();
  const rawUrl = q('#card-edit-url').value.trim();
  if (title) tab.title = title;
  if (rawUrl) tab.url = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;
  // item 42: save note
  const noteInput = q('#card-edit-note-input');
  if (noteInput) { tab.note = noteInput.value.trim() || undefined; }
  // item 46: save tags
  const tagsInput = q('#card-edit-tags-input');
  if (tagsInput) {
    const raw = tagsInput.value.trim();
    tab.tags = raw ? raw.split(',').map(t=>t.trim()).filter(Boolean) : undefined;
  }
  scheduleSave();
  renderCollections();
  closeCardEditModal();
}

function closeCardEditModal() {
  q('#card-edit-overlay').style.display = 'none';
  cardEditState = null;
  cardAddState  = null;
}

/* ============================================================
   SPACE PICKER (cross-space collection move)
   ============================================================ */
function openSpacePicker(colId, spId) {
  const list = q('#space-picker-list');
  list.innerHTML = '';
  S.spaces.filter(s => s.id !== spId).forEach(s => {
    const item = document.createElement('div');
    item.className = 'space-picker-item';
    const dot = document.createElement('span');
    dot.className = 'space-dot';
    const nm = document.createElement('span');
    nm.textContent = s.name;
    item.append(dot, nm);
    item.addEventListener('click', () => { moveColToSpace(colId, spId, s.id); closeSpacePicker(); });
    list.appendChild(item);
  });
  q('#space-picker-overlay').style.display = 'flex';
}

function closeSpacePicker() {
  q('#space-picker-overlay').style.display = 'none';
}

/* ============================================================
   SPACE CUSTOMIZE MODAL
   ============================================================ */
const SPACE_COLORS = [
  '#7c6af5','#4f8ef7','#22d3ee','#4ade80',
  '#facc15','#fb923c','#f87171','#f472b6',
];
const SPACE_EMOJIS = ['🌐','📌','📚','💼','🔖','⭐','🎯','🚀','💡','🎨'];

let scSpaceId = null;
let scColor = null;
let scIcon  = null;

function openSpaceCustomize(spId) {
  const sp = S.spaces.find(s => s.id === spId);
  if (!sp) return;
  scSpaceId = spId;
  scColor = sp.color || null;
  scIcon  = sp.icon  || null;

  // Render color row
  const colorRow = q('#sc-color-row');
  colorRow.innerHTML = '';
  // "None" swatch
  const noneBtn = document.createElement('button');
  noneBtn.className = 'sc-swatch sc-swatch-none' + (!scColor ? ' selected' : '');
  noneBtn.textContent = '✕';
  noneBtn.title = 'No color';
  noneBtn.addEventListener('click', () => { scColor = null; renderScColors(); });
  colorRow.appendChild(noneBtn);
  SPACE_COLORS.forEach(hex => {
    const sw = document.createElement('button');
    sw.className = 'sc-swatch' + (scColor === hex ? ' selected' : '');
    sw.style.background = hex;
    sw.title = hex;
    sw.addEventListener('click', () => { scColor = hex; renderScColors(); });
    colorRow.appendChild(sw);
  });

  // Render emoji row
  const emojiRow = q('#sc-emoji-row');
  emojiRow.innerHTML = '';
  // "None" emoji
  const noneEm = document.createElement('button');
  noneEm.className = 'sc-emoji-btn' + (!scIcon ? ' selected' : '');
  noneEm.textContent = '✕';
  noneEm.title = 'No icon';
  noneEm.addEventListener('click', () => { scIcon = null; renderScEmojis(); });
  emojiRow.appendChild(noneEm);
  SPACE_EMOJIS.forEach(em => {
    const btn = document.createElement('button');
    btn.className = 'sc-emoji-btn' + (scIcon === em ? ' selected' : '');
    btn.textContent = em;
    btn.addEventListener('click', () => { scIcon = em; renderScEmojis(); });
    emojiRow.appendChild(btn);
  });

  q('#space-customize-overlay').style.display = 'flex';
}

function renderScColors() {
  const colorRow = q('#sc-color-row');
  colorRow.querySelectorAll('.sc-swatch').forEach(sw => {
    if (sw.classList.contains('sc-swatch-none')) {
      sw.classList.toggle('selected', !scColor);
    } else {
      sw.classList.toggle('selected', hexFromRgb(sw.style.background) === scColor);
    }
  });
}

function renderScEmojis() {
  const emojiRow = q('#sc-emoji-row');
  emojiRow.querySelectorAll('.sc-emoji-btn').forEach(btn => {
    const isNone = btn.textContent === '✕';
    btn.classList.toggle('selected', isNone ? !scIcon : btn.textContent === scIcon);
  });
}

/* Convert a CSS rgb() or rgba() string to a 6-digit hex string (#rrggbb). Returns
   the input unchanged if it doesn't match the expected format. */
function hexFromRgb(rgb) {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return rgb;
  return '#' + m.slice(0, 3).map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
}

function saveSpaceCustomize() {
  const sp = S.spaces.find(s => s.id === scSpaceId);
  if (sp) {
    if (scColor) sp.color = scColor; else delete sp.color;
    if (scIcon)  sp.icon  = scIcon;  else delete sp.icon;
    scheduleSave();
    renderSpaces();
  }
  closeSpaceCustomize();
}

function closeSpaceCustomize() {
  q('#space-customize-overlay').style.display = 'none';
  scSpaceId = null;
}

function moveColToSpace(colId, srcSpId, tgtSpId) {
  const srcSp = S.spaces.find(s => s.id === srcSpId);
  const tgtSp = S.spaces.find(s => s.id === tgtSpId);
  if (!srcSp || !tgtSp) return;
  const colIdx = srcSp.collections.findIndex(c => c.id === colId);
  if (colIdx === -1) return;
  const [col] = srcSp.collections.splice(colIdx, 1);
  if (!tgtSp.collections) tgtSp.collections = [];
  tgtSp.collections.unshift(col);
  scheduleSave();
  renderCollections();
  showSnack(`Collection moved to "${tgtSp.name}".`);
}

function addTabToCol(spId, colId, tabData) {
  const sp = S.spaces.find(s=>s.id===spId); if (!sp) return;
  const col = sp.collections?.find(c=>c.id===colId); if (!col) return;
  if (!col.tabs) col.tabs = [];
  col.tabs.push({ id:uid(), title:tabData.title||tabData.url||'Untitled', url:tabData.url||'', favicon:favUrl(tabData.url||'') });
  scheduleSave(); renderCollections();
}

/* ============================================================
   VIEW MODE
   ============================================================ */
function setViewMode(mode) {
  const sp = activeSpace(); if (!sp) return;
  S.viewModes[sp.id] = mode;
  scheduleSave(); renderCollections(); renderViewMenu();
}

function renderViewMenu() {
  const vm = viewMode();
  const modes = [
    { key:'card',    label:'Card',    ic:'layout-grid' },
    { key:'compact', label:'Compact', ic:'layout-list' },
    { key:'list',    label:'List',    ic:'list' },
    { key:'grid',    label:'Grid',    ic:'grid' },
  ];
  const menu = q('#view-menu');
  menu.innerHTML = '';
  modes.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'dropdown-item' + (m.key===vm ? ' active' : '');
    btn.dataset.viewMode = m.key;
    btn.innerHTML = ic(m.ic, 13) + ' ' + m.label;
    btn.addEventListener('click', () => { setViewMode(m.key); menu.classList.remove('open'); });
    menu.appendChild(btn);
  });
  const iconMap = { card:'layout-grid', compact:'layout-list', list:'list', grid:'grid' };
  q('#view-trigger').innerHTML = ic(iconMap[vm]||'layout-grid', 12) + ' VIEW ' + ic('chevron-down', 10);
}

function updateDndBtn() {
  const btn = q('#btn-dnd-toggle');
  btn.innerHTML = ic('grip-vertical', 12) + ' DnD';
  btn.classList.toggle('dnd-on', S.dndEnabled);
}

/* ============================================================
   SEARCH
   ============================================================ */
function handleSearch(val) {
  searchQ = val.trim().toLowerCase();
  q('#search-clear').style.display = searchQ ? 'flex' : 'none';
  if (S.activeNav !== 'collections') updateNavActive('collections');
  renderCollections();
}

function renderSearchResults(area, vm) {
  const results = [];
  S.spaces.forEach(sp => {
    (sp.collections||[]).forEach(col => {
      (col.tabs||[]).forEach(tab => {
        if (tab.title.toLowerCase().includes(searchQ) || tab.url.toLowerCase().includes(searchQ)) {
          results.push({ sp, col, tab });
        }
      });
    });
  });

  const hd = document.createElement('div');
  hd.className = 'search-results-hd';
  hd.textContent = `${results.length} result${results.length!==1?'s':''} for "${searchQ}"`;
  area.appendChild(hd);

  if (!results.length) {
    const e=document.createElement('div'); e.className='col-empty'; e.textContent='No tabs found.'; area.appendChild(e); return;
  }

  // group by col
  const map = {};
  results.forEach(r => {
    const k=r.sp.id+'_'+r.col.id;
    if (!map[k]) map[k]={sp:r.sp,col:r.col,tabs:[]};
    map[k].tabs.push(r.tab);
  });
  Object.values(map).forEach(({sp,col,tabs}) => {
    const fakeCol = {...col, tabs, collapsed:false};
    const el = buildColEl(fakeCol, sp, vm);
    // highlight
    el.querySelectorAll('.card-title,.card-url').forEach(span => {
      span.innerHTML = hilite(span.textContent, searchQ);
    });
    area.appendChild(el);
  });
}

function hilite(text, q) {
  const esc = text.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
  return esc.replace(re, m=>`<mark>${m}</mark>`);
}

/* ============================================================
   DRAG & DROP
   ============================================================ */

// Tracks where inside a collection the card should be inserted
let dropInsert = null; // { colId, beforeTabId } — beforeTabId=null means append

function initDropZones() {
  qa('.drop-zone').forEach(dz => {
    dz.addEventListener('dragover', e => {
      if (!S.dndEnabled || !dragData) return;
      e.preventDefault();
      // Only highlight the zone border when dragging from open-tabs panel
      // (card reordering uses per-card indicators instead)
      if (dragData.type === 'open-tab') {
        dz.classList.add('drop-active');
      }
    });
    dz.addEventListener('dragleave', e => {
      if (!dz.contains(e.relatedTarget)) {
        dz.classList.remove('drop-active');
      }
    });
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('drop-active');
      clearDropIndicators();
      if (!dragData || dragData.type === 'collection') return;
      handleDrop(dz.dataset.spId, dz.dataset.colId);
    });
  });

  // Per-card dragover for within-collection reordering
  qa('.tab-card').forEach(card => {
    card.addEventListener('dragover', e => {
      if (!S.dndEnabled || !dragData || dragData.type !== 'card') return;
      e.preventDefault();
      e.stopPropagation();

      const colId = card.dataset.colId;
      const tabId = card.dataset.tabId;

      // Determine insert before or after based on horizontal cursor position
      const rect = card.getBoundingClientRect();
      // In list view use vertical axis, otherwise horizontal
      const isListView = card.closest('.view-list');
      const before = isListView
        ? (e.clientY - rect.top) < rect.height / 2
        : (e.clientX - rect.left) < rect.width / 2;

      clearDropIndicators();
      card.classList.add(before ? 'drop-before' : 'drop-after');
      dropInsert = { colId, beforeTabId: before ? tabId : null, afterTabId: before ? null : tabId };
    });

    card.addEventListener('dragleave', e => {
      if (!card.contains(e.relatedTarget)) {
        card.classList.remove('drop-before', 'drop-after');
      }
    });

    card.addEventListener('drop', e => {
      e.preventDefault();
      clearDropIndicators();
      if (!dragData || dragData.type === 'collection') return;
      e.stopPropagation(); // only stop propagation for non-collection drops
      const spId = card.dataset.spId;
      const colId = card.dataset.colId;
      handleDrop(spId, colId);
    });
  });

  // Collection reordering drop zones
  qa('.collection').forEach(colEl => {
    colEl.addEventListener('dragover', e => {
      if (!S.dndEnabled || !dragData || dragData.type !== 'collection') return;
      if (colEl.dataset.id === dragData.colId) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = colEl.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      clearColDropIndicators();
      colEl.classList.add(before ? 'col-drop-before' : 'col-drop-after');
      colDropTarget = { colId: colEl.dataset.id, before };
    });

    colEl.addEventListener('dragleave', e => {
      if (dragData?.type !== 'collection') return;
      if (!e.relatedTarget || !colEl.contains(e.relatedTarget)) {
        colEl.classList.remove('col-drop-before', 'col-drop-after');
      }
    });

    colEl.addEventListener('drop', e => {
      if (!dragData || dragData.type !== 'collection') return;
      e.preventDefault();
      e.stopPropagation();
      clearColDropIndicators();
      handleCollectionReorder();
    });
  });
}

function clearDropIndicators() {
  qa('.tab-card.drop-before, .tab-card.drop-after').forEach(c => {
    c.classList.remove('drop-before', 'drop-after');
  });
  qa('.drop-zone.drop-active').forEach(z => z.classList.remove('drop-active'));
}

function clearColDropIndicators() {
  qa('.collection.col-drop-before, .collection.col-drop-after').forEach(c => {
    c.classList.remove('col-drop-before', 'col-drop-after');
  });
}

function handleCollectionReorder() {
  if (!dragData || dragData.type !== 'collection' || !colDropTarget) {
    dragData = null; colDropTarget = null; return;
  }
  const sp = S.spaces.find(s => s.id === dragData.spId);
  if (!sp) { dragData = null; colDropTarget = null; return; }

  const cols = sp.collections;
  const srcIdx = cols.findIndex(c => c.id === dragData.colId);
  if (srcIdx === -1) { dragData = null; colDropTarget = null; return; }

  const [moved] = cols.splice(srcIdx, 1);
  const tgtIdx = cols.findIndex(c => c.id === colDropTarget.colId);
  if (tgtIdx === -1) {
    cols.push(moved);
  } else {
    cols.splice(colDropTarget.before ? tgtIdx : tgtIdx + 1, 0, moved);
  }

  scheduleSave();
  renderCollections();
  dragData = null;
  colDropTarget = null;
}

function handleDrop(targetSpId, targetColId) {
  if (!dragData) return;

  if (dragData.type === 'open-tab') {
    addTabToCol(targetSpId, targetColId, { title:dragData.title, url:dragData.url });
    showSnack('Tab added to collection.');

  } else if (dragData.type === 'card') {
    const srcR = findCol(dragData.colId);
    if (!srcR) { dragData=null; dropInsert=null; return; }

    const srcIdx = srcR.col.tabs.findIndex(t=>t.id===dragData.tabId);
    if (srcIdx === -1) { dragData=null; dropInsert=null; return; }

    const isSameCol = dragData.colId === targetColId;

    if (isSameCol) {
      // Reorder within the same collection
      if (!dropInsert || dropInsert.colId !== targetColId) { dragData=null; dropInsert=null; return; }

      const tabs = srcR.col.tabs;
      const [moved] = tabs.splice(srcIdx, 1);

      const refId = dropInsert.beforeTabId || dropInsert.afterTabId;
      let insertIdx = tabs.findIndex(t => t.id === refId);

      if (insertIdx === -1) {
        // append
        tabs.push(moved);
      } else {
        if (dropInsert.afterTabId) insertIdx += 1;
        tabs.splice(insertIdx, 0, moved);
      }

    } else {
      // Move to a different collection
      const [moved] = srcR.col.tabs.splice(srcIdx, 1);
      const tgtR = findCol(targetColId);
      if (!tgtR) { srcR.col.tabs.splice(srcIdx, 0, moved); dragData=null; dropInsert=null; return; }
      if (!tgtR.col.tabs) tgtR.col.tabs = [];

      if (dropInsert && dropInsert.colId === targetColId) {
        const refId = dropInsert.beforeTabId || dropInsert.afterTabId;
        let insertIdx = tgtR.col.tabs.findIndex(t => t.id === refId);
        if (insertIdx === -1) {
          tgtR.col.tabs.push(moved);
        } else {
          if (dropInsert.afterTabId) insertIdx += 1;
          tgtR.col.tabs.splice(insertIdx, 0, moved);
        }
      } else {
        tgtR.col.tabs.push(moved);
      }
    }

    scheduleSave();
    renderCollections();
  }

  dragData = null;
  dropInsert = null;
}

function onCardDragStart(e) {
  if (!S.dndEnabled) { e.preventDefault(); return; }
  const c = e.currentTarget;
  dragData = { type:'card', tabId:c.dataset.tabId, colId:c.dataset.colId, spId:c.dataset.spId };
  c.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain', c.dataset.tabId);
  e.stopPropagation(); // prevent bubbling to .collection dragstart which would cancel this drag
}

function onCardDragEnd(e) { e.currentTarget.classList.remove('dragging'); }

/* ============================================================
   OPEN TABS
   ============================================================ */
async function loadOpenTabs() {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      openTabs = await new Promise(res => chrome.tabs.query({}, tabs => res(tabs||[])));
    } else {
      // Demo data when not in extension
      openTabs = [
        { id:1, windowId:1, title:'Google',  url:'https://www.google.com',  favIconUrl:'' },
        { id:2, windowId:1, title:'GitHub',  url:'https://github.com',       favIconUrl:'' },
        { id:3, windowId:1, title:'YouTube', url:'https://www.youtube.com',  favIconUrl:'' },
        { id:4, windowId:2, title:'Reddit',  url:'https://www.reddit.com',   favIconUrl:'' },
        { id:5, windowId:2, title:'HN',      url:'https://news.ycombinator.com', favIconUrl:'' },
      ];
    }
  } catch { openTabs = []; }
  renderOpenTabs();
}

function renderOpenTabs() {
  const list = q('#open-tabs-list');
  list.innerHTML = '';

  const visibleTabs = openTabs.filter(t => !isTabFlowTab(t));

  if (!visibleTabs.length) {
    const e=document.createElement('div');
    e.style.cssText='padding:14px 10px;font-size:12px;color:var(--text-faint)';
    e.textContent='No open tabs found.';
    list.appendChild(e); return;
  }

  // group by window
  const wins = {};
  visibleTabs.forEach(t => { (wins[t.windowId]||(wins[t.windowId]=[])).push(t); });

  let wi=1;
  Object.entries(wins).forEach(([wid, tabs]) => {
    const g = document.createElement('div');
    g.className = 'win-group';

    const hdr = document.createElement('div');
    hdr.className = 'win-group-hdr';

    const chevWrap = document.createElement('span');
    chevWrap.className = 'win-chevron';
    chevWrap.innerHTML = ic('chevron-down', 12);

    const monIcon = document.createElement('span');
    monIcon.innerHTML = ic('monitor', 12);

    const lbl = document.createElement('span');
    lbl.textContent = `Window ${wi++} (${tabs.length})`;

    const saveWin = document.createElement('button');
    saveWin.className = 'save-win-btn';
    saveWin.title = 'Save window as collection';
    saveWin.innerHTML = ic('download', 11);
    saveWin.addEventListener('click', e => { e.stopPropagation(); saveWindowAsCol(tabs); });

    hdr.appendChild(chevWrap);
    hdr.appendChild(monIcon);
    hdr.appendChild(lbl);
    hdr.appendChild(saveWin);
    hdr.addEventListener('click', () => { g.classList.toggle('collapsed'); });

    const tabsWrap = document.createElement('div');
    tabsWrap.className = 'win-tabs-wrap';
    tabs.forEach(tab => tabsWrap.appendChild(buildTabRow(tab)));

    g.appendChild(hdr);
    g.appendChild(tabsWrap);
    list.appendChild(g);
  });
}

function buildTabRow(tab) {
  const row = document.createElement('div');
  row.className = 'tab-row';
  if (S.dndEnabled) {
    row.draggable = true;
    row.addEventListener('dragstart', e => {
      dragData = { type:'open-tab', title:tab.title, url:tab.url };
      row.classList.add('dragging-src');
      e.dataTransfer.effectAllowed='copy';
      e.dataTransfer.setData('text/plain', tab.url);
    });
    row.addEventListener('dragend', () => row.classList.remove('dragging-src'));
  }

  row.addEventListener('click', () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.update(tab.id, { active:true });
        chrome.windows.update(tab.windowId, { focused:true });
      } else window.open(tab.url,'_blank');
    } catch {}
  });

  const makeTabListFallback = () => {
    const fallbackImg = document.createElement('img');
    fallbackImg.src = 'icons/icon16.png';
    fallbackImg.alt = '';
    fallbackImg.onerror = () => {
      const f = buildFavFallback(tab.url, 'tab-fav');
      fallbackImg.parentNode?.replaceChild(f, fallbackImg);
    };
    return fallbackImg;
  };

  const isTabFlowPage = (() => {
    const u = (tab.url || '').toLowerCase();
    const t = (tab.title || '').toLowerCase();
    return u.includes('/newtab.html') || u.startsWith('chrome-extension://') || t.includes('tabflow');
  })();

  const src = tab.favIconUrl || favUrl(tab.url);
  let fav;
  if (isTabFlowPage) {
    fav = makeTabListFallback();
  } else if (src) {
    fav = document.createElement('img');
    fav.src = src;
    fav.alt = '';
    fav.onerror = () => {
      const f = makeTabListFallback();
      fav.parentNode?.replaceChild(f, fav);
    };
  } else {
    fav = makeTabListFallback();
  }

  const title = document.createElement('span');
  title.className = 'tab-row-title';
  title.textContent = tab.title || tab.url;
  title.title = tab.url;

  row.appendChild(fav);
  row.appendChild(title);
  return row;
}

function setupTabListeners() {
  try {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    const refresh = () => loadOpenTabs();
    chrome.tabs.onCreated.addListener(refresh);
    chrome.tabs.onRemoved.addListener(refresh);
    chrome.tabs.onUpdated.addListener((_,info) => {
      if (info.status==='complete'||info.title||info.favIconUrl) refresh();
    });
  } catch {}
}

/* ============================================================
   RECENTLY CLOSED TABS (item 54)
   ============================================================ */
async function renderRecentlyClosed() {
  const list = q('#recently-closed-list');
  if (!list) return;
  list.innerHTML = '';
  if (typeof chrome === 'undefined' || !chrome.sessions) {
    list.style.display = 'none'; return;
  }
  let sessions;
  try { sessions = await new Promise(res => chrome.sessions.getRecentlyClosed({ maxResults: 10 }, res)); }
  catch { list.style.display = 'none'; return; }
  const tabs = (sessions || []).flatMap(s => s.tab ? [s.tab] : []);
  if (!tabs.length) {
    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:12px;color:var(--text-faint);padding:6px 10px';
    msg.textContent = 'No recently closed tabs.';
    list.appendChild(msg); return;
  }
  tabs.forEach(tab => {
    const row = document.createElement('div');
    row.className = 'tab-row';
    const src = tab.favIconUrl || favUrl(tab.url || '');
    const fav = src ? Object.assign(document.createElement('img'), { src, alt:'' }) : buildFavFallback(tab.url || '', 'tab-fav');
    if (fav.tagName === 'IMG') fav.onerror = () => { const f=buildFavFallback(tab.url||'','tab-fav'); fav.parentNode?.replaceChild(f,fav); };
    const title = document.createElement('span');
    title.className = 'tab-row-title'; title.textContent = tab.title || tab.url || '(unknown)'; title.title = tab.url || '';
    const restBtn = document.createElement('button');
    restBtn.className = 'save-win-btn'; restBtn.title = 'Restore tab';
    restBtn.innerHTML = ic('external-link', 11);
    restBtn.addEventListener('click', e => {
      e.stopPropagation();
      try {
        if (tab.sessionId) chrome.sessions.restore(tab.sessionId);
        else if (tab.url) chrome.tabs.create({ url: tab.url });
      } catch { if (tab.url) window.open(tab.url, '_blank'); }
    });
    row.addEventListener('click', () => {
      try {
        if (tab.sessionId) chrome.sessions.restore(tab.sessionId);
        else if (tab.url) chrome.tabs.create({ url: tab.url });
      } catch { if (tab.url) window.open(tab.url, '_blank'); }
    });
    row.append(fav, title, restBtn);
    list.appendChild(row);
  });
}

/* ============================================================
   SESSION SAVE
   ============================================================ */
function saveSession() {
  if (!openTabs.length) { showSnack('No open tabs to save.'); return; }
  const sp = activeSpace(); if (!sp) return;
  const now=new Date();
  const label=now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const time=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  const col={ id:uid(), name:`Session – ${label} ${time}`, collapsed:false,
    tabs:openTabs.map(t=>({ id:uid(), title:t.title||t.url, url:t.url, favicon:favUrl(t.url) })) };
  if (!sp.collections) sp.collections=[];
  sp.collections.unshift(col);
  scheduleSave(); renderCollections();
  showSnack(`Saved ${openTabs.length} tabs as session.`);
}

function saveWindowAsCol(tabs) {
  const sp=activeSpace(); if(!sp) return;
  const now=new Date();
  const label=now.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const time=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  const col={ id:uid(), name:`Window – ${label} ${time}`, collapsed:false,
    tabs:tabs.map(t=>({ id:uid(), title:t.title||t.url, url:t.url, favicon:favUrl(t.url) })) };
  if(!sp.collections) sp.collections=[];
  sp.collections.unshift(col);
  scheduleSave(); renderCollections();
  showSnack(`Saved ${tabs.length} tabs.`);
}

/* ============================================================
   COLLAPSE / EXPAND ALL
   ============================================================ */
function expandAll()  { activeSpace()?.collections?.forEach(c=>c.collapsed=false); scheduleSave(); renderCollections(); }
function collapseAll(){ activeSpace()?.collections?.forEach(c=>c.collapsed=true);  scheduleSave(); renderCollections(); }

/* ============================================================
   LINKS
   ============================================================ */
function renderLinks() {
  const el=q('#links-list'); el.innerHTML='';
  (S.links||[]).forEach((lnk,i) => {
    const row=document.createElement('div'); row.className='link-item';
    const nm=document.createElement('span'); nm.className='link-name'; nm.textContent=lnk.name;
    nm.addEventListener('click',()=>{ try{window.open(lnk.url,'_blank')}catch{} });
    const url=document.createElement('span'); url.className='link-url'; url.textContent=lnk.url;
    // item 33: edit button → inline edit form
    const editBtn=document.createElement('button'); editBtn.className='link-del'; editBtn.innerHTML=ic('pencil',11); editBtn.title='Edit';
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      // toggle inline form
      const existing = row.querySelector('.link-edit-form');
      if (existing) { row.removeChild(existing); return; }
      const form=document.createElement('div'); form.className='link-edit-form';
      const nIn=document.createElement('input'); nIn.value=lnk.name; nIn.placeholder='Name';
      const uIn=document.createElement('input'); uIn.value=lnk.url; uIn.placeholder='https://…';
      const save=document.createElement('button'); save.className='accent-btn'; save.style.fontSize='11px'; save.style.padding='3px 8px'; save.textContent='Save';
      save.addEventListener('click', () => {
        const n=nIn.value.trim(), u=uIn.value.trim();
        if(!n||!u){showSnack('Enter both name and URL.');return;}
        lnk.name=n; lnk.url=u.startsWith('http')?u:'https://'+u;
        scheduleSave(); renderLinks();
      });
      const cancel=document.createElement('button'); cancel.className='settings-btn'; cancel.style.fontSize='11px'; cancel.style.padding='3px 8px'; cancel.textContent='Cancel';
      cancel.addEventListener('click',()=>row.removeChild(form));
      form.append(nIn,uIn,save,cancel);
      row.appendChild(form);
      nIn.focus(); nIn.select();
    });
    const del=document.createElement('button'); del.className='link-del'; del.innerHTML=ic('x',11);
    del.addEventListener('click',()=>{ S.links.splice(i,1); scheduleSave(); renderLinks(); });
    row.append(nm,url,editBtn,del); el.appendChild(row);
  });
}

function addLink() {
  const n=q('#link-name-input').value.trim(), u=q('#link-url-input').value.trim();
  if(!n||!u){showSnack('Enter both name and URL.');return;}
  const url=u.startsWith('http')?u:'https://'+u;
  if(!S.links) S.links=[];
  S.links.push({id:uid(),name:n,url});
  q('#link-name-input').value=''; q('#link-url-input').value='';
  scheduleSave(); renderLinks();
}

/* ============================================================
   NEXT
   ============================================================ */
function renderNextItems() {
  const el=q('#next-list'); el.innerHTML='';
  (S.nextItems||[]).forEach((item,i)=>{
    const row=document.createElement('div'); row.className='next-item'+(item.done?' done':'');
    row.dataset.idx = i;

    // item 34: drag handle for reordering
    const dh = document.createElement('span'); dh.className = 'next-drag-handle';
    dh.innerHTML = ic('grip-vertical', 11);
    let nextDhActive = false;
    dh.addEventListener('mousedown', e => { e.stopPropagation(); nextDhActive = true; });

    row.draggable = true;
    row.addEventListener('dragstart', e => {
      if (!nextDhActive) { e.preventDefault(); return; }
      nextDhActive = false;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(i));
      row.classList.add('dragging-src');
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging-src');
      el.querySelectorAll('.next-item').forEach(n => n.style.borderTop = '');
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      el.querySelectorAll('.next-item').forEach(n => n.style.borderTop = '');
      row.style.borderTop = '2px solid var(--accent)';
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      if (isNaN(fromIdx) || fromIdx === i) return;
      const [moved] = S.nextItems.splice(fromIdx, 1);
      // After splicing, `i` may have shifted down by 1 if fromIdx < i
      const insertAt = fromIdx < i ? i - 1 : i;
      S.nextItems.splice(insertAt, 0, moved);
      scheduleSave(); renderNextItems();
    });

    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!item.done;
    cb.addEventListener('change',()=>{ S.nextItems[i].done=cb.checked; scheduleSave(); renderNextItems(); });
    const title=document.createElement('span'); title.className='next-title'; title.textContent=item.title; title.title=item.url||'';
    if(item.url) title.addEventListener('click',()=>{ try{window.open(item.url,'_blank')}catch{} });
    const del=document.createElement('button'); del.className='next-del'; del.innerHTML=ic('x',11);
    del.addEventListener('click',()=>{ S.nextItems.splice(i,1); scheduleSave(); renderNextItems(); });
    row.append(dh,cb,title,del); el.appendChild(row);
  });
}

function addNext() {
  const t=q('#next-title-input').value.trim(), u=q('#next-url-input').value.trim();
  if(!t){showSnack('Enter a title.');return;}
  if(!S.nextItems) S.nextItems=[];
  S.nextItems.push({id:uid(),title:t,url:u,done:false});
  q('#next-title-input').value=''; q('#next-url-input').value='';
  scheduleSave(); renderNextItems();
}

/* ============================================================
   SETTINGS — STATE DEFAULTS
   ============================================================ */
const SETTING_DEFAULTS = {
  theme: 'dark',
  accent: '#7c6af5',
  font: 'Inter',
  fontSize: 'normal',
  fontWeight: 'normal',
  borderRadius: 8,
  cardGap: 8,
  cardMinWidth: 140,
  sidebarWidth: 220,
  defaultView: 'card',
  shadowIntensity: 'medium',
  cardHover: 'glow',
  animSpeed: 'normal',
  bgPattern: 'none',
  cardStyle: 'default',
  scrollbar: 'thin',
  customThemes: [],
  bgStyle: 'solid',
  customBgColor: '',
  toolbarStyle: 'default',
  cardDensity: 'comfortable',
  sidebarStyle: 'default',
  customCss: '',
  showClock: 'off',
};

const FONTS = [
  { key:'Inter',            label:'Inter',            sample:'The quick brown fox' },
  { key:'Plus Jakarta Sans',label:'Jakarta Sans',     sample:'The quick brown fox' },
  { key:'DM Sans',          label:'DM Sans',          sample:'The quick brown fox' },
  { key:'Nunito',           label:'Nunito',           sample:'The quick brown fox' },
  { key:'Outfit',           label:'Outfit',           sample:'The quick brown fox' },
  { key:'Syne',             label:'Syne',             sample:'The quick brown fox' },
  { key:'IBM Plex Sans',    label:'IBM Plex',         sample:'The quick brown fox' },
  { key:'JetBrains Mono',   label:'JetBrains Mono',  sample:'The quick brown fox' },
];

// Color slots for the custom theme editor
const THEME_SLOTS = [
  { key:'--bg',            label:'Background' },
  { key:'--sidebar-bg',    label:'Sidebar' },
  { key:'--main-bg',       label:'Main Area' },
  { key:'--card-bg',       label:'Card' },
  { key:'--card-hover',    label:'Card Hover' },
  { key:'--border',        label:'Border' },
  { key:'--text',          label:'Text' },
  { key:'--text-muted',    label:'Text Muted' },
  { key:'--text-faint',    label:'Text Faint' },
  { key:'--divider',       label:'Divider' },
  { key:'--sidebar-active',label:'Active Item' },
  { key:'--input-bg',      label:'Input BG' },
];

// Working copy for the editor
let teColors = {};

/* ============================================================
   APPLY ALL SETTINGS TO DOM
   ============================================================ */
function applyAllSettings() {
  applyTheme(S.theme);
  applyAccent(S.accent);
  applyFont(S.font);
  applyFontSize(S.fontSize);
  applyFontWeight(S.fontWeight);
  applyBorderRadius(S.borderRadius);
  applyCardGap(S.cardGap);
  applyCardMinWidth(S.cardMinWidth);
  applySidebarWidth(S.sidebarWidth);
  applyBgPattern(S.bgPattern);
  applyCardStyle(S.cardStyle);
  applyCardHover(S.cardHover);
  applyShadow(S.shadowIntensity);
  applyAnimSpeed(S.animSpeed);
  applyScrollbar(S.scrollbar);
  applyBgStyle(S.bgStyle, S.customBgColor);
  applyToolbarStyle(S.toolbarStyle);
  applyCardDensity(S.cardDensity);
  applySidebarStyle(S.sidebarStyle);
  applyCustomCss(S.customCss);
  applyClockVisibility(S.showClock);
}

function applyFont(font) {
  // Load the font via Google Fonts if not Inter (already loaded)
  if (font !== 'Inter') {
    const id = 'gf-' + font.replace(/\s/g,'-');
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      const enc = font.replace(/\s/g,'+');
      link.href = `https://fonts.googleapis.com/css2?family=${enc}:wght@400;500;600&display=swap`;
      document.head.appendChild(link);
    }
  }
  document.documentElement.style.setProperty('--font', `'${font}', system-ui, sans-serif`);
  document.body.style.fontFamily = `'${font}', system-ui, sans-serif`;
}

function applyFontSize(size) {
  const map = { small: '12px', normal: '13px', large: '14px' };
  document.documentElement.style.setProperty('--font-size-base', map[size] || '13px');
  document.body.style.fontSize = map[size] || '13px';
}

function applyFontWeight(weight) {
  const map = { light: '300', normal: '400', medium: '500' };
  document.documentElement.style.setProperty('--font-weight-base', map[weight] || '400');
}

function applyBorderRadius(r) {
  document.documentElement.style.setProperty('--radius', r + 'px');
}

function applyCardGap(g) {
  document.documentElement.style.setProperty('--card-gap', g + 'px');
  // update rendered cards-wrap gap
  document.querySelectorAll('.cards-wrap').forEach(el => el.style.gap = g + 'px');
}

function applyCardMinWidth(w) {
  document.documentElement.style.setProperty('--card-min-w', w + 'px');
  document.querySelectorAll('.tab-card, .add-tab-card').forEach(el => {
    if (!el.closest('.view-list')) el.style.minWidth = w + 'px';
  });
}

function applySidebarWidth(w) {
  const app = q('#app');
  const collapsed = app.classList.contains('sidebar-collapsed');
  const rightHidden = app.classList.contains('right-hidden');
  const sidebar = q('#sidebar');
  const sidebarWidth = collapsed ? 0 : w;
  const right = rightHidden ? '0px' : '240px';

  app.style.gridTemplateColumns = `${sidebarWidth}px minmax(0, 1fr) ${right}`;

  // Collapse visually without removing the grid item; otherwise grid placement jumps.
  sidebar.style.display = 'flex';
  sidebar.style.width = sidebarWidth + 'px';
  sidebar.style.minWidth = sidebarWidth + 'px';
  document.documentElement.style.setProperty('--sidebar-w', w + 'px');
}

function applyBgPattern(pat) {
  const main = q('#main-content');
  main.classList.remove('bg-dots','bg-grid','bg-noise','bg-topography','bg-hexagons','bg-diamonds','bg-crosshatch','bg-waves','bg-circles');
  if (pat !== 'none') main.classList.add('bg-' + pat);
}

function applyCardStyle(style) {
  document.body.classList.remove('card-glass','card-flat','card-outline');
  if (style !== 'default') document.body.classList.add('card-' + style);
}

function applyCardHover(hover) {
  document.body.classList.remove('hover-none','hover-lift','hover-glow','hover-border');
  document.body.classList.add('hover-' + hover);
}

function applyShadow(intensity) {
  document.body.classList.remove('shadow-none','shadow-soft','shadow-medium','shadow-strong');
  document.body.classList.add('shadow-' + intensity);
}

function applyAnimSpeed(speed) {
  document.body.classList.remove('anim-off','anim-fast','anim-normal','anim-slow');
  document.body.classList.add('anim-' + speed);
}

function applyScrollbar(style) {
  document.body.classList.remove('scroll-thin','scroll-normal','scroll-hidden');
  document.body.classList.add('scroll-' + style);
}

function applyBgStyle(style, customColor) {
  const main = q('#main-content');
  main.classList.remove('bg-style-gradient-diag','bg-style-gradient-radial','bg-style-gradient-sunset');
  main.style.backgroundColor = '';
  if (style === 'gradient-diag')    main.classList.add('bg-style-gradient-diag');
  else if (style === 'gradient-radial')  main.classList.add('bg-style-gradient-radial');
  else if (style === 'gradient-sunset')  main.classList.add('bg-style-gradient-sunset');
  else if (style === 'custom' && customColor) main.style.backgroundColor = customColor;
}

function applyToolbarStyle(style) {
  const toolbar = q('#toolbar');
  if (!toolbar) return;
  toolbar.classList.remove('toolbar-minimal','toolbar-floating','toolbar-glass');
  if (style !== 'default') toolbar.classList.add('toolbar-' + style);
}

function applyCardDensity(density) {
  document.body.classList.remove('density-comfortable','density-cozy','density-compact');
  document.body.classList.add('density-' + density);
}

function applySidebarStyle(style) {
  document.body.classList.remove('sidebar-glass','sidebar-bordered','sidebar-seamless');
  if (style !== 'default') document.body.classList.add('sidebar-' + style);
}

function applyCustomCss(css) {
  let el = document.getElementById('custom-css');
  if (!el) {
    el = document.createElement('style');
    el.id = 'custom-css';
    document.head.appendChild(el);
  }
  el.textContent = css || '';
}

/* item 55: clock widget */
function applyClockVisibility(val) {
  const cw = q('#clock-widget');
  if (!cw) return;
  cw.classList.toggle('hidden', val !== 'on');
  if (val === 'on') startClock();
  else stopClock();
}

function startClock() {
  if (clockInterval) return;
  const tick = () => {
    const now = new Date();
    const timeEl = q('#clock-time');
    const dateEl = q('#clock-date');
    const greetEl = q('#clock-greeting');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });
    if (greetEl) {
      const h = now.getHours();
      greetEl.textContent = h < 12 ? 'Good morning ☀️' : h < 17 ? 'Good afternoon 🌤️' : 'Good evening 🌙';
    }
  };
  tick();
  clockInterval = setInterval(tick, 1000);
}

function stopClock() {
  clearInterval(clockInterval);
  clockInterval = null;
}

/* ============================================================
   SETTINGS — RENDER ALL TABS
   ============================================================ */
function renderSettings() {
  renderSettingsThemes();
  renderCustomThemes();
  renderSettingsAccents();
  renderFontGrid();
  renderPills('#fontsize-pills',   'fontSize',       S.fontSize);
  renderPills('#fontweight-pills', 'fontWeight',     S.fontWeight);
  renderSlider('#sl-radius',  '#sl-radius-val',  'borderRadius',  S.borderRadius,  v=>v+'px');
  renderSlider('#sl-gap',     '#sl-gap-val',     'cardGap',       S.cardGap,       v=>v+'px');
  renderSlider('#sl-cardw',   '#sl-cardw-val',   'cardMinWidth',  S.cardMinWidth,  v=>v+'px');
  renderSlider('#sl-sidebar', '#sl-sidebar-val', 'sidebarWidth',  S.sidebarWidth,  v=>v+'px');
  renderPills('#defview-pills',       'defaultView',    S.defaultView);
  renderPills('#shadow-pills',        'shadowIntensity',S.shadowIntensity);
  renderPills('#hover-pills',         'cardHover',      S.cardHover);
  renderPills('#anim-pills',          'animSpeed',      S.animSpeed);
  renderPills('#bgpat-pills',         'bgPattern',      S.bgPattern);
  renderPills('#cardstyle-pills',     'cardStyle',      S.cardStyle);
  renderPills('#scrollbar-pills',     'scrollbar',      S.scrollbar);
  renderPills('#bgstyle-pills',       'bgStyle',        S.bgStyle);
  renderPills('#toolbar-pills',       'toolbarStyle',   S.toolbarStyle);
  renderPills('#density-pills',       'cardDensity',    S.cardDensity);
  renderPills('#sidebar-style-pills', 'sidebarStyle',   S.sidebarStyle);
  renderPills('#clock-pills',         'showClock',       S.showClock);
  // Custom bg color input
  const cbgInput = q('#custom-bg-input');
  if (cbgInput) cbgInput.value = S.customBgColor || '#000000';
  // Custom CSS textarea
  const cssInput = q('#custom-css-input');
  if (cssInput) cssInput.value = S.customCss || '';
  const hd = q('#homepage-url-display');
  if (hd) hd.textContent = location.href;
  renderSyncStatus();
  renderSnapshots();
}

function renderPills(sel, stateKey, currentVal) {
  const container = q(sel); if (!container) return;
  container.querySelectorAll('.pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.val === String(currentVal));
    pill.onclick = () => {
      S[stateKey] = pill.dataset.val;
      scheduleSave();
      // apply immediately
      const appliers = {
        fontSize: applyFontSize, fontWeight: applyFontWeight,
        shadowIntensity: applyShadow, cardHover: applyCardHover,
        animSpeed: applyAnimSpeed, bgPattern: applyBgPattern,
        cardStyle: applyCardStyle, scrollbar: applyScrollbar,
        bgStyle: v => applyBgStyle(v, S.customBgColor),
        toolbarStyle: applyToolbarStyle,
        cardDensity: applyCardDensity,
        sidebarStyle: applySidebarStyle,
        showClock: applyClockVisibility,
        defaultView: v => {
          S.viewModes = Object.fromEntries(S.spaces.map(s=>[s.id,v]));
          scheduleSave();
        },
      };
      if (appliers[stateKey]) appliers[stateKey](pill.dataset.val);
      renderPills(sel, stateKey, pill.dataset.val);
    };
  });
}

function renderSlider(slSel, valSel, stateKey, currentVal, fmt) {
  const sl = q(slSel); const vl = q(valSel);
  if (!sl || !vl) return;
  sl.value = currentVal;
  vl.textContent = fmt(currentVal);
  sl.oninput = () => {
    const v = parseInt(sl.value);
    S[stateKey] = v;
    vl.textContent = fmt(v);
    scheduleSave();
    const appliers = {
      borderRadius: applyBorderRadius, cardGap: applyCardGap,
      cardMinWidth: applyCardMinWidth, sidebarWidth: applySidebarWidth,
    };
    if (appliers[stateKey]) appliers[stateKey](v);
  };
}

/* ============================================================
   SETTINGS — THEMES
   ============================================================ */
function renderSettingsThemes() {
  const grid = q('#theme-grid'); if (!grid) return;
  grid.innerHTML = '';
  Object.entries(THEMES).forEach(([key, t]) => {
    grid.appendChild(buildThemeCard(key, t, () => {
      S.theme = key;
      scheduleSave();
      applyTheme(key);
      renderSettingsThemes();
      renderCustomThemes();
    }, S.theme === key));
  });
}

function renderCustomThemes() {
  const grid = q('#custom-theme-grid'); if (!grid) return;
  grid.innerHTML = '';
  if (!(S.customThemes||[]).length) {
    grid.innerHTML = '<span style="font-size:12px;color:var(--text-faint)">No custom themes yet. Click + New to build one.</span>';
    return;
  }
  S.customThemes.forEach((t, i) => {
    const p = t.preview || { sidebar:'#333', main:'#222', card:'#444', card2:'#555' };
    const card = buildThemeCard('custom_'+i, { name:t.name, preview:p }, () => {
      S.theme = 'custom_'+i;
      // Apply custom theme vars
      const root = document.documentElement;
      Object.entries(t.vars).forEach(([k,v]) => root.style.setProperty(k,v));
      scheduleSave();
      renderSettingsThemes();
      renderCustomThemes();
    }, S.theme === 'custom_'+i);
    // Add delete btn
    const del = document.createElement('button');
    del.className = 'theme-del';
    del.innerHTML = ic('x', 9);
    del.title = 'Delete theme';
    del.addEventListener('click', e => {
      e.stopPropagation();
      S.customThemes.splice(i, 1);
      if (S.theme === 'custom_'+i) { S.theme='dark'; applyTheme('dark'); }
      scheduleSave();
      renderCustomThemes();
      renderSettingsThemes();
    });
    card.appendChild(del);
    grid.appendChild(card);
  });
}

function buildThemeCard(key, t, onClick, selected) {
  const p = t.preview || { sidebar:'#333', main:'#222', card:'#444', card2:'#555' };
  const card = document.createElement('div');
  card.className = 'theme-card' + (selected ? ' selected' : '');

  const prev = document.createElement('div');
  prev.className = 'theme-preview';
  prev.style.background = p.main;

  const sidebar = document.createElement('div');
  sidebar.className = 'tp-sidebar';
  sidebar.style.background = p.sidebar;

  const main = document.createElement('div');
  main.className = 'tp-main';
  const c1 = document.createElement('div'); c1.className='tp-c1'; c1.style.background=p.card;
  const c2 = document.createElement('div'); c2.className='tp-c2'; c2.style.background=p.card2;
  main.append(c1, c2);
  prev.append(sidebar, main);

  const nm = document.createElement('div');
  nm.className = 'theme-name';
  nm.textContent = t.name;

  card.append(prev, nm);
  card.addEventListener('click', onClick);
  return card;
}

/* ============================================================
   SETTINGS — CUSTOM THEME EDITOR
   ============================================================ */
function openThemeEditor(existing) {
  const editor = q('#theme-editor');
  editor.style.display = 'block';

  // Seed colors from current theme or existing custom theme
  const baseVars = existing?.vars || getCurrentThemeVars();
  teColors = { ...baseVars };

  q('#te-name').value = existing?.name || '';
  renderTeColorGrid();
}

function getCurrentThemeVars() {
  const computed = getComputedStyle(document.documentElement);
  const result = {};
  THEME_SLOTS.forEach(slot => {
    result[slot.key] = computed.getPropertyValue(slot.key).trim() || '#000000';
  });
  return result;
}

function renderTeColorGrid() {
  const grid = q('#te-color-grid'); if (!grid) return;
  grid.innerHTML = '';
  THEME_SLOTS.forEach(slot => {
    const slotEl = document.createElement('div');
    slotEl.className = 'te-slot';

    const label = document.createElement('div');
    label.className = 'te-slot-label';
    label.textContent = slot.label;

    const row = document.createElement('div');
    row.className = 'te-slot-row';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'te-color-input';
    colorInput.value = teColors[slot.key] || '#000000';

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'te-hex-input';
    hexInput.value = teColors[slot.key] || '#000000';
    hexInput.maxLength = 7;

    colorInput.addEventListener('input', () => {
      teColors[slot.key] = colorInput.value;
      hexInput.value = colorInput.value;
      // Live preview
      document.documentElement.style.setProperty(slot.key, colorInput.value);
    });

    hexInput.addEventListener('input', () => {
      const v = hexInput.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        teColors[slot.key] = v;
        colorInput.value = v;
        document.documentElement.style.setProperty(slot.key, v);
      }
    });

    row.append(colorInput, hexInput);
    slotEl.append(label, row);
    grid.appendChild(slotEl);
  });
}

function saveCustomTheme() {
  const name = q('#te-name').value.trim() || 'Custom Theme';
  const preview = {
    sidebar: teColors['--sidebar-bg'] || '#333',
    main:    teColors['--main-bg']    || '#222',
    card:    teColors['--card-bg']    || '#444',
    card2:   teColors['--card-hover'] || '#555',
  };
  const theme = { id: uid(), name, vars: { ...teColors }, preview };
  if (!S.customThemes) S.customThemes = [];
  S.customThemes.push(theme);
  S.theme = 'custom_' + (S.customThemes.length - 1);
  scheduleSave();
  q('#theme-editor').style.display = 'none';
  renderCustomThemes();
  renderSettingsThemes();
  showSnack(`Theme "${name}" saved!`);
}

/* ============================================================
   SETTINGS — ACCENTS
   ============================================================ */
function renderSettingsAccents() {
  const grid = q('#accent-grid'); if (!grid) return;
  grid.innerHTML = '';
  ACCENT_COLORS.forEach(a => {
    const sw = document.createElement('div');
    sw.className = 'accent-swatch' + (S.accent===a.hex ? ' selected' : '');
    sw.style.background = a.hex;
    sw.title = a.name;
    sw.addEventListener('click', () => {
      S.accent = a.hex; scheduleSave();
      applyAccent(a.hex);
      q('#custom-accent-input').value = a.hex;
      renderSettingsAccents();
    });
    grid.appendChild(sw);
  });
}

/* ============================================================
   SETTINGS — FONTS
   ============================================================ */
function renderFontGrid() {
  const grid = q('#font-grid'); if (!grid) return;
  grid.innerHTML = '';
  FONTS.forEach(f => {
    const card = document.createElement('div');
    card.className = 'font-card' + (S.font===f.key ? ' selected' : '');

    const nm = document.createElement('div');
    nm.className = 'font-card-name';
    nm.style.fontFamily = `'${f.key}', system-ui, sans-serif`;
    nm.textContent = f.label;

    const sample = document.createElement('div');
    sample.className = 'font-card-sample';
    sample.style.fontFamily = `'${f.key}', system-ui, sans-serif`;
    sample.textContent = f.sample;

    card.append(nm, sample);
    card.addEventListener('click', () => {
      S.font = f.key; scheduleSave(); applyFont(f.key); renderFontGrid();
    });
    grid.appendChild(card);
  });
}

/* ============================================================
   SETTINGS — SYNC STATUS (item 43)
   ============================================================ */
function renderSyncStatus() {
  const badge = q('#sync-status-badge');
  if (!badge) return;
  // If chrome.storage.sync is available and not quota-exceeded, mark as synced
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    badge.textContent = 'Chrome Sync ✓';
    badge.className = 'sync-status-badge synced';
  } else {
    badge.textContent = 'Local only';
    badge.className = 'sync-status-badge local';
  }
}

/* ============================================================
   SETTINGS — WORKSPACE SNAPSHOTS (item 56)
   ============================================================ */
async function loadSnapshots() {
  if (typeof chrome === 'undefined' || !chrome.storage) return [];
  return new Promise(res => {
    chrome.storage.local.get('tabflow_snapshots', r => res(r.tabflow_snapshots || []));
  });
}

async function saveSnapshot() {
  const name = prompt('Snapshot name:', `Snapshot ${new Date().toLocaleDateString()}`);
  if (!name) return;
  const snaps = await loadSnapshots();
  snaps.unshift({ id: uid(), name, date: new Date().toISOString(),
    spaces: JSON.parse(JSON.stringify(S.spaces)) });
  await new Promise(res => chrome.storage.local.set({ tabflow_snapshots: snaps }, res));
  renderSnapshots();
  showSnack(`Snapshot "${name}" saved!`);
}

async function renderSnapshots() {
  const list = q('#snapshots-list');
  if (!list) return;
  list.innerHTML = '';
  const snaps = await loadSnapshots();
  if (!snaps.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:12px;color:var(--text-faint);padding:4px 0';
    empty.textContent = 'No snapshots yet.';
    list.appendChild(empty);
    return;
  }
  snaps.forEach((snap, idx) => {
    const item = document.createElement('div');
    item.className = 'snapshot-item';
    const nm = document.createElement('div'); nm.className = 'snapshot-name'; nm.textContent = snap.name;
    const meta = document.createElement('div'); meta.className = 'snapshot-meta';
    meta.textContent = new Date(snap.date).toLocaleDateString() + ' · ' + snap.spaces.length + ' space(s)';
    const acts = document.createElement('div'); acts.className = 'snapshot-actions';
    const restoreBtn = document.createElement('button'); restoreBtn.className = 'snapshot-restore-btn';
    restoreBtn.textContent = 'Restore';
    restoreBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm(`Restore snapshot "${snap.name}"? Current collections will be replaced.`)) return;
      S.spaces = JSON.parse(JSON.stringify(snap.spaces));
      S.activeSpaceId = S.spaces[0]?.id || null;
      scheduleSave(); renderAll();
      showSnack(`Restored "${snap.name}".`);
    });
    const delBtn = document.createElement('button'); delBtn.className = 'snapshot-del-btn';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      const snaps2 = await loadSnapshots();
      snaps2.splice(idx, 1);
      await new Promise(res => chrome.storage.local.set({ tabflow_snapshots: snaps2 }, res));
      renderSnapshots();
    });
    acts.append(restoreBtn, delBtn);
    item.append(nm, meta, acts);
    list.appendChild(item);
  });
}

/* ============================================================
   SETTINGS — BOOKMARKS IMPORT (item 44)
   ============================================================ */
async function browseBookmarks() {
  const list = q('#bookmarks-folder-list');
  if (!list) return;
  list.innerHTML = '';
  if (typeof chrome === 'undefined' || !chrome.bookmarks) {
    list.innerHTML = '<div style="font-size:12px;color:var(--text-faint);padding:4px 0">Bookmarks API not available.</div>';
    return;
  }
  let tree;
  try { tree = await new Promise(res => chrome.bookmarks.getTree(res)); } catch {
    list.innerHTML = '<div style="font-size:12px;color:var(--text-faint);padding:4px 0">Could not load bookmarks.</div>';
    return;
  }
  const folders = [];
  const collect = (nodes) => {
    if (!nodes) return;
    nodes.forEach(n => {
      if (!n.url && n.children) { folders.push(n); collect(n.children); }
    });
  };
  collect(tree[0]?.children || tree);
  if (!folders.length) {
    list.innerHTML = '<div style="font-size:12px;color:var(--text-faint);padding:4px 0">No bookmark folders found.</div>';
    return;
  }
  folders.forEach(folder => {
    const bookmarks = (folder.children || []).filter(n => n.url);
    if (!bookmarks.length) return;
    const item = document.createElement('div');
    item.className = 'bookmark-folder-item';
    const nm = document.createElement('span'); nm.className = 'bookmark-folder-name';
    nm.textContent = folder.title || 'Untitled';
    const cnt = document.createElement('span'); cnt.className = 'bookmark-folder-count';
    cnt.textContent = bookmarks.length + ' bookmarks';
    const btn = document.createElement('button'); btn.className = 'settings-btn';
    btn.style.cssText = 'font-size:10px;padding:3px 8px;margin-left:auto;flex-shrink:0';
    btn.textContent = 'Import';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      importBookmarkFolder(folder, bookmarks);
    });
    item.append(nm, cnt, btn);
    list.appendChild(item);
  });
}

function importBookmarkFolder(folder, bookmarks) {
  const sp = activeSpace(); if (!sp) return;
  const col = {
    id: uid(), name: folder.title || 'Imported', collapsed: false,
    tabs: bookmarks.map(b => ({ id: uid(), title: b.title || b.url, url: b.url, favicon: '' }))
  };
  if (!sp.collections) sp.collections = [];
  sp.collections.unshift(col);
  scheduleSave(); renderCollections();
  showSnack(`Imported ${bookmarks.length} bookmarks as "${col.name}".`);
  q('#bookmarks-folder-list').innerHTML = '';
}

/* ============================================================
   SETTINGS — EXPORT / IMPORT / CLEAR
   ============================================================ */
function exportData() {
  const data = {
    version: 3,
    exported: new Date().toISOString(),
    spaces: S.spaces,
    links: S.links,
    nextItems: S.nextItems,
    settings: {
      theme: S.theme, accent: S.accent, font: S.font, fontSize: S.fontSize,
      fontWeight: S.fontWeight, borderRadius: S.borderRadius, cardGap: S.cardGap,
      cardMinWidth: S.cardMinWidth, sidebarWidth: S.sidebarWidth,
      defaultView: S.defaultView, shadowIntensity: S.shadowIntensity,
      cardHover: S.cardHover, animSpeed: S.animSpeed, bgPattern: S.bgPattern,
      cardStyle: S.cardStyle, scrollbar: S.scrollbar, customThemes: S.customThemes,
      bgStyle: S.bgStyle, customBgColor: S.customBgColor,
      toolbarStyle: S.toolbarStyle, cardDensity: S.cardDensity,
      sidebarStyle: S.sidebarStyle, customCss: S.customCss,
    }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tabflow-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showSnack('Backup exported!');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.spaces || !Array.isArray(data.spaces)) { showSnack('Invalid backup file.'); return; }
      S.spaces = data.spaces;
      S.links = data.links || [];
      S.nextItems = data.nextItems || [];
      // Restore settings if present
      if (data.settings) {
        Object.assign(S, data.settings);
      }
      if (!S.activeSpaceId || !S.spaces.find(s=>s.id===S.activeSpaceId)) {
        S.activeSpaceId = S.spaces[0]?.id;
      }
      scheduleSave();
      applyAllSettings();
      renderAll();
      renderOpenTabs();
      showSnack(`Imported ${S.spaces.length} space(s)!`);
    } catch(err) { showSnack('Failed to parse backup file.'); }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('Are you sure? This permanently deletes all collections.')) return;
  storage.clear().then(() => {
    const d = defaultData();
    Object.assign(S, d);
    applyAllSettings();
    renderAll();
    renderOpenTabs();
    showSnack('All data cleared.');
  });
}

function resetSettings() {
  if (!confirm('Reset all appearance settings to defaults?')) return;
  Object.assign(S, SETTING_DEFAULTS);
  scheduleSave();
  applyAllSettings();
  renderSettings();
  showSnack('Settings reset to defaults.');
}

/* ============================================================
   CONTEXT MENU
   ============================================================ */
function showCtx(x, y, { rename, delete: del, moveToSpace, color, customize, tabGroup }) {
  ctxTarget = { rename, delete:del, moveToSpace, color, customize, tabGroup };
  const moveBtn = q('#ctx-move-space');
  if (moveBtn) moveBtn.style.display = moveToSpace ? 'flex' : 'none';
  const colorBtn = q('#ctx-color');
  if (colorBtn) colorBtn.style.display = color ? 'flex' : 'none';
  const customizeBtn = q('#ctx-customize');
  if (customizeBtn) customizeBtn.style.display = customize ? 'flex' : 'none';
  const tabGroupBtn = q('#ctx-tab-group');
  if (tabGroupBtn) tabGroupBtn.style.display = tabGroup ? 'flex' : 'none';
  // hide sub-picker when re-opening
  const ccp = q('#ctx-color-picker');
  if (ccp) ccp.style.display = 'none';
  const menu = q('#context-menu');
  menu.style.display = 'block';
  const vw=window.innerWidth, vh=window.innerHeight;
  menu.style.left = Math.min(x, vw-160) + 'px';
  menu.style.top  = Math.min(y, vh-120)  + 'px';
}

function hideCtx() {
  q('#context-menu').style.display = 'none';
  ctxTarget = null;
}

/* ============================================================
   SNACKBAR
   ============================================================ */
function showSnack(msg, withUndo=false) {
  clearTimeout(snackTimer);
  const bar = q('#snackbar');
  bar.innerHTML = '';
  const txt = document.createElement('span');
  txt.textContent = msg;
  bar.appendChild(txt);
  if (withUndo && undoBuf) {
    const u=document.createElement('span'); u.className='snack-undo'; u.textContent='UNDO';
    u.addEventListener('click', () => { doUndo(); hideSnack(); });
    bar.appendChild(u);
  }
  bar.style.display = 'flex';
  snackTimer = setTimeout(hideSnack, 4000);
}

function hideSnack() { q('#snackbar').style.display='none'; }

function doUndo() {
  if (!undoBuf) return;
  if (undoBuf.type==='tab') {
    const sp=S.spaces.find(s=>s.id===undoBuf.spId);
    const col=sp?.collections?.find(c=>c.id===undoBuf.colId);
    if(col){col.tabs.splice(undoBuf.idx,0,undoBuf.tab); scheduleSave(); renderCollections();}
  } else if (undoBuf.type==='col') {
    const sp=S.spaces.find(s=>s.id===undoBuf.spId);
    if(sp){sp.collections.splice(undoBuf.idx,0,undoBuf.col); scheduleSave(); renderCollections();}
  }
  undoBuf=null;
}

/* ============================================================
   INLINE EDIT HELPER
   ============================================================ */
function editInline(el, obj, key, onDone) {
  const orig = obj[key];
  el.contentEditable = 'true';
  el.focus();
  selAll(el);
  const done = () => {
    el.contentEditable = 'false';
    const v = el.textContent.trim();
    if (v) { obj[key]=v; scheduleSave(); if(onDone) onDone(); }
    else { el.textContent=orig; }
  };
  el.addEventListener('keydown', e => { if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();done();} }, {once:true});
  el.addEventListener('blur', done, {once:true});
}

function selAll(el) {
  const range=document.createRange();
  range.selectNodeContents(el);
  const sel=window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ============================================================
   NAV
   ============================================================ */
function updateNavActive(view) {
  S.activeNav = view;
  qa('.nav-item[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view===view));
  qa('.view-panel').forEach(p => p.classList.toggle('active', p.id==='view-'+view));
}

/* ============================================================
   ADD CURRENT TAB TO COLLECTION (item 32)
   ============================================================ */
async function openAddToColPicker() {
  let activeTab = null;
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await new Promise(res => chrome.tabs.query({ active:true, currentWindow:true }, res));
      activeTab = tabs?.[0];
    }
  } catch {}
  if (!activeTab || isTabFlowTab(activeTab)) { showSnack('No suitable active tab found.'); return; }
  pendingAddTab = { title: activeTab.title || activeTab.url, url: activeTab.url, favicon: activeTab.favIconUrl || '' };
  // Populate picker list
  const list = q('#add-to-col-list');
  const info = q('#add-to-col-info');
  if (list) {
    list.innerHTML = '';
    if (info) info.textContent = pendingAddTab.title + ' (' + (domain(pendingAddTab.url)||pendingAddTab.url) + ')';
    S.spaces.forEach(sp => {
      (sp.collections||[]).forEach(col => {
        const item = document.createElement('div');
        item.className = 'space-picker-item';
        const spLabel = document.createElement('span');
        spLabel.style.cssText = 'font-size:10px;color:var(--text-faint);margin-right:4px';
        spLabel.textContent = sp.name + ' /';
        const nm = document.createElement('span');
        nm.textContent = col.name;
        const cnt = document.createElement('span');
        cnt.style.cssText = 'margin-left:auto;font-size:11px;color:var(--text-faint)';
        cnt.textContent = (col.tabs||[]).length + ' tabs';
        item.append(spLabel, nm, cnt);
        item.addEventListener('click', () => {
          if (!pendingAddTab) return;
          addTabToCol(sp.id, col.id, { title:pendingAddTab.title, url:pendingAddTab.url, favicon:pendingAddTab.favicon });
          showSnack(`Added "${pendingAddTab.title}" to ${col.name}.`);
          pendingAddTab = null;
          q('#add-to-col-overlay').style.display = 'none';
        });
        list.appendChild(item);
      });
    });
  }
  q('#add-to-col-overlay').style.display = 'flex';
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
function bindEvents() {
  // Sidebar
  q('#btn-sidebar-toggle').addEventListener('click', () => {
    S.sidebarOpen=!S.sidebarOpen; scheduleSave(); updateLayoutClasses();
  });
  q('#sidebar-show-btn').addEventListener('click', () => {
    S.sidebarOpen=true; scheduleSave(); updateLayoutClasses();
  });

  // Right panel
  q('#btn-right-toggle').addEventListener('click', () => {
    S.rightPanelOpen=false; scheduleSave(); updateLayoutClasses();
  });
  q('#right-panel-show-btn').addEventListener('click', () => {
    S.rightPanelOpen=true; scheduleSave(); updateLayoutClasses();
  });

  // Spaces
  q('#btn-add-space').addEventListener('click', addSpace);

  // Toolbar
  q('#btn-expand-all').addEventListener('click', expandAll);
  q('#btn-collapse-all').addEventListener('click', collapseAll);
  q('#btn-add-collection').addEventListener('click', addCollection);

  // View dropdown
  q('#view-trigger').addEventListener('click', e => {
    e.stopPropagation();
    q('#view-menu').classList.toggle('open');
  });

  // DnD toggle
  q('#btn-dnd-toggle').addEventListener('click', () => {
    S.dndEnabled=!S.dndEnabled; scheduleSave(); updateDndBtn(); renderCollections(); renderOpenTabs();
  });

  // Search
  q('#search-input').addEventListener('input', e => handleSearch(e.target.value));
  q('#search-clear').addEventListener('click', () => { q('#search-input').value=''; handleSearch(''); });

  // Nav
  qa('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v=btn.dataset.view;
      updateNavActive(v);
      if(v==='collections') renderCollections();
      if(v==='links') renderLinks();
      if(v==='next') renderNextItems();
      if(v==='settings') renderSettings();
    });
  });

  // Settings tabs
  qa('.stab[data-stab]').forEach(btn => {
    btn.addEventListener('click', () => {
      qa('.stab').forEach(b=>b.classList.remove('active'));
      qa('.stab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      const panel = q('#stab-'+btn.dataset.stab);
      if (panel) panel.classList.add('active');
    });
  });

  // Custom theme editor
  q('#btn-new-theme').addEventListener('click', () => {
    openThemeEditor(null);
  });
  q('#te-save').addEventListener('click', saveCustomTheme);
  q('#te-cancel').addEventListener('click', () => {
    q('#theme-editor').style.display = 'none';
    // Reapply current theme in case user was live-previewing
    applyAllSettings();
  });

  // Session / refresh
  q('#btn-save-session').addEventListener('click', saveSession);
  q('#btn-refresh-tabs').addEventListener('click', loadOpenTabs);

  // item 32: Add current tab
  q('#btn-add-current-tab')?.addEventListener('click', openAddToColPicker);
  q('#add-to-col-cancel')?.addEventListener('click', () => {
    pendingAddTab = null;
    q('#add-to-col-overlay').style.display = 'none';
  });
  q('#add-to-col-overlay')?.addEventListener('click', e => {
    if (e.target === q('#add-to-col-overlay')) { pendingAddTab = null; q('#add-to-col-overlay').style.display = 'none'; }
  });

  // item 54: Recently closed tabs refresh
  q('#btn-rc-refresh')?.addEventListener('click', renderRecentlyClosed);

  // item 56: Workspace snapshots
  q('#btn-save-snapshot')?.addEventListener('click', saveSnapshot);

  // item 44: Bookmarks import
  q('#btn-browse-bookmarks')?.addEventListener('click', browseBookmarks);

  // Links
  q('#btn-add-link').addEventListener('click', addLink);
  q('#link-url-input').addEventListener('keydown', e=>{ if(e.key==='Enter') addLink(); });

  // Next
  q('#btn-add-next').addEventListener('click', addNext);
  q('#next-url-input').addEventListener('keydown', e=>{ if(e.key==='Enter') addNext(); });

  // Settings — homepage URL
  q('#btn-copy-homepage').addEventListener('click', () => {
    const url = location.href;
    try {
      navigator.clipboard.writeText(url);
      showSnack('Homepage URL copied! Paste it in Edge → Settings → Home button.');
    } catch { prompt('Copy this URL:', url); }
  });

  // Settings — export/import/reset
  q('#btn-export').addEventListener('click', exportData);
  q('#btn-import').addEventListener('click', () => q('#import-file-input').click());
  q('#import-file-input').addEventListener('change', e => {
    const f=e.target.files[0]; if(f) importData(f); e.target.value='';
  });
  q('#btn-clear-all').addEventListener('click', clearAllData);
  q('#btn-reset-settings').addEventListener('click', resetSettings);

  // Custom accent color picker
  q('#custom-accent-input').addEventListener('input', e => {
    S.accent=e.target.value; scheduleSave(); applyAccent(e.target.value);
    qa('.accent-swatch').forEach(sw=>sw.classList.remove('selected'));
  });

  // Custom background color
  q('#custom-bg-input')?.addEventListener('input', e => {
    S.customBgColor = e.target.value;
    S.bgStyle = 'custom';
    scheduleSave();
    applyBgStyle('custom', e.target.value);
    renderPills('#bgstyle-pills', 'bgStyle', 'custom');
  });

  // Advanced: Custom CSS apply button
  q('#btn-apply-css')?.addEventListener('click', () => {
    const cssInput = q('#custom-css-input');
    if (cssInput) {
      S.customCss = cssInput.value;
      scheduleSave();
      applyCustomCss(S.customCss);
      showSnack('Custom CSS applied!');
    }
  });

  // Advanced: Clear CSS
  q('#btn-clear-css')?.addEventListener('click', () => {
    const cssInput = q('#custom-css-input');
    if (cssInput) cssInput.value = '';
    S.customCss = '';
    scheduleSave();
    applyCustomCss('');
    showSnack('Custom CSS cleared.');
  });

  // Space customize modal
  q('#sc-save')?.addEventListener('click', saveSpaceCustomize);
  q('#sc-cancel')?.addEventListener('click', closeSpaceCustomize);
  q('#space-customize-overlay')?.addEventListener('click', e => {
    if (e.target === q('#space-customize-overlay')) closeSpaceCustomize();
  });

  // Context menu
  q('#ctx-rename').addEventListener('click', () => { if(ctxTarget?.rename){ctxTarget.rename();} hideCtx(); });
  q('#ctx-move-space').addEventListener('click', () => { if(ctxTarget?.moveToSpace){ctxTarget.moveToSpace();} hideCtx(); });
  q('#ctx-delete').addEventListener('click', () => { if(ctxTarget?.delete){ctxTarget.delete();} hideCtx(); });
  q('#ctx-color').addEventListener('click', () => {
    const ccp = q('#ctx-color-picker');
    if (ccp) ccp.style.display = ccp.style.display === 'flex' ? 'none' : 'flex';
  });
  q('#ctx-color-picker').addEventListener('click', e => {
    const sw = e.target.closest('.ctx-cp-swatch');
    if (!sw) return;
    if (ctxTarget?.color) ctxTarget.color(sw.dataset.color || undefined);
    hideCtx();
  });
  q('#ctx-customize').addEventListener('click', () => { if(ctxTarget?.customize){ctxTarget.customize();} hideCtx(); });
  q('#ctx-tab-group').addEventListener('click', () => { if(ctxTarget?.tabGroup){ctxTarget.tabGroup();} hideCtx(); });

  // Card edit modal
  q('#card-edit-save').addEventListener('click', saveCardEdit);
  q('#card-edit-cancel').addEventListener('click', closeCardEditModal);
  q('#card-edit-overlay').addEventListener('click', e => { if (e.target === q('#card-edit-overlay')) closeCardEditModal(); });
  const onCardEditKey = e => { if (e.key === 'Enter') saveCardEdit(); if (e.key === 'Escape') closeCardEditModal(); };
  q('#card-edit-title').addEventListener('keydown', onCardEditKey);
  q('#card-edit-url').addEventListener('keydown', onCardEditKey);

  // Space picker modal
  q('#space-picker-cancel').addEventListener('click', closeSpacePicker);
  q('#space-picker-overlay').addEventListener('click', e => { if (e.target === q('#space-picker-overlay')) closeSpacePicker(); });

  // Close dropdowns on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#view-dropdown')) q('#view-menu').classList.remove('open');
    if (!e.target.closest('.context-menu') && !e.target.closest('.col-actions')) hideCtx();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      // Only handle Escape here for dropdowns/ctx; hotkey modal handled by global handler
      if (q('#hotkey-overlay').style.display !== 'none') return; // global handler takes it
      if (q('#card-edit-overlay').style.display !== 'none') { closeCardEditModal(); return; }
      if (q('#space-picker-overlay').style.display !== 'none') { closeSpacePicker(); return; }
      if (q('#add-to-col-overlay').style.display !== 'none') { pendingAddTab=null; q('#add-to-col-overlay').style.display='none'; return; }
      hideCtx();
      q('#view-menu').classList.remove('open');
    }
  });

  // Global drag target on collections-area
  q('#collections-area').addEventListener('dragover', e => { if(dragData) e.preventDefault(); });

}

/* ============================================================
   HOTKEYS  (slot-based, backed by chrome.commands)
   ============================================================ */

const SLOT_COUNT = 4;
// Default labels shown before user customises in chrome://extensions/shortcuts
const SLOT_DEFAULT_KEYS = ['Alt+1','Alt+2','Alt+3','Alt+4'];

let hkState = null; // { tabId, colId, selectedSlot }

/* ---------- helpers ---------- */
function slotLabel(slot) {
  return `Slot ${slot}`;
}

function comboLabel(hk) {
  if (!hk) return '';
  if (hk.slot) return `Slot ${hk.slot}`;
  return hk.combo || '';
}

function findTabBySlot(slot) {
  for (const sp of S.spaces) {
    for (const col of (sp.collections||[])) {
      for (const tab of (col.tabs||[])) {
        if (tab.hotkey?.slot === slot) return { tab, col, sp };
      }
    }
  }
  return null;
}

/* ---------- open modal ---------- */
function openHkModal(tabId, colId, spId) {
  const found = findCol(colId);
  const tab = found?.col.tabs.find(t => t.id === tabId);
  if (!tab) return;

  hkState = { tabId, colId, spId, selectedSlot: tab.hotkey?.slot || null };

  q('#hk-tab-name').textContent = tab.title || tab.url;
  renderHkSlotGrid();
  q('#hk-clear').style.display = tab.hotkey ? 'inline-flex' : 'none';
  q('#hk-save').style.display  = tab.hotkey ? 'inline-flex' : 'none';
  q('#hotkey-overlay').style.display = 'flex';
}

/* ---------- render slot grid ---------- */
function renderHkSlotGrid() {
  const grid = q('#hk-slot-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (let s = 1; s <= SLOT_COUNT; s++) {
    const existing = findTabBySlot(s);
    const isMe = existing?.tab.id === hkState?.tabId; // this tab already owns this slot
    const isTaken = existing && !isMe;
    const isSelected = s === hkState?.selectedSlot;

    const btn = document.createElement('button');
    btn.className = 'hk-slot-btn' +
      (isSelected ? ' selected' : '') +
      (isTaken    ? ' taken'    : '');

    const num = document.createElement('div');
    num.className = 'hk-slot-num';
    num.textContent = s;

    const key = document.createElement('div');
    key.className = 'hk-slot-key';
    key.textContent = SLOT_DEFAULT_KEYS[s - 1];

    const owner = document.createElement('div');
    owner.className = 'hk-slot-owner';
    owner.textContent = isTaken  ? existing.tab.title : (isMe ? '← this tab' : 'free');

    btn.append(num, key, owner);

    if (!isTaken) {
      btn.addEventListener('click', () => {
        hkState.selectedSlot = s;
        q('#hk-save').style.display = 'inline-flex';
        renderHkSlotGrid();
      });
    } else {
      btn.title = `Used by: ${existing.tab.title}`;
    }

    grid.appendChild(btn);
  }
}

/* ---------- save ---------- */
function saveHotkey() {
  if (!hkState?.selectedSlot) return;
  const found = findCol(hkState.colId);
  const tab = found?.col.tabs.find(t => t.id === hkState.tabId);
  if (!tab) { closeHkModal(); return; }

  // Clear slot from any previous owner
  const prev = findTabBySlot(hkState.selectedSlot);
  if (prev && prev.tab.id !== tab.id) delete prev.tab.hotkey;

  tab.hotkey = { slot: hkState.selectedSlot };
  scheduleSave();
  renderCollections();
  showSnack(`Slot ${hkState.selectedSlot} (${SLOT_DEFAULT_KEYS[hkState.selectedSlot-1]}) → "${tab.title}"`);
  closeHkModal();
}

/* ---------- clear ---------- */
function clearHotkey() {
  const found = findCol(hkState.colId);
  const tab = found?.col.tabs.find(t => t.id === hkState.tabId);
  if (tab) { delete tab.hotkey; scheduleSave(); renderCollections(); }
  closeHkModal();
  showSnack('Hotkey removed.');
}

/* ---------- close ---------- */
function closeHkModal() {
  q('#hotkey-overlay').style.display = 'none';
  hkState = null;
}

/* ---------- bind modal buttons ---------- */
function bindHotkeyEvents() {
  q('#hk-save').addEventListener('click',   saveHotkey);
  q('#hk-clear').addEventListener('click',  clearHotkey);
  q('#hk-cancel').addEventListener('click', closeHkModal);
  q('#hotkey-overlay').addEventListener('click', e => {
    if (e.target === q('#hotkey-overlay')) closeHkModal();
  });
  // Open chrome://extensions/shortcuts in a new tab
  q('#hk-open-shortcuts')?.addEventListener('click', e => {
    e.preventDefault();
    try { chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); } catch {}
  });
}

/* ============================================================
   BOOT
   ============================================================ */
async function init() {
  await loadData();
  initStaticIcons();
  renderAll();
  await loadOpenTabs();
  renderRecentlyClosed();
  setupTabListeners();
  bindEvents();
  bindHotkeyEvents();
  // set color picker to current accent
  q('#custom-accent-input').value = S.accent || '#7c6af5';
}

document.addEventListener('DOMContentLoaded', () => init().catch(console.error));
