/* ================================================================
   TabFlow — settings view
   Every control writes through store.update() into doc.settings and
   re-applies via the 'appearance' renderer — no parallel save lists.
   ================================================================ */

import { ext, caps, IS_FIREFOX } from '../../common/ext.js';
import { q, qa, h, uid } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { THEMES, ACCENT_COLORS, FONT_STACKS, THEME_SLOTS } from '../../common/themes.js';
import {
  getDoc, settings, update, replaceDoc, flush,
  loadSnapshots, saveSnapshot, deleteSnapshot, clearAllData,
} from '../store.js';
import { registerRenderer, render, renderAll } from './bus.js';
import { confirmDialog, promptDialog } from './modals.js';
import { toast } from './toast.js';
import { themeVars, applyCustomCss } from './appearance.js';
import { DEFAULT_SETTINGS, buildExport, parseImport, makeCollection, makeTab } from '../migrations.js';

/* ============================================================
   Render entry
   ============================================================ */

function renderSettings() {
  renderThemeGrid();
  renderCustomThemeGrid();
  renderAccentGrid();
  renderFontGrid();
  renderPills('#fontsize-pills', 'fontSize');
  renderPills('#density-pills', 'density');
  renderPills('#defview-pills', 'defaultView', (value) => {
    update((doc) => doc.spaces.forEach((space) => (space.viewMode = value)));
    render('collections', 'viewmenu');
  });
  renderPills('#bgstyle-pills', 'bgStyle');
  renderPills('#bgpat-pills', 'bgPattern');
  renderPills('#clock-pills', 'showClock', null, {
    toValue: (raw) => raw === 'on',
    toString: (value) => (value ? 'on' : 'off'),
  });
  renderSlider('#sl-radius', '#sl-radius-val', 'borderRadius');
  renderSlider('#sl-sidebar', '#sl-sidebar-val', 'sidebarWidth');
  renderToggles();
  renderStorageStatus();
  renderSnapshots();
  q('#custom-bg-input').value = settings().customBgColor || '#000000';
  q('#custom-accent-input').value = settings().accent;
  q('#custom-css-input').value = settings().customCss;
  q('#homepage-url-display').textContent = location.href;
  q('#zen-settings-section').style.display = IS_FIREFOX ? '' : 'none';
}

/* ============================================================
   Generic controls
   ============================================================ */

function setSetting(key, value, { extraRender = [] } = {}) {
  update((doc) => (doc.settings[key] = value));
  render('appearance', 'layout', ...extraRender);
}

function renderPills(sel, key, onApply = null, codec = null) {
  const container = q(sel);
  if (!container) return;
  const current = codec ? codec.toString(settings()[key]) : String(settings()[key]);
  for (const pill of qa('.pill', container)) {
    pill.classList.toggle('active', pill.dataset.val === current);
    pill.onclick = () => {
      const value = codec ? codec.toValue(pill.dataset.val) : pill.dataset.val;
      setSetting(key, value);
      if (onApply) onApply(value);
      renderPills(sel, key, onApply, codec);
    };
  }
}

function renderSlider(slSel, valSel, key) {
  const slider = q(slSel);
  const label = q(valSel);
  if (!slider || !label) return;
  slider.value = settings()[key];
  label.textContent = `${settings()[key]}px`;
  slider.oninput = () => {
    const value = parseInt(slider.value, 10);
    label.textContent = `${value}px`;
    setSetting(key, value);
  };
}

function bindToggle(sel, key, extraRender = []) {
  const el = q(sel);
  if (!el) return;
  el.checked = !!settings()[key];
  el.onchange = () => setSetting(key, el.checked, { extraRender });
}

function renderToggles() {
  bindToggle('#remote-favicons-toggle', 'remoteFavicons', ['collections', 'opentabs']);

  // Advanced feature toggles.
  bindToggle('#cmdpalette-toggle', 'cmdPalette');
  bindToggle('#focusexisting-toggle', 'focusExistingTab');
  bindToggle('#zenmode-toggle', 'zenMode');
  bindToggle('#glass-toggle', 'glass');
  bindToggle('#animatedbg-toggle', 'animatedBg');
  bindToggle('#reducemotion-toggle', 'reduceMotion');
  bindToggle('#clock24h-toggle', 'clock24h');
  bindToggle('#clockseconds-toggle', 'clockSeconds');

  const nameInput = q('#greeting-name-input');
  if (nameInput) {
    nameInput.value = settings().greetingName ?? '';
    nameInput.oninput = () => setSetting('greetingName', nameInput.value);
  }
}

/* ============================================================
   Themes
   ============================================================ */

