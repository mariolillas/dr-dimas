// Expediente, historial (intake), alta desde papel y cola de "por completar".
import * as S from '../store.js';
import * as M from '../model.js';
import { INTAKE, alertsFor, PHOTO_RELEASE } from '../content.js';
import { html, raw, todayISO, age, uid, readImage } from '../util.js';
import { t, getLang } from '../i18n.js';
import { SCREENS, SHEETS, A, st, go, back, render, openSheet, closeSheet, toast, ask, navbar,
  fmtDate, ago, avatar, chip, icon, pickImages, setPath } from '../core.js';
import { zoneLabel } from '../face.js';
import { alertChips, alertText } from './home.js';

const ynLabel = (v) => (v === 'yes' ? t('yn.yes') : v === 'no' ? t('yn.no') : '—');

// ---------- EXPEDIENTE ----------
SCREENS.patient = ({ id }) => {
  const p = M.patient(id);
  if (!p) return { html: html`${navbar('')}<main class="page"><div class="empty">${t('pat.notFound')}</div></main>` };
  const ss = M.sessionsOf(id);
  const i = p.intake || {};
  const photos = [...(p.paperPhotos || []).map((ph) => ({ ...ph, tag: 'paper' })),
    ...ss.flatMap((s) => (s.photos || []).map((ph) => ({ ...ph, date: s.date })))];
  const rel = PHOTO_RELEASE.options.find((o) => o.v === p.photoRelease);
  const docs = M.docsOf(id);
  return { html: html`${navbar(t('pat.record'), { right: html`<button class="link" data-act="newAppt" data-pid="${id}">${icon('calendar')}</button>` })}
  <main class="page">
    <section class="card hero">
      ${avatar(p.name, 'xl')}
      <div class="grow">
        <h1 class="serif name">${p.name}</h1>
        <p class="muted">${p.dob ? `${fmtDate(p.dob)} · ${age(p.dob)} ${t('pat.yrs')}` : t('pat.noDob')}
          ${p.cell || p.phone ? html` · ${p.cell || p.phone}` : ''}${p.email ? html` · ${p.email}` : ''}</p>
        <div class="chips wrap">${alertChips(p, 6)}
          ${rel ? chip(t('pat.release') + ': ' + rel[getLang()], p.photoRelease === 'social' ? 'mint' : 'gray') : chip(t('pat.noRelease'), 'gray')}</div>
      </div>
      <div class="hero-actions">
        <button class="btn primary" data-act="go" data-to="session" data-pid="${id}">${icon('syringe')} ${t('qa.session')}</button>
        <button class="btn ghost" data-act="message" data-pid="${id}" data-kind="check">${icon('msg')} ${t('btn.message')}</button>
      </div>
    </section>

    <div class="two-col">
      <div class="col gap">
        <section class="card">
          <div class="card-h"><h3 class="serif">${t('pat.history')}</h3><button class="link" data-act="editIntake" data-id="${id}">${icon('edit')} ${t('btn.edit')}</button></div>
          <dl class="kv">
            <dt>${t('f.allergies')}</dt><dd class="${i.allergies?.yn === 'yes' ? 'red' : ''}">${ynLabel(i.allergies?.yn)}${i.allergies?.detail ? ` · ${i.allergies.detail}` : ''}</dd>
            <dt>${t('f.anaphylaxis')}</dt><dd class="${i.anaphylaxis?.yn === 'yes' ? 'red' : ''}">${ynLabel(i.anaphylaxis?.yn)}</dd>
            <dt>${t('f.currentMeds')}</dt><dd>${i.currentMeds || '—'}</dd>
            <dt>${t('pat.thinners')}</dt><dd class="${alertsFor(p).some((a) => a.k === 'bloodThinner') ? 'red' : ''}">${thinnerList(i)}</dd>
            <dt>${t('f.herpes')}</dt><dd>${ynLabel(i.herpes)}</dd>
            <dt>${t('f.autoimmune')}</dt><dd>${ynLabel(i.autoimmune)}</dd>
            <dt>${t('f.prevTreatment')}</dt><dd>${ynLabel(i.prevTreatment?.yn)}${i.fillerTypes ? ` · ${i.fillerTypes}` : ''}</dd>
            <dt>${t('f.complications')}</dt><dd>${ynLabel(i.complications?.yn)}</dd>
            ${i.comments ? html`<dt>${t('f.comments')}</dt><dd>${i.comments}</dd>` : ''}
          </dl>
          ${p.status === 'paper' ? html`<button class="btn mint full" data-act="go" data-to="completeOne" data-id="${id}">${icon('paper')} ${t('pat.completeFromPaper')}</button>` : ''}
        </section>

        <section class="card">
          <div class="card-h"><h3 class="serif">${t('pat.documents')}</h3></div>
          <div class="list flat">
            <div class="row-item">${icon('doc')}<span class="grow"><b>${t('doc.history')}</b>
              <small>${p.intakeSig ? t('doc.signedOn', { d: fmtDate(p.intakeSig.date) }) : p.status === 'paper' ? t('doc.onPaper') : t('doc.notSigned')}</small></span>
              ${p.intakeSig ? icon('check', 'ok') : html`<button class="btn small ghost" data-act="editIntake" data-id="${id}">${t('btn.open')}</button>`}</div>
            ${['tox', 'filler', 'sculptra'].map((k) => {
              const d = M.consentFor(id, k);
              return html`<div class="row-item">${icon('doc')}<span class="grow"><b>${t('doc.consent.' + k)}</b>
                <small>${d ? t('doc.signedOn', { d: fmtDate(d.signedAt.slice(0, 10)) }) : k === 'sculptra' ? t('doc.sculptraPending') : t('doc.notSigned')}</small></span>
                ${d ? html`<button class="btn small ghost" data-act="go" data-to="doc" data-id="${d.id}">${t('btn.view')}</button>`
                  : k === 'sculptra' ? '' : html`<button class="btn small primary" data-act="startConsent" data-pid="${id}" data-kind="${k}">${t('btn.signNow')}</button>`}</div>`;
            })}
            ${docs.filter((d) => M.consentFor(id, d.kind)?.id !== d.id).map((d) => html`<button class="row-item" data-act="go" data-to="doc" data-id="${d.id}">${icon('doc')}<span class="grow"><b>${t('doc.consent.' + d.kind)}</b><small>${t('doc.previous')} · ${fmtDate(d.signedAt.slice(0, 10))}</small></span>${icon('chev-r', 'chev')}</button>`)}
          </div>
        </section>
      </div>

      <div class="col gap">
        <section class="card">
          <div class="card-h"><h3 class="serif">${t('pat.sessions')}</h3><span class="muted small">${ss.length}</span></div>
          ${ss.length ? html`<div class="timeline">${ss.map((s) => {
            const pr = M.priceOf(s);
            return html`<button class="tl-item" data-act="go" data-to="sessionView" data-id="${s.id}">
              <span class="tl-dot ${s.type}"></span>
              <span class="grow"><small>${fmtDate(s.date)} · ${s.injector || ''}</small>
                <b>${M.sessionTitle(s)}</b>
                <small>${M.summarize(s).rows.slice(0, 4).map((r) => r.zone && zoneShort(r.zone)).join(', ')}</small></span>
              ${chip(`${s.pay?.paid ? t('pay.paid') : t('pay.pending')} $${pr.total}`, s.pay?.paid ? 'mint' : 'amber')}
            </button>`;
          })}</div>` : html`<div class="empty">${t('pat.noSessions')}</div>`}
        </section>

        <section class="card">
          <div class="card-h"><h3 class="serif">${t('pat.photos')}</h3><span class="muted small">${photos.length}</span></div>
          ${photos.length ? html`<div class="thumbs">${photos.map((ph) => html`<button class="thumb" data-act="viewPhoto" data-img="${ph.id}">
            <img data-img="${ph.thumbId || ph.id}" alt=""><span>${ph.tag === 'paper' ? t('photo.paper') : t('photo.' + (ph.tag || 'before'))}${ph.date ? ' · ' + fmtDate(ph.date, { month: 'short', day: 'numeric' }) : ''}</span></button>`)}</div>`
            : html`<div class="empty">${t('pat.noPhotos')}</div>`}
        </section>
      </div>
    </div>
    <button class="btn danger-ghost" data-act="deletePatient" data-id="${id}">${icon('trash')} ${t('pat.delete')}</button>
  </main>` };
};
const zoneShort = (z) => zoneLabel(z, getLang());
function thinnerList(i) {
  const ks = ['aspirin', 'antiInflammatories', 'anticoagulants', 'nsaids', 'steroids', 'ginkgo', 'vitA', 'vitE', 'garlic', 'flax'].filter((k) => i[k] === 'yes');
  return ks.length ? ks.map((k) => t('f.' + k)).join(', ') : '—';
}
A.deletePatient = (el) => ask(t('pat.deleteQ'), async () => {
  const id = el.dataset.id;
  for (const s of M.sessionsOf(id)) await S.remove('session', s.id);
  for (const d of M.docsOf(id)) await S.remove('doc', d.id);
  for (const a of Object.values(S.data.appt).filter((a) => a.pid === id)) await S.remove('appt', a.id);
  await S.remove('patient', id);
  toast(t('msg.deleted'));
  back();
}, { yes: t('btn.delete'), danger: true });

