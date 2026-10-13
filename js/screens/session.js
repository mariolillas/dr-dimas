// Nueva sesión / editar sesión / ver sesión + hoja de instrucciones post-tratamiento.
import * as S from '../store.js';
import * as M from '../model.js';
import * as F from '../face.js';
import { INSTRUCTIONS, FILLER_PRODUCTS } from '../content.js';
import { html, raw, uid, num, money, readImage, todayISO } from '../util.js';
import { t, getLang } from '../i18n.js';
import { SCREENS, SHEETS, A, st, go, back, render, openSheet, closeSheet, toast, ask, navbar, fmtDate,
  chip, icon, pickImages, settings } from '../core.js';
import { alertChips } from './home.js';

const zl = (z) => F.zoneLabel(z, getLang());

// ---------- Mapa facial ----------
export function faceMapSVG(s, { editable = true, view = st.ui.view || 'front', small = false } = {}) {
  const unit = M.unitOf(s.type);
  const pts = (s.points || []).filter((p) => p.view === view);
  const hints = editable ? F.zonesFor(view, s.type) : [];
  return raw(`<svg class="facemap ${small ? 'small' : ''}" ${editable ? 'id="facemap"' : ''} viewBox="0 0 ${F.VB.w} ${F.VB.h}" role="img">
    ${F.viewSVG(view)}
    ${hints.map((z) => `<circle class="zone-hint" cx="${z.x}" cy="${z.y}" r="${z.r}"/>`).join('')}
    ${pts.map((p) => `<g class="pt ${p.id === st.ui.selPt ? 'sel' : ''}" data-pt="${p.id}" transform="translate(${p.x},${p.y})">
      <circle r="13"/><text dy="4">${num(p.amount, 2)}${unit === 'u' ? '' : ''}</text></g>`).join('')}
  </svg>`);
}
function svgPoint(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const r = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: Math.round(r.x), y: Math.round(r.y) };
}
function viewTabs(s) {
  const v = st.ui.view || 'front';
  const count = (k) => (s.points || []).filter((p) => p.view === k).length;
  return html`<div class="seg">${['front', 'left', 'right'].map((k) => html`<button class="${v === k ? 'on' : ''}" data-act="setView" data-v="${k}">${t('view.' + k)}${count(k) ? ` · ${count(k)}` : ''}</button>`)}</div>`;
}
A.setView = (el) => { st.ui.view = el.dataset.v; st.ui.selPt = null; keepScroll(render); };
const keepScroll = (fn) => { const y = window.scrollY; fn(); window.scrollTo(0, y); };

