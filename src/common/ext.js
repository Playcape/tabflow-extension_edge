/* ================================================================
   TabFlow — platform layer
   The ONLY place in the codebase that knows which browser we run on.
   Everything else consumes `ext` and `caps`.

   Firefox/Zen expose a promise-based `browser` global. Chromium's
   `chrome` is promise-based in MV3 when no callback is passed, so a
   straight alias gives us one promise API everywhere.
   ================================================================ */

/* Chromium exposes a bare `chrome` object on ordinary web pages too, so
   test for a usable extension API instead of the global's existence. */
const native = globalThis.browser?.runtime?.getURL
  ? globalThis.browser
  : globalThis.chrome?.runtime?.getURL
    ? globalThis.chrome
    : null;

export const ext = native ?? devShim();

/**
 * Minimal mock so the new-tab page also runs as a plain web page
 * (dev preview / demo mode). Storage maps to localStorage; tab APIs
 * return demo data. Never active inside a real extension.
 */
function devShim() {
  const noopEvent = () => ({ addListener() {}, removeListener() {} });
  const demoTabs = [
    { id: 1, windowId: 1, title: 'MDN Web Docs', url: 'https://developer.mozilla.org', favIconUrl: '' },
    { id: 2, windowId: 1, title: 'GitHub', url: 'https://github.com', favIconUrl: '' },
    { id: 3, windowId: 2, title: 'Hacker News', url: 'https://news.ycombinator.com', favIconUrl: '' },
  ];
  const keysOf = (keys) =>
    typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys ?? {});
  return {
    runtime: {
      id: 'tabflow-dev',
      getURL: (path) => new URL(path, location.href).href,
      getManifest: () => ({ permissions: [] }),
      onInstalled: noopEvent(),
      onMessage: noopEvent(),
      async sendMessage() {},
    },
    storage: {
      local: {
        async get(keys) {
          const out = {};
          for (const key of keysOf(keys)) {
            const raw = localStorage.getItem(key);
            if (raw !== null) out[key] = JSON.parse(raw);
          }
          return out;
        },
        async set(items) {
          for (const [key, value] of Object.entries(items)) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        },
        async remove(keys) {
          for (const key of keysOf(keys)) localStorage.removeItem(key);
        },
      },
      onChanged: noopEvent(),
    },
    tabs: {
      async get(id) { return demoTabs.find((t) => t.id === id) ?? null; },
      async query() { return demoTabs; },
      async create({ url }) { window.open(url, '_blank'); return { id: 0 }; },
      async update() { return {}; },
      async remove() {},
      async sendMessage() {},
      onCreated: noopEvent(),
      onRemoved: noopEvent(),
      onUpdated: noopEvent(),
    },
    windows: {
      async update() { return {}; },
      async create({ url }) { (Array.isArray(url) ? url : [url]).forEach((u) => window.open(u, '_blank')); },
    },
    commands: { onCommand: noopEvent() },
    omnibox: { onInputChanged: noopEvent(), onInputEntered: noopEvent() },
    action: { onClicked: noopEvent() },
  };
}

export const EXT_ORIGIN = ext.runtime.getURL('');
export const IS_FIREFOX = EXT_ORIGIN.startsWith('moz-extension://');
export const IS_CHROMIUM = EXT_ORIGIN.startsWith('chrome-extension://');
export const IS_EDGE =
  IS_CHROMIUM && typeof navigator !== 'undefined' && navigator.userAgent.includes('Edg/');

export const NEWTAB_PAGE = ext.runtime.getURL('newtab/newtab.html');

/* Capability flags — feature-detect, never user-agent-sniff for APIs. */
export const caps = {
  /** Chromium tab groups (Firefox ships tabs.group from 139+, detected the same way). */
  tabGroups: !!(ext.tabs?.group && ext.tabGroups?.update),
  /** Recently-closed tabs. */
  sessions: !!ext.sessions?.getRecentlyClosed,
  bookmarks: !!ext.bookmarks?.getTree,
  /**
   * Chromium's private _favicon endpoint (needs "favicon" permission).
   * Resolves icons locally instead of calling a remote service.
   */
  localFavicons:
    IS_CHROMIUM && (ext.runtime.getManifest().permissions ?? []).includes('favicon'),
};

/** URLs the browser itself uses for a blank new tab. */
const NEW_TAB_URLS = new Set([
  'chrome://newtab/',
  'edge://newtab/',
  'about:newtab',
  'about:home',
  'about:blank',
]);

export function isBrowserNewTabUrl(url) {
  return NEW_TAB_URLS.has(url ?? '');
}

/** True if a tab is TabFlow's own page (or about to become it). */
export function isTabFlowTab(tab) {
  const url = tab?.url ?? '';
  const pending = tab?.pendingUrl ?? '';
  return (
    url.startsWith(EXT_ORIGIN) ||
    pending.startsWith(EXT_ORIGIN) ||
    isBrowserNewTabUrl(url)
  );
}

/**
 * Where the user can remap extension shortcuts.
 * Firefox has no directly-linkable page; callers must show instructions.
 */
export function shortcutsPage() {
  if (IS_FIREFOX) {
    return {
      url: null,
      hint: 'Add-ons Manager (about:addons) → gear icon → “Manage Extension Shortcuts”',
    };
  }
  return {
    url: IS_EDGE ? 'edge://extensions/shortcuts' : 'chrome://extensions/shortcuts',
    hint: null,
  };
}

/** Focus an existing tab (and its window). */
export async function focusTab(tab) {
  await ext.tabs.update(tab.id, { active: true });
  await ext.windows.update(tab.windowId, { focused: true });
}

/**
 * Focus a tab whose URL matches `match(url)`, or open `url` in a new tab.
 * Used by hotkey slots and the toolbar action.
 */
export async function focusOrOpen(url, match) {
  try {
    const tabs = await ext.tabs.query({});
    const exact = tabs.find((t) => t.url === url);
    const fuzzy = exact ?? (match ? tabs.find((t) => match(t.url ?? '')) : null);
    if (fuzzy) {
      await focusTab(fuzzy);
      return;
    }
  } catch {
    /* fall through to create */
  }
  try {
    await ext.tabs.create({ url });
  } catch (err) {
    console.error('TabFlow: could not open tab', err);
  }
}