SHEETS.photo = ({ img }) => ({ wide: true, html: html`<div class="sheet-h"><span></span><b></b><button class="link" data-act="closeSheet">${t('btn.close')}</button></div>
  <div class="sheet-body center"><img class="photo-full" data-img="${img}" alt=""></div>` });
A.viewPhoto = (el) => openSheet('photo', { img: el.dataset.img });

// ---------- HISTORIAL (intake) ----------
function blankPatient(extra = {}) {
  return { name: '', dob: '', phone: '', cell: '', email: '', address: '', referredBy: '', intake: {}, status: 'active', ...extra };
}
A.newPatient = (el, prefill = {}) => {
  st.draft = blankPatient(prefill);
  st.sheet = null;
  go('intake', { mode: 'new' });
};
A.editIntake = (el) => {
  st.draft = structuredClone(M.patient(el.dataset.id));
  st.draft.intake ||= {};
  go('intake', { mode: 'edit' });
};

export function intakeForm(d, { signature = true } = {}) {
  const top = new Set(['name', 'dob', 'phone', 'cell', 'email', 'address', 'referredBy']);
  const path = (k) => (top.has(k) ? k : 'intake.' + k);
  const val = (k) => (top.has(k) ? d[k] : d.intake?.[k]);
  const field = (f) => {
    const v = val(f.k), p = path(f.k), label = t('f.' + f.k) + (f.req ? ' *' : '');
    switch (f.t) {
      case 'yn': return html`<div class="field yn"><span>${label}</span>${ynSeg(p, v)}</div>`;
      case 'ynd': return html`<div class="field yn"><span>${label}</span>${ynSeg(p + '.yn', v?.yn)}
        ${v?.yn === 'yes' ? html`<input type="date" data-bind="${p}.date" value="${v.date || ''}" aria-label="${t('f.when')}">` : ''}</div>`;
      case 'ynt': return html`<div class="field yn"><span>${label}</span>${ynSeg(p + '.yn', v?.yn)}
        ${v?.yn === 'yes' ? html`<input data-bind="${p}.detail" value="${v.detail || ''}" placeholder="${t('f.which')}">` : ''}</div>`;
      case 'area': return html`<label class="field stack"><span>${label}</span><textarea rows="2" data-bind="${p}">${v || ''}</textarea></label>`;
      default: return html`<label class="field"><span>${label}</span><input type="${f.t === 'tel' ? 'tel' : f.t}" data-bind="${p}" value="${v || ''}" ${f.t === 'email' ? 'autocapitalize="off"' : ''}></label>`;
    }
  };
  return html`${INTAKE.map((g) => html`<h4 class="group-h">${t('g.' + g.group)}</h4><div class="group">${g.fields.map(field)}</div>`)}
    ${signature ? html`<h4 class="group-h">${t('intake.sign')}</h4>
    <div class="group pad-group"><p class="small muted">${t('intake.attest')}</p>
      ${d.intakeSig ? html`<p class="small">${t('doc.signedOn', { d: fmtDate(d.intakeSig.date) })} <img class="sig-mini" data-img="${d.intakeSig.img}" alt=""></p><p class="small muted">${t('intake.resign')}</p>` : ''}
      <div class="pad-wrap"><canvas data-pad="intakeSig" class="pad"></canvas><button class="link" data-act="clearPad" data-pad="intakeSig">${t('btn.clear')}</button></div>
    </div>` : ''}`;
}
function ynSeg(path, v) {
  return html`<span class="seg small yn-seg">
    <button class="${v === 'yes' ? 'on red' : ''}" data-act="yn" data-path="${path}" data-v="yes">${t('yn.yes')}</button>
    <button class="${v === 'no' ? 'on' : ''}" data-act="yn" data-path="${path}" data-v="no">${t('yn.no')}</button></span>`;
}
A.yn = (el) => {
  setPath(st.draft, el.dataset.path, el.dataset.v);
  const y = window.scrollY; render(); window.scrollTo(0, y);
};
A.clearPad = (el) => st.pads[el.dataset.pad]?.clear();

