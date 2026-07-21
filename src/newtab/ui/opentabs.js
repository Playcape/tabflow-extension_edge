/* ================================================================
   TabFlow — right panel: live open tabs, recently closed,
   session/window capture, "add current tab" picker.

   Favicons for open tabs come straight from tab.favIconUrl (no
   remote service needed) — and they're stored on save so cards keep
   real icons offline.
   ================================================================ */

import { ext, caps, isTabFlowTab, focusTab } from '../../common/ext.js';
import { q, h, debounce, faviconEl, letterTile, timestampLabel, domainOf } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { getDoc, activeSpace, settings, update } from '../store.js';
import { registerRenderer, render } from './bus.js';
import { openOverlay, closeOverlay, bindBackdropClose } from './modals.js';
import { toast } from './toast.js';
import { setDrag, clearDrag } from './dnd.js';
import { makeCollection, makeTab } from '../migrations.js';

let openTabs = [];

/* ---------- data ---------- */

async function loadOpenTabs() {
  try {
    openTabs = (await ext.tabs.query({})) ?? [];
  } catch {
    openTabs = [];
  }
  renderOpenTabs();
}

const refreshSoon = debounce(loadOpenTabs, 250);

/* ---------- capture helpers ---------- */

function toSavedTab(tab) {
  return makeTab({
    title: tab.title || tab.url,
    url: tab.url,
    favicon: tab.favIconUrl && tab.favIconUrl.startsWith('https:') ? tab.favIconUrl : '',
  });
}

function saveTabsAsCollection(tabs, namePrefix) {
  const space = activeSpace();
  if (!space) return;
  const usable = tabs.filter((tab) => !isTabFlowTab(tab) && /^https?:/i.test(tab.url ?? ''));
  if (!usable.length) {
    toast('No tabs to save.');
    return;
  }
  const collection = makeCollection(`${namePrefix} – ${timestampLabel()}`, usable.map(toSavedTab));
  update(() => space.collections.unshift(collection));
  render('collections');
  toast(`Saved ${usable.length} tab${usable.length === 1 ? '' : 's'} to “${space.name}”.`);
}

/* ---------- render: open tabs ---------- */

function renderOpenTabs() {
  const list = q('#open-tabs-list');
  const visible = openTabs.filter((tab) => !isTabFlowTab(tab));

  if (!visible.length) {
    list.replaceChildren(
      h('div', { class: 'panel-empty', text: 'No other tabs are open.' })
    );
    return;
  }

  const byWindow = new Map();
  for (const tab of visible) {
    if (!byWindow.has(tab.windowId)) byWindow.set(tab.windowId, []);
    byWindow.get(tab.windowId).push(tab);
  }

  let windowIndex = 1;
  list.replaceChildren(
    ...[...byWindow.values()].map((tabs) => {
      const group = h('div', { class: 'win-group' });
      const header = h('div', { class: 'win-group-hdr', onclick: () => group.classList.toggle('collapsed') },
        h('span', { class: 'win-chevron', html: icon('chevron-down', 12) }),
        h('span', { html: icon('monitor', 12) }),
        h('span', { text: `Window ${windowIndex++} (${tabs.length})` }),
        h('button', {
          class: 'save-win-btn',
          html: icon('download', 11),
          title: 'Save window as collection',
          'aria-label': 'Save window as collection',
          onclick: (event) => {
            event.stopPropagation();
            saveTabsAsCollection(tabs, 'Window');
          },
        })
      );
      group.append(header, h('div', { class: 'win-tabs-wrap' }, tabs.map(buildTabRow)));
      return group;
    })
  );
}

function buildTabRow(tab) {
  const fav = tab.favIconUrl
    ? faviconEl(tab.url, tab.favIconUrl, settings().remoteFavicons, 'tab-fav-img', 'tab-fav-fallback')
    : letterTile(tab.url ?? '', 'tab-fav-fallback');

  const row = h('div',
    {
      class: 'tab-row',
      title: tab.url,
      onclick: () => focusTab(tab).catch(() => {}),
    },
    fav,
    h('span', { class: 'tab-row-title', text: tab.title || tab.url })
  );

  row.draggable = true;
  row.addEventListener('dragstart', (event) => {
    setDrag({
      type: 'open-tab',
      title: tab.title || tab.url,
      url: tab.url,
      favicon: tab.favIconUrl && tab.favIconUrl.startsWith('https:') ? tab.favIconUrl : '',
    });
    row.classList.add('dragging-src');
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', tab.url ?? '');
  });
  row.addEventListener('dragend', () => {
    row.classList.remove('dragging-src');
    clearDrag();
  });
  return row;
}

