// Estado descifrado en memoria + guardado cifrado. Al bloquear se borra todo de memoria.
import * as db from './db.js';
import * as cx from './crypto.js';
import { uid, bytesToB64, b64ToBytes } from './util.js';

export const KINDS = ['patient', 'session', 'appt', 'doc', 'settings'];

export const DEFAULT_SETTINGS = {
  id: 'settings',
  lang: 'en',
  autoLockMin: 5,
  clinic: {
    name: 'Dr. Dimas Beauty Services',
    address: '7629 South Staples Street, Suite 106-A, Corpus Christi, TX 78413',
    phone: '', // [DATO PENDIENTE] — confirmar con Vanessa
    bookingUrl: '', // link de Vagaro
  },
  // Precios confirmados por Vanessa (2026-10-04)
  prices: { dysportUnit: 5, lipFlip: 50, fillerSyringe: 550, lipPlump: 350, sculptraVial: 750 },
  promos: [{ id: 'oct2026', name: 'October special', amount: 50, until: '2026-10-31', active: true }],
  providers: ['Dr. Vanessa Dimas, MD', 'Jackie Escamilla, NP'],
  followup: { checkDays: 14, toxDays: 90, fillerDays: 270, sculptraDays: 42 },
  legalApproved: null, // { by, date } cuando Vanessa apruebe los textos
  lastBackup: null,
};

let key = null;
// Modo prueba: la bóveda se creó con el código público TEST_PIN (ver config.js).
export const flags = { test: false };
export const isTestVault = async () => !!(await db.getKV('testMode'));
export const markTestVault = () => db.putKV('testMode', true);
export const data = { patient: {}, session: {}, appt: {}, doc: {}, settings: null };

export const isUnlocked = () => !!key;
export const hasVault = async () => !!(await db.getMeta());

function reset() {
  key = null;
  for (const k of KINDS) data[k] = k === 'settings' ? null : {};
  for (const u of urlCache.values()) URL.revokeObjectURL(u);
  urlCache.clear();
}

async function loadAll() {
  const recs = await db.allRecords();
  for (const r of recs) {
    try {
      const obj = await cx.decryptJSON(key, r);
      if (r.kind === 'settings') data.settings = obj;
      else if (data[r.kind]) data[r.kind][obj.id] = obj;
    } catch (e) { console.warn('No se pudo descifrar', r.id, e); }
  }
  if (!data.settings) data.settings = structuredClone(DEFAULT_SETTINGS);
  data.settings = { ...structuredClone(DEFAULT_SETTINGS), ...data.settings,
    clinic: { ...DEFAULT_SETTINGS.clinic, ...data.settings.clinic },
    prices: { ...DEFAULT_SETTINGS.prices, ...data.settings.prices },
    followup: { ...DEFAULT_SETTINGS.followup, ...data.settings.followup } };
}

export async function setup(passcode) {
  const { meta, dataKey, recovery } = await cx.createVault(passcode);
  await db.wipe();
  await db.putMeta(meta);
  key = dataKey;
  data.settings = structuredClone(DEFAULT_SETTINGS);
  await save('settings', data.settings);
  await db.persist();
  return recovery;
}

export async function unlock(passcode) {
  const meta = await db.getMeta();
  key = await cx.unlockWithPasscode(meta, passcode); // lanza error si el código es incorrecto
  await loadAll();
}
export async function unlockRecovery(code, newPass) {
  const meta = await db.getMeta();
  key = await cx.unlockWithRecovery(meta, code);
  await db.putMeta(await cx.setPasscode(meta, key, newPass));
  await loadAll();
}
export async function checkPasscode(passcode) {
  try { await cx.unlockWithPasscode(await db.getMeta(), passcode); return true; } catch { return false; }
}
export async function changePasscode(newPass) {
  await db.putMeta(await cx.setPasscode(await db.getMeta(), key, newPass));
}
export async function regenerateRecovery() {
  const { meta, recovery } = await cx.newRecovery(await db.getMeta(), key);
  await db.putMeta(meta);
  return recovery;
}
export function lock() { reset(); }