SCREENS.intake = ({ mode }) => {
  const d = st.draft;
  return { html: html`${navbar(t(mode === 'new' ? 'intake.new' : 'intake.edit'), { right: html`<button class="link strong" data-act="saveIntake">${t('btn.save')}</button>` })}
  <main class="page narrow">
    <p class="muted">${t('intake.explain')}</p>
    ${intakeForm(d)}
    <button class="btn primary full" data-act="saveIntake">${t('btn.save')}</button>
  </main>` };
};
A.saveIntake = async () => {
  const d = st.draft;
  if (!String(d.name || '').trim()) return toast(t('intake.needName'), 'bad');
  const pad = st.pads.intakeSig;
  if (pad && !pad.isEmpty()) {
    if (d.intakeSig?.img) await S.deleteImage(d.intakeSig.img);
    d.intakeSig = { img: await S.putImage(await pad.toBytes(), 'image/png'), date: todayISO() };
  }
  d.name = d.name.trim();
  const isNew = !d.id;
  const p = await S.save('patient', d);
  if (st.ui.apptToLink) {
    const a = S.data.appt[st.ui.apptToLink];
    if (a) { a.pid = p.id; a.name = p.name; await S.save('appt', a); }
    st.ui.apptToLink = null;
  }
  toast(t('msg.saved'));
  st.draft = null;
  if (isNew) go('patient', { id: p.id }, { replace: true }); else back();
};

