// Utilidades generales (sin dependencias).

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Tagged template que escapa todo lo interpolado salvo lo marcado con raw().
const RAW = Symbol('raw');
export const raw = (s) => ({ [RAW]: true, s: String(s ?? '') });
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < vals.length) out += fmtVal(vals[i]);
  });
  return raw(out);
}
function fmtVal(v) {
  if (v == null || v === false) return '';
  if (Array.isArray(v)) return v.map(fmtVal).join('');
  if (typeof v === 'object' && v[RAW]) return v.s;
  return esc(v);
}
export const str = (h) => (h && h[RAW] ? h.s : String(h ?? ''));

export const uid = (p = '') =>
  p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const todayISO = () => toISO(new Date());
export function toISO(d) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function parseISO(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
export function age(dob) {
  if (!dob) return '';
  const d = parseISO(dob), t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
  return a;
}
export const money = (n) =>
  '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const num = (n, d = 1) => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(d).replace(/0+$/, '').replace(/\.$/, '');
};
export const initials = (name) =>
  String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');
export const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';
export const digits = (s) => String(s || '').replace(/\D/g, '');
// Para buscar sin acentos ni mayúsculas: 'Lucía' → 'lucia'.
export const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function debounce(fn, ms = 400) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// Lee una imagen (File) y la devuelve como JPEG redimensionado + miniatura.
export async function readImage(file, max = 1600, thumbMax = 360) {
  const bmp = await createImageBitmap(file).catch(() => null);
  const src = bmp || (await loadImg(URL.createObjectURL(file)));
  const big = await toJpeg(src, max, 0.85);
  const thumb = await toJpeg(src, thumbMax, 0.75);
  if (bmp && bmp.close) bmp.close();
  return { big, thumb };
}
function loadImg(url) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
}
async function toJpeg(src, max, q) {
  const w = src.width, h = src.height, s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', q));
  return new Uint8Array(await blob.arrayBuffer());
}

// base64 por bloques (para respaldos con fotos grandes).
export function bytesToB64(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
export function b64ToBytes(b64) {
  const s = atob(b64), u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}
