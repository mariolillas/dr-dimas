// Hoy (agenda), Pacientes, Seguimiento + hojas de cita, elegir paciente y mensaje.
import * as S from '../store.js';
import * as M from '../model.js';
import { alertsFor, TEMPLATES } from '../content.js';
import { html, todayISO, addDays, daysBetween, firstName, digits, uid } from '../util.js';
import { t, getLang, setLang } from '../i18n.js';
import { SCREENS, SHEETS, A, st, go, render, openSheet, closeSheet, toast, ask, fmtDate, fmtTime, ago, avatar, chip, icon, settings } from '../core.js';

export function alertChips(p, max = 3) {
  const out = alertsFor(p).slice(0, max).map((a) => chip(alertText(a), a.c));
  if (p.status === 'paper') out.push(chip(t('chip.paper'), 'gray'));
  return out;
}
export function alertText(a) {
  if (a.k === 'allergy') return t('alert.allergy') + (a.d ? `: ${a.d}` : '');
  if (a.k === 'bloodThinner') return t('alert.bloodThinner');
  return t('alert.' + a.k);
}

export function header() {
  const s = settings();
  const backupDays = s.lastBackup ? daysBetween(s.lastBackup.slice(0, 10), todayISO()) : null;
  return html`<header class="top">
    <div class="brand"><img src="icons/mark.png" alt=""><div><b class="serif">Dr. Dimas</b><small>${t('app.sub')}</small></div></div>
    <div class="top-r">
      <button class="seg-mini" data-act="langSwitch">${getLang() === 'en' ? 'EN · es' : 'ES · en'}</button>
      <span class="pill">${icon('lock')} ${t('top.encrypted')}${backupDays == null ? '' : ' · ' + t('top.backup', { n: backupDays })}</span>
      <button class="icon-btn" data-act="lockNow" aria-label="${t('btn.lock')}">${icon('lock')}</button>
    </div>
  </header>`;
}
A.langSwitch = async () => {
  setLang(getLang() === 'en' ? 'es' : 'en');
  settings().lang = getLang();
  await S.save('settings', settings());
  render();
};

function banners() {
  const s = settings(), out = [];
  const bd = s.lastBackup ? daysBetween(s.lastBackup.slice(0, 10), todayISO()) : null;
  if (bd == null || bd >= 3) out.push(html`<button class="banner amber" data-act="go" data-to="backup">${icon('alert')}<span>${bd == null ? t('ban.noBackup') : t('ban.oldBackup', { n: bd })}</span>${icon('chev-r')}</button>`);
  if (!s.legalApproved) out.push(html`<button class="banner" data-act="go" data-to="legal">${icon('doc')}<span>${t('ban.legal')}</span>${icon('chev-r')}</button>`);
  if (M.patients().some(M.isDemo)) out.push(html`<div class="banner gray">${icon('people')}<span>${t('ban.demo')}</span></div>`);
  return out;
}

// ---------- HOY ----------
SCREENS.today = () => {
  const day = st.ui.day || todayISO();
  const appts = M.apptsOn(day);
  const fu = M.followups();
  const paper = M.patients().filter((p) => p.status === 'paper').length;
  const isToday = day === todayISO();
  return { tabs: true, html: html`${header()}
  <main class="page">
    <div class="day-nav">
      <button class="icon-btn" data-act="dayShift" data-n="-1">${icon('chev-l')}</button>
      <div><p class="eyebrow">${fmtDate(day, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 class="large serif">${isToday ? t('today.title') : fmtDate(day, { month: 'short', day: 'numeric' })}</h1></div>
      <button class="icon-btn" data-act="dayShift" data-n="1">${icon('chev-r')}</button>
      ${isToday ? '' : html`<button class="btn small ghost" data-act="dayShift" data-n="0">${t('today.title')}</button>`}
    </div>
    ${banners()}
    <section>
      <div class="sec-h"><h3>${t('today.appts')}</h3><button class="link" data-act="newAppt">${icon('plus')} ${t('today.addAppt')}</button></div>
      <div class="list">
        ${appts.length ? appts.map(apptRow) : html`<div class="empty">${t('today.noAppts')}</div>`}
      </div>
      <p class="foot">${t('today.vagaroNote')}</p>
    </section>
    ${fu.length ? html`<section>
      <div class="sec-h"><h3>${t('today.due')} <span class="count">${fu.length}</span></h3><button class="link" data-act="tab" data-to="followups">${t('btn.seeAll')}</button></div>
      <div class="list">${fu.slice(0, 4).map(fuRow)}</div>
    </section>` : ''}
    <section>
      <h3 class="sec-h">${t('today.quick')}</h3>
      <div class="tiles">
        <button class="tile dark" data-act="pickPatient">${icon('syringe')}<b>${t('qa.session')}</b><small>${t('qa.sessionSub')}</small></button>
        <button class="tile" data-act="newPatient">${icon('people')}<b>${t('qa.patient')}</b><small>${t('qa.patientSub')}</small></button>
        <button class="tile" data-act="go" data-to="paper">${icon('camera')}<b>${t('qa.paper')}</b><small>${t('qa.paperSub')}</small></button>
        <button class="tile" data-act="go" data-to="complete">${icon('paper')}<b>${t('qa.complete')}</b><small>${t('qa.completeSub', { n: paper })}</small></button>
      </div>
    </section>
  </main>` };
};
A.dayShift = (el) => {
  const n = Number(el.dataset.n);
  st.ui.day = n === 0 ? todayISO() : addDays(st.ui.day || todayISO(), n);
  render();
};

