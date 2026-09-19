/* ================================================================
   TabFlow — HTML Pages view
   Card grid for HTML pages (Study Guides, Cheat Sheets, Custom Docs),
   sandboxed inline iframe viewer, and 3 input methods (Upload, Embed, Code).
   ================================================================ */

import { q, qa, h, uid } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { ext } from '../../common/ext.js';
import { getDoc, activePageSpace, findPage, update, flush } from '../store.js';
import { registerRenderer, render } from './bus.js';
import { openOverlay, closeOverlay } from './modals.js';
import { toast } from './toast.js';
import { preparePageContent, resolvePageContent } from '../pageStorage.js';
import { mountPage } from '../pageViewer.js';

let activeViewingPageId = null;
let pageModalState = null; // { mode: 'add' | 'edit', page?: object }
let selectedFileContent = null;
let savingPage = false;

const METHOD_LABELS = {
  code: { label: 'Direct Code', icon: 'code' },
  upload: { label: 'Uploaded File', icon: 'file-up' },
  embed: { label: 'Embed URL', icon: 'globe' },
};

/* ============================================================
   Render Entry
   ============================================================ */

export function renderPages() {
  const space = activePageSpace();
  const titleEl = q('#page-space-title');
  if (titleEl) titleEl.textContent = space?.name ?? 'Pages';

  // If currently viewing a page, ensure viewer stays active unless closed
  if (activeViewingPageId) {
    const found = findPage(activeViewingPageId);
    if (found && found.space === space) {
      openPageViewer(found.page);
      return;
    }
    closePageViewer();
    return;
  }

  q('#page-viewer-wrap').style.display = 'none';
  q('#pages-list-wrap').style.display = 'block';

  const grid = q('#pages-grid');
  const pages = space?.pages ?? [];

  if (!pages.length) {
    grid.replaceChildren(
      h('div', { class: 'empty-state' },
        h('div', { class: 'empty-state-icon', html: icon('file-text', 40) }),
        h('div', { class: 'empty-state-title', text: 'No pages yet' }),
        h('div', {
          class: 'empty-state-desc',
          text: 'Upload HTML files, embed URLs, or paste HTML code directly to create study guides & cheat sheets.',
        }),
        h('button', {
          class: 'accent-btn',
          html: icon('plus', 14) + ' Add Page',
          onclick: () => openPageModal({ mode: 'add' }),
        })
      )
    );
    return;
  }

  grid.replaceChildren(...pages.map((page) => buildPageCard(page, space)));
}

/* ============================================================
   Page Cards
   ============================================================ */

function buildPageCard(page, space) {
  const methodInfo = METHOD_LABELS[page.method] ?? METHOD_LABELS.code;

  const badge = h('div', { class: `page-card-badge method-${page.method}` },
    h('span', { html: icon(methodInfo.icon, 11) }),
    h('span', { text: methodInfo.label })
  );

  const titleEl = h('div', { class: 'page-card-title', text: page.title });

  const dateStr = new Date(page.createdAt || Date.now()).toLocaleDateString();
  const metaEl = h('div', { class: 'page-card-meta', text: `Added ${dateStr}` });

  const body = h('div', { class: 'page-card-body' }, badge, titleEl, metaEl);

  if (page.tags?.length) {
    body.append(
      h('div', { class: 'card-tags', style: 'margin-top:8px;' },
        page.tags.map((tag) => h('span', { class: 'tag-pill', text: tag }))
      )
    );
  }

  const pageActionBtn = (iconName, tip, onClick) =>
    h('button', {
      class: 'card-act-btn',
      html: icon(iconName, 11),
      title: tip,
      'aria-label': tip,
      onclick: (e) => {
        e.stopPropagation();
        onClick();
      },
    });

  const actions = h('div', { class: 'card-actions' },
    pageActionBtn('eye', 'Open in extension', () => openPageViewer(page, true)),
    pageActionBtn('pencil', 'Edit', () => openPageModal({ mode: 'edit', page })),
    pageActionBtn('external-link', 'Open in new tab', () => openInNewTab(page))
  );

  const card = h('div',
    {
      class: 'tab-card page-card',
      tabindex: '0',
      role: 'button', 'aria-label': `Open ${page.title}`,
      onclick: () => openPageViewer(page, true),
      onkeydown: (event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPageViewer(page, true);
        }
      },
    },
    h('button', {
      class: 'card-remove',
      html: icon('x', 11),
      title: 'Delete page',
      onclick: (e) => {
        e.stopPropagation();
        deletePage(page.id);
      },
    }),
    body,
    actions
  );

  return card;
}

/* ============================================================
   Main Area Sandboxed Viewer
   ============================================================ */

let viewerRequest = 0;
let viewerContent = null;

