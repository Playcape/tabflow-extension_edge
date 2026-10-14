/* ================================================================
   TabFlow — state store

   One document, one owner. UI modules read via getters and change
   state exclusively through update(fn), which persists (debounced)
   and stamps the write with this page instance's id.

   Multiple TabFlow pages can be open at once (several windows, or a
   pinned tab plus new tabs). storage.onChanged detects writes from
   *other* instances and reloads, so edits no longer silently clobber
   each other — the v1 behavior lost data here.
   ================================================================ */

import { ext } from '../common/ext.js';
import { uid, deepClone } from '../common/util.js';
import { defaultDoc, normalizeDoc, migrateV2 } from './migrations.js';
import { clearPageContents, hydratePageSpaces } from './pageStorage.js';
import { mergeDocuments } from './merge.js';

const KEY = 'tabflow_v3';
const LEGACY_KEY = 'tabflow_v2';
const SNAPSHOT_KEY = 'tabflow_snapshots';
const INSTANCE_ID = uid();

let doc = null;
let dirty = false;
let externalListeners = new Set();
let baseDoc = null;
let timer = null;
let writeQueue = Promise.resolve(true);
let writing = false;
let replacePending = false;

/* ---------- access ---------- */

export function getDoc() {
  return doc;
}

export function settings() {
  return doc.settings;
}

export function activeSpace() {
  return doc.spaces.find((space) => space.id === doc.activeSpaceId) ?? doc.spaces[0] ?? null;
}

export function findSpace(spaceId) {
  return doc.spaces.find((space) => space.id === spaceId) ?? null;
}

export function activePageSpace() {
  return (doc.pageSpaces ?? []).find((space) => space.id === doc.activePageSpaceId) ?? doc.pageSpaces?.[0] ?? null;
}

export function findPageSpace(spaceId) {
  return (doc.pageSpaces ?? []).find((space) => space.id === spaceId) ?? null;
}

export function findPage(pageId) {
  for (const space of (doc.pageSpaces ?? [])) {
    const page = space.pages.find((p) => p.id === pageId);
    if (page) return { page, space };
  }
  return null;
}

export function findCollection(collectionId) {
  for (const space of doc.spaces) {
    const collection = space.collections.find((c) => c.id === collectionId);
    if (collection) return { collection, space };
  }
  return null;
}

export function findTab(collectionId, tabId) {
  const found = findCollection(collectionId);
  const tab = found?.collection.tabs.find((t) => t.id === tabId);
  return tab ? { tab, ...found } : null;
}

export function findTabBySlot(slot) {
  for (const space of doc.spaces) {
    for (const collection of space.collections) {
      const tab = collection.tabs.find((t) => t.hotkeySlot === slot);
      if (tab) return { tab, collection, space };
    }
  }
  return null;
}

/* ---------- persistence ---------- */

function scheduleWrite() {
  clearTimeout(timer);
  timer = setTimeout(() => write(), 300);
}

function write() {
  writeQueue = writeQueue.then(async () => {
    if (!dirty || !doc) return true;
    const local = deepClone(doc);
    const reference = doc;
    const replace = replacePending;
    dirty = false;
    replacePending = false;
    writing = true;
    try {
      const commit = async () => {
        const stored = (await ext.storage.local.get(KEY))[KEY];
        const next = replace || !stored || !baseDoc
          ? local
          : mergeDocuments(baseDoc, local, normalizeDoc(stored));
        next.meta = {
          rev: Math.max(local.meta.rev ?? 0, stored?.meta?.rev ?? 0) + 1,
          writer: INSTANCE_ID,
          savedAt: Date.now(),
        };
        await ext.storage.local.set({ [KEY]: next });
        return next;
      };
      // Web Locks serialize windows sharing this extension origin. Older
      // runtimes still use the merge, but cannot guarantee atomic conflicts.
      const saved = globalThis.navigator?.locks?.request
        ? await navigator.locks.request('tabflow-document-write', commit)
        : await commit();
      baseDoc = deepClone(saved);
      if (doc === reference) {
        const merged = mergeDocuments(local, doc, saved);
        const hasExternalEdits = JSON.stringify({ ...merged, meta: null }) !==
          JSON.stringify({ ...doc, meta: null });
        if (hasExternalEdits) {
          doc = merged;
          for (const listener of externalListeners) listener();
        } else doc.meta = saved.meta;
      }
      if (dirty) scheduleWrite();
      return true;
    } catch (err) {
      dirty = true;
      replacePending ||= replace;
      console.error('TabFlow: save failed; unsaved edits remain in memory', err);
      return false;
    } finally {
      writing = false;
    }
  });
  return writeQueue;
}