function apptRow(a) {
  const p = a.pid && M.patient(a.pid);
  const name = p ? p.name : a.name;
  const consentMissing = p && (a.service === 'tox' || a.service === 'filler') && !M.consentFor(p.id, a.service);
  return html`<button class="row-item" data-act="openAppt" data-id="${a.id}">
    <span class="time">${fmtTime(a.time)}</span>
    ${avatar(name)}
    <span class="grow"><b>${name}</b>
      <small>${t('svc.' + (a.service || 'other'))}${a.note ? ' · ' + a.note : ''}</small></span>
    <span class="chips">${p ? alertChips(p, 2) : chip(t('chip.newPatient'), 'gray')}${consentMissing ? chip(t('chip.consentPending'), 'amber') : ''}</span>
    ${icon('chev-r', 'chev')}
  </button>`;
}
A.openAppt = (el) => {
  const a = S.data.appt[el.dataset.id];
  if (a.pid && M.patient(a.pid)) return go('patient', { id: a.pid });
  st.ui.apptToLink = a.id;
  A.newPatient(null, { name: a.name });
};

function fuRow(f) {
  return html`<div class="row-item">
    ${avatar(f.p.name)}
    <span class="grow"><b>${f.p.name}</b><small>${t('fu.' + f.kind)} · ${M.sessionTitle(f.s)} · ${ago(f.s.date)}</small></span>
    <button class="btn small mint" data-act="message" data-pid="${f.p.id}" data-sid="${f.s.id}" data-kind="${f.kind}">${icon('msg')} ${t('btn.message')}</button>
    <button class="btn small ghost" data-act="fuDone" data-sid="${f.s.id}" data-kind="${f.kind}">${icon('check')}</button>
  </div>`;
}
A.fuDone = async (el) => {
  const s = S.data.session[el.dataset.sid];
  const key = { check: 'check', touchup: 'touchup', review: 'review', sculptra: 'next' }[el.dataset.kind];
  s.fu = { ...(s.fu || {}), [key]: todayISO() };
  await S.save('session', s);
  toast(t('fu.marked'));
  render();
};

// ---------- PACIENTES ----------
SCREENS.patients = () => {
  const filter = st.ui.pFilter || 'all';
  const paper = M.patients().filter((p) => p.status === 'paper').length;
  return { tabs: true, after: () => document.getElementById('psearch')?.focus({ preventScroll: true }), html: html`${header()}
  <main class="page">
    <div class="title-row"><h1 class="large serif">${t('tab.patients')}</h1>
      <button class="btn primary" data-act="newPatient">${icon('plus')} ${t('qa.patient')}</button></div>
    <div class="search">${icon('search')}<input id="psearch" type="search" placeholder="${t('pat.search')}" value="${st.ui.pq || ''}" data-live="pSearch" autocomplete="off"></div>
    <div class="seg">
      <button class="${filter === 'all' ? 'on' : ''}" data-act="pFilter" data-f="all">${t('pat.all')} (${M.patients().length})</button>
      <button class="${filter === 'paper' ? 'on' : ''}" data-act="pFilter" data-f="paper">${t('pat.toComplete')} (${paper})</button>
    </div>
    <div class="list" id="plist">${patientRows()}</div>
  </main>` };
};
function patientRows() {
  const q = (st.ui.pq || '').toLowerCase().trim();
  const dq = digits(q);
  let ps = M.patients();
  if (st.ui.pFilter === 'paper') ps = ps.filter((p) => p.status === 'paper');
  if (q) ps = ps.filter((p) => p.name.toLowerCase().includes(q) || (dq && digits(p.phone + ' ' + p.cell).includes(dq)));
  ps = ps.map((p) => ({ p, last: M.lastSession(p.id) }))
    .sort((a, b) => (b.last?.date || '').localeCompare(a.last?.date || '') || a.p.name.localeCompare(b.p.name));
  if (!ps.length) return html`<div class="empty">${t('pat.none')}</div>`;
  return ps.map(({ p, last }) => html`<button class="row-item" data-act="go" data-to="patient" data-id="${p.id}">
    ${avatar(p.name)}
    <span class="grow"><b>${p.name}</b><small>${last ? `${M.sessionTitle(last)} · ${ago(last.date)}` : t('pat.noSessions')}</small></span>
    <span class="chips">${alertChips(p, 2)}</span>${icon('chev-r', 'chev')}
  </button>`);
}
A.pSearch = (el) => {
  st.ui.pq = el.value;
  document.getElementById('plist').innerHTML = String(patientRows().s ?? '');
};
A.pFilter = (el) => { st.ui.pFilter = el.dataset.f; render(); };