async function openPageViewer(page, forceReload = false) {
  const frame = q('#page-viewer-frame');
  const viewerWrap = q('#page-viewer-wrap');
  const isAlreadyActive = !forceReload &&
                          activeViewingPageId === page.id &&
                          viewerWrap.style.display !== 'none' &&
                          frame.dataset.pageId === page.id &&
                          viewerContent === JSON.stringify([page.method, page.contentKey, page.content]);

  activeViewingPageId = page.id;
  q('#pages-list-wrap').style.display = 'none';
  viewerWrap.style.display = 'flex';

  q('#page-viewer-title').textContent = page.title;
  const badgeEl = q('#page-viewer-badge');
  const methodInfo = METHOD_LABELS[page.method] ?? METHOD_LABELS.code;
  badgeEl.textContent = methodInfo.label;
  badgeEl.className = `page-method-badge method-${page.method}`;

  if (isAlreadyActive) {
    return; // Preserve live iframe DOM and form/checkbox state across re-renders
  }

  const request = ++viewerRequest;
  let content;
  try {
    content = await resolvePageContent(page, { strict: Boolean(page.contentStorage || page.content === '...[large]') });
  } catch {
    if (activeViewingPageId === page.id) toast('Could not load this page from local storage.');
    return;
  }
  if (request !== viewerRequest || activeViewingPageId !== page.id) return;

  try {
    mountPage(frame, page, content);
    frame.dataset.pageId = page.id;
    viewerContent = JSON.stringify([page.method, page.contentKey, page.content]);
  } catch (error) { toast(error.message); }
}

function closePageViewer() {
  viewerRequest++;
  activeViewingPageId = null;
  viewerContent = null;
  const frame = q('#page-viewer-frame');
  frame.onload = null;
  frame.removeAttribute('srcdoc');
  frame.src = 'about:blank';
  delete frame.dataset.pageId;
  renderPages();
}

async function openInNewTab(page) {
  let content;
  try {
    content = await resolvePageContent(page, { strict: Boolean(page.contentStorage || page.content === '...[large]') });
  } catch {
    toast('Could not load this page from local storage.');
    return;
  }
  if (page.method === 'embed' && /^https?:\/\//i.test(content.trim())) {
    ext.tabs.create({ url: content.trim(), active: true });
    return;
  }
  if (!(await flush())) { toast('Save your changes before opening this Page.'); return; }
  ext.tabs.create({ url: ext.runtime.getURL(`newtab/page-host.html?page=${encodeURIComponent(page.id)}`), active: true }).catch(()=>toast('Could not open this Page.'));
}

/* ============================================================
   Page Mutations & Modal
   ============================================================ */

function deletePage(pageId) {
  const space = activePageSpace();
  if (!space) return;
  update((doc) => {
    space.pages = space.pages.filter((p) => p.id !== pageId);
  });
  // Retain versioned payloads until Clear All: another window may still
  // reference the previous document while this metadata write is pending.
  if (activeViewingPageId === pageId) {
    closePageViewer();
  } else {
    renderPages();
  }
  toast('Page deleted.');
}

function setModalMethod(method) {
  qa('.page-mtab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.method === method);
  });
  q('#page-method-sec-code').style.display = method === 'code' ? 'block' : 'none';
  q('#page-method-sec-upload').style.display = method === 'upload' ? 'block' : 'none';
  q('#page-method-sec-embed').style.display = method === 'embed' ? 'block' : 'none';
}

async function openPageModal({ mode, page = null }) {
  const modal = { mode, page, pageId: page?.id ?? uid(), spaceId: activePageSpace()?.id };
  pageModalState = modal;
  selectedFileContent = null;

  q('#page-edit-overlay-title').textContent = mode === 'edit' ? 'Edit Page' : 'Add Page';
  q('#page-edit-title').value = page?.title ?? '';

  let fullContent = '';
  if (page) {
    try {
      fullContent = await resolvePageContent(page, { strict: Boolean(page.contentStorage || page.content === '...[large]') });
    } catch {
      toast('Could not load this page from local storage.');
      return;
    }
  }

  if (pageModalState !== modal) return;
  q('#page-edit-code').value = page?.method === 'code' || page?.method === 'upload' ? fullContent : '';
  q('#page-edit-url').value = page?.method === 'embed' ? fullContent : '';
  q('#page-edit-tags').value = (page?.tags ?? []).join(', ');
  q('#page-file-info').textContent = '';
  q('#page-edit-file').value = '';

  const initialMethod = page?.method ?? 'code';
  setModalMethod(initialMethod);

  openOverlay('#page-edit-overlay');
  q('#page-edit-title').focus();
}

async function savePageModal() {
  if (!pageModalState || savingPage) return;
  savingPage = true;
  q('#page-edit-save').disabled = true;
  try { await persistPageModal(); }
  finally { savingPage = false; q('#page-edit-save').disabled = false; }
}

