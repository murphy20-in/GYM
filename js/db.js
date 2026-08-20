/* db.js — IndexedDB persistence for progress photos.
 *
 * Photos can easily exceed localStorage limits, so they are stored here instead.
 * Stored as data URLs or Blobs in an object store.
 */

const DB_NAME = 'gym_db';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function savePhoto(date, kind, dataUrl) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const id = `${date}|${kind}`;
    const request = store.put({ id, date, kind, dataUrl });
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getPhotos(date) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = (e) => {
      const all = e.target.result || [];
      const filtered = all.filter(p => p.date === date);
      const out = { front: null, side: null, back: null };
      for (const p of filtered) {
        out[p.kind] = p.dataUrl;
      }
      resolve(out);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllPhotos() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = (e) => resolve(e.target.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function deletePhoto(date, kind) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const id = `${date}|${kind}`;
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function clearAllPhotos() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function importPhotos(photosList) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    if (photosList.length === 0) {
      resolve(true);
      return;
    }
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    let count = 0;
    for (const item of photosList) {
      const request = store.put(item);
      request.onsuccess = () => {
        count++;
        if (count === photosList.length) resolve(true);
      };
      request.onerror = (e) => reject(e.target.error);
    }
  });
}
