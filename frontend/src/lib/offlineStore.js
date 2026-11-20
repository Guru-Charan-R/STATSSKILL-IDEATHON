// Tiny IndexedDB wrapper for content saved on this device.
// Documents and lesson notes are kept locally so they open without a network.
const DB_NAME = 'statskill-offline';
const VERSION = 1;
const STORES = ['documents', 'lessons'];

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach(name => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    try { result = fn(store); } catch (e) { reject(e); return; }
    tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : undefined);
    tx.onerror = () => reject(tx.error);
  });
}

function makeApi(storeName) {
  return {
    async save(item) {
      const key = String(item.id);
      await tx(storeName, 'readwrite', s => s.put({ ...item, id: key, savedAt: item.savedAt || new Date().toISOString() }));
      return key;
    },
    async list() {
      return (await tx(storeName, 'readonly', s => s.getAll())) || [];
    },
    async get(id) {
      return await tx(storeName, 'readonly', s => s.get(String(id)));
    },
    async remove(id) {
      await tx(storeName, 'readwrite', s => s.delete(String(id)));
    },
  };
}

export const offlineDocuments = makeApi('documents');
export const offlineLessons = makeApi('lessons');

export function useOnlineStatus() {
  // simple helper used by Header; returns a boolean at call time
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}