async function persistPageModal() {
  const modal = pageModalState;
  const { mode, page, pageId, spaceId } = modal;

  const activeTab = q('.page-mtab.active');
  const method = activeTab ? activeTab.dataset.method : 'code';

  let title = q('#page-edit-title').value.trim();
  let content = '';

  if (method === 'code') {
    content = q('#page-edit-code').value;
  } else if (method === 'embed') {
    content = q('#page-edit-url').value.trim();
  } else if (method === 'upload') {
    let existingContent = '';
    if (page) {
      try {
        existingContent = await resolvePageContent(page, { strict: Boolean(page.contentStorage || page.content === '...[large]') });
      } catch {
        toast('Could not load this page from local storage.');
        return;
      }
    }
    content = selectedFileContent || existingContent;
  }

  if (!title) {
    toast('Please enter a title for the page.');
    return;
  }
  if (!content) {
    toast('Please provide page content, URL, or upload a file.');
    return;
  }

  const tags = q('#page-edit-tags').value.split(',').map((t) => t.trim()).filter(Boolean);
  if (method === 'embed') {
    try { const url = new URL(content); if (!['http:','https:'].includes(url.protocol)) throw new Error(); content = url.href; }
    catch { toast('Use an HTTP or HTTPS address for embedded Pages.'); return; }
  }
  let prepared;
  try {
    prepared = await preparePageContent(pageId, content);
  } catch (error) {
    toast(error.message || 'Could not save page content.');
    return;
  }

  if (pageModalState !== modal) return;
  const space = getDoc().pageSpaces.find(s => s.id === spaceId);
  const existing = space?.pages.find(p => p.id === pageId);
  if (!space || (mode === 'edit' && !existing)) {
    toast('This Page or Page Space was removed in another window.');
    return;
  }
  update(() => {
    if (!existing) {
      space.pages.unshift({
        id: pageId,
        title,
        method,
        ...prepared,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags,
      });
    } else {
      existing.title = title;
      existing.method = method;
      delete existing.contentKey;
      delete existing.contentStorage;
      Object.assign(existing, prepared);
      existing.updatedAt = Date.now();
      existing.tags = tags;
    }
  });

  if (!(await flush())) {
    toast('Page changes could not be saved.');
    return;
  }

  if (pageModalState !== modal) return;
  closeOverlay('#page-edit-overlay');
  pageModalState = null;
  selectedFileContent = null;
  renderPages();

  const freshSpace = activePageSpace();
  const updatedPage = freshSpace?.pages.find((p) => p.id === pageId);
  if (updatedPage) {
    openPageViewer(updatedPage, true);
  }

  toast(mode === 'add' ? 'Page created.' : 'Page updated.');
}

/* ============================================================
   Init
   ============================================================ */

export function initPages() {
  registerRenderer('pages', renderPages);

  q('#btn-add-page')?.addEventListener('click', () => openPageModal({ mode: 'add' }));
  q('#btn-page-viewer-back')?.addEventListener('click', closePageViewer);

  q('#btn-page-viewer-edit')?.addEventListener('click', () => {
    if (activeViewingPageId) {
      const found = findPage(activeViewingPageId);
      if (found) openPageModal({ mode: 'edit', page: found.page });
    }
  });

  q('#btn-page-viewer-open-tab')?.addEventListener('click', () => {
    if (activeViewingPageId) {
      const found = findPage(activeViewingPageId);
      if (found) openInNewTab(found.page);
    }
  });

  // Modal Method Tab switching
  qa('.page-mtab').forEach((btn) => {
    btn.addEventListener('click', () => setModalMethod(btn.dataset.method));
  });

  // File Upload Reader
  q('#page-edit-file')?.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedFileContent = e.target.result;
      q('#page-file-info').textContent = `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      if (!q('#page-edit-title').value.trim()) {
        q('#page-edit-title').value = file.name.replace(/\.[^/.]+$/, '');
      }
    };
    reader.readAsText(file);
  });

  q('#page-edit-save')?.addEventListener('click', savePageModal);
  q('#page-edit-cancel')?.addEventListener('click', () => closeOverlay('#page-edit-overlay'));

  // Listen for messages from sandbox iframe (external link clicks)
  window.addEventListener('message', (event) => {
    const frame = q('#page-viewer-frame');
    const url = event.data?.url;
    if (event.source !== frame?.contentWindow || event.data?.type !== 'tabflow:open-external-url' || typeof url !== 'string') return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;
      ext.tabs.create({ url: parsed.href, active: true }).catch(() => {});
    } catch {}
  });
}

export function openPage(pageId) {
  const found = findPage(pageId);
  if (found) openPageViewer(found.page, true);
}
