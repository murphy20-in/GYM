/* db.js — IndexedDB persistence.
 *
 * Three stores:
 *   photos  — progress photos, which would blow past a localStorage quota
 *   docs    — the six domain documents (settings, sessions, prs, weights,
 *             days, measurements), one record each
 *   backup  — pre-migration snapshots, kept so a bad upgrade is recoverable
 *
 * `docs` holds whole documents rather than one row per weigh-in. The app loads
 * everything into memory at boot anyway (see storage.js), so per-row indexes
 * would buy nothing, while a single put per change stays atomic and is O(1)
 * regardless of how many years of history accumulate.
 */

const DB_NAME = 'gym_db';
const DB_VERSION = 2;
const STORE_NAME = 'photos';
const DOC_STORE = 'docs';
const BACKUP_STORE = 'backup';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DOC_STORE)) {
        db.createObjectStore(DOC_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
    request.onblocked = () => reject(new Error('Database upgrade blocked by another open tab.'));
  });
}

/* ---------- domain documents ---------- */

/** Every stored document as { key: value }. Empty object on a fresh install. */
export async function readAllDocs() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOC_STORE, 'readonly');
    const req = tx.objectStore(DOC_STORE).getAll();
    req.onsuccess = e => {
      const out = {};
      for (const row of e.target.result || []) out[row.key] = row.value;
      resolve(out);
    };
    req.onerror = e => reject(e.target.error);
  });
}

/** Write one document. Rejects on failure so callers can surface a real error. */
export async function writeDoc(key, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOC_STORE, 'readwrite');
    tx.objectStore(DOC_STORE).put({ key, value });
    tx.oncomplete = () => resolve(true);
    tx.onerror = e => reject(e.target.error);
    tx.onabort = e => reject(e.target.error || new Error('Write aborted'));
  });
}

/** Write several documents in one transaction — all land or none do. */
export async function writeDocs(entries) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOC_STORE, 'readwrite');
    const store = tx.objectStore(DOC_STORE);
    for (const [key, value] of Object.entries(entries)) store.put({ key, value });
    tx.oncomplete = () => resolve(true);
    tx.onerror = e => reject(e.target.error);
    tx.onabort = e => reject(e.target.error || new Error('Write aborted'));
  });
}

/* ---------- backups ---------- */

export async function saveBackup(id, payload) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE, 'readwrite');
    tx.objectStore(BACKUP_STORE).put({ id, at: new Date().toISOString(), payload });
    tx.oncomplete = () => resolve(true);
    tx.onerror = e => reject(e.target.error);
  });
}

export async function listBackups() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE, 'readonly');
    const req = tx.objectStore(BACKUP_STORE).getAll();
    req.onsuccess = e => resolve((e.target.result || []).map(b => ({ id: b.id, at: b.at })));
    req.onerror = e => reject(e.target.error);
  });
}

export async function getBackup(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE, 'readonly');
    const req = tx.objectStore(BACKUP_STORE).get(id);
    req.onsuccess = e => resolve(e.target.result?.payload ?? null);
    req.onerror = e => reject(e.target.error);
  });
}

/** Is IndexedDB usable at all? Private modes and locked-down browsers say no. */
export async function isAvailable() {
  try {
    if (!('indexedDB' in window)) return false;
    await getDB();
    return true;
  } catch {
    return false;
  }
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
