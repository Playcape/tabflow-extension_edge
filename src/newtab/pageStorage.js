/* ================================================================
   TabFlow — HTML payload storage
   Small pages stay in the schema-v3 document. Large HTML lives in IDB,
   identified by contentStorage: 'indexeddb'; backups always inline it.
   Inline content wins over historical IDB copies after import/restore.
   ================================================================ */

const DB_NAME = 'tabflow_pages_db';
const DB_VERSION = 1;
const STORE_NAME = 'html_pages';
export const PAGE_INLINE_LIMIT = 256 * 1024;

function openDB() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Page storage is busy in another tab'));
  });
}

async function transaction(mode, operate) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    let result;
    let tx;
    try {
      tx = db.transaction(STORE_NAME, mode);
      const request = operate(tx.objectStore(STORE_NAME));
      request.onsuccess = () => { result = request.result; };
      // A request succeeding does not guarantee the transaction commits.
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onabort = tx.onerror = () => {
        db.close();
        reject(tx.error || new Error('Page storage transaction failed'));
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

export async function savePageContent(id, content) {
  try {
    await transaction('readwrite', (store) => store.put({ id, content, updatedAt: Date.now() }));
    return true;
  } catch (error) {
    console.warn('TabFlow: could not save page payload', error);
    return false;
  }
}

/** Legacy-compatible read: inline data is authoritative when available. */
export async function getPageContent(id, fallbackContent = '', { strict = false } = {}) {
  if (typeof fallbackContent === 'string' && fallbackContent && fallbackContent !== '...[large]') {
    return fallbackContent;
  }
  try {
    const record = await transaction('readonly', (store) => store.get(id));
    if (typeof record?.content === 'string') return record.content;
  } catch (error) {
    if (strict) throw error;
  }
  if (strict) throw new Error('This page payload is missing from local storage.');
  return '';
}

export async function resolvePageContent(page, options = {}) {
  return getPageContent(page.contentKey || page.id, page.content, options);
}

/** Prepare metadata only after the payload commit succeeds. */
export async function preparePageContent(id, content) {
  if (new Blob([content]).size <= PAGE_INLINE_LIMIT) return { content };
  // A new key keeps the previously saved document valid if metadata saving fails.
  const contentKey = `${id}:${globalThis.crypto?.randomUUID?.() ?? Date.now() + '-' + Math.random()}`;
  if (!(await savePageContent(contentKey, content))) {
    throw new Error('Could not save this large page. Free local storage and try again.');
  }
  return { content: '', contentStorage: 'indexeddb', contentKey };
}

/** Self-contained copy used by JSON export and snapshots; never mutate live state. */
export async function hydratePageSpaces(spaces = []) {
  return Promise.all(spaces.map(async (space) => ({
    ...space,
    pages: await Promise.all((space.pages ?? []).map(async (page) => {
      const content = await resolvePageContent(page, { strict: Boolean(page.contentStorage || page.content === '...[large]') });
      const copy = { ...page, content };
      delete copy.contentStorage;
      delete copy.contentKey;
      return copy;
    })),
  })));
}

/** Import/restore large backup payloads without exceeding extension JSON quotas. */
export async function preparePageSpaces(spaces = []) {
  const hydrated = await hydratePageSpaces(spaces);
  for (const space of hydrated) {
    for (const page of space.pages) {
      Object.assign(page, await preparePageContent(page.id, page.content));
    }
  }
  return hydrated;
}

export async function deletePageContent(id) {
  try {
    await transaction('readwrite', (store) => store.delete(id));
    return true;
  } catch { return false; }
}

export async function clearPageContents() {
  await transaction('readwrite', (store) => store.clear());
}
