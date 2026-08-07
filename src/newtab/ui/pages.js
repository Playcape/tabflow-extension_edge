/* ================================================================
   TabFlow — HTML Pages view
   Card grid for HTML pages (Study Guides, Cheat Sheets, Custom Docs),
   sandboxed inline iframe viewer, and 3 input methods (Upload, Embed, Code).
   ================================================================ */

import { q, qa, h, uid } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { ext } from '../../common/ext.js';
import { getDoc, activePageSpace, findPage, update } from '../store.js';
import { registerRenderer, render } from './bus.js';
import { openOverlay, closeOverlay } from './modals.js';
import { toast } from './toast.js';
import { savePageContent, getPageContent, deletePageContent } from '../pageStorage.js';
import { makePage } from '../migrations.js';

let activeViewingPageId = null;
let pageModalState = null; // { mode: 'add' | 'edit', page?: object }
let selectedFileContent = null;

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
    if (found) {
      openPageViewer(found.page);
      return;
    }
    activeViewingPageId = null;
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
        e.currentTarget?.blur();
        document.activeElement?.blur();
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
      onclick: () => openPageViewer(page, true),
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

function saveFormState(pageId, doc) {
  try {
    if (!doc || !doc.body) return;
    const values = {};
    doc.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((el, i) => {
      const key = el.id || el.name || `cb_${i}`;
      values[key] = el.checked;
    });
    doc.querySelectorAll('input[type="text"], input[type="number"], input[type="search"], textarea').forEach((el, i) => {
      const key = el.id || el.name || `txt_${i}`;
      values[key] = el.value;
    });
    localStorage.setItem(`tabflow_form_${pageId}`, JSON.stringify(values));
  } catch (e) {}
}

function restoreFormState(pageId, doc) {
  try {
    const raw = localStorage.getItem(`tabflow_form_${pageId}`);
    if (!raw) return;
    const values = JSON.parse(raw);
    doc.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((el, i) => {
      const key = el.id || el.name || `cb_${i}`;
      if (key in values) {
        el.checked = Boolean(values[key]);
      }
    });
    doc.querySelectorAll('input[type="text"], input[type="number"], input[type="search"], textarea').forEach((el, i) => {
      const key = el.id || el.name || `txt_${i}`;
      if (key in values) {
        el.value = values[key];
      }
    });
  } catch (e) {}
}

function attachIframeListeners(pageId, frame) {
  try {
    const doc = frame.contentDocument || frame.contentWindow?.document;
    if (!doc || !doc.body) return;
    if (doc.querySelector('#app') || doc.querySelector('#page-viewer-frame')) return;

    // Restore static form state
    restoreFormState(pageId, doc);

    // Prevent form submits from reloading iframe
    doc.addEventListener('submit', (e) => {
      e.preventDefault();
      saveFormState(pageId, doc);
    }, true);

    let saveTimer = null;
    const triggerSave = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveFormState(pageId, doc), 300);
    };

    doc.addEventListener('change', triggerSave, true);
    doc.addEventListener('input', triggerSave, true);

    // Link handling: smooth scroll anchors, open external links in new tab, block relative reload
    doc.addEventListener('click', (e) => {
      let t = e.target;
      while (t && t.tagName !== 'A' && t !== doc.body) t = t.parentElement;
      if (t && t.tagName === 'A') {
        const href = t.getAttribute('href') || '';
        if (href.startsWith('#')) {
          e.preventDefault();
          const targetEl = doc.getElementById(href.slice(1)) || doc.querySelector(`[name="${href.slice(1)}"]`);
          if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
        } else if (/^https?:\/\//i.test(href)) {
          e.preventDefault();
          ext.tabs.create({ url: href, active: true }).catch(() => {});
        } else if (href === '' || href.startsWith('javascript:')) {
          /* allow inline js actions */
        } else {
          e.preventDefault();
        }
      }
      setTimeout(triggerSave, 100);
    }, true);
  } catch (err) {
    console.warn('TabFlow: could not attach listeners to iframe', err);
  }
}

async function openPageViewer(page, forceReload = false) {
  const frame = q('#page-viewer-frame');
  const viewerWrap = q('#page-viewer-wrap');
  const isAlreadyActive = !forceReload &&
                          activeViewingPageId === page.id &&
                          viewerWrap.style.display !== 'none' &&
                          frame.dataset.pageId === page.id;

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

  frame.dataset.pageId = page.id;
  let content = await getPageContent(page.id, page.content);

  // Clean up legacy corrupted entries
  if (typeof content === 'string' && (content.includes('...[large]') || content.includes('id="app"'))) {
    content = content.replace(/<div id="app"[\s\S]*$/i, '').replace('...[large]', '');
    if (page.content && typeof page.content === 'string' && !page.content.includes('...[large]')) {
      content = page.content;
    }
    await savePageContent(page.id, content);
  }

  if (page.method === 'embed' && /^https?:\/\//i.test(content.trim())) {
    frame.removeAttribute('srcdoc');
    frame.src = content.trim();
  } else {
    // srcdoc with sandbox="allow-scripts allow-forms allow-popups" (no allow-same-origin)
    // gives the iframe an opaque origin, exempt from extension CSP, so inline scripts execute
    frame.removeAttribute('src');
    frame.srcdoc = content;
  }
}

function closePageViewer() {
  activeViewingPageId = null;
  const frame = q('#page-viewer-frame');
  frame.removeAttribute('srcdoc');
  frame.src = 'about:blank';
  delete frame.dataset.pageId;
  renderPages();
}

async function openInNewTab(page) {
  const content = await getPageContent(page.id, page.content);
  if (page.method === 'embed' && /^https?:\/\//i.test(content.trim())) {
    ext.tabs.create({ url: content.trim(), active: true });
    return;
  }
  const blob = new Blob([content], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  ext.tabs.create({ url: blobUrl, active: true });
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
  deletePageContent(pageId);
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
  pageModalState = { mode, page };
  selectedFileContent = null;

  q('#page-edit-overlay-title').textContent = mode === 'edit' ? 'Edit Page' : 'Add Page';
  q('#page-edit-title').value = page?.title ?? '';

  let fullContent = '';
  if (page) {
    fullContent = await getPageContent(page.id, page.content ?? '');
  }

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
  if (!pageModalState) return;
  const { mode, page } = pageModalState;
  const space = activePageSpace();
  if (!space) return;

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
      existingContent = await getPageContent(page.id, page.content ?? '');
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
  const pageId = mode === 'edit' && page ? page.id : uid();

  await savePageContent(pageId, content);

  update(() => {
    if (mode === 'add') {
      space.pages.unshift({
        id: pageId,
        title,
        method,
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags,
      });
    } else if (page) {
      page.title = title;
      page.method = method;
      page.content = content;
      page.updatedAt = Date.now();
      page.tags = tags;
    }
  });

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
    if (event.data?.type === 'tabflow:open-external-url' && event.data?.url) {
      ext.tabs.create({ url: event.data.url, active: true }).catch(() => {});
    }
  });
}
