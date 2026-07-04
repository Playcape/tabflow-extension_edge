/* ================================================================
   TabFlow — collections view
   Collections grid, tab cards, view modes, search, drag & drop,
   card edit / hotkey / move-to-space modals.

   Click behavior: a saved tab opens in the *current* tab (this is a
   new-tab page — that's what start pages do). Ctrl/Cmd/middle-click
   opens a background tab. v1 always spawned new tabs and left the
   TabFlow tab behind.
   ================================================================ */

import { ext, caps, shortcutsPage, IS_FIREFOX } from '../../common/ext.js';
import {
  q, qa, h, domainOf, normalizeUrl, faviconEl, highlight, deepClone,
} from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { COLLECTION_COLORS } from '../../common/themes.js';
import {
  getDoc, settings, activeSpace, findSpace, findCollection, findTab,
  findTabBySlot, update, setUndo,
} from '../store.js';
import { registerRenderer, render } from './bus.js';
import { showMenu } from './contextmenu.js';
import { openOverlay, closeOverlay, bindBackdropClose } from './modals.js';
import { editInline } from './inline.js';
import { toast } from './toast.js';
import { setDrag, getDrag, clearDrag } from './dnd.js';
import { makeCollection, makeTab } from '../migrations.js';

const SLOT_COUNT = 4;
const SLOT_KEYS = ['Alt+1', 'Alt+2', 'Alt+3', 'Alt+4'];
const VIEW_MODES = [
  { key: 'card', label: 'Card', icon: 'layout-grid' },
  { key: 'compact', label: 'Compact', icon: 'layout-list' },
  { key: 'list', label: 'List', icon: 'list' },
  { key: 'grid', label: 'Grid', icon: 'grid' },
];

let searchQuery = '';

/* ============================================================
   Opening URLs
   ============================================================ */

function openUrl(url, { newTab = false, active = false } = {}) {
  if (!url) return;
  if (newTab) ext.tabs.create({ url, active }).catch(() => {});
  else location.href = url;
}

async function openMany(urls, { windowed = false, group = null } = {}) {
  const valid = urls.filter(Boolean);
  if (!valid.length) {
    toast('No tabs to open.');
    return 0;
  }
  try {
    if (windowed) {
      await ext.windows.create({ url: valid });
    } else if (group && caps.tabGroups) {
      const tabs = await Promise.all(valid.map((url) => ext.tabs.create({ url, active: false })));
      const groupId = await ext.tabs.group({ tabIds: tabs.map((t) => t.id) });
      await ext.tabGroups.update(groupId, { title: group, collapsed: false });
    } else {
      for (const url of valid) await ext.tabs.create({ url, active: false });
    }
    return valid.length;
  } catch (err) {
    console.error('TabFlow: open failed', err);
    toast('Some tabs could not be opened.');
    return 0;
  }
}

/* ============================================================
   Render
   ============================================================ */

function viewModeOf(space) {
  return space?.viewMode ?? 'card';
}

function renderCollections() {
  const area = q('#collections-area');
  const space = activeSpace();
  const viewMode = viewModeOf(space);
  area.className = `view-${viewMode}`;

  if (searchQuery) {
    renderSearchResults(area, viewMode);
    return;
  }

  const nodes = [];
  const callout = zenSetupCallout();
  if (callout) nodes.push(callout);

  if (!space || !space.collections.length) {
    nodes.push(emptyState());
  } else {
    nodes.push(...space.collections.map((col) => buildCollectionEl(col, space, viewMode)));
  }
  area.replaceChildren(...nodes);
}

/**
 * Zen ships with "URL bar replaces new tab" enabled, which means no
 * new-tab page — ours included — is ever shown. Without this hint a Zen
 * user would conclude the extension is broken.
 */
