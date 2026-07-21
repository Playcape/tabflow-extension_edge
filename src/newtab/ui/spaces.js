/* ================================================================
   TabFlow — spaces (sidebar list, breadcrumb, customize modal)
   ================================================================ */

import { q, h, uid } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { SPACE_COLORS, SPACE_EMOJIS } from '../../common/themes.js';
import { getDoc, activeSpace, findSpace, update, settings } from '../store.js';
import { registerRenderer, render } from './bus.js';
import { showMenu } from './contextmenu.js';
import { confirmDialog, openOverlay, closeOverlay, bindBackdropClose } from './modals.js';
import { editInline } from './inline.js';
import { toast } from './toast.js';
import { clearSearch } from './collections.js';

/* ---------- render ---------- */

function renderSpaces() {
  const doc = getDoc();
  const list = q('#spaces-list');
  list.replaceChildren(...doc.spaces.map(buildSpaceItem));
  renderBreadcrumb();
}

function renderBreadcrumb() {
  q('#space-breadcrumb').textContent = activeSpace()?.name ?? '';
}

function buildSpaceItem(space) {
  const doc = getDoc();

  const nameEl = h('span', { class: 'space-name', text: space.name });
  nameEl.addEventListener('dblclick', (event) => {
    event.stopPropagation();
    startRename(space, nameEl);
  });

  const dot = space.icon
    ? h('div', { class: 'space-dot space-icon', text: space.icon })
    : h('div', { class: 'space-dot', style: space.color ? `background:${space.color}` : '' });

  const handle = h('div', {
    class: 'space-drag-handle',
    html: icon('grip-vertical', 10),
    title: 'Drag to reorder',
  });

  const el = h('div',
    {
      class: 'space-item' + (space.id === doc.activeSpaceId ? ' active' : ''),
      dataset: { id: space.id },
      onclick: () => switchSpace(space.id),
      oncontextmenu: (event) => {
        event.preventDefault();
        showMenu(event.clientX, event.clientY, [
          { label: 'Rename', icon: 'pencil', onClick: () => startRename(space, nameEl) },
          { label: 'Customize…', icon: 'settings', onClick: () => openCustomize(space.id) },
          { label: 'Delete', icon: 'trash', danger: true, onClick: () => deleteSpace(space.id) },
        ]);
      },
    },
    handle,
    dot,
    nameEl,
    h('button', {
      class: 'space-del-btn',
      html: icon('x', 11),
      title: `Delete space “${space.name}”`,
      'aria-label': `Delete space ${space.name}`,
      onclick: (event) => {
        event.stopPropagation();
        deleteSpace(space.id);
      },
    })
  );

  /* Handle-gated drag reordering. */
  let handleArmed = false;
  handle.addEventListener('mousedown', () => {
    handleArmed = true;
    document.addEventListener('mouseup', () => (handleArmed = false), { once: true });
  });
  el.draggable = true;
  el.addEventListener('dragstart', (event) => {
    if (!handleArmed) {
      event.preventDefault();
      return;
    }
    handleArmed = false;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-tabflow-space', space.id);
    el.classList.add('dragging-src');
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging-src');
    clearSpaceDropMarkers();
  });
  el.addEventListener('dragover', (event) => {
    if (!event.dataTransfer.types.includes('application/x-tabflow-space')) return;
    event.preventDefault();
    clearSpaceDropMarkers();
    const rect = el.getBoundingClientRect();
    el.classList.add(event.clientY < rect.top + rect.height / 2 ? 'space-drop-before' : 'space-drop-after');
  });
  el.addEventListener('drop', (event) => {
    const draggedId = event.dataTransfer.getData('application/x-tabflow-space');
    if (!draggedId || draggedId === space.id) return;
    event.preventDefault();
    const rect = el.getBoundingClientRect();
    const after = event.clientY >= rect.top + rect.height / 2;
    update((doc) => {
      const fromIdx = doc.spaces.findIndex((s) => s.id === draggedId);
      if (fromIdx === -1) return;
      const [moved] = doc.spaces.splice(fromIdx, 1);
      const toIdx = doc.spaces.findIndex((s) => s.id === space.id);
      doc.spaces.splice(after ? toIdx + 1 : toIdx, 0, moved);
    });
    renderSpaces();
  });

  return el;
}