// ---------- Editor ----------
SCREENS.session = ({ pid, id }) => {
  if (!st.draft || st.draft._for !== (id || 'new:' + pid)) {
    st.draft = id ? structuredClone(S.data.session[id]) : M.newSession(pid, st.ui.nextType || 'tox');
    st.draft._for = id || 'new:' + pid;
    st.ui.view = 'front'; st.ui.selPt = null;
  }
  const s = st.draft;
  const p = M.patient(s.pid);
  const sum = M.summarize(s);
  const pr = M.priceOf(s);
  const sel = s.points.find((x) => x.id === st.ui.selPt);
  const consent = s.type !== 'sculptra' && !M.consentFor(s.pid, s.type);
  const set = settings();
  const unit = sum.unit;
  return {
    after: mountMap,
    html: html`${navbar(t(id ? 'ses.edit' : 'ses.new'), { right: html`<button class="link strong" data-act="saveSession">${t('btn.save')}</button>` })}
  <main class="page">
    <section class="card ses-head">
      <div class="grow"><h2 class="serif">${p.name}</h2><div class="chips wrap">${alertChips(p, 4)}</div></div>
      <div class="seg">${M.SERVICES.map((k) => html`<button class="${s.type === k ? 'on' : ''}" data-act="setType" data-v="${k}">${t('svc.' + k)}</button>`)}</div>
    </section>
    ${consent ? html`<button class="banner amber" data-act="startConsent" data-pid="${s.pid}" data-kind="${s.type}">${icon('alert')}<span>${t('ses.noConsent', { svc: t('svc.' + s.type) })}</span><b>${t('btn.signNow')}</b></button>` : ''}
    <div class="group ${s.type === 'sculptra' ? 'inline3' : 'inline2'}">
      <label class="field"><span>${t('ses.date')}</span><input type="date" data-bind="date" value="${s.date}"></label>
      <label class="field"><span>${t('ses.injector')}</span><select data-bind="injector">${set.providers.map((n) => html`<option ${s.injector === n ? 'selected' : ''}>${n}</option>`)}</select></label>
      ${s.type === 'sculptra' ? html`<label class="field"><span>${t('ses.series')}</span><span class="row gap">
        <input type="number" min="1" data-bind="series.n" value="${s.series?.n || 1}" class="w60"> / <input type="number" min="1" data-bind="series.of" value="${s.series?.of || 3}" class="w60"></span></label>` : ''}
    </div>

    <div class="ses-grid">
      <section class="card map-card">
        ${viewTabs(s)}
        <div class="map-wrap">${faceMapSVG(s)}</div>
        <p class="hint">${t('ses.tapHint', { unit: t('unit.' + unit) })}</p>
        ${sel ? pointPanel(s, sel) : html`<div class="presets"><span class="muted small">${t('ses.defaultDose')}</span>
          ${M.PRESETS[s.type].map((v) => html`<button class="chip-btn ${defAmt(s.type) === v ? 'on' : ''}" data-act="setDefAmt" data-v="${v}">${num(v, 2)}${unit === 'u' ? 'u' : ' mL'}</button>`)}</div>`}
        ${(s.points || []).some((p) => p.view === (st.ui.view || 'front')) ? html`<button class="link danger" data-act="clearView">${t('ses.clearView')}</button>` : ''}
      </section>

      <div class="col gap">
        <section class="card">
          <div class="card-h"><h3>${t('ses.product')}</h3>${s.type === 'tox' ? '' : html`<button class="link" data-act="addProduct">${icon('plus')} ${t('ses.addProduct')}</button>`}</div>
          ${s.products.map((pd, i) => productRow(s, pd, i))}
        </section>
        <section class="card">
          <div class="card-h"><h3>${t('ses.summary')}</h3></div>
          <table class="sum"><thead><tr><th>${t('ses.area')}</th><th>${t('ses.sites')}</th><th>${t('ses.dose')}</th></tr></thead>
            <tbody>${sum.rows.length ? sum.rows.map((r) => html`<tr><td>${zl(r.zone)}</td><td>${r.sites}</td><td>${num(r.total, 2)} ${unit}</td></tr>`)
              : html`<tr><td colspan="3" class="muted">${t('ses.noPoints')}</td></tr>`}</tbody>
            <tfoot><tr><td>${t('ses.total')}</td><td>${s.points.length}</td><td><b>${num(sum.total, 2)} ${unit}</b></td></tr></tfoot></table>
        </section>
      </div>
    </div>

    <section class="card">
      <div class="card-h"><h3>${t('ses.payment')}</h3></div>
      <div class="pay-grid">
        <label class="field"><span>${t('ses.pricing')}</span><select data-bind="pricing" data-live="rerender">${M.PRICING[s.type].map((k) => html`<option value="${k}" ${s.pricing === k ? 'selected' : ''}>${t('price.' + k)}</option>`)}</select></label>
        <label class="field"><span>${t('ses.promo')}</span><select data-bind="pay.promo" data-live="rerender"><option value="">—</option>${(set.promos || []).filter((x) => x.active).map((x) => html`<option value="${x.id}" ${s.pay.promo === x.id ? 'selected' : ''}>${x.name} (−${money(x.amount)})</option>`)}</select></label>
        <label class="field"><span>${t('ses.discount')}</span><input type="number" min="0" data-bind="pay.discount" data-live="rerenderLazy" value="${s.pay.discount || ''}" placeholder="0"></label>
        <label class="field"><span>${t('ses.override')}</span><input type="number" min="0" data-bind="pay.override" data-live="rerenderLazy" value="${s.pay.override ?? ''}" placeholder="${pr.auto}"></label>
      </div>
      <div class="pay-total">
        <div class="muted small">${t('ses.suggested')}: ${priceExplain(s)} = ${money(pr.base)}${pr.promoAmt ? ` − ${money(pr.promoAmt)}` : ''}${pr.disc ? ` − ${money(pr.disc)}` : ''}</div>
        <div class="big-total">${money(pr.total)}</div>
      </div>
      <div class="row gap wrap">
        <div class="seg">${M.METHODS.map((m) => html`<button class="${s.pay.method === m ? 'on' : ''}" data-act="setMethod" data-v="${m}">${t('pay.' + m)}</button>`)}</div>
        <label class="switch"><input type="checkbox" data-bind="pay.paid" data-live="rerender" ${s.pay.paid ? 'checked' : ''}><span></span>${t('pay.paid')}</label>
      </div>
    </section>

    <section class="card">
      <div class="card-h"><h3>${t('ses.photos')}</h3>
        <span class="row gap"><button class="btn small ghost" data-act="sesPhoto" data-tag="before">${icon('camera')} ${t('photo.before')}</button>
        <button class="btn small ghost" data-act="sesPhoto" data-tag="after">${icon('camera')} ${t('photo.after')}</button></span></div>
      ${s.photos.length ? html`<div class="thumbs">${s.photos.map((ph, i) => html`<div class="thumb"><img data-img="${ph.thumbId}" alt=""><span>${t('photo.' + ph.tag)}</span><button class="x" data-act="sesPhotoDel" data-i="${i}">×</button></div>`)}</div>` : html`<p class="muted small">${t('ses.photoTip')}</p>`}
    </section>

    <section class="card">
      <label class="field stack"><span>${t('ses.notes')}</span><textarea rows="3" data-bind="notes">${s.notes || ''}</textarea></label>
    </section>
    <button class="btn primary full big" data-act="saveSession">${t('ses.save')}</button>
    ${id ? html`<button class="btn danger-ghost" data-act="deleteSession">${icon('trash')} ${t('ses.delete')}</button>` : ''}
  </main>` };
};
const defAmt = (type) => st.ui.lastAmt[type] ?? (type === 'tox' ? 4 : type === 'filler' ? 0.1 : 1);
A.setDefAmt = (el) => { st.ui.lastAmt[st.draft.type] = Number(el.dataset.v); keepScroll(render); };