// ---------- ALTA DESDE PAPEL ----------
SCREENS.paper = () => {
  if (!st.draft?._paper) st.draft = blankPatient({ status: 'paper', paperPhotos: [], _paper: true });
  const d = st.draft;
  return { html: html`${navbar(t('paper.title'))}
  <main class="page narrow">
    <p class="muted">${t('paper.explain')}</p>
    <div class="group">
      <label class="field"><span>${t('f.name')} *</span><input data-bind="name" value="${d.name}"></label>
      <label class="field"><span>${t('f.dob')}</span><input type="date" data-bind="dob" value="${d.dob}"></label>
      <label class="field"><span>${t('f.cell')}</span><input type="tel" data-bind="cell" value="${d.cell}"></label>
    </div>
    <h4 class="group-h">${t('paper.sheets')} (${d.paperPhotos.length})</h4>
    <div class="thumbs">${d.paperPhotos.map((ph, i) => html`<div class="thumb"><img data-img="${ph.thumbId}" alt=""><span>${t('paper.page', { n: i + 1 })}</span>
      <button class="x" data-act="paperDel" data-i="${i}">×</button></div>`)}
      <button class="thumb add" data-act="paperShot">${icon('camera')}<span>${t('paper.take')}</span></button></div>
    <div class="row gap">
      <button class="btn ghost grow" data-act="paperSave" data-more="1">${t('paper.saveMore')}</button>
      <button class="btn primary grow" data-act="paperSave">${t('btn.save')}</button>
    </div>
  </main>` };
};
A.paperShot = () => pickImages(async (files) => {
  for (const f of files) st.draft.paperPhotos.push(await S.putPhoto(await readImage(f, 2200)));
  render();
}, { multiple: true });
A.paperDel = async (el) => {
  const [ph] = st.draft.paperPhotos.splice(Number(el.dataset.i), 1);
  await S.deleteImage(ph.id); await S.deleteImage(ph.thumbId);
  render();
};
A.paperSave = async (el) => {
  const d = st.draft;
  if (!String(d.name || '').trim()) return toast(t('intake.needName'), 'bad');
  d.name = d.name.trim();
  delete d._paper;
  await S.save('patient', d);
  toast(t('paper.saved', { name: d.name }));
  st.draft = el.dataset.more ? blankPatient({ status: 'paper', paperPhotos: [], _paper: true }) : null;
  if (el.dataset.more) { render(); window.scrollTo(0, 0); } else back();
};

