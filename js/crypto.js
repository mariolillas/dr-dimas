// Cifrado local con WebCrypto.
// - Una llave de datos AES-GCM 256 aleatoria cifra todo (registros y fotos).
// - Esa llave se guarda "envuelta" dos veces: con el código de acceso y con el código de recuperación
//   (PBKDF2-SHA256). Sin uno de los dos, los datos no se pueden leer: ni el servidor ni quien mantiene la app.

const enc = new TextEncoder();
const dec = new TextDecoder();
export const ITER = 310000;
const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32, sin I/L/O/U

export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));

async function kek(secret, salt, iter = ITER) {
  const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}
async function wrap(key, k) {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.wrapKey('raw', key, k, { name: 'AES-GCM', iv });
  return { iv, ct: new Uint8Array(ct) };
}
async function unwrap(w, k) {
  return crypto.subtle.unwrapKey('raw', w.ct, k, { name: 'AES-GCM', iv: w.iv },
    { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export function makeRecoveryCode() {
  const b = randomBytes(20);
  let s = '';
  for (const x of b) s += ALPHA[x % 32];
  return s.match(/.{4}/g).join('-'); // 5 bloques de 4 (100 bits)
}
const normCode = (c) => String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  .replace(/O/g, '0').replace(/[IL]/g, '1');

export async function createVault(passcode) {
  const dataKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const recovery = makeRecoveryCode();
  const saltP = randomBytes(16), saltR = randomBytes(16);
  const meta = {
    v: 1, iter: ITER, saltP, saltR,
    wp: await wrap(dataKey, await kek(passcode, saltP)),
    wr: await wrap(dataKey, await kek(normCode(recovery), saltR)),
    createdAt: Date.now(),
  };
  return { meta, dataKey, recovery };
}

export async function unlockWithPasscode(meta, passcode) {
  return unwrap(meta.wp, await kek(passcode, meta.saltP, meta.iter));
}
export async function unlockWithRecovery(meta, code) {
  return unwrap(meta.wr, await kek(normCode(code), meta.saltR, meta.iter));
}
export async function setPasscode(meta, dataKey, passcode) {
  const saltP = randomBytes(16);
  return { ...meta, saltP, wp: await wrap(dataKey, await kek(passcode, saltP, meta.iter)) };
}
export async function newRecovery(meta, dataKey) {
  const recovery = makeRecoveryCode();
  const saltR = randomBytes(16);
  return { meta: { ...meta, saltR, wr: await wrap(dataKey, await kek(normCode(recovery), saltR, meta.iter)) }, recovery };
}

export async function encryptJSON(key, obj) {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv, ct: new Uint8Array(ct) };
}
export async function decryptJSON(key, rec) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: rec.iv }, key, rec.ct);
  return JSON.parse(dec.decode(pt));
}
export async function encryptBytes(key, bytes) {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
  return { iv, ct: new Uint8Array(ct) };
}
export async function decryptBytes(key, rec) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: rec.iv }, key, rec.ct));
}