function priceExplain(s) {
  const P = settings().prices;
  switch (s.pricing) {
    case 'dysport': return `${num(M.summarize(s).total)}u × ${money(P.dysportUnit)}`;
    case 'filler': return `${num(M.qtyTotal(s))} × ${money(P.fillerSyringe)}`;
    case 'sculptra': return `${num(M.qtyTotal(s))} × ${money(P.sculptraVial)}`;
    default: return t('price.' + s.pricing);
  }
}

function productRow(s, pd, i) {
  const b = (k) => `products.${i}.${k}`;
  const isTox = s.type === 'tox';
  return html`<div class="product">
    <div class="product-grid">
      <label class="field"><span>${t('ses.prodName')}</span><input data-bind="${b('name')}" value="${pd.name || ''}" list="${isTox ? '' : 'fillerList'}"></label>
      ${isTox ? html`<label class="field"><span>${t('ses.dilution')}</span><input type="number" step="0.1" data-bind="${b('dilution')}" value="${pd.dilution || ''}" placeholder="mL"></label>`
        : html`<label class="field"><span>${t(s.type === 'sculptra' ? 'ses.vials' : 'ses.syringes')}</span><input type="number" step="0.5" min="0" data-bind="${b('qty')}" data-live="rerenderLazy" value="${pd.qty ?? 1}"></label>`}
      <label class="field"><span>${t('ses.lot')}</span><input data-bind="${b('lot')}" value="${pd.lot || ''}" autocapitalize="characters"></label>
      <label class="field"><span>${t('ses.expiry')}</span><input type="month" data-bind="${b('exp')}" value="${pd.exp || ''}"></label>
    </div>
    <div class="row gap">
      ${pd.sticker ? html`<button class="thumb mini" data-act="viewPhoto" data-img="${pd.sticker.id}"><img data-img="${pd.sticker.thumbId}" alt=""></button>` : ''}
      <button class="btn small ghost" data-act="stickerShot" data-i="${i}">${icon('camera')} ${t(pd.sticker ? 'ses.stickerRetake' : 'ses.sticker')}</button>
      <span class="muted small">${t('ses.stickerNote')}</span>
      ${s.products.length > 1 ? html`<button class="link danger" data-act="delProduct" data-i="${i}">${t('btn.remove')}</button>` : ''}
    </div>
  </div>
  <datalist id="fillerList">${FILLER_PRODUCTS.map((n) => html`<option value="${n}">`)}</datalist>`;
}