function zenSetupCallout() {
  if (!IS_FIREFOX || getDoc().ui.zenHintDismissed) return null;
  return h('div', { class: 'zen-callout', role: 'note' },
    h('div', { class: 'zen-callout-text' },
      h('strong', { text: 'Using Zen? ' }),
      'If opening a new tab shows a floating search bar instead of TabFlow, open ',
      h('code', { text: 'about:config' }),
      ' and set ',
      h('code', { text: 'zen.urlbar.replace-newtab' }),
      ' to ',
      h('code', { text: 'false' }),
      '.'
    ),
    h('button', {
      class: 'settings-btn slim',
      text: 'Copy pref name',
      onclick: async () => {
        try {
          await navigator.clipboard.writeText('zen.urlbar.replace-newtab');
          toast('Copied — paste it into about:config.');
        } catch {
          toast('Could not copy.');
        }
      },
    }),
    h('button', {
      class: 'icon-btn small',
      html: icon('x', 11),
      'aria-label': 'Dismiss Zen setup hint',
      onclick: () => {
        update((doc) => (doc.ui.zenHintDismissed = true));
        render('collections');
      },
    })
  );
}

function emptyState() {
  return h('div', { class: 'empty-state' },
    h('div', { class: 'empty-state-icon', html: icon('inbox', 40) }),
    h('div', { class: 'empty-state-title', text: 'No collections yet' }),
    h('div', {
      class: 'empty-state-desc',
      text: 'Group related tabs into collections. Save your open tabs from the panel on the right, or start empty.',
    }),
    h('button', {
      class: 'accent-btn',
      html: icon('folder-plus', 14) + ' New collection',
      onclick: addCollection,
    })
  );
}

/* ---------- search ---------- */

export function handleSearch(value) {
  searchQuery = value.trim().toLowerCase();
  q('#search-clear').style.display = searchQuery ? 'flex' : 'none';
  render('collections');
}

export function clearSearch() {
  searchQuery = '';
  const input = q('#search-input');
  if (input) input.value = '';
  const clear = q('#search-clear');
  if (clear) clear.style.display = 'none';
}

function renderSearchResults(area, viewMode) {
  const doc = getDoc();
  const groups = [];
  for (const space of doc.spaces) {
    for (const collection of space.collections) {
      const matches = collection.tabs.filter(
        (tab) =>
          tab.title.toLowerCase().includes(searchQuery) ||
          tab.url.toLowerCase().includes(searchQuery) ||
          (tab.tags ?? []).some((tag) => tag.toLowerCase().includes(searchQuery))
      );
      if (matches.length) groups.push({ space, collection, matches });
    }
  }

  const total = groups.reduce((sum, group) => sum + group.matches.length, 0);
  const header = h('div', {
    class: 'search-results-hd',
    text: `${total} result${total === 1 ? '' : 's'} for “${searchQuery}”`,
  });

  if (!groups.length) {
    area.replaceChildren(
      header,
      h('div', { class: 'empty-state' },
        h('div', { class: 'empty-state-icon', html: icon('search', 40) }),
        h('div', { class: 'empty-state-title', text: 'Nothing found' }),
        h('div', { class: 'empty-state-desc', text: 'Search covers titles, URLs, and tags across all spaces.' })
      )
    );
    return;
  }

  area.replaceChildren(
    header,
    ...groups.map(({ space, collection, matches }) => {
      const el = buildCollectionEl(
        { ...collection, collapsed: false },
        space,
        viewMode,
        { tabs: matches, searchContext: true }
      );
      return el;
    })
  );
}

/* ---------- collection ---------- */

function sortedTabs(collection) {
  const tabs = [...collection.tabs];
  const compare =
    collection.sortMode === 'title-asc' ? (a, b) => a.title.localeCompare(b.title) :
    collection.sortMode === 'title-desc' ? (a, b) => b.title.localeCompare(a.title) :
    collection.sortMode === 'domain' ? (a, b) => domainOf(a.url).localeCompare(domainOf(b.url)) :
    null;
  const pinned = tabs.filter((t) => t.pinned);
  const rest = tabs.filter((t) => !t.pinned);
  if (compare) {
    pinned.sort(compare);
    rest.sort(compare);
  }
  return [...pinned, ...rest];
}

