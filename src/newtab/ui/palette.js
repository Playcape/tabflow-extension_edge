/* ================================================================
   TabFlow — command palette (Ctrl/⌘ + K)
   A quick launcher over tabs, collections, spaces, links, tasks and
   a few navigation actions. Fuzzy-filtered, keyboard-driven, and
   entirely local — it only ever reads the in-memory document.
   ================================================================ */

import { q, h, domainOf } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { getDoc, settings } from '../store.js';
import { setNav, toggleZen } from './layout.js';
import { switchSpace, switchPageSpace } from './spaces.js';
import { openUrl } from './collections.js';
import { renderPages } from './pages.js';

let overlay = null;
let input = null;
let resultList = null;
let items = []; // current filtered results
let selected = 0;

function isOpen() {
  return overlay && overlay.style.display !== 'none';
}

/* ---------- index ---------- */

function actionItems() {
  return [
    { group: 'Action', label: 'Toggle Zen mode', keywords: 'focus minimal hide chrome', ic: 'monitor', run: () => toggleZen() },
    { group: 'Action', label: 'Open Settings', keywords: 'preferences options config', ic: 'settings', run: () => setNav('settings') },
    { group: 'Action', label: 'Go to Collections', keywords: 'tabs home grid', ic: 'layout-grid', run: () => setNav('collections') },
    { group: 'Action', label: 'Go to Pages', keywords: 'pages html study guide notes', ic: 'file-text', run: () => setNav('pages') },
    { group: 'Action', label: 'Go to Links', keywords: 'aliases omnibox shortcuts', ic: 'link', run: () => setNav('links') },
    { group: 'Action', label: 'Go to Tasks', keywords: 'todo read later queue', ic: 'check-square', run: () => setNav('tasks') },
  ];
}

function buildIndex() {
  const doc = getDoc();
  const idx = [...actionItems()];

  for (const space of doc.spaces) {
    idx.push({ group: 'Space', label: space.name, ic: 'layout-grid', run: () => switchSpace(space.id) });
    for (const col of space.collections) {
      idx.push({
        group: 'Collection', label: col.name, sub: space.name, ic: 'inbox',
        run: () => goToCollection(space.id, col.id),
      });
      for (const tab of col.tabs) {
        idx.push({
          group: 'Tab', label: tab.title || tab.url, sub: domainOf(tab.url), url: tab.url, ic: 'external-link',
          run: () => tab.url && openUrl(tab.url),
        });
      }
    }
  }

  for (const pageSpace of (doc.pageSpaces ?? [])) {
    idx.push({ group: 'Page Space', label: pageSpace.name, ic: 'file-text', run: () => { switchPageSpace(pageSpace.id); setNav('pages'); } });
    for (const page of pageSpace.pages) {
      idx.push({
        group: 'Page', label: page.title, sub: pageSpace.name, ic: 'file-text',
        run: () => {
          if (doc.activePageSpaceId !== pageSpace.id) switchPageSpace(pageSpace.id);
          setNav('pages');
          renderPages();
        },
      });
    }
  }

  for (const link of doc.links) {
    idx.push({ group: 'Link', label: link.name, sub: link.url, url: link.url, ic: 'link', run: () => openUrl(link.url) });
  }
  for (const task of doc.tasks) {
    idx.push({
      group: 'Task', label: task.title, sub: task.url || (task.done ? '✓ done' : ''), ic: 'check-square',
      run: () => (task.url ? openUrl(task.url) : setNav('tasks')),
    });
  }
  return idx;
}