/* ---------- render: recently closed ---------- */

async function renderRecentlyClosed() {
  const section = q('#recently-closed-section');
  const list = q('#recently-closed-list');
  if (!caps.sessions) {
    section.style.display = 'none';
    return;
  }
  let sessions = [];
  try {
    sessions = (await ext.sessions.getRecentlyClosed({ maxResults: 10 })) ?? [];
  } catch {
    section.style.display = 'none';
    return;
  }
  const tabs = sessions.flatMap((session) => (session.tab ? [session.tab] : []));
  if (!tabs.length) {
    list.replaceChildren(h('div', { class: 'panel-empty', text: 'Nothing recently closed.' }));
    return;
  }
  list.replaceChildren(
    ...tabs.map((tab) => {
      const restore = async () => {
        try {
          if (tab.sessionId != null) await ext.sessions.restore(tab.sessionId);
          else if (tab.url) await ext.tabs.create({ url: tab.url });
        } catch {
          if (tab.url) ext.tabs.create({ url: tab.url }).catch(() => {});
        }
      };
      return h('div', { class: 'tab-row', title: tab.url ?? '', onclick: restore },
        faviconEl(tab.url ?? '', tab.favIconUrl, settings().remoteFavicons, 'tab-fav-img', 'tab-fav-fallback'),
        h('span', { class: 'tab-row-title', text: tab.title || tab.url || '(unknown)' })
      );
    })
  );
}

/* ---------- add current tab picker ---------- */

async function openAddCurrentTab() {
  let currentTab = null;
  try {
    // The focused tab is this TabFlow page; offer the most recent *other* tab.
    const tabs = await ext.tabs.query({ currentWindow: true });
    currentTab =
      tabs.find((tab) => tab.active && !isTabFlowTab(tab)) ??
      tabs
        .filter((tab) => !isTabFlowTab(tab) && /^https?:/i.test(tab.url ?? ''))
        .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))[0];
  } catch {
    /* handled below */
  }
  if (!currentTab) {
    toast('No suitable tab found in this window.');
    return;
  }

  const pending = {
    title: currentTab.title || currentTab.url,
    url: currentTab.url,
    favicon: currentTab.favIconUrl && currentTab.favIconUrl.startsWith('https:') ? currentTab.favIconUrl : '',
  };

  q('#add-to-col-info').textContent = `${pending.title} (${domainOf(pending.url) || pending.url})`;
  const list = q('#add-to-col-list');
  const entries = [];
  for (const space of getDoc().spaces) {
    for (const collection of space.collections) {
      entries.push(
        h('button', {
          class: 'space-picker-item',
          onclick: () => {
            update(() => collection.tabs.push(makeTab(pending)));
            closeOverlay('#add-to-col-overlay');
            render('collections');
            toast(`Added to “${collection.name}”.`);
          },
        },
          h('span', { class: 'picker-space-label', text: `${space.name} /` }),
          h('span', { text: collection.name }),
          h('span', { class: 'picker-count', text: `${collection.tabs.length} tabs` })
        )
      );
    }
  }
  list.replaceChildren(
    ...(entries.length ? entries : [h('div', { class: 'panel-empty', text: 'Create a collection first.' })])
  );
  openOverlay('#add-to-col-overlay');
}

/* ---------- init ---------- */

export function initOpenTabs() {
  registerRenderer('opentabs', renderOpenTabs);
  registerRenderer('recentlyClosed', renderRecentlyClosed);

  q('#btn-refresh-tabs').addEventListener('click', loadOpenTabs);
  q('#btn-save-session').addEventListener('click', () => saveTabsAsCollection(openTabs, 'Session'));
  q('#btn-add-current-tab').addEventListener('click', openAddCurrentTab);
  q('#btn-rc-refresh').addEventListener('click', renderRecentlyClosed);
  q('#add-to-col-cancel').addEventListener('click', () => closeOverlay('#add-to-col-overlay'));
  bindBackdropClose(q('#add-to-col-overlay'));

  ext.tabs.onCreated.addListener(refreshSoon);
  ext.tabs.onRemoved.addListener(() => {
    refreshSoon();
    renderRecentlyClosed();
  });
  ext.tabs.onUpdated.addListener((tabId, info) => {
    if (info.status === 'complete' || info.title || info.favIconUrl) refreshSoon();
  });

  loadOpenTabs();
  renderRecentlyClosed();
}
