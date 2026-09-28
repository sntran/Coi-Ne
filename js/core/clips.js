// The recordings of the parent. They are in IndexedDB, because they are too large for localStorage.
// Each record has the id "<lang>:<key>", the sound data, and its type.

const DB_NAME = 'coine-audio';
const STORE = 'clips';
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('No IndexedDB'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

function run(mode, fn) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

/** The ids of all recordings. An empty list if the browser has no IndexedDB. */
export async function listClips() {
  try {
    return (await run('readonly', (s) => s.getAllKeys())) || [];
  } catch {
    return [];
  }
}

/** Get a recording as a Blob, or null. */
export async function getClip(id) {
  try {
    const rec = await run('readonly', (s) => s.get(id));
    return rec ? new Blob([rec.data], { type: rec.type }) : null;
  } catch {
    return null;
  }
}

/** Save a recording. The data is stored as an ArrayBuffer, because old Safari versions cannot store a Blob. */
export async function putClip(id, blob) {
  const data = await blob.arrayBuffer();
  await run('readwrite', (s) => s.put({ data, type: blob.type, time: Date.now() }, id));
  // Ask the browser to keep the data.
  navigator.storage?.persist?.().catch?.(() => {});
}

export async function deleteClip(id) {
  await run('readwrite', (s) => s.delete(id));
}
