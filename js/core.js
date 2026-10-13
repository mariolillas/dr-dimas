// Núcleo de la UI: estado, rutas, render, eventos, hojas (sheets), teclado de PIN y helpers compartidos.
import * as S from './store.js';
import { html, raw, str, esc, todayISO, daysBetween, parseISO } from './util.js';
import { t, getLang } from './i18n.js';
import { Pad } from './pad.js';

export const SCREENS = {};
export const SHEETS = {};
export const A = {}; // acciones: data-act="nombre"

export const st = {
  route: { name: 'boot', params: {} },
  stack: [],
  sheet: null,
  draft: null,
  ui: { pin: '', view: 'front', selPt: null, lastAmt: {} },
  pads: {},
};

const app = document.getElementById('app');

// ---------- Rutas ----------
export function go(name, params = {}, { push = true, replace = false } = {}) {
  if (push && !replace && !['boot', 'lock', 'setup'].includes(st.route.name)) st.stack.push(st.route);
  st.route = { name, params };
  st.sheet = null;
  render();
  window.scrollTo(0, 0);
}
export function back() {
  st.route = st.stack.pop() || { name: 'today', params: {} };
  st.sheet = null;
  render();
}
export function tab(name) { st.stack = []; go(name, {}, { push: false }); }
export function openSheet(name, params = {}) { st.sheet = { name, params }; render(); }
export function closeSheet() { st.sheet = null; render(); }

// ---------- Render ----------
export function render() {
  const r = st.route;
  const scr = SCREENS[r.name];
  if (!scr) { app.innerHTML = `<p style="padding:40px">Unknown screen ${esc(r.name)}</p>`; return; }
  const out = scr(r.params || {});
  let body = str(out.html);
  if (out.tabs) body += str(tabBar(out.tabs === true ? r.name : out.tabs));
  let sheetOut = null;
  if (st.sheet && SHEETS[st.sheet.name]) {
    sheetOut = SHEETS[st.sheet.name](st.sheet.params || {});
    body += `<div class="sheet-bg" data-act="closeSheetBg"></div><div class="sheet ${sheetOut.wide ? 'wide' : ''}" role="dialog">${str(sheetOut.html)}</div>`;
  }
  document.body.className = out.dark ? 'dark' : '';
  app.innerHTML = body;
  st.pads = {};
  hydrate();
  out.after && out.after();
  sheetOut?.after && sheetOut.after();
}

// Carga imágenes cifradas y monta paneles de firma.
export function hydrate(root = app) {
  root.querySelectorAll('img[data-img]').forEach(async (img) => {
    const u = await S.imageURL(img.dataset.img);
    if (u) img.src = u;
  });
  root.querySelectorAll('canvas[data-pad]').forEach((c) => {
    st.pads[c.dataset.pad] = new Pad(c, { onChange: (p) => {
      c.closest('.pad-wrap')?.classList.toggle('signed', !p.isEmpty());
      if (!p.isEmpty()) c.closest('.legal-sec')?.classList.remove('missing');
    } });
  });
}

function tabBar(active) {
  const tabs = [
    ['today', 'calendar', t('tab.today')], ['patients', 'people', t('tab.patients')],
    ['followups', 'bell', t('tab.followups')], ['settings', 'gear', t('tab.settings')],
  ];
  return html`<nav class="tabbar">${tabs.map(([k, ic, label]) => html`
    <button class="tab ${k === active ? 'on' : ''}" data-act="tab" data-to="${k}">${icon(ic)}<span>${label}</span></button>`)}</nav>`;
}

// ---------- Eventos ----------
app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  Promise.resolve(fn(el, e)).catch(showError);
});
const onField = (e) => {
  const el = e.target;
  if (el.dataset.bind && st.draft) setPath(st.draft, el.dataset.bind, fieldValue(el));
  if (el.dataset.live && A[el.dataset.live]) Promise.resolve(A[el.dataset.live](el, e)).catch(showError);
};
app.addEventListener('input', onField);
// 'change' solo para selects, casillas y fechas: en campos de texto ya se procesó con 'input', y repetirlo al perder
// el foco re-pintaba la lista justo cuando el dedo tocaba un resultado (el toque se perdía).
const TEXTY = new Set(['text', 'search', 'tel', 'email', 'number', 'url', 'textarea']);
app.addEventListener('change', (e) => {
  const el = e.target;
  if (el.type === 'file' || TEXTY.has(el.type)) return;
  onField(e);
});

function fieldValue(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'number') return el.value === '' ? '' : Number(el.value);
  return el.value;
}
export function setPath(obj, path, v) {
  const ks = path.split('.');
  let o = obj;
  for (let i = 0; i < ks.length - 1; i++) {
    const k = ks[i];
    if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    o = o[k];
  }
  o[ks[ks.length - 1]] = v;
}
export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

A.tab = (el) => tab(el.dataset.to);
A.back = () => back();
A.closeSheet = () => closeSheet();
A.closeSheetBg = () => { if (!st.sheet?.params?.modal) closeSheet(); };
A.go = (el) => go(el.dataset.to, { ...el.dataset });