function clearSpaceDropMarkers() {
  q('#spaces-list')
    .querySelectorAll('.space-drop-before, .space-drop-after')
    .forEach((el) => el.classList.remove('space-drop-before', 'space-drop-after'));
}

/* ---------- actions ---------- */

export function switchSpace(id) {
  update((doc) => (doc.activeSpaceId = id));
  clearSearch();
  render('spaces', 'collections', 'viewmenu');
}

function startRename(space, nameEl) {
  editInline(nameEl, space.name, (value) => {
    update(() => (space.name = value));
    render('spaces');
  });
}

function addSpace() {
  const id = uid();
  update((doc) => {
    doc.spaces.push({
      id,
      name: 'New Space',
      viewMode: settings().defaultView,
      collections: [],
    });
    doc.activeSpaceId = id;
  });
  clearSearch();
  render('spaces', 'collections', 'viewmenu');
  // Immediately offer a rename.
  const nameEl = q(`.space-item[data-id="${id}"] .space-name`);
  const space = findSpace(id);
  if (nameEl && space) startRename(space, nameEl);
}

async function deleteSpace(id) {
  const doc = getDoc();
  if (doc.spaces.length <= 1) {
    toast('Cannot delete the last space.');
    return;
  }
  const space = findSpace(id);
  const tabCount = space.collections.reduce((sum, c) => sum + c.tabs.length, 0);
  const ok = await confirmDialog({
    title: `Delete “${space.name}”?`,
    message: tabCount
      ? `This removes ${space.collections.length} collection(s) with ${tabCount} saved tab(s).`
      : 'This space is empty.',
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!ok) return;
  update((doc) => {
    doc.spaces = doc.spaces.filter((s) => s.id !== id);
    if (doc.activeSpaceId === id) doc.activeSpaceId = doc.spaces[0].id;
  });
  render('spaces', 'collections', 'viewmenu');
}

/* ---------- customize modal ---------- */

let customizeState = null; // { spaceId, color, icon }

function openCustomize(spaceId) {
  const space = findSpace(spaceId);
  if (!space) return;
  customizeState = { spaceId, color: space.color ?? null, icon: space.icon ?? null };
  renderCustomizeRows();
  openOverlay('#space-customize-overlay');
}

function renderCustomizeRows() {
  const colorRow = q('#sc-color-row');
  colorRow.replaceChildren(
    h('button', {
      class: 'sc-swatch sc-swatch-none' + (customizeState.color ? '' : ' selected'),
      text: '✕',
      title: 'No color',
      onclick: () => {
        customizeState.color = null;
        renderCustomizeRows();
      },
    }),
    ...SPACE_COLORS.map((hex) =>
      h('button', {
        class: 'sc-swatch' + (customizeState.color === hex ? ' selected' : ''),
        style: `background:${hex}`,
        title: hex,
        onclick: () => {
          customizeState.color = hex;
          renderCustomizeRows();
        },
      })
    )
  );

  const emojiRow = q('#sc-emoji-row');
  emojiRow.replaceChildren(
    h('button', {
      class: 'sc-emoji-btn' + (customizeState.icon ? '' : ' selected'),
      text: '✕',
      title: 'No icon',
      onclick: () => {
        customizeState.icon = null;
        renderCustomizeRows();
      },
    }),
    ...SPACE_EMOJIS.map((emoji) =>
      h('button', {
        class: 'sc-emoji-btn' + (customizeState.icon === emoji ? ' selected' : ''),
        text: emoji,
        onclick: () => {
          customizeState.icon = emoji;
          renderCustomizeRows();
        },
      })
    )
  );
}

function saveCustomize() {
  const space = findSpace(customizeState?.spaceId);
  if (space) {
    update(() => {
      if (customizeState.color) space.color = customizeState.color;
      else delete space.color;
      if (customizeState.icon) space.icon = customizeState.icon;
      else delete space.icon;
    });
    render('spaces');
  }
  closeOverlay('#space-customize-overlay');
  customizeState = null;
}

/* ---------- init ---------- */

export function initSpaces() {
  registerRenderer('spaces', renderSpaces);
  q('#btn-add-space').addEventListener('click', addSpace);
  q('#sc-save').addEventListener('click', saveCustomize);
  q('#sc-cancel').addEventListener('click', () => closeOverlay('#space-customize-overlay'));
  bindBackdropClose(q('#space-customize-overlay'));
}
