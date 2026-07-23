/* ================================================================
   TabFlow — layout & navigation
   Panels (sidebar / right), nav switching, clock widget, global
   keyboard handling ("/" focuses search, Escape unwinds UI state).
   ================================================================ */

import { q, qa } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { ext } from '../../common/ext.js';
import { getDoc, settings, update } from '../store.js';
import { registerRenderer, render } from './bus.js';
import { closeTopOverlay, anyOverlayOpen } from './modals.js';
import { hideMenu, menuVisible } from './contextmenu.js';

let activeNav = 'collections';
let clockTimer = null;

export function currentNav() {
  return activeNav;
}

export function setNav(view) {
  activeNav = view;
  qa('.nav-item[data-view]').forEach((btn) =>
    btn.classList.toggle('active', btn.dataset.view === view)
  );
  qa('.view-panel').forEach((panel) =>
    panel.classList.toggle('active', panel.id === `view-${view}`)
  );
  const rendererFor = {
    collections: 'collections',
    links: 'links',
    tasks: 'tasks',
    settings: 'settings',
  };
  render(rendererFor[view] ?? 'collections');
}

/* ---------- panels ---------- */

function renderLayout() {
  const doc = getDoc();
  const app = q('#app');
  app.classList.toggle('sidebar-collapsed', !doc.ui.sidebarOpen);
  app.classList.toggle('right-hidden', !doc.ui.rightPanelOpen);
  q('#sidebar-show-btn').style.display = doc.ui.sidebarOpen ? 'none' : 'flex';
  q('#right-panel-show-btn').style.display = doc.ui.rightPanelOpen ? 'none' : 'flex';
  renderClock();
}

/* ---------- clock ---------- */

function renderClock() {
  const widget = q('#clock-widget');
  const on = settings().showClock;
  widget.classList.toggle('hidden', !on);
  // Rebuild the timer every render so a changed interval (seconds on/off) sticks.
  clearInterval(clockTimer);
  clockTimer = null;
  if (!on) return;

  const tick = () => {
    const s = settings();
    const now = new Date();
    q('#clock-time').textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      ...(s.clockSeconds ? { second: '2-digit' } : {}),
      hour12: !s.clock24h,
    });
    q('#clock-date').textContent = now.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const hour = now.getHours();
    const base = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const emoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';
    const name = (s.greetingName ?? '').trim();
    q('#clock-greeting').textContent = name ? `${base}, ${name} ${emoji}` : `${base} ${emoji}`;
  };
  tick();
  clockTimer = setInterval(tick, settings().clockSeconds ? 1000 : 30_000);
}

/** Toggle the minimal, chrome-free "Zen" view. */
export function toggleZen(force) {
  update((doc) => {
    doc.settings.zenMode = force === undefined ? !doc.settings.zenMode : !!force;
  });
  render('appearance');
}

/* ---------- static icons ---------- */

function setIcon(sel, name, size = 14) {
  const el = q(sel);
  if (el) el.innerHTML = icon(name, size);
}

function initStaticIcons() {
  setIcon('#btn-sidebar-toggle', 'panel-left');
  setIcon('#sidebar-show-btn', 'panel-left', 13);
  setIcon('#search-clear', 'x', 12);
  setIcon('.search-icon-wrap', 'search', 13);
  qa('.nav-icon[data-icon]').forEach((el) => (el.innerHTML = icon(el.dataset.icon, 14)));
  setIcon('#btn-add-space', 'plus', 12);
  q('#btn-expand-all').innerHTML = icon('chevron-down', 12) + ' Expand all';
  q('#btn-collapse-all').innerHTML = icon('chevron-up', 12) + ' Collapse all';
  q('#btn-add-collection').innerHTML = icon('plus', 12) + ' Collection';
  setIcon('#btn-refresh-tabs', 'refresh');
  setIcon('#btn-save-session', 'download');
  setIcon('#btn-right-toggle', 'panel-right');
  setIcon('#btn-add-current-tab', 'plus-circle');
  setIcon('#btn-rc-refresh', 'refresh', 11);
  setIcon('#right-panel-show-btn', 'panel-right', 13);
}

/* ---------- focus the search box ---------- *
   Called when the background sends the user back to this tab instead of
   opening a duplicate (see background.js). The search box doubles as a
   launcher — type a URL or a Links alias and press Enter — so this is the
   "ready to type" landing spot when the browser omnibox can't be focused
   by an extension. */
export function focusSearch() {
  const input = q('#search-input');
  if (!input) return;
  // Respect a deliberately-collapsed sidebar — don't force it open on every
  // new tab. The search box lives there, so there's nothing to focus if hidden.
  if (!getDoc().ui.sidebarOpen) return;
  input.focus();
  input.select();
}

/* ---------- global keys ---------- */

function onGlobalKeydown(event) {
  // Ctrl/⌘ + .  →  toggle Zen mode.
  if ((event.ctrlKey || event.metaKey) && event.key === '.') {
    event.preventDefault();
    toggleZen();
    return;
  }

  if (event.key === 'Escape') {
    if (menuVisible()) {
      hideMenu();
      return;
    }
    if (anyOverlayOpen()) {
      closeTopOverlay();
      return;
    }
    if (settings().zenMode) {
      toggleZen(false);
      return;
    }
    q('#view-menu')?.classList.remove('open');
    const search = q('#search-input');
    if (document.activeElement === search && search.value) {
      search.value = '';
      search.dispatchEvent(new Event('input'));
    }
    return;
  }

  // "/" focuses search unless typing somewhere.
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const target = event.target;
    const typing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable;
    if (!typing) {
      event.preventDefault();
      q('#search-input').focus();
    }
  }
}

/* ---------- init ---------- */

export function initLayout() {
  initStaticIcons();
  registerRenderer('layout', renderLayout);

  q('#btn-sidebar-toggle').addEventListener('click', () => {
    update((doc) => (doc.ui.sidebarOpen = false));
    renderLayout();
  });
  q('#sidebar-show-btn').addEventListener('click', () => {
    update((doc) => (doc.ui.sidebarOpen = true));
    renderLayout();
  });
  q('#btn-right-toggle').addEventListener('click', () => {
    update((doc) => (doc.ui.rightPanelOpen = false));
    renderLayout();
  });
  q('#right-panel-show-btn').addEventListener('click', () => {
    update((doc) => (doc.ui.rightPanelOpen = true));
    renderLayout();
  });
  q('#zen-exit-btn')?.addEventListener('click', () => toggleZen(false));

  qa('.nav-item[data-view]').forEach((btn) =>
    btn.addEventListener('click', () => setNav(btn.dataset.view))
  );

  document.addEventListener('keydown', onGlobalKeydown);

  // Background asks us to focus search when it redirects a duplicate new tab
  // here (single-instance behavior). runtime.onMessage is absent in the dev
  // shim, hence the optional chaining.
  ext.runtime.onMessage?.addListener((message) => {
    if (message?.type === 'tabflow:activate') focusSearch();
  });
}