function buildCollectionEl(collection, space, viewMode, { tabs = null, searchContext = false } = {}) {
  const el = h('div', {
    class: 'collection' + (collection.collapsed ? ' collapsed' : ''),
    dataset: { id: collection.id, spId: space.id },
  });
  if (collection.color) el.dataset.color = collection.color;

  /* header */
  const nameEl = h('span', { class: 'col-name', text: collection.name });
  nameEl.addEventListener('dblclick', () => startRename(collection, nameEl));

  const header = h('div', { class: 'collection-header' },
    h('button', {
      class: 'col-chevron icon-btn',
      html: icon('chevron-down', 13),
      'aria-label': collection.collapsed ? 'Expand collection' : 'Collapse collection',
      'aria-expanded': String(!collection.collapsed),
      onclick: () => {
        update(() => (collection.collapsed = !collection.collapsed));
        render('collections');
      },
    }),
    h('div', { class: 'col-name-wrap' },
      searchContext
        ? h('span', { class: 'col-search-space', text: `${space.name} / ` })
        : null,
      nameEl,
      h('span', { class: 'col-count', text: String((tabs ?? collection.tabs).length) }),
      h('button', {
        class: 'col-restore-btn',
        html: icon('external-link', 11) + ' Open all',
        title: 'Open every tab in this collection',
        onclick: async (event) => {
          event.stopPropagation();
          const count = await openMany(collection.tabs.map((t) => t.url));
          if (count) toast(`Opened ${count} tab${count === 1 ? '' : 's'} from “${collection.name}”.`);
        },
      }),
      h('button', {
        class: 'col-new-win-btn',
        html: icon('monitor', 11) + ' Window',
        title: 'Open all tabs in a new window',
        onclick: (event) => {
          event.stopPropagation();
          openMany(collection.tabs.map((t) => t.url), { windowed: true });
        },
      })
    ),
    h('div', { class: 'col-actions' },
      h('button', {
        class: 'icon-btn',
        html: icon('arrow-up-down', 11),
        title: 'Sort tabs',
        'aria-label': 'Sort tabs',
        onclick: (event) => {
          event.stopPropagation();
          showSortMenu(event.clientX, event.clientY, collection);
        },
      }),
      h('button', {
        class: 'icon-btn',
        html: icon('more-horizontal', 13),
        title: 'Collection menu',
        'aria-label': 'Collection menu',
        onclick: (event) => {
          event.stopPropagation();
          showCollectionMenu(event.clientX, event.clientY, collection, space, nameEl);
        },
      })
    )
  );

  /* drag handle for reordering (not while searching) */
  if (!searchContext) {
    const handle = h('span', {
      class: 'col-drag-handle',
      html: icon('grip-vertical', 11),
      title: 'Drag to reorder',
    });
    let armed = false;
    handle.addEventListener('mousedown', () => {
      armed = true;
      document.addEventListener('mouseup', () => (armed = false), { once: true });
    });
    el.draggable = true;
    el.addEventListener('dragstart', (event) => {
      if (!armed) {
        event.preventDefault();
        return;
      }
      armed = false;
      event.stopPropagation();
      setDrag({ type: 'collection', collectionId: collection.id, spaceId: space.id });
      el.classList.add('col-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', collection.name);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('col-dragging');
      clearIndicators();
      clearDrag();
    });
    header.prepend(handle);
  }

  el.append(header);

  /* cards */
  const cardsWrap = h('div', { class: 'cards-wrap' });
  if (!collection.collapsed) {
    const list = tabs ?? sortedTabs(collection);
    if (!list.length) {
      cardsWrap.append(h('div', { class: 'col-empty', text: 'Drop tabs here, or use +' }));
    } else {
      cardsWrap.append(...list.map((tab) => buildCard(tab, collection, space)));
    }
    if (!searchContext) {
      cardsWrap.append(
        h('div', {
          class: 'add-tab-card',
          html: icon('plus', 18),
          title: 'Add a tab to this collection',
          role: 'button',
          tabindex: '0',
          onclick: () => openTabModal({ mode: 'add', collection }),
          onkeydown: (event) => {
            if (event.key === 'Enter') openTabModal({ mode: 'add', collection });
          },
        })
      );
    }
  }
  el.append(
    h('div', { class: 'drop-zone', dataset: { colId: collection.id, spId: space.id } }, cardsWrap)
  );
  return el;
}

function startRename(collection, nameEl) {
  editInline(nameEl, collection.name, (value) => {
    update(() => (collection.name = value));
    render('collections');
  });
}