// ---------- SEGUIMIENTO ----------
SCREENS.followups = () => {
  const fu = M.followups();
  const groups = ['check', 'touchup', 'sculptra', 'review'];
  return { tabs: true, html: html`${header()}
  <main class="page">
    <h1 class="large serif">${t('tab.followups')}</h1>
    <p class="muted">${t('fu.explain', { check: settings().followup.checkDays, tox: settings().followup.toxDays })}</p>
    ${fu.length ? groups.map((g) => {
      const items = fu.filter((f) => f.kind === g);
      if (!items.length) return '';
      return html`<section><h3 class="sec-h">${t('fu.group.' + g)} <span class="count">${items.length}</span></h3>
        <div class="list">${items.map(fuRow)}</div></section>`;
    }) : html`<div class="empty big">${icon('check')}<p>${t('fu.none')}</p></div>`}
    <p class="foot">${t('fu.v2')}</p>
  </main>` };
};

// ---------- Hoja: elegir paciente ----------
SHEETS.pickPatient = () => {
  const q = (st.ui.pickQ || '').toLowerCase();
  const ps = M.patients().filter((p) => !q || p.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
  return { html: html`<div class="sheet-h"><button class="link" data-act="closeSheet">${t('btn.cancel')}</button><b>${t('pick.title')}</b><span></span></div>
    <div class="sheet-body">
      <div class="search">${icon('search')}<input id="pickq" type="search" placeholder="${t('pat.search')}" value="${st.ui.pickQ || ''}" data-live="pickSearch"></div>
      <div class="list" id="picklist">${ps.slice(0, 60).map((p) => html`<button class="row-item" data-act="pickDo" data-id="${p.id}">${avatar(p.name)}<span class="grow"><b>${p.name}</b></span>${icon('chev-r', 'chev')}</button>`)}</div>
      <button class="btn ghost full" data-act="newPatient">${icon('plus')} ${t('qa.patient')}</button>
    </div>`, after: () => document.getElementById('pickq')?.focus({ preventScroll: true }) };
};
A.pickPatient = () => { st.ui.pickQ = ''; openSheet('pickPatient'); };
A.pickSearch = (el) => {
  st.ui.pickQ = el.value; render();
  const i = document.getElementById('pickq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length);
};
A.pickDo = (el) => { closeSheet(); go('session', { pid: el.dataset.id }); };

// ---------- Hoja: cita ----------
SHEETS.appt = () => {
  const d = st.draft;
  const ps = M.patients().sort((a, b) => a.name.localeCompare(b.name));
  return { html: html`<div class="sheet-h"><button class="link" data-act="closeSheet">${t('btn.cancel')}</button><b>${t(d.id ? 'appt.edit' : 'appt.new')}</b><button class="link strong" data-act="saveAppt">${t('btn.save')}</button></div>
  <div class="sheet-body">
    <div class="group">
      <label class="field"><span>${t('appt.patient')}</span>
        <select data-bind="pid"><option value="">${t('appt.newName')}</option>${ps.map((p) => html`<option value="${p.id}" ${d.pid === p.id ? 'selected' : ''}>${p.name}</option>`)}</select></label>
      <label class="field"><span>${t('appt.name')}</span><input data-bind="name" value="${d.name || ''}" placeholder="${t('appt.namePh')}"></label>
      <label class="field"><span>${t('appt.date')}</span><input type="date" data-bind="date" value="${d.date}"></label>
      <label class="field"><span>${t('appt.time')}</span><input type="time" data-bind="time" value="${d.time || ''}"></label>
      <label class="field"><span>${t('appt.service')}</span><select data-bind="service">${['tox', 'filler', 'sculptra', 'check', 'consult', 'other'].map((s) => html`<option value="${s}" ${d.service === s ? 'selected' : ''}>${t('svc.' + s)}</option>`)}</select></label>
      <label class="field"><span>${t('appt.note')}</span><input data-bind="note" value="${d.note || ''}"></label>
    </div>
    ${d.id ? html`<button class="btn danger-ghost full" data-act="deleteAppt">${icon('trash')} ${t('appt.delete')}</button>` : ''}
  </div>` };
};
A.newAppt = (el) => {
  st.draft = { date: st.ui.day || todayISO(), time: '', service: 'tox', pid: el?.dataset?.pid || '', name: '', note: '' };
  openSheet('appt');
};
A.saveAppt = async () => {
  const d = st.draft;
  if (!d.pid && !String(d.name || '').trim()) return toast(t('appt.needName'), 'bad');
  if (!d.time) return toast(t('appt.needTime'), 'bad');
  d.id ||= uid('a');
  if (d.pid) d.name = M.patient(d.pid)?.name || d.name;
  await S.save('appt', { ...d });
  st.ui.day = d.date;
  closeSheet(); toast(t('msg.saved'));
};
A.deleteAppt = () => ask(t('appt.deleteQ'), async () => { await S.remove('appt', st.draft.id); render(); });

// ---------- Hoja: mensaje prellenado ----------
SHEETS.message = ({ pid, sid, kind }) => {
  const p = M.patient(pid);
  const lang = st.ui.msgLang || getLang();
  const text = st.ui.msgText ?? buildMessage(p, S.data.session[sid], kind, lang);
  st.ui.msgText = text;
  const phone = digits(p.cell || p.phone);
  return { html: html`<div class="sheet-h"><button class="link" data-act="closeSheet">${t('btn.close')}</button><b>${t('msg.to', { name: p.name })}</b><span></span></div>
  <div class="sheet-body">
    <div class="seg small"><button class="${lang === 'en' ? 'on' : ''}" data-act="msgLang" data-l="en">English</button><button class="${lang === 'es' ? 'on' : ''}" data-act="msgLang" data-l="es">Español</button></div>
    <textarea class="msg-text" rows="6" data-live="msgEdit">${text}</textarea>
    <div class="share-grid">
      <button class="btn primary" data-act="sendVia" data-via="sms" ${phone ? '' : 'disabled'}>${icon('msg')} SMS</button>
      <button class="btn primary" data-act="sendVia" data-via="wa" ${phone ? '' : 'disabled'}>WhatsApp</button>
      <button class="btn primary" data-act="sendVia" data-via="email" ${p.email ? '' : 'disabled'}>Email</button>
      <button class="btn ghost" data-act="sendVia" data-via="copy">${t('btn.copy')}</button>
    </div>
    ${!phone && !p.email ? html`<p class="muted">${t('msg.noContact')}</p>` : ''}
    ${sid && kind ? html`<button class="btn ghost full" data-act="fuDone" data-sid="${sid}" data-kind="${kind}">${icon('check')} ${t('fu.markDone')}</button>` : ''}
    <p class="foot">${t('msg.foot')}</p>
  </div>` };
};
export function buildMessage(p, s, kind, lang) {
  const tpl = TEMPLATES[{ check: 'check', touchup: 'touchup', review: 'review', sculptra: 'sculptra' }[kind] || 'check'];
  const url = settings().clinic.bookingUrl;
  const booking = url ? (lang === 'es' ? TEMPLATES.bookingEs : TEMPLATES.bookingEn).replace('{url}', url) : '';
  const service = s ? (s.type === 'tox' ? 'Dysport' : s.type === 'sculptra' ? 'Sculptra' : lang === 'es' ? 'relleno' : 'filler') : '';
  const months = s ? Math.max(1, Math.round(daysBetween(s.date, todayISO()) / 30.4)) : '';
  return (tpl[lang] || tpl.en)
    .replace('{first}', firstName(p.name)).replace('{service}', service).replace('{months}', months)
    .replace('{next}', s?.series ? s.series.n + 1 : '').replace('{of}', s?.series?.of || '').replace('{booking}', booking);
}
A.message = (el) => {
  st.ui.msgText = null; st.ui.msgLang = null;
  openSheet('message', { pid: el.dataset.pid, sid: el.dataset.sid, kind: el.dataset.kind });
};
A.msgLang = (el) => { st.ui.msgLang = el.dataset.l; st.ui.msgText = null; render(); };
A.msgEdit = (el) => { st.ui.msgText = el.value; };
A.sendVia = async (el) => {
  const { pid } = st.sheet.params;
  const p = M.patient(pid);
  const text = st.ui.msgText || '';
  const phone = digits(p.cell || p.phone);
  const e164 = phone.length === 10 ? '1' + phone : phone;
  const via = el.dataset.via;
  if (via === 'copy') {
    try { await navigator.clipboard.writeText(text); toast(t('msg.copied')); } catch { toast(t('msg.copyFail'), 'bad'); }
    return;
  }
  const href = via === 'sms' ? `sms:+${e164}&body=${encodeURIComponent(text)}`
    : via === 'wa' ? `https://wa.me/${e164}?text=${encodeURIComponent(text)}`
      : `mailto:${p.email}?subject=${encodeURIComponent(settings().clinic.name)}&body=${encodeURIComponent(text)}`;
  window.location.href = href;
};