function buildThemeCard(key, name, preview, selected, onClick) {
  const p = preview ?? { sidebar: '#333', main: '#222', card: '#444', card2: '#555' };
  return h('div', { class: 'theme-card' + (selected ? ' selected' : ''), onclick: onClick },
    h('div', { class: 'theme-preview', style: `background:${p.main}` },
      h('div', { class: 'tp-sidebar', style: `background:${p.sidebar}` }),
      h('div', { class: 'tp-main' },
        h('div', { class: 'tp-c1', style: `background:${p.card}` }),
        h('div', { class: 'tp-c2', style: `background:${p.card2}` })
      )
    ),
    h('div', { class: 'theme-name', text: name })
  );
}

function selectTheme(themeId) {
  setSetting('theme', themeId);
  renderThemeGrid();
  renderCustomThemeGrid();
}

function renderThemeGrid() {
  const grid = q('#theme-grid');
  grid.replaceChildren(
    ...Object.entries(THEMES).map(([key, theme]) =>
      buildThemeCard(key, theme.name, theme.preview, settings().theme === key, () => selectTheme(key))
    )
  );
}

function renderCustomThemeGrid() {
  const grid = q('#custom-theme-grid');
  const customThemes = settings().customThemes;
  if (!customThemes.length) {
    grid.replaceChildren(
      h('span', { class: 'settings-hint', text: 'No custom themes yet. Click “+ New” to build one.' })
    );
    return;
  }
  grid.replaceChildren(
    ...customThemes.map((theme, index) => {
      const id = `custom_${index}`;
      const card = buildThemeCard(id, theme.name, theme.preview, settings().theme === id, () => selectTheme(id));
      card.append(
        h('button', {
          class: 'theme-del',
          html: icon('x', 9),
          title: 'Delete theme',
          'aria-label': `Delete theme ${theme.name}`,
          onclick: (event) => {
            event.stopPropagation();
            update((doc) => {
              doc.settings.customThemes.splice(index, 1);
              if (doc.settings.theme === id) doc.settings.theme = 'dark';
            });
            render('appearance');
            renderThemeGrid();
            renderCustomThemeGrid();
          },
        })
      );
      return card;
    })
  );
}

/* ---------- custom theme editor ---------- */

let editorColors = {};

function openThemeEditor() {
  const editor = q('#theme-editor');
  editor.style.display = 'block';
  editorColors = { ...themeVars(settings().theme, settings().customThemes) };
  q('#te-name').value = '';
  renderEditorGrid();
}

function renderEditorGrid() {
  const grid = q('#te-color-grid');
  grid.replaceChildren(
    ...THEME_SLOTS.map((slot) => {
      const colorInput = h('input', {
        type: 'color',
        class: 'te-color-input',
        value: editorColors[slot.key] ?? '#000000',
        'aria-label': `${slot.label} color`,
      });
      const hexInput = h('input', {
        type: 'text',
        class: 'te-hex-input',
        value: editorColors[slot.key] ?? '#000000',
        maxLength: 7,
        'aria-label': `${slot.label} hex value`,
      });
      colorInput.addEventListener('input', () => {
        editorColors[slot.key] = colorInput.value;
        hexInput.value = colorInput.value;
        document.documentElement.style.setProperty(slot.key, colorInput.value); // live preview
      });
      hexInput.addEventListener('input', () => {
        const value = hexInput.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(value)) {
          editorColors[slot.key] = value;
          colorInput.value = value;
          document.documentElement.style.setProperty(slot.key, value);
        }
      });
      return h('div', { class: 'te-slot' },
        h('div', { class: 'te-slot-label', text: slot.label }),
        h('div', { class: 'te-slot-row' }, colorInput, hexInput)
      );
    })
  );
}

function saveCustomTheme() {
  const name = q('#te-name').value.trim() || 'Custom Theme';
  const theme = {
    id: uid(),
    name,
    vars: { ...editorColors },
    preview: {
      sidebar: editorColors['--sidebar-bg'],
      main: editorColors['--main-bg'],
      card: editorColors['--card-bg'],
      card2: editorColors['--card-hover'],
    },
  };
  update((doc) => {
    doc.settings.customThemes.push(theme);
    doc.settings.theme = `custom_${doc.settings.customThemes.length - 1}`;
  });
  q('#theme-editor').style.display = 'none';
  render('appearance');
  renderThemeGrid();
  renderCustomThemeGrid();
  toast(`Theme “${name}” saved.`);
}

/* ============================================================
   Accent + fonts
   ============================================================ */

function renderAccentGrid() {
  const grid = q('#accent-grid');
  grid.replaceChildren(
    ...ACCENT_COLORS.map((accent) =>
      h('button', {
        class: 'accent-swatch' + (settings().accent === accent.hex ? ' selected' : ''),
        style: `background:${accent.hex}`,
        title: accent.name,
        'aria-label': `Accent ${accent.name}`,
        onclick: () => {
          setSetting('accent', accent.hex);
          q('#custom-accent-input').value = accent.hex;
          renderAccentGrid();
        },
      })
    )
  );
}