// ---------- Archivos (cámara / fotos) ----------
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);
let fileCb = null;
fileInput.addEventListener('change', async () => {
  const files = [...fileInput.files];
  fileInput.value = '';
  if (files.length && fileCb) await Promise.resolve(fileCb(files)).catch(showError);
});
export function pickImages(cb, { multiple = false, camera = false } = {}) {
  fileCb = cb;
  fileInput.multiple = multiple;
  if (camera) fileInput.setAttribute('capture', 'environment'); else fileInput.removeAttribute('capture');
  fileInput.click();
}
const jsonInput = document.createElement('input');
jsonInput.type = 'file';
jsonInput.accept = '.json,application/json';
jsonInput.style.display = 'none';
document.body.appendChild(jsonInput);
let jsonCb = null;
jsonInput.addEventListener('change', async () => {
  const f = jsonInput.files[0];
  jsonInput.value = '';
  if (f && jsonCb) await Promise.resolve(jsonCb(await f.text())).catch(showError);
});
export function pickJSON(cb) { jsonCb = cb; jsonInput.click(); }

// ---------- Avisos ----------
let toastTimer;
export function toast(msg, kind = '') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.className = 'show ' + kind;
  el.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2600);
}
export function showError(e) {
  console.error(e);
  toast(t('err.generic') + (e?.message ? ` (${e.message})` : ''), 'bad');
}
// Confirmación dentro de la app (sin confirm() nativo).
export function ask(msg, onYes, { yes = t('btn.confirm'), danger = false } = {}) {
  st.ui.askFn = onYes;
  openSheet('ask', { msg, yes, danger });
}
SHEETS.ask = ({ msg, yes, danger }) => ({
  html: html`<div class="sheet-body center">
    <p class="ask-msg">${msg}</p>
    <div class="row gap">
      <button class="btn ghost" data-act="closeSheet">${t('btn.cancel')}</button>
      <button class="btn ${danger ? 'danger' : 'primary'}" data-act="askYes">${yes}</button>
    </div></div>`,
});
A.askYes = async () => { const fn = st.ui.askFn; st.ui.askFn = null; closeSheet(); if (fn) await fn(); };

// ---------- Teclado de PIN ----------
export function keypad({ title, sub = '', err = '', light = false }) {
  const n = st.ui.pin.length;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return html`<div class="pin ${light ? 'light' : ''}">
    <h2 class="pin-title">${title}</h2>
    ${sub ? html`<p class="pin-sub">${sub}</p>` : ''}
    <div class="pin-dots ${err ? 'shake' : ''}">${[0, 1, 2, 3, 4, 5].map((i) => html`<i class="${i < n ? 'on' : ''}"></i>`)}</div>
    <p class="pin-err">${err}</p>
    <div class="keypad">${keys.map((k) => (k === '' ? html`<span></span>`
      : html`<button class="key" data-act="pinKey" data-k="${k}">${k === 'del' ? icon('del') : k}</button>`))}</div>
  </div>`;
}
A.pinKey = (el) => {
  const k = el.dataset.k;
  st.ui.pinErr = '';
  if (k === 'del') st.ui.pin = st.ui.pin.slice(0, -1);
  else if (st.ui.pin.length < 6) st.ui.pin += k;
  render();
  if (st.ui.pin.length === 6 && st.ui.onPin) {
    const pin = st.ui.pin;
    setTimeout(() => Promise.resolve(st.ui.onPin(pin)).catch(showError), 120);
  }
};
export function pinFail(msg) { st.ui.pin = ''; st.ui.pinErr = msg; render(); }

// ---------- Helpers de presentación ----------
export const L = () => getLang();
export const settings = () => S.data.settings;
export function fmtDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '';
  return parseISO(iso).toLocaleDateString(L() === 'es' ? 'es-MX' : 'en-US', opts);
}
export function fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(L() === 'es' ? 'es-MX' : 'en-US', { hour: 'numeric', minute: '2-digit' });
}
export const ago = (iso) => {
  const d = daysBetween(iso, todayISO());
  if (d <= 0) return t('time.today');
  if (d < 14) return t('time.days', { n: d });
  if (d < 70) return t('time.weeks', { n: Math.round(d / 7) });
  return t('time.months', { n: Math.round(d / 30.4) });
};
export const avatar = (name, cls = '', img = null) => (img
  ? html`<span class="avatar photo ${cls}"><img data-img="${img}" alt=""></span>`
  : html`<span class="avatar ${cls}">${initialsOf(name)}</span>`);
const initialsOf = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');
export const chip = (text, c = '') => html`<span class="chip ${c}">${text}</span>`;

export function navbar(title, { backBtn = true, right = '' } = {}) {
  return html`<header class="nav">
    <div class="nav-l">${backBtn ? html`<button class="nav-back" data-act="back">${icon('chev-l')}<span>${t('btn.back')}</span></button>` : ''}</div>
    <div class="nav-title">${title}</div>
    <div class="nav-r">${right}</div>
  </header>`;
}

// Iconos SVG en línea (estilo SF Symbols simplificado).
const IC = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.2 4.4 1.9 5 5"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  'chev-l': '<path d="M15 4l-8 8 8 8"/>', 'chev-r': '<path d="M9 4l8 8-8 8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.6"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  del: '<path d="M9 6h11v12H9l-6-6z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  syringe: '<path d="M14 4l6 6M17 7l-9.5 9.5-3-3L14 4M7.5 16.5L4 20"/>', paper: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v8h14v-8"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
};
export const icon = (name, cls = '') => raw(`<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[name] || ''}</svg>`);