export async function save(kind, obj) {
  if (!key) throw new Error('locked');
  if (kind !== 'settings') {
    obj.id ||= uid(kind[0]);
    obj.updatedAt = Date.now();
    obj.createdAt ||= obj.updatedAt;
    data[kind][obj.id] = obj;
  } else data.settings = obj;
  const rec = await cx.encryptJSON(key, obj);
  await db.putRecord({ id: obj.id, kind, ...rec, updatedAt: Date.now() });
  return obj;
}
export async function remove(kind, id) {
  delete data[kind][id];
  await db.deleteRecord(id);
}

// ---- Fotos / firmas (blobs cifrados) ----
const urlCache = new Map();
export async function putImage(bytes, type = 'image/jpeg') {
  const id = uid('b');
  const rec = await cx.encryptBytes(key, bytes);
  await db.putBlob({ id, type, ...rec });
  return id;
}
export async function putPhoto({ big, thumb }) {
  const id = await putImage(big);
  const thumbId = await putImage(thumb);
  return { id, thumbId };
}
export async function imageURL(id) {
  if (!id) return '';
  if (urlCache.has(id)) return urlCache.get(id);
  const b = await db.getBlob(id);
  if (!b) return '';
  const bytes = await cx.decryptBytes(key, b);
  const url = URL.createObjectURL(new Blob([bytes], { type: b.type || 'image/jpeg' }));
  urlCache.set(id, url);
  return url;
}
export async function imageBytes(id) {
  const b = await db.getBlob(id);
  return b ? cx.decryptBytes(key, b) : null;
}
export async function deleteImage(id) {
  if (!id) return;
  if (urlCache.has(id)) { URL.revokeObjectURL(urlCache.get(id)); urlCache.delete(id); }
  await db.deleteBlob(id);
}

// ---- Respaldo cifrado (archivo) ----
const enc64 = (o) => ({ iv: bytesToB64(o.iv), ct: bytesToB64(o.ct) });
const dec64 = (o) => ({ iv: b64ToBytes(o.iv), ct: b64ToBytes(o.ct) });

export async function exportBackup() {
  const meta = await db.getMeta();
  const recs = await db.allRecords();
  const blobs = await db.allBlobs();
  const out = {
    format: 'drdimas-backup', v: 1, exportedAt: new Date().toISOString(),
    meta: { v: meta.v, iter: meta.iter, createdAt: meta.createdAt,
      saltP: bytesToB64(meta.saltP), saltR: bytesToB64(meta.saltR), wp: enc64(meta.wp), wr: enc64(meta.wr) },
    records: recs.map((r) => ({ id: r.id, kind: r.kind, updatedAt: r.updatedAt, ...enc64(r) })),
    blobs: blobs.map((b) => ({ id: b.id, type: b.type, ...enc64(b) })),
  };
  data.settings.lastBackup = new Date().toISOString();
  await save('settings', data.settings);
  return new Blob([JSON.stringify(out)], { type: 'application/json' });
}

// Restaura un respaldo: reemplaza TODO lo local. Después hay que desbloquear con el código del respaldo.
export async function importBackup(text) {
  const b = JSON.parse(text);
  if (b.format !== 'drdimas-backup') throw new Error('not a backup');
  const m = b.meta;
  const meta = { v: m.v, iter: m.iter, createdAt: m.createdAt, saltP: b64ToBytes(m.saltP), saltR: b64ToBytes(m.saltR),
    wp: dec64(m.wp), wr: dec64(m.wr) };
  await db.wipe();
  await db.putMeta(meta);
  for (const r of b.records) await db.putRecord({ id: r.id, kind: r.kind, updatedAt: r.updatedAt, ...dec64(r) });
  for (const x of b.blobs) await db.putBlob({ id: x.id, type: x.type, ...dec64(x) });
  reset();
}

export async function wipeEverything() { reset(); await db.wipe(); }