function showCollectionMenu(x, y, collection, space, nameEl) {
  const doc = getDoc();
  showMenu(x, y, [
    { label: 'Rename', icon: 'pencil', onClick: () => startRename(collection, nameEl) },
    caps.tabGroups && {
      label: 'Open as tab group',
      icon: 'layout-grid',
      onClick: async () => {
        await openMany(collection.tabs.map((t) => t.url), { group: collection.name });
        toast(`Opened “${collection.name}” as a tab group.`);
      },
    },
    doc.spaces.length > 1 && {
      label: 'Move to space…',
      icon: 'external-link',
      onClick: () => openSpacePicker(collection.id, space.id),
    },
    {
      swatches: [
        { color: '', title: 'No color' },
        ...COLLECTION_COLORS.map((c) => ({ color: c.key, hex: c.hex, title: c.key })),
      ],
      onPick: (colorKey) => {
        update(() => {
          if (colorKey) collection.color = colorKey;
          else delete collection.color;
        });
        render('collections');
      },
    },
    { label: 'Delete', icon: 'trash', danger: true, onClick: () => deleteCollection(space.id, collection.id) },
  ]);
}

function showSortMenu(x, y, collection) {
  const options = [
    { key: 'title-asc', label: 'Title A→Z' },
    { key: 'title-desc', label: 'Title Z→A' },
    { key: 'domain', label: 'By domain' },
    { key: 'manual', label: 'Manual order' },
  ];
  showMenu(x, y, options.map((option) => ({
    label: option.label,
    active: (collection.sortMode ?? 'manual') === option.key,
    onClick: () => {
      update(() => (collection.sortMode = option.key));
      render('collections');
    },
  })));
}

/* ---------- card ---------- */

function buildCard(tab, collection, space) {
  const remote = settings().remoteFavicons;

  const favRow = h('div', { class: 'card-fav-row' },
    faviconEl(tab.url, tab.favicon, remote, 'card-fav', 'fav-fallback')
  );
  if (tab.pinned) favRow.append(h('span', { class: 'card-pin-indicator', html: icon('pin', 10), title: 'Pinned' }));
  if (tab.note) favRow.append(h('span', { class: 'card-note-indicator', html: icon('file-text', 10), title: tab.note }));
  if (tab.hotkeySlot) {
    favRow.append(
      h('button', {
        class: 'hotkey-badge',
        text: SLOT_KEYS[tab.hotkeySlot - 1],
        title: `Hotkey slot ${tab.hotkeySlot} — click to change`,
        onclick: (event) => {
          event.stopPropagation();
          openHotkeyModal(tab, collection);
        },
      })
    );
  }

  const titleEl = h('div', { class: 'card-title' });
  titleEl.append(searchQuery ? highlight(tab.title, searchQuery) : tab.title);

  const urlEl = h('div', { class: 'card-url' });
  const urlText = domainOf(tab.url) || tab.url;
  urlEl.append(searchQuery ? highlight(urlText, searchQuery) : urlText);

  const body = h('div', { class: 'card-body' }, favRow, titleEl, urlEl);
  if (tab.tags?.length) {
    body.append(
      h('div', { class: 'card-tags' },
        tab.tags.map((tag) => h('span', { class: 'tag-pill', text: tag }))
      )
    );
  }

  const actionBtn = (name, tip, onClick, extraClass = '') =>
    h('button', {
      class: 'card-act-btn' + extraClass,
      html: icon(name, 11),
      title: tip,
      'aria-label': tip,
      onclick: (event) => {
        event.stopPropagation();
        onClick();
      },
    });

  const actions = h('div', { class: 'card-actions' },
    actionBtn('pencil', 'Edit', () => openTabModal({ mode: 'edit', collection, tab })),
    actionBtn('copy', 'Copy URL', async () => {
      try {
        await navigator.clipboard.writeText(tab.url);
        toast('URL copied.');
      } catch {
        toast('Could not copy.');
      }
    }),
    actionBtn('external-link', 'Open in new tab', () => openUrl(tab.url, { newTab: true, active: true })),
    actionBtn(tab.pinned ? 'pin-off' : 'pin', tab.pinned ? 'Unpin' : 'Pin to top', () => {
      update(() => (tab.pinned = !tab.pinned));
      render('collections');
    }, tab.pinned ? ' hk-active' : ''),
    actionBtn('keyboard', tab.hotkeySlot ? `Hotkey: ${SLOT_KEYS[tab.hotkeySlot - 1]}` : 'Assign hotkey',
      () => openHotkeyModal(tab, collection), tab.hotkeySlot ? ' hk-active' : '')
  );

  const card = h('div',
    {
      class: 'tab-card' + (tab.pinned ? ' pinned' : ''),
      dataset: { tabId: tab.id, colId: collection.id, spId: space.id },
      tabindex: '0',
      role: 'link',
      'aria-label': `${tab.title} — ${urlText}`,
    },
    h('button', {
      class: 'card-remove',
      html: icon('x', 11),
      title: 'Remove from collection',
      'aria-label': `Remove ${tab.title}`,
      onclick: (event) => {
        event.stopPropagation();
        removeTab(collection.id, tab.id);
      },
    }),
    body,
    actions
  );

  card.addEventListener('click', (event) => {
    if (event.target.closest('button') || event.target.closest('.editing')) return;
    openUrl(tab.url, { newTab: event.ctrlKey || event.metaKey, active: !(event.ctrlKey || event.metaKey) });
  });
  card.addEventListener('auxclick', (event) => {
    if (event.button === 1) openUrl(tab.url, { newTab: true });
  });
  card.addEventListener('keydown', (event) => {
    if (event.target !== card) return;
    if (event.key === 'Enter') openUrl(tab.url, { newTab: event.ctrlKey || event.metaKey, active: true });
    if (event.key === 'Delete') removeTab(collection.id, tab.id);
  });

  card.draggable = true;
  card.addEventListener('dragstart', (event) => {
    event.stopPropagation();
    setDrag({ type: 'card', tabId: tab.id, collectionId: collection.id });
    card.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tab.url);
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    clearIndicators();
    clearDrag();
  });

  return card;
}

