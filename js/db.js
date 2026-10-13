// IndexedDB: solo guarda datos YA cifrados (excepto 'meta', que tiene sales y llaves envueltas).

const NAME = 'drdimas', VER = 1;
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const r = indexedDB.open(NAME, VER);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs', { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let out;
    Promise.resolve(fn(s)).then((v) => { out = v; });
    t.oncomplete = () => res(out);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export const getMeta = () => tx('meta', 'readonly', (s) => req(s.get('vault')));
export const putMeta = (m) => tx('meta', 'readwrite', (s) => s.put(m, 'vault'));
export const getKV = (k) => tx('meta', 'readonly', (s) => req(s.get(k)));
export const putKV = (k, v) => tx('meta', 'readwrite', (s) => s.put(v, k));

export const allRecords = () => tx('records', 'readonly', (s) => req(s.getAll()));
export const putRecord = (r) => tx('records', 'readwrite', (s) => s.put(r));
export const deleteRecord = (id) => tx('records', 'readwrite', (s) => s.delete(id));

export const getBlob = (id) => tx('blobs', 'readonly', (s) => req(s.get(id)));
export const putBlob = (b) => tx('blobs', 'readwrite', (s) => s.put(b));
export const deleteBlob = (id) => tx('blobs', 'readwrite', (s) => s.delete(id));
export const allBlobs = () => tx('blobs', 'readonly', (s) => req(s.getAll()));

export async function wipe() {
  for (const st of ['meta', 'records', 'blobs']) await tx(st, 'readwrite', (s) => s.clear());
}

export async function persist() {
  try { if (navigator.storage?.persist) return await navigator.storage.persist(); } catch {}
  return false;
}