/**
 * Apply a state change and persist it.
 * `fn` receives the live document and may mutate it freely.
 */
export function update(fn) {
  fn(doc);
  dirty = true;
  scheduleWrite();
}

/** Persist immediately (used before export and on pagehide). */
export function flush() {
  clearTimeout(timer);
  return write();
}

/** Replace the whole document (import / restore / clear). */
export function replaceDoc(nextDoc) {
  doc = normalizeDoc(nextDoc);
  dirty = true;
  replacePending = true;
  return flush();
}

/* ---------- boot ---------- */

export async function initStore() {
  let stored = null;
  let needsWrite = false;
  try {
    const result = await ext.storage.local.get([KEY, LEGACY_KEY, 'tabflow_first_run']);
    if (result[KEY]) {
      stored = normalizeDoc(result[KEY]);
    } else if (result[LEGACY_KEY]) {
      // Migrate v2 in place; the v2 document is left untouched as a rollback.
      stored = migrateV2(result[LEGACY_KEY]);
      needsWrite = true;
    }

    if (!stored) {
      needsWrite = true;
      stored = defaultDoc();
      if (result.tabflow_first_run && !matchMedia('(prefers-color-scheme: dark)').matches) {
        stored.settings.theme = 'light';
      }
    }
    if (result.tabflow_first_run) ext.storage.local.remove('tabflow_first_run');
  } catch (err) {
    // Never turn a transient read failure into a destructive defaults write.
    console.error('TabFlow: load failed; existing data was left untouched', err);
    throw err;
  }

  doc = stored;
  baseDoc = deepClone(stored);
  if (needsWrite) {
    dirty = true;
    if (!(await flush())) throw new Error('TabFlow could not save its initial data.');
  }

  // Adopt writes from other TabFlow pages.
  ext.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[KEY]) return;
    const incoming = changes[KEY].newValue;
    if (!incoming || incoming.meta?.writer === INSTANCE_ID) return;
    // If we have unsaved local edits, keep them; our pending write wins.
    if (dirty || writing) return;
    doc = normalizeDoc(incoming);
    doc.meta.rev = incoming.meta?.rev ?? doc.meta.rev;
    baseDoc = deepClone(doc);
    for (const listener of externalListeners) listener();
  });

  // Don't lose the trailing debounce window on close.
  addEventListener('pagehide', () => flush());
}

/** Called when another TabFlow instance changed the data. */
export function onExternalChange(listener) {
  externalListeners.add(listener);
}

/* ---------- undo (single-slot, surfaced via toast) ---------- */

let undoEntry = null; // { label, apply }

export function setUndo(label, apply) {
  undoEntry = { label, apply };
}

export function takeUndo() {
  const entry = undoEntry;
  undoEntry = null;
  return entry;
}

/* ---------- snapshots (separate key, v1-compatible shape) ---------- */

export async function loadSnapshots({ strict = false } = {}) {
  try {
    const result = await ext.storage.local.get(SNAPSHOT_KEY);
    return Array.isArray(result[SNAPSHOT_KEY]) ? result[SNAPSHOT_KEY] : [];
  } catch (error) {
    if (strict) throw error;
    return [];
  }
}

export async function saveSnapshot(name) {
  if (!(await flush())) throw new Error('Your latest changes could not be saved.');
  const snapshots = await loadSnapshots({ strict: true });
  snapshots.unshift({
    id: uid(),
    name,
    date: new Date().toISOString(),
    spaces: deepClone(doc.spaces),
    pageSpaces: await hydratePageSpaces(deepClone(doc.pageSpaces)),
    activePageSpaceId: doc.activePageSpaceId,
  });
  await ext.storage.local.set({ [SNAPSHOT_KEY]: snapshots.slice(0, 20) });
}

export async function deleteSnapshot(id) {
  const snapshots = (await loadSnapshots({ strict: true })).filter((snap) => snap.id !== id);
  await ext.storage.local.set({ [SNAPSHOT_KEY]: snapshots });
}

export async function clearAllData() {
  if (!(await flush())) throw new Error('Could not finish pending changes.');
  // Commit the reset before removing payloads referenced by the saved document.
  // A failed metadata write must leave the previous Pages readable.
  if (!(await replaceDoc(defaultDoc()))) throw new Error('Could not save the cleared workspace.');
  await clearPageContents();
  for (let index = (globalThis.localStorage?.length ?? 0) - 1; index >= 0; index--) {
    const key = localStorage.key(index);
    if (key?.startsWith('tabflow_form_')) localStorage.removeItem(key);
  }
  await ext.storage.local.remove([LEGACY_KEY, SNAPSHOT_KEY, 'tabflow_first_run']);
}