function renderFontGrid() {
  const grid = q('#font-grid');
  grid.replaceChildren(
    ...FONT_STACKS.map((font) =>
      h('div', {
        class: 'font-card' + (settings().font === font.key ? ' selected' : ''),
        onclick: () => {
          setSetting('font', font.key);
          renderFontGrid();
        },
      },
        h('div', { class: 'font-card-name', style: `font-family:${font.stack}`, text: font.label }),
        h('div', { class: 'font-card-sample', style: `font-family:${font.stack}`, text: 'The quick brown fox' })
      )
    )
  );
}

/* ============================================================
   Data: storage, snapshots, bookmarks, export/import
   ============================================================ */

async function renderStorageStatus() {
  const badge = q('#sync-status-badge');
  const size = new Blob([JSON.stringify(getDoc())]).size;
  const pretty = size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(size / 1024)} KB`;
  badge.textContent = `Local · ${pretty}`;
  badge.className = 'sync-status-badge local';
  badge.title = 'Data is stored in this browser profile. Use Export for backups.';
}

async function renderSnapshots() {
  const list = q('#snapshots-list');
  const snapshots = await loadSnapshots();
  if (!snapshots.length) {
    list.replaceChildren(h('div', { class: 'settings-hint', text: 'No snapshots yet.' }));
    return;
  }
  list.replaceChildren(
    ...snapshots.map((snap) =>
      h('div', { class: 'snapshot-item' },
        h('div', { class: 'snapshot-name', text: snap.name }),
        h('div', {
          class: 'snapshot-meta',
          text: `${new Date(snap.date).toLocaleDateString()} · ${snap.spaces.length} space(s)`,
        }),
        h('div', { class: 'snapshot-actions' },
          h('button', {
            class: 'snapshot-restore-btn',
            text: 'Restore',
            onclick: async () => {
              const ok = await confirmDialog({
                title: `Restore “${snap.name}”?`,
                message: 'Your current spaces and collections will be replaced. Settings are kept.',
                confirmLabel: 'Restore',
                danger: true,
              });
              if (!ok) return;
              replaceDoc({ ...getDoc(), spaces: snap.spaces, activeSpaceId: snap.spaces[0]?.id });
              renderAll();
              toast(`Restored “${snap.name}”.`);
            },
          }),
          h('button', {
            class: 'snapshot-del-btn',
            text: '✕',
            'aria-label': `Delete snapshot ${snap.name}`,
            onclick: async () => {
              await deleteSnapshot(snap.id);
              renderSnapshots();
            },
          })
        )
      )
    )
  );
}

async function onSaveSnapshot() {
  const name = await promptDialog({
    title: 'Save snapshot',
    label: 'Snapshot name',
    value: `Snapshot ${new Date().toLocaleDateString()}`,
  });
  if (!name) return;
  flush();
  await saveSnapshot(name);
  renderSnapshots();
  toast(`Snapshot “${name}” saved.`);
}

/* ---------- bookmarks import ---------- */

async function browseBookmarks() {
  const list = q('#bookmarks-folder-list');
  if (!caps.bookmarks) {
    list.replaceChildren(h('div', { class: 'settings-hint', text: 'Bookmarks API not available.' }));
    return;
  }
  let tree;
  try {
    tree = await ext.bookmarks.getTree();
  } catch {
    list.replaceChildren(h('div', { class: 'settings-hint', text: 'Could not load bookmarks.' }));
    return;
  }
  const folders = [];
  const walk = (nodes) => {
    for (const node of nodes ?? []) {
      if (!node.url && node.children) {
        folders.push(node);
        walk(node.children);
      }
    }
  };
  walk(tree[0]?.children ?? tree);

  const rows = folders
    .map((folder) => ({ folder, bookmarks: (folder.children ?? []).filter((n) => n.url) }))
    .filter(({ bookmarks }) => bookmarks.length)
    .map(({ folder, bookmarks }) =>
      h('div', { class: 'bookmark-folder-item' },
        h('span', { class: 'bookmark-folder-name', text: folder.title || 'Untitled' }),
        h('span', { class: 'bookmark-folder-count', text: `${bookmarks.length} bookmarks` }),
        h('button', {
          class: 'settings-btn slim',
          text: 'Import',
          onclick: () => {
            const space = getDoc().spaces.find((s) => s.id === getDoc().activeSpaceId) ?? getDoc().spaces[0];
            const collection = makeCollection(
              folder.title || 'Imported',
              bookmarks.map((b) => makeTab({ title: b.title || b.url, url: b.url }))
            );
            update(() => space.collections.unshift(collection));
            render('collections');
            list.replaceChildren();
            toast(`Imported ${bookmarks.length} bookmarks as “${collection.name}”.`);
          },
        })
      )
    );
  list.replaceChildren(...(rows.length ? rows : [h('div', { class: 'settings-hint', text: 'No bookmark folders with links found.' })]));
}

/* ---------- export / import ---------- */

function exportData() {
  flush();
  const payload = buildExport(getDoc());
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = h('a', {
    href: url,
    download: `tabflow-backup-${new Date().toISOString().split('T')[0]}.json`,
  });
  anchor.click();
  URL.revokeObjectURL(url);
  toast('Backup exported.');
}

async function importData(file) {
  const text = await file.text();
  const imported = parseImport(text);
  if (!imported) {
    toast('Not a valid TabFlow backup file.');
    return;
  }
  const tabCount = imported.spaces.reduce(
    (sum, space) => sum + space.collections.reduce((s, c) => s + c.tabs.length, 0), 0
  );
  const ok = await confirmDialog({
    title: 'Import backup?',
    message: `This replaces your current data with ${imported.spaces.length} space(s) and ${tabCount} saved tab(s).`,
    confirmLabel: 'Import',
    danger: true,
  });
  if (!ok) return;
  replaceDoc(imported);
  renderAll();
  toast('Backup imported.');
}

/* ---------- danger zone ---------- */

async function onResetSettings() {
  const ok = await confirmDialog({
    title: 'Reset appearance settings?',
    message: 'Theme, fonts, layout and effects go back to defaults. Collections and custom themes are kept.',
    confirmLabel: 'Reset',
    danger: true,
  });
  if (!ok) return;
  update((doc) => {
    const customThemes = doc.settings.customThemes;
    doc.settings = { ...DEFAULT_SETTINGS, customThemes };
  });
  render('appearance', 'layout');
  renderSettings();
  toast('Settings reset.');
}

async function onClearAll() {
  const ok = await confirmDialog({
    title: 'Delete all TabFlow data?',
    message: 'Every space, collection, saved tab, link, task and snapshot is permanently deleted.',
    confirmLabel: 'Delete everything',
    danger: true,
  });
  if (!ok) return;
  await clearAllData();
  renderAll();
  toast('All data cleared.');
}

/* ============================================================
   Init
   ============================================================ */

export function initSettings() {
  registerRenderer('settings', renderSettings);

  /* settings sub-tabs */
  qa('.stab[data-stab]').forEach((btn) =>
    btn.addEventListener('click', () => {
      qa('.stab').forEach((b) => b.classList.remove('active'));
      qa('.stab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      q(`#stab-${btn.dataset.stab}`)?.classList.add('active');
    })
  );

  q('#btn-new-theme').addEventListener('click', openThemeEditor);
  q('#te-save').addEventListener('click', saveCustomTheme);
  q('#te-cancel').addEventListener('click', () => {
    q('#theme-editor').style.display = 'none';
    render('appearance'); // undo live preview
  });

  q('#custom-accent-input').addEventListener('input', (event) => {
    setSetting('accent', event.target.value);
    renderAccentGrid();
  });
  q('#custom-bg-input').addEventListener('input', (event) => {
    update((doc) => {
      doc.settings.customBgColor = event.target.value;
      doc.settings.bgStyle = 'custom';
    });
    render('appearance');
    renderPills('#bgstyle-pills', 'bgStyle');
  });

  q('#btn-apply-css').addEventListener('click', () => {
    setSetting('customCss', q('#custom-css-input').value);
    toast('Custom CSS applied.');
  });
  q('#btn-clear-css').addEventListener('click', () => {
    q('#custom-css-input').value = '';
    setSetting('customCss', '');
    applyCustomCss('');
  });

  q('#btn-save-snapshot').addEventListener('click', onSaveSnapshot);
  q('#btn-browse-bookmarks').addEventListener('click', browseBookmarks);

  q('#btn-copy-zen-pref').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('zen.urlbar.replace-newtab');
      toast('Copied — paste it into about:config.');
    } catch {
      toast('Could not copy.');
    }
  });

  q('#btn-copy-homepage').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast('URL copied — set it as your browser homepage.');
    } catch {
      toast('Copy failed — select the URL below manually.');
    }
  });

  q('#btn-export').addEventListener('click', exportData);
  q('#btn-import').addEventListener('click', () => q('#import-file-input').click());
  q('#import-file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) importData(file);
    event.target.value = '';
  });

  q('#btn-reset-settings').addEventListener('click', onResetSettings);
  q('#btn-clear-all').addEventListener('click', onClearAll);
}