function pointPanel(s, p) {
  const unit = M.unitOf(s.type);
  const zones = F.zonesFor(p.view, s.type).map((z) => z.k);
  const other = p.view === 'front' ? 'other' : 'other' + (p.view === 'left' ? 'L' : 'R');
  if (!zones.includes(p.zone) && p.zone !== other) zones.push(p.zone);
  zones.push(other);
  return html`<div class="pt-panel">
    <select data-live="ptZone">${zones.map((z) => html`<option value="${z}" ${z === p.zone ? 'selected' : ''}>${zl(z)}</option>`)}</select>
    <div class="stepper">
      <button data-act="ptStep" data-d="-1">−</button><b>${num(p.amount, 2)} ${unit === 'u' ? t('unit.u') : 'mL'}</b><button data-act="ptStep" data-d="1">+</button>
    </div>
    <div class="presets">${M.PRESETS[s.type].map((v) => html`<button class="chip-btn ${Number(p.amount) === v ? 'on' : ''}" data-act="ptSet" data-v="${v}">${num(v, 2)}</button>`)}</div>
    <div class="row gap">
      <button class="btn small ghost" data-act="ptDelete">${icon('trash')} ${t('btn.delete')}</button>
      <button class="btn small primary" data-act="ptDone">${t('btn.done')}</button>
    </div>
  </div>`;
}

function mountMap() {
  const svg = document.getElementById('facemap');
  if (!svg) return;
  svg.addEventListener('click', (e) => {
    const s = st.draft;
    const g = e.target.closest('[data-pt]');
    if (g) { st.ui.selPt = g.dataset.pt; return keepScroll(render); }
    if (st.ui.selPt) { st.ui.selPt = null; return keepScroll(render); }
    const { x, y } = svgPoint(svg, e);
    const view = st.ui.view || 'front';
    const p = { id: uid('p'), view, x, y, zone: F.zoneAt(view, s.type, x, y), amount: defAmt(s.type) };
    s.points.push(p);
    keepScroll(render);
  });
}
const selPoint = () => st.draft.points.find((p) => p.id === st.ui.selPt);
A.ptStep = (el) => {
  const p = selPoint(); if (!p) return;
  const step = M.STEP[st.draft.type];
  p.amount = Math.max(0, Math.round((Number(p.amount) + step * Number(el.dataset.d)) * 100) / 100);
  st.ui.lastAmt[st.draft.type] = p.amount;
  keepScroll(render);
};
A.ptSet = (el) => { const p = selPoint(); p.amount = Number(el.dataset.v); st.ui.lastAmt[st.draft.type] = p.amount; keepScroll(render); };
A.ptZone = (el) => { selPoint().zone = el.value; keepScroll(render); };
A.ptDelete = () => { st.draft.points = st.draft.points.filter((p) => p.id !== st.ui.selPt); st.ui.selPt = null; keepScroll(render); };
A.ptDone = () => { st.ui.selPt = null; keepScroll(render); };
A.clearView = () => ask(t('ses.clearViewQ'), () => {
  const v = st.ui.view || 'front';
  st.draft.points = st.draft.points.filter((p) => p.view !== v);
  st.ui.selPt = null; render();
});