/* ============================================================
   Mutations
   ============================================================ */

export function addCollection() {
  const space = activeSpace();
  if (!space) return;
  const collection = makeCollection();
  update(() => space.collections.unshift(collection));
  render('collections');
  const nameEl = q(`.collection[data-id="${collection.id}"] .col-name`);
  if (nameEl) startRename(collection, nameEl);
}

function deleteCollection(spaceId, collectionId) {
  const space = findSpace(spaceId);
  const idx = space?.collections.findIndex((c) => c.id === collectionId) ?? -1;
  if (idx === -1) return;
  const removed = deepClone(space.collections[idx]);
  update(() => space.collections.splice(idx, 1));
  setUndo('collection', () => {
    update(() => {
      const sp = findSpace(spaceId) ?? activeSpace();
      sp.collections.splice(Math.min(idx, sp.collections.length), 0, removed);
    });
    render('collections');
  });
  render('collections');
  toast(`Deleted “${removed.name}”.`, { undo: true });
}

function removeTab(collectionId, tabId) {
  const found = findCollection(collectionId);
  if (!found) return;
  const idx = found.collection.tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return;
  const removed = found.collection.tabs[idx];
  update(() => found.collection.tabs.splice(idx, 1));
  setUndo('tab', () => {
    update(() => {
      const target = findCollection(collectionId);
      if (target) target.collection.tabs.splice(Math.min(idx, target.collection.tabs.length), 0, removed);
    });
    render('collections');
  });
  render('collections');
  toast('Tab removed.', { undo: true });
}

export function addTabToCollection(collectionId, { title, url, favicon = '' }) {
  const found = findCollection(collectionId);
  if (!found) return false;
  update(() => found.collection.tabs.push(makeTab({ title, url, favicon })));
  render('collections');
  return true;
}

function moveCollectionToSpace(collectionId, fromSpaceId, toSpaceId) {
  const from = findSpace(fromSpaceId);
  const to = findSpace(toSpaceId);
  if (!from || !to) return;
  update(() => {
    const idx = from.collections.findIndex((c) => c.id === collectionId);
    if (idx === -1) return;
    const [moved] = from.collections.splice(idx, 1);
    to.collections.unshift(moved);
  });
  render('collections');
  toast(`Moved to “${to.name}”.`);
}

