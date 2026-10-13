// Lógica de negocio (sin UI): sesiones, resúmenes, precios, seguimiento, consentimientos.
import * as S from './store.js';
import { todayISO, daysBetween, num } from './util.js';
import { t } from './i18n.js';

export const SERVICES = ['tox', 'filler', 'sculptra'];
export const PRICING = {
  tox: ['dysport', 'lipflip'],
  filler: ['filler', 'lipplump'],
  sculptra: ['sculptra'],
};
export const PRESETS = { tox: [2, 4, 5, 6, 10], filler: [0.05, 0.1, 0.2, 0.3, 0.5], sculptra: [0.5, 1, 2, 3] };
export const STEP = { tox: 1, filler: 0.05, sculptra: 0.5 };
export const unitOf = (type) => (type === 'tox' ? 'u' : 'mL');
export const METHODS = ['cash', 'card', 'cherry', 'vagaro'];

export const patients = () => Object.values(S.data.patient);
export const patient = (id) => S.data.patient[id];
export function sessionsOf(pid) {
  return Object.values(S.data.session).filter((s) => s.pid === pid)
    .sort((a, b) => (b.date + (b.createdAt || 0)).localeCompare(a.date + (a.createdAt || 0)));
}
export const docsOf = (pid) => Object.values(S.data.doc).filter((d) => d.pid === pid)
  .sort((a, b) => String(b.signedAt).localeCompare(String(a.signedAt)));
export const lastSession = (pid) => sessionsOf(pid)[0];
export const consentFor = (pid, kind) => docsOf(pid).find((d) => d.kind === kind);
export const apptsOn = (iso) => Object.values(S.data.appt).filter((a) => a.date === iso)
  .sort((a, b) => String(a.time).localeCompare(String(b.time)));

export function activePromos() {
  const today = todayISO();
  return (S.data.settings.promos || []).filter((p) => p.active && (!p.until || p.until >= today));
}

export function newSession(pid, type = 'tox') {
  const st = S.data.settings;
  const promo = activePromos()[0];
  return {
    pid, type, date: todayISO(), injector: st.providers[0] || '',
    products: [defaultProduct(type)],
    pricing: PRICING[type][0],
    points: [], photos: [],
    pay: { promo: promo?.id || '', discount: 0, override: '', method: 'card', paid: false },
    series: type === 'sculptra' ? { n: 1, of: 3 } : null,
    notes: '', fu: {},
  };
}
export function defaultProduct(type) {
  return { name: type === 'tox' ? 'Dysport' : type === 'sculptra' ? 'Sculptra' : '', lot: '', exp: '', dilution: '', qty: 1, sticker: null };
}

// Resumen por zona (como la tabla de la hoja de inyección).
export function summarize(s) {
  const m = new Map();
  for (const p of s.points || []) {
    const r = m.get(p.zone) || { zone: p.zone, sites: 0, total: 0 };
    r.sites++; r.total += Number(p.amount) || 0;
    m.set(p.zone, r);
  }
  const rows = [...m.values()];
  const total = rows.reduce((a, r) => a + r.total, 0);
  return { rows, total: Math.round(total * 100) / 100, unit: unitOf(s.type) };
}

export const qtyTotal = (s) => (s.products || []).reduce((a, p) => a + (Number(p.qty) || 0), 0);

export function suggestedPrice(s) {
  const P = S.data.settings.prices;
  switch (s.pricing) {
    case 'dysport': return summarize(s).total * P.dysportUnit;
    case 'lipflip': return P.lipFlip;
    case 'filler': return qtyTotal(s) * P.fillerSyringe;
    case 'lipplump': return P.lipPlump;
    case 'sculptra': return qtyTotal(s) * P.sculptraVial;
    default: return 0;
  }
}
export function priceOf(s) {
  const base = suggestedPrice(s);
  const promo = (S.data.settings.promos || []).find((p) => p.id === s.pay?.promo);
  const promoAmt = promo ? Number(promo.amount) || 0 : 0;
  const disc = Number(s.pay?.discount) || 0;
  const auto = Math.max(0, base - promoAmt - disc);
  const ov = s.pay?.override;
  const total = ov !== '' && ov != null && !Number.isNaN(Number(ov)) ? Number(ov) : auto;
  return { base, promo, promoAmt, disc, auto, total };
}

export function sessionTitle(s) {
  const prod = (s.products || []).map((p) => p.name).filter(Boolean)[0] || t('svc.' + s.type);
  if (s.type === 'tox') {
    const sum = summarize(s);
    return `${s.pricing === 'lipflip' ? 'Lip Flip · ' : ''}${prod} · ${num(sum.total)}u`;
  }
  const q = qtyTotal(s);
  if (s.type === 'filler') return `${s.pricing === 'lipplump' ? 'Lip Plump · ' : ''}${prod} · ${num(q)} ${t(q === 1 ? 'unit.syringe' : 'unit.syringes')}`;
  return `Sculptra · ${num(q)} ${t(q === 1 ? 'unit.vial' : 'unit.vials')}${s.series ? ` · ${s.series.n}/${s.series.of}` : ''}`;
}
export function areasText(s, lang) {
  return summarize(s).rows.map((r) => r.zone).join(', ');
}

// ---------- Seguimiento ----------
export function followups() {
  const f = S.data.settings.followup, today = todayISO();
  const out = [];
  for (const p of patients()) {
    const ss = sessionsOf(p.id);
    for (const type of SERVICES) {
      const last = ss.find((x) => x.type === type);
      if (!last) continue;
      const d = daysBetween(last.date, today);
      const fu = last.fu || {};
      if (type !== 'sculptra' && !fu.check && d >= f.checkDays && d <= f.checkDays + 21)
        out.push({ kind: 'check', p, s: last, d, over: d - f.checkDays });
      if (type === 'tox' && !fu.touchup && d >= f.toxDays)
        out.push({ kind: 'touchup', p, s: last, d, over: d - f.toxDays });
      if (type === 'filler' && !fu.review && d >= f.fillerDays)
        out.push({ kind: 'review', p, s: last, d, over: d - f.fillerDays });
      if (type === 'sculptra' && last.series && last.series.n < last.series.of && !fu.next && d >= f.sculptraDays)
        out.push({ kind: 'sculptra', p, s: last, d, over: d - f.sculptraDays });
    }
  }
  return out.sort((a, b) => b.over - a.over);
}

// ---------- Reporte mensual ----------
export function monthReport(ym) {
  const ss = Object.values(S.data.session).filter((s) => String(s.date).startsWith(ym));
  const r = { count: ss.length, paid: 0, pending: 0, byMethod: {}, byService: {}, byProvider: {}, units: 0, syringes: 0, vials: 0 };
  for (const s of ss) {
    const { total } = priceOf(s);
    if (s.pay?.paid) {
      r.paid += total;
      r.byMethod[s.pay.method] = (r.byMethod[s.pay.method] || 0) + total;
    } else r.pending += total;
    r.byService[s.type] = (r.byService[s.type] || 0) + total;
    r.byProvider[s.injector || '—'] = (r.byProvider[s.injector || '—'] || 0) + total;
    if (s.type === 'tox') r.units += summarize(s).total;
    if (s.type === 'filler') r.syringes += qtyTotal(s);
    if (s.type === 'sculptra') r.vials += qtyTotal(s);
  }
  return r;
}

export const isDemo = (o) => !!o?.demo;