A.setType = (el) => {
  const s = st.draft, v = el.dataset.v;
  if (s.type === v) return;
  if (s.points.length) return toast(t('ses.typeLocked'), 'bad');
  Object.assign(s, { type: v, products: [M.defaultProduct(v)], pricing: M.PRICING[v][0], series: v === 'sculptra' ? { n: 1, of: 3 } : null });
  st.ui.nextType = v;
  keepScroll(render);
};
A.setMethod = (el) => { st.draft.pay.method = el.dataset.v; keepScroll(render); };
A.rerender = () => keepScroll(render);
let lazyT;
A.rerenderLazy = () => { clearTimeout(lazyT); lazyT = setTimeout(() => {
  const a = document.activeElement; const bind = a?.dataset?.bind;
  keepScroll(render);
  if (bind) { const n = document.querySelector(`[data-bind="${bind}"]`); n?.focus({ preventScroll: true }); }
}, 700); };
A.addProduct = () => { st.draft.products.push(M.defaultProduct(st.draft.type)); keepScroll(render); };
A.delProduct = (el) => { st.draft.products.splice(Number(el.dataset.i), 1); keepScroll(render); };
A.stickerShot = (el) => pickImages(async ([f]) => {
  const pd = st.draft.products[Number(el.dataset.i)];
  pd.sticker = await S.putPhoto(await readImage(f, 1600));
  keepScroll(render);
});
A.sesPhoto = (el) => pickImages(async (files) => {
  for (const f of files) st.draft.photos.push({ ...(await S.putPhoto(await readImage(f))), tag: el.dataset.tag });
  keepScroll(render);
}, { multiple: true });
A.sesPhotoDel = (el) => { st.draft.photos.splice(Number(el.dataset.i), 1); keepScroll(render); };

A.saveSession = async () => {
  const s = st.draft;
  if (!s.points.length && s.type !== 'sculptra') {
    return ask(t('ses.noPointsQ'), () => doSave(s), { yes: t('btn.saveAnyway') });
  }
  await doSave(s);
};
async function doSave(s) {
  const isNew = !s.id;
  delete s._for;
  const saved = await S.save('session', s);
  st.draft = null;
  toast(t('msg.saved'));
  go('sessionView', { id: saved.id, fresh: isNew ? '1' : '' }, { replace: true });
}
A.deleteSession = () => ask(t('ses.deleteQ'), async () => {
  await S.remove('session', st.draft.id);
  st.draft = null; toast(t('msg.deleted')); back();
}, { yes: t('btn.delete'), danger: true });

// ---------- Ver sesión ----------
SCREENS.sessionView = ({ id, fresh }) => {
  const s = S.data.session[id];
  if (!s) return { html: html`${navbar('')}<main class="page"><div class="empty">${t('ses.notFound')}</div></main>` };
  const p = M.patient(s.pid);
  const sum = M.summarize(s);
  const pr = M.priceOf(s);
  const views = ['front', 'left', 'right'].filter((v) => s.points.some((x) => x.view === v));
  return { html: html`${navbar(fmtDate(s.date), { right: html`<button class="link" data-act="editSession" data-id="${id}">${t('btn.edit')}</button>` })}
  <main class="page" id="print-area">
    ${fresh && INSTRUCTIONS[s.type] ? html`<button class="banner mint" data-act="instructions" data-type="${s.type}" data-pid="${s.pid}">${icon('share')}<span>${t('ses.sendInstr')}</span>${icon('chev-r')}</button>` : ''}
    <section class="card">
      <p class="eyebrow">${p.name} · ${fmtDate(s.date)} · ${s.injector}</p>
      <h2 class="serif">${M.sessionTitle(s)}</h2>
      <div class="chips wrap">${chip(`${s.pay?.paid ? t('pay.paid') : t('pay.pending')} ${money(pr.total)} · ${t('pay.' + s.pay.method)}`, s.pay?.paid ? 'mint' : 'amber')}
        ${pr.promo ? chip(pr.promo.name) : ''}</div>
    </section>
    <div class="ses-grid">
      <section class="card"><div class="maps">${(views.length ? views : ['front']).map((v) => html`<figure>${faceMapSVG(s, { editable: false, view: v, small: views.length > 1 })}<figcaption>${t('view.' + v)}</figcaption></figure>`)}</div></section>
      <div class="col gap">
        <section class="card"><table class="sum"><thead><tr><th>${t('ses.area')}</th><th>${t('ses.sites')}</th><th>${t('ses.dose')}</th></tr></thead>
          <tbody>${sum.rows.map((r) => html`<tr><td>${zl(r.zone)}</td><td>${r.sites}</td><td>${num(r.total, 2)} ${sum.unit}</td></tr>`)}</tbody>
          <tfoot><tr><td>${t('ses.total')}</td><td>${s.points.length}</td><td><b>${num(sum.total, 2)} ${sum.unit}</b></td></tr></tfoot></table></section>
        <section class="card"><h3>${t('ses.product')}</h3>
          ${s.products.map((pd) => html`<p><b>${pd.name || '—'}</b>${pd.qty && s.type !== 'tox' ? ` × ${num(pd.qty)}` : ''}<br>
            <span class="muted small">${t('ses.lot')}: ${pd.lot || '—'} · ${t('ses.expiry')}: ${pd.exp || '—'}${pd.dilution ? ` · ${t('ses.dilution')}: ${pd.dilution} mL` : ''}</span></p>
            ${pd.sticker ? html`<button class="thumb mini" data-act="viewPhoto" data-img="${pd.sticker.id}"><img data-img="${pd.sticker.thumbId}" alt=""></button>` : ''}`)}
        </section>
      </div>
    </div>
    ${s.photos.length ? html`<section class="card"><h3>${t('ses.photos')}</h3><div class="thumbs">${s.photos.map((ph) => html`<button class="thumb" data-act="viewPhoto" data-img="${ph.id}"><img data-img="${ph.thumbId}" alt=""><span>${t('photo.' + ph.tag)}</span></button>`)}</div></section>` : ''}
    ${s.notes ? html`<section class="card"><h3>${t('ses.notes')}</h3><p class="pre">${s.notes}</p></section>` : ''}
    <div class="row gap wrap no-print">
      ${INSTRUCTIONS[s.type] ? html`<button class="btn ghost" data-act="instructions" data-type="${s.type}" data-pid="${s.pid}">${icon('share')} ${t('ses.instr')}</button>` : ''}
      <button class="btn ghost" data-act="print">${icon('print')} ${t('btn.printPdf')}</button>
      <button class="btn ghost" data-act="go" data-to="patient" data-id="${s.pid}">${t('ses.toPatient')}</button>
    </div>
  </main>` };
};
A.editSession = (el) => { st.draft = null; go('session', { pid: S.data.session[el.dataset.id].pid, id: el.dataset.id }); };
A.print = () => window.print();