/* ============================================================
   Tab edit / add modal
   ============================================================ */

let tabModalState = null; // { mode: 'add'|'edit', collection, tab? }

function openTabModal({ mode, collection, tab = null }) {
  tabModalState = { mode, collection, tab };
  q('#card-edit-overlay-title').textContent = mode === 'edit' ? 'Edit Tab' : 'Add Tab';
  q('#card-edit-title').value = tab?.title ?? '';
  q('#card-edit-url').value = tab?.url ?? '';
  q('#card-edit-note-input').value = tab?.note ?? '';
  q('#card-edit-tags-input').value = (tab?.tags ?? []).join(', ');
  openOverlay('#card-edit-overlay');
  q('#card-edit-title').select();
}

function saveTabModal() {
  if (!tabModalState) return;
  const { mode, collection, tab } = tabModalState;
  const title = q('#card-edit-title').value.trim();
  const url = normalizeUrl(q('#card-edit-url').value);
  const note = q('#card-edit-note-input').value.trim();
  const tags = q('#card-edit-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);

  if (!title && !url) {
    toast('Enter a title or URL.');
    return;
  }

  update(() => {
    if (mode === 'add') {
      collection.tabs.push({
        ...makeTab({ title: title || domainOf(url) || url, url }),
        ...(note ? { note } : {}),
        ...(tags.length ? { tags } : {}),
      });
    } else {
      if (title) tab.title = title;
      if (url) tab.url = url;
      if (note) tab.note = note;
      else delete tab.note;
      if (tags.length) tab.tags = tags;
      else delete tab.tags;
    }
  });
  closeOverlay('#card-edit-overlay');
  tabModalState = null;
  render('collections');
}

/* ============================================================
   Hotkey slot modal
   ============================================================ */

let hotkeyState = null; // { tabId, collectionId, selectedSlot }

function openHotkeyModal(tab, collection) {
  hotkeyState = { tabId: tab.id, collectionId: collection.id, selectedSlot: tab.hotkeySlot ?? null };
  q('#hk-tab-name').textContent = tab.title || tab.url;
  q('#hk-clear').style.display = tab.hotkeySlot ? 'inline-flex' : 'none';

  const { url, hint } = shortcutsPage();
  const hintEl = q('#hk-remap-hint');
  hintEl.replaceChildren(
    'Hotkeys work globally, in any tab. Remap them at: ',
    url
      ? h('button', {
          class: 'hk-shortcut-link',
          text: url,
          onclick: () => ext.tabs.create({ url }).catch(() => toast('Open ' + url + ' manually.')),
        })
      : h('span', { text: hint })
  );

  renderHotkeySlots();
  openOverlay('#hotkey-overlay');
}

function renderHotkeySlots() {
  const grid = q('#hk-slot-grid');
  const buttons = [];
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    const owner = findTabBySlot(slot);
    const isMine = owner?.tab.id === hotkeyState.tabId;
    const taken = owner && !isMine;
    const selected = hotkeyState.selectedSlot === slot;
    const btn = h('button',
      {
        class: 'hk-slot-btn' + (selected ? ' selected' : '') + (taken ? ' taken' : ''),
        title: taken ? `Used by: ${owner.tab.title}` : `Assign slot ${slot}`,
        disabled: taken,
        onclick: () => {
          hotkeyState.selectedSlot = slot;
          renderHotkeySlots();
        },
      },
      h('div', { class: 'hk-slot-num', text: String(slot) }),
      h('div', { class: 'hk-slot-key', text: SLOT_KEYS[slot - 1] }),
      h('div', {
        class: 'hk-slot-owner',
        text: taken ? owner.tab.title : isMine ? '← this tab' : 'free',
      })
    );
    buttons.push(btn);
  }
  grid.replaceChildren(...buttons);
}

function saveHotkey() {
  if (!hotkeyState?.selectedSlot) {
    closeOverlay('#hotkey-overlay');
    return;
  }
  const found = findTab(hotkeyState.collectionId, hotkeyState.tabId);
  if (found) {
    update(() => {
      const previous = findTabBySlot(hotkeyState.selectedSlot);
      if (previous && previous.tab.id !== found.tab.id) delete previous.tab.hotkeySlot;
      found.tab.hotkeySlot = hotkeyState.selectedSlot;
    });
    toast(`${SLOT_KEYS[hotkeyState.selectedSlot - 1]} → “${found.tab.title}”`);
  }
  closeOverlay('#hotkey-overlay');
  hotkeyState = null;
  render('collections');
}