function goToCollection(spaceId, colId) {
  if (getDoc().activeSpaceId !== spaceId) switchSpace(spaceId);
  setNav('collections');
  requestAnimationFrame(() => {
    const el = q(`.collection[data-id="${colId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('cmdk-flash');
    setTimeout(() => el.classList.remove('cmdk-flash'), 1200);
  });
}

/* ---------- fuzzy match ---------- */

function score(item, queryLower) {
  if (!queryLower) return 0.001;
  const label = item.label.toLowerCase();
  if (label.startsWith(queryLower)) return 1000 - label.length;
  if (label.includes(queryLower)) return 500 - label.indexOf(queryLower);
  // subsequence over the whole haystack (label + sub + url + keywords)
  const hay = `${item.label} ${item.sub ?? ''} ${item.url ?? ''} ${item.keywords ?? ''}`.toLowerCase();
  let ti = 0;
  let s = 0;
  for (const ch of queryLower) {
    const at = hay.indexOf(ch, ti);
    if (at === -1) return -1;
    s += 1 - (at - ti) * 0.01;
    ti = at + 1;
  }
  return s;
}

const GROUP_ORDER = { Action: 0, Space: 1, 'Page Space': 1.5, Collection: 2, Tab: 3, Page: 3.5, Link: 4, Task: 5 };

function filterItems(query) {
  const all = buildIndex();
  const qlow = query.trim().toLowerCase();
  const scored = [];
  for (const it of all) {
    const sc = score(it, qlow);
    if (sc > -1) scored.push({ it, sc });
  }
  scored.sort((a, b) => b.sc - a.sc || GROUP_ORDER[a.it.group] - GROUP_ORDER[b.it.group]);
  return scored.slice(0, 40).map((x) => x.it);
}

/* ---------- render ---------- */

function renderResults() {
  if (!items.length) {
    resultList.replaceChildren(h('div', { class: 'cmdk-empty', text: 'No matches' }));
    return;
  }
  resultList.replaceChildren(
    ...items.map((it, i) =>
      h('div', {
        class: 'cmdk-item' + (i === selected ? ' selected' : ''),
        role: 'option',
        'aria-selected': i === selected ? 'true' : 'false',
        onmousemove: () => {
          if (selected !== i) {
            selected = i;
            updateSelection();
          }
        },
        onclick: () => run(i),
      },
        h('span', { class: 'cmdk-item-ic', html: icon(it.ic || 'external-link', 15) }),
        h('span', { class: 'cmdk-item-label', text: it.label }),
        it.sub ? h('span', { class: 'cmdk-item-sub', text: it.sub }) : null,
        h('span', { class: 'cmdk-item-group', text: it.group })
      )
    )
  );
}

function updateSelection() {
  const rows = resultList.querySelectorAll('.cmdk-item');
  rows.forEach((row, i) => {
    const on = i === selected;
    row.classList.toggle('selected', on);
    row.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on) row.scrollIntoView({ block: 'nearest' });
  });
}

function run(i) {
  const it = items[i];
  close();
  if (it?.run) it.run();
}

/* ---------- open / close ---------- */

function open() {
  if (!settings().cmdPalette) return;
  overlay.style.display = 'flex';
  input.value = '';
  items = filterItems('');
  selected = 0;
  renderResults();
  input.focus();
}

function close() {
  if (overlay) overlay.style.display = 'none';
}

function onInputKey(event) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      event.stopPropagation();
      if (items.length) {
        selected = (selected + 1) % items.length;
        updateSelection();
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      event.stopPropagation();
      if (items.length) {
        selected = (selected - 1 + items.length) % items.length;
        updateSelection();
      }
      break;
    case 'Enter':
      event.preventDefault();
      event.stopPropagation();
      if (items.length) run(selected);
      break;
    case 'Escape':
      event.preventDefault();
      event.stopPropagation();
      close();
      break;
    default:
      break;
  }
}

/* ---------- init ---------- */

export function initPalette() {
  overlay = q('#cmdk-overlay');
  input = q('#cmdk-input');
  resultList = q('#cmdk-results');
  if (!overlay || !input || !resultList) return;

  q('.cmdk-input-icon').innerHTML = icon('search', 15);

  input.addEventListener('input', () => {
    items = filterItems(input.value);
    selected = 0;
    renderResults();
  });
  input.addEventListener('keydown', onInputKey);
  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) close();
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
      if (!settings().cmdPalette) return;
      event.preventDefault();
      isOpen() ? close() : open();
    }
  });
}