// ---------- Instrucciones post-tratamiento ----------
SHEETS.instructions = ({ type, pid }) => {
  const ins = INSTRUCTIONS[type];
  const p = M.patient(pid);
  return { wide: true, html: html`<div class="sheet-h"><button class="link" data-act="closeSheet">${t('btn.close')}</button><b>${ins.title}</b><span></span></div>
  <div class="sheet-body">
    ${!settings().legalApproved ? html`<p class="banner amber">${icon('alert')}<span>${t('legal.pendingShort')}</span></p>` : ''}
    <div class="instr">${ins.text.map((para) => html`<p>${para}</p>`)}</div>
    <div class="share-grid">
      <button class="btn primary" data-act="shareInstr" data-via="share">${icon('share')} ${t('btn.share')}</button>
      <button class="btn primary" data-act="shareInstr" data-via="sms" ${p.cell || p.phone ? '' : 'disabled'}>SMS</button>
      <button class="btn primary" data-act="shareInstr" data-via="email" ${p.email ? '' : 'disabled'}>Email</button>
      <button class="btn ghost" data-act="shareInstr" data-via="copy">${t('btn.copy')}</button>
    </div>
  </div>` };
};
A.instructions = (el) => openSheet('instructions', { type: el.dataset.type, pid: el.dataset.pid });
A.shareInstr = async (el) => {
  const { type, pid } = st.sheet.params;
  const ins = INSTRUCTIONS[type], p = M.patient(pid);
  const text = `${ins.title}\n\n${ins.text.join('\n\n')}\n\n— ${settings().clinic.name}`;
  const via = el.dataset.via;
  if (via === 'share' && navigator.share) { try { await navigator.share({ title: ins.title, text }); } catch {} return; }
  if (via === 'copy' || via === 'share') { try { await navigator.clipboard.writeText(text); toast(t('msg.copied')); } catch { toast(t('msg.copyFail'), 'bad'); } return; }
  const ph = String(p.cell || p.phone).replace(/\D/g, '');
  window.location.href = via === 'sms' ? `sms:+${ph.length === 10 ? '1' + ph : ph}&body=${encodeURIComponent(text)}`
    : `mailto:${p.email}?subject=${encodeURIComponent(ins.title)}&body=${encodeURIComponent(text)}`;
};