function clearHotkey() {
  const found = findTab(hotkeyState?.collectionId, hotkeyState?.tabId);
  if (found) update(() => delete found.tab.hotkeySlot);
  closeOverlay('#hotkey-overlay');
  hotkeyState = null;
  render('collections');
  toast('Hotkey removed.');
}

/* ============================================================
   Space picker (move collection)
   ============================================================ */

function openSpacePicker(collectionId, fromSpaceId) {
  const list = q('#space-picker-list');
  list.replaceChildren(
    ...getDoc().spaces
      .filter((space) => space.id !== fromSpaceId)
      .map((space) =>
        h('button', { class: 'space-picker-item', onclick: () => {
            moveCollectionToSpace(collectionId, fromSpaceId, space.id);
            closeOverlay('#space-picker-overlay');
          } },
          h('span', { class: 'space-dot', style: space.color ? `background:${space.color}` : '' }),
          h('span', { text: space.name })
        )
      )
  );
  openOverlay('#space-picker-overlay');
}

/* ============================================================
   View menu + toolbar
   ============================================================ */

function renderViewMenu() {
  const space = activeSpace();
  const current = viewModeOf(space);
  const menu = q('#view-menu');
  menu.replaceChildren(
    ...VIEW_MODES.map((mode) =>
      h('button', {
        class: 'dropdown-item' + (mode.key === current ? ' active' : ''),
        html: icon(mode.icon, 13) + ' ' + mode.label,
        onclick: () => {
          update(() => (space.viewMode = mode.key));
          menu.classList.remove('open');
          render('collections', 'viewmenu');
        },
      })
    )
  );
  const active = VIEW_MODES.find((mode) => mode.key === current) ?? VIEW_MODES[0];
  q('#view-trigger').innerHTML = icon(active.icon, 12) + ' View ' + icon('chevron-down', 10);
}

/* ============================================================
   Drag & drop (delegated on the collections area)
   ============================================================ */

let dropTarget = null; // card: { colId, refTabId, after } | collection: { colId, before }

function clearIndicators() {
  qa('.tab-card.drop-before, .tab-card.drop-after').forEach((el) =>
    el.classList.remove('drop-before', 'drop-after')
  );
  qa('.drop-zone.drop-active').forEach((el) => el.classList.remove('drop-active'));
  qa('.collection.col-drop-before, .collection.col-drop-after').forEach((el) =>
    el.classList.remove('col-drop-before', 'col-drop-after')
  );
  dropTarget = null;
}

function onAreaDragOver(event) {
  const drag = getDrag();
  if (!drag || searchQuery) return;

  if (drag.type === 'collection') {
    const colEl = event.target.closest('.collection');
    if (!colEl || colEl.dataset.id === drag.collectionId) return;
    event.preventDefault();
    clearIndicators();
    const rect = colEl.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    colEl.classList.add(before ? 'col-drop-before' : 'col-drop-after');
    dropTarget = { kind: 'collection', colId: colEl.dataset.id, before };
    return;
  }

  // card / open-tab
  const cardEl = event.target.closest('.tab-card');
  const zoneEl = event.target.closest('.drop-zone');
  if (!cardEl && !zoneEl) return;
  event.preventDefault();
  clearIndicators();

  if (cardEl && drag.type === 'card') {
    const rect = cardEl.getBoundingClientRect();
    const listView = !!cardEl.closest('.view-list');
    const before = listView
      ? event.clientY < rect.top + rect.height / 2
      : event.clientX < rect.left + rect.width / 2;
    cardEl.classList.add(before ? 'drop-before' : 'drop-after');
    dropTarget = {
      kind: 'card',
      colId: cardEl.dataset.colId,
      refTabId: cardEl.dataset.tabId,
      after: !before,
    };
  } else if (zoneEl) {
    zoneEl.classList.add('drop-active');
    dropTarget = { kind: 'zone', colId: zoneEl.dataset.colId };
  }
}

