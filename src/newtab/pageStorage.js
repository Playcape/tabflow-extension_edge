/* ================================================================
   TabFlow — page storage adapter
   Provides storage for HTML pages. Large payloads transparently
   use IndexedDB if chrome.storage.local limits are exceeded.
   ================================================================ */

const DB_NAME = 'tabflow_pages_db';
const DB_VERSION = 1;
const STORE_NAME = 'html_pages';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePageContent(id, content) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, content, updatedAt: Date.now() });
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('TabFlow pageStorage IndexedDB save fallback failed:', err);
    return false;
  }
}

export async function getPageContent(id, fallbackContent = '') {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && typeof req.result.content === 'string') {
          resolve(req.result.content);
        } else {
          resolve(fallbackContent);
        }
      };
      req.onerror = () => resolve(fallbackContent);
    });
  } catch (err) {
    return fallbackContent;
  }
}

export async function deletePageContent(id) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}