// ---------- POR COMPLETAR (cola) ----------
SCREENS.complete = () => {
  const ps = M.patients().filter((p) => p.status === 'paper').sort((a, b) => a.createdAt - b.createdAt);
  const total = M.patients().filter((p) => p.paperPhotos?.length).length;
  const done = total - ps.length;
  return { html: html`${navbar(t('qa.complete'), { right: html`<button class="link" data-act="go" data-to="paper">${icon('camera')}</button>` })}
  <main class="page">
    <h1 class="large serif">${t('qa.complete')}</h1>
    <p class="muted">${t('complete.progress', { done, total })}</p>
    <div class="progress"><i style="width:${total ? Math.round((done / total) * 100) : 0}%"></i></div>
    <p class="muted small">${t('complete.explain')}</p>
    <div class="list">${ps.length ? ps.map((p) => html`<button class="row-item" data-act="go" data-to="completeOne" data-id="${p.id}">
      ${avatar(p.name)}<span class="grow"><b>${p.name}</b><small>${t('complete.sheets', { n: p.paperPhotos?.length || 0 })} · ${ago(new Date(p.createdAt).toISOString().slice(0, 10))}</small></span>${icon('chev-r', 'chev')}</button>`)
      : html`<div class="empty">${t('complete.none')}</div>`}</div>
  </main>` };
};

SCREENS.completeOne = ({ id }) => {
  if (!st.draft || st.draft.id !== id) { st.draft = structuredClone(M.patient(id)); st.draft.intake ||= {}; st.ui.pageIdx = 0; }
  const d = st.draft;
  const pages = d.paperPhotos || [];
  const cur = pages[st.ui.pageIdx || 0];
  return { html: html`${navbar(d.name, { right: html`<button class="link strong" data-act="completeSave">${t('btn.saveDraft')}</button>` })}
  <main class="split">
    <section class="split-l">
      ${cur ? html`<div class="paper-view"><img data-img="${cur.id}" alt=""></div>` : html`<div class="empty">${t('complete.noPhotos')}</div>`}
      <div class="thumbs small">${pages.map((ph, i) => html`<button class="thumb ${i === (st.ui.pageIdx || 0) ? 'on' : ''}" data-act="pageIdx" data-i="${i}"><img data-img="${ph.thumbId}" alt=""><span>${t('paper.page', { n: i + 1 })}</span></button>`)}
        <button class="thumb add" data-act="completeShot">${icon('camera')}</button></div>
    </section>
    <section class="split-r">
      ${intakeForm(d, { signature: false })}
      <label class="check"><input type="checkbox" data-bind="signedOnPaper" ${d.signedOnPaper ? 'checked' : ''}> ${t('complete.signedPaper')}</label>
      <div class="row gap sticky-foot">
        <button class="btn ghost grow" data-act="completeSave">${t('btn.saveDraft')}</button>
        <button class="btn primary grow" data-act="completeDone">${t('complete.done')}</button>
      </div>
    </section>
  </main>` };
};
A.pageIdx = (el) => { st.ui.pageIdx = Number(el.dataset.i); render(); };
A.completeShot = () => pickImages(async (files) => {
  for (const f of files) st.draft.paperPhotos.push(await S.putPhoto(await readImage(f, 2200)));
  render();
}, { multiple: true });
A.completeSave = async () => { await S.save('patient', st.draft); toast(t('msg.saved')); };
A.completeDone = async () => {
  const d = st.draft;
  if (!d.dob) return toast(t('complete.needDob'), 'bad');
  d.status = 'active';
  await S.save('patient', d);
  toast(t('complete.marked', { name: d.name }));
  const next = M.patients().filter((p) => p.status === 'paper').sort((a, b) => a.createdAt - b.createdAt)[0];
  st.draft = null;
  if (next) go('completeOne', { id: next.id }, { replace: true }); else back();
};