function onAreaDrop(event) {
  const drag = getDrag();
  const target = dropTarget;
  clearIndicators();
  if (!drag || !target) return;
  event.preventDefault();

  if (drag.type === 'collection' && target.kind === 'collection') {
    update((doc) => {
      const space = findSpace(drag.spaceId);
      if (!space) return;
      const fromIdx = space.collections.findIndex((c) => c.id === drag.collectionId);
      if (fromIdx === -1) return;
      const [moved] = space.collections.splice(fromIdx, 1);
      const toIdx = space.collections.findIndex((c) => c.id === target.colId);
      if (toIdx === -1) space.collections.push(moved);
      else space.collections.splice(target.before ? toIdx : toIdx + 1, 0, moved);
    });
    render('collections');
  } else if (drag.type === 'open-tab') {
    if (addTabToCollection(target.colId, drag)) toast('Tab saved to collection.');
  } else if (drag.type === 'card') {
    moveCard(drag, target);
  }
  clearDrag();
}

function moveCard(drag, target) {
  update(() => {
    const source = findCollection(drag.collectionId);
    if (!source) return;
    const fromIdx = source.collection.tabs.findIndex((t) => t.id === drag.tabId);
    if (fromIdx === -1) return;
    const [moved] = source.collection.tabs.splice(fromIdx, 1);

    const destination = findCollection(target.colId);
    if (!destination) {
      source.collection.tabs.splice(fromIdx, 0, moved); // put it back
      return;
    }
    const tabs = destination.collection.tabs;
    if (target.kind === 'card') {
      let idx = tabs.findIndex((t) => t.id === target.refTabId);
      if (idx === -1) tabs.push(moved);
      else tabs.splice(target.after ? idx + 1 : idx, 0, moved);
      // A manual placement implies manual ordering from now on.
      destination.collection.sortMode = 'manual';
    } else {
      tabs.push(moved);
    }
  });
  render('collections');
}

/* ============================================================
   Init
   ============================================================ */

export function initCollections() {
  registerRenderer('collections', renderCollections);
  registerRenderer('viewmenu', renderViewMenu);

  q('#btn-add-collection').addEventListener('click', addCollection);
  q('#btn-expand-all').addEventListener('click', () => {
    update(() => activeSpace()?.collections.forEach((c) => (c.collapsed = false)));
    render('collections');
  });
  q('#btn-collapse-all').addEventListener('click', () => {
    update(() => activeSpace()?.collections.forEach((c) => (c.collapsed = true)));
    render('collections');
  });

  q('#view-trigger').addEventListener('click', (event) => {
    event.stopPropagation();
    q('#view-menu').classList.toggle('open');
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#view-dropdown')) q('#view-menu').classList.remove('open');
  });

  q('#search-input').addEventListener('input', (event) => handleSearch(event.target.value));
  q('#search-clear').addEventListener('click', () => {
    clearSearch();
    render('collections');
  });

  /* modals */
  q('#card-edit-save').addEventListener('click', saveTabModal);
  q('#card-edit-cancel').addEventListener('click', () => closeOverlay('#card-edit-overlay'));
  bindBackdropClose(q('#card-edit-overlay'));
  for (const sel of ['#card-edit-title', '#card-edit-url', '#card-edit-tags-input']) {
    q(sel).addEventListener('keydown', (event) => {
      if (event.key === 'Enter') saveTabModal();
    });
  }

  q('#hk-save').addEventListener('click', saveHotkey);
  q('#hk-clear').addEventListener('click', clearHotkey);
  q('#hk-cancel').addEventListener('click', () => closeOverlay('#hotkey-overlay'));
  bindBackdropClose(q('#hotkey-overlay'));

  q('#space-picker-cancel').addEventListener('click', () => closeOverlay('#space-picker-overlay'));
  bindBackdropClose(q('#space-picker-overlay'));

  /* delegated DnD */
  const area = q('#collections-area');
  area.addEventListener('dragover', onAreaDragOver);
  area.addEventListener('drop', onAreaDrop);
  area.addEventListener('dragleave', (event) => {
    if (event.target === area) clearIndicators();
  });
}
