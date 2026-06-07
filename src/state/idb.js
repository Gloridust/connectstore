// Tiny promise-based IndexedDB key/value helper (no dependencies).
// One database, one object store, used as a single large-capacity bucket for
// the whole ConnectStore state tree (including base64 screenshots & icons,
// which would blow past the ~5–10 MB localStorage quota).

const DB_NAME = 'connectstore';
const DB_VERSION = 1;
const STORE = 'kv';

export const hasIndexedDB =
  typeof indexedDB !== 'undefined' && indexedDB !== null;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Best-effort disk usage estimate (bytes). Returns null if unsupported.
export async function storageEstimate() {
  try {
    if (navigator.storage?.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage: usage ?? null, quota: quota ?? null };
    }
  } catch {
    // ignore
  }
  return null;
}
