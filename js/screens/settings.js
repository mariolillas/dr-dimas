// Ajustes, respaldo, textos legales y reporte mensual.
import * as S from '../store.js';
import * as M from '../model.js';
import { LEGAL_REVIEW, LEGAL_VERSION } from '../content.js';
import { html, money, num, todayISO, uid } from '../util.js';
import { t, getLang, setLang } from '../i18n.js';
import { SCREENS, A, st, go, back, render, toast, ask, navbar, fmtDate, icon, settings, pickJSON, tab } from '../core.js';
import { lockNow } from './auth.js';
import { header } from './home.js';

export const APP_VERSION = '0.1.4';

SCREENS.settings = () => {
  const s = settings();
  return { tabs: true, html: html`${header()}<main class="page narrow">
    <h1 class="large serif">${t('tab.settings')}</h1>
    <div class="list">
      <button class="row-item" data-act="go" data-to="settingsEdit">${icon('gear')}<span class="grow"><b>${t('set.clinic')}</b><small>${t('set.clinicSub')}</small></span>${icon('chev-r', 'chev')}</button>
      <button class="row-item" data-act="go" data-to="report">${icon('chart')}<span class="grow"><b>${t('set.report')}</b><small>${t('set.reportSub')}</small></span>${icon('chev-r', 'chev')}</button>
      <button class="row-item" data-act="go" data-to="backup">${icon('cloud')}<span class="grow"><b>${t('set.backup')}</b><small>${s.lastBackup ? t('set.lastBackup', { d: fmtDate(s.lastBackup.slice(0, 10)) }) : t('set.noBackup')}</small></span>${icon('chev-r', 'chev')}</button>
      <button class="row-item" data-act="go" data-to="legal">${icon('doc')}<span class="grow"><b>${t('set.legal')}</b><small>${s.legalApproved ? t('set.legalOk', { d: fmtDate(s.legalApproved.date) }) : t('set.legalPending')}</small></span>${icon('chev-r', 'chev')}</button>
    </div>
    ${S.flags.test ? html`<section class="card test-card">
      <h3>${icon('alert')} ${t('test.title')}</h3>
      <p class="muted">${t('test.explain')}</p>
      <button class="btn primary full" data-act="finishTesting">${t('test.finish')}</button>
    </section>` : html`<h4 class="group-h">${t('set.security')}</h4>
    <div class="group">
      <label class="field"><span>${t('set.autolock')}</span><select data-live="setAutoLock">${[2, 5, 10, 15, 30].map((m) => html`<option value="${m}" ${s.autoLockMin === m ? 'selected' : ''}>${m} min</option>`)}</select></label>
      <label class="field"><span>${t('set.lang')}</span><select data-live="setLangSel"><option value="en" ${getLang() === 'en' ? 'selected' : ''}>English</option><option value="es" ${getLang() === 'es' ? 'selected' : ''}>Español</option></select></label>
    </div>
    <div class="list">
      <button class="row-item" data-act="changePin">${icon('lock')}<span class="grow"><b>${t('set.changePin')}</b></span>${icon('chev-r', 'chev')}</button>
      <button class="row-item" data-act="newRecovery">${icon('shield')}<span class="grow"><b>${t('set.newRecovery')}</b><small>${t('set.newRecoverySub')}</small></span>${icon('chev-r', 'chev')}</button>
      <button class="row-item" data-act="lockNow">${icon('lock')}<span class="grow"><b>${t('btn.lock')}</b></span></button>
    </div>`}
    ${S.flags.test ? html`<div class="group"><label class="field"><span>${t('set.lang')}</span><select data-live="setLangSel"><option value="en" ${getLang() === 'en' ? 'selected' : ''}>English</option><option value="es" ${getLang() === 'es' ? 'selected' : ''}>Español</option></select></label></div>` : ''}
    ${M.patients().some(M.isDemo) ? html`<button class="btn ghost full" data-act="removeDemo">${icon('trash')} ${t('set.removeDemo')}</button>` : html`<button class="btn ghost full" data-act="addDemo">${t('set.addDemo')}</button>`}
    <h4 class="group-h">${t('set.about')}</h4>
    <div class="group about">
      <p>Dr. Dimas Beauty Services · v${APP_VERSION} · ${t('set.legalVer')} ${LEGAL_VERSION}</p>
      <p class="muted small">${t('set.aboutText')}</p>
    </div>
    <button class="btn danger-ghost full" data-act="wipeAll">${icon('trash')} ${t('set.wipe')}</button>
  </main>` };
};
A.finishTesting = () => ask(t('test.finishQ'), () => ask(t('test.finishQ2'), async () => {
  try { localStorage.setItem('drdimas.realSetup', '1'); } catch {}
  await S.wipeEverything();
  location.reload();
}, { yes: t('test.finishYes'), danger: true }), { yes: t('btn.continue') });
A.setAutoLock = async (el) => { settings().autoLockMin = Number(el.value); await S.save('settings', settings()); toast(t('msg.saved')); };
A.setLangSel = async (el) => { setLang(el.value); settings().lang = el.value; await S.save('settings', settings()); render(); };
A.newRecovery = () => ask(t('set.newRecoveryQ'), async () => {
  st.ui.newRecovery = await S.regenerateRecovery();
  go('recoveryShow');
});
SCREENS.recoveryShow = () => ({ html: html`${navbar(t('rec.title'))}
  <main class="page narrow">
    <p class="muted">${t('rec.explainNew')}</p>
    <div class="recovery-code dark-code" id="print-area">${st.ui.newRecovery || ''}</div>
    <div class="row gap"><button class="btn ghost" data-act="print">${icon('print')} ${t('btn.print')}</button>
      <button class="btn primary" data-act="recoveryDone">${t('btn.done')}</button></div>
  </main>` });
A.recoveryDone = () => { st.ui.newRecovery = null; back(); };

A.removeDemo = () => ask(t('set.removeDemoQ'), async () => {
  const ids = new Set(M.patients().filter(M.isDemo).map((p) => p.id));
  for (const kind of ['session', 'doc', 'appt']) for (const o of Object.values(S.data[kind])) if (o.demo || ids.has(o.pid)) await S.remove(kind, o.id);
  for (const id of ids) await S.remove('patient', id);
  toast(t('msg.deleted')); render();
}, { yes: t('btn.delete'), danger: true });
A.addDemo = async () => { const { seedDemo } = await import('../demo.js'); await seedDemo(); toast(t('msg.saved')); render(); };
A.wipeAll = () => ask(t('set.wipeQ'), () => ask(t('set.wipeQ2'), async () => {
  await S.wipeEverything();
  location.reload();
}, { yes: t('set.wipeYes'), danger: true }), { yes: t('btn.continue'), danger: true });

// ---------- Clínica, precios, promos, proveedores, seguimiento ----------
SCREENS.settingsEdit = () => {
  if (!st.draft || st.draft.id !== 'settings') st.draft = structuredClone(settings());
  const d = st.draft;
  return { html: html`${navbar(t('set.clinic'), { right: html`<button class="link strong" data-act="saveSettings">${t('btn.save')}</button>` })}
  <main class="page narrow">
    <h4 class="group-h">${t('set.clinicInfo')}</h4>
    <div class="group">
      <label class="field"><span>${t('set.cName')}</span><input data-bind="clinic.name" value="${d.clinic.name}"></label>
      <label class="field"><span>${t('f.address')}</span><input data-bind="clinic.address" value="${d.clinic.address}"></label>
      <label class="field"><span>${t('f.phone')}</span><input type="tel" data-bind="clinic.phone" value="${d.clinic.phone}" placeholder="${t('set.phonePending')}"></label>
      <label class="field"><span>${t('set.booking')}</span><input type="url" data-bind="clinic.bookingUrl" value="${d.clinic.bookingUrl}" placeholder="https://www.vagaro.com/..." autocapitalize="off"></label>
    </div>
    <h4 class="group-h">${t('set.prices')}</h4>
    <div class="group">${['dysportUnit', 'lipFlip', 'fillerSyringe', 'lipPlump', 'sculptraVial'].map((k) => html`
      <label class="field"><span>${t('price.k.' + k)}</span><input type="number" min="0" step="0.5" data-bind="prices.${k}" value="${d.prices[k]}"></label>`)}</div>
    <h4 class="group-h">${t('set.promos')}</h4>
    <div class="group">${(d.promos || []).map((p, i) => html`<div class="promo-row">
      <input data-bind="promos.${i}.name" value="${p.name}" placeholder="${t('set.promoName')}">
      <input type="number" min="0" data-bind="promos.${i}.amount" value="${p.amount}" class="w90" aria-label="$">
      <input type="date" data-bind="promos.${i}.until" value="${p.until || ''}">
      <label class="switch"><input type="checkbox" data-bind="promos.${i}.active" ${p.active ? 'checked' : ''}><span></span></label>
      <button class="link danger" data-act="delPromo" data-i="${i}">×</button></div>`)}
      <button class="link" data-act="addPromo">${icon('plus')} ${t('set.addPromo')}</button>
      <p class="muted small">${t('set.promoNote')}</p>
    </div>
    <h4 class="group-h">${t('set.providers')}</h4>
    <div class="group">${d.providers.map((p, i) => html`<div class="promo-row"><input data-bind="providers.${i}" value="${p}"><button class="link danger" data-act="delProvider" data-i="${i}">×</button></div>`)}
      <button class="link" data-act="addProvider">${icon('plus')} ${t('set.addProvider')}</button></div>
    <h4 class="group-h">${t('set.followup')}</h4>
    <div class="group">${['checkDays', 'toxDays', 'fillerDays', 'sculptraDays'].map((k) => html`
      <label class="field"><span>${t('set.fu.' + k)}</span><input type="number" min="1" data-bind="followup.${k}" value="${d.followup[k]}" class="w90"></label>`)}</div>
    <button class="btn primary full" data-act="saveSettings">${t('btn.save')}</button>
  </main>` };
};
A.addPromo = () => { st.draft.promos.push({ id: uid('pr'), name: '', amount: 0, until: '', active: true }); render(); };
A.delPromo = (el) => { st.draft.promos.splice(Number(el.dataset.i), 1); render(); };
A.addProvider = () => { st.draft.providers.push(''); render(); };
A.delProvider = (el) => { st.draft.providers.splice(Number(el.dataset.i), 1); render(); };
A.saveSettings = async () => {
  const d = st.draft;
  d.providers = d.providers.map((x) => String(x).trim()).filter(Boolean);
  d.promos = d.promos.filter((p) => String(p.name).trim());
  await S.save('settings', d);
  st.draft = null; toast(t('msg.saved')); back();
};

// ---------- Respaldo ----------
SCREENS.backup = () => {
  const s = settings();
  return { html: html`${navbar(t('set.backup'))}
  <main class="page narrow">
    <section class="card">
      <h3>${icon('shield')} ${t('bk.howTitle')}</h3>
      <p class="muted">${t('bk.how')}</p>
      <p><b>${s.lastBackup ? t('set.lastBackup', { d: new Date(s.lastBackup).toLocaleString(getLang() === 'es' ? 'es-MX' : 'en-US') }) : t('set.noBackup')}</b></p>
      <button class="btn primary full" data-act="exportBackup">${icon('share')} ${t('bk.export')}</button>
      <p class="muted small">${t('bk.exportTip')}</p>
    </section>
    <section class="card">
      <h3>${t('bk.restoreTitle')}</h3>
      <p class="muted">${t('bk.restore')}</p>
      <button class="btn ghost full" data-act="importBackup">${t('bk.import')}</button>
    </section>
    <section class="card">
      <h3>${icon('cloud')} ${t('bk.cloudTitle')}</h3>
      <p class="muted">${t('bk.cloud')}</p>
    </section>
  </main>` };
};
A.exportBackup = async () => {
  const blob = await S.exportBackup();
  const name = `drdimas-backup-${todayISO()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); } catch (e) { if (e.name !== 'AbortError') throw e; }
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  toast(t('bk.done'));
  render();
};
A.importBackup = () => pickJSON((text) => ask(t('bk.importQ'), async () => {
  await S.importBackup(text);
  lockNow(null, t('bk.imported'));
}, { yes: t('bk.importYes'), danger: true }));

// ---------- Textos legales ----------
SCREENS.legal = () => {
  const s = settings();
  return { html: html`${navbar(t('set.legal'))}
  <main class="page narrow">
    <p class="muted">${t('legal.explain')}</p>
    <section class="card"><h3>${t('legal.changed')}</h3><ul class="bullets">${LEGAL_REVIEW.changed.map((x) => html`<li>${x}</li>`)}</ul></section>
    <section class="card"><h3>${t('legal.flagged')}</h3><ul class="bullets warn">${LEGAL_REVIEW.flagged.map((x) => html`<li>${x}</li>`)}</ul></section>
    <section class="card">
      ${s.legalApproved ? html`<p class="banner mint">${icon('check')}<span>${t('set.legalOk', { d: fmtDate(s.legalApproved.date) })} · ${s.legalApproved.by}</span></p>
        <button class="btn ghost full" data-act="legalRevoke">${t('legal.revoke')}</button>`
        : html`<p>${t('legal.approveText', { v: LEGAL_VERSION })}</p>
        <label class="field"><span>${t('legal.by')}</span><input id="legalBy" value="${s.providers[0] || ''}"></label>
        <button class="btn primary full" data-act="legalApprove">${t('legal.approve')}</button>`}
    </section>
  </main>` };
};
A.legalApprove = async () => {
  settings().legalApproved = { by: document.getElementById('legalBy').value || '—', date: todayISO(), version: LEGAL_VERSION };
  await S.save('settings', settings()); toast(t('msg.saved')); render();
};
A.legalRevoke = async () => { settings().legalApproved = null; await S.save('settings', settings()); render(); };

// ---------- Reporte mensual ----------
SCREENS.report = () => {
  const ym = st.ui.ym || todayISO().slice(0, 7);
  const r = M.monthReport(ym);
  const [y, m] = ym.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString(getLang() === 'es' ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' });
  const rows = (obj, fmt) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => html`<tr><td>${fmt(k)}</td><td class="num">${money(v)}</td></tr>`);
  return { html: html`${navbar(t('set.report'))}
  <main class="page narrow">
    <div class="day-nav"><button class="icon-btn" data-act="ymShift" data-n="-1">${icon('chev-l')}</button>
      <h1 class="large serif">${label}</h1><button class="icon-btn" data-act="ymShift" data-n="1">${icon('chev-r')}</button></div>
    <div class="stats">
      <div class="stat"><small>${t('rep.paid')}</small><b>${money(r.paid)}</b></div>
      <div class="stat"><small>${t('rep.pending')}</small><b>${money(r.pending)}</b></div>
      <div class="stat"><small>${t('rep.sessions')}</small><b>${r.count}</b></div>
      <div class="stat"><small>${t('rep.volume')}</small><b>${num(r.units)}u · ${num(r.syringes)} syr · ${num(r.vials)} vials</b></div>
    </div>
    <section class="card"><h3>${t('rep.byService')}</h3><table class="sum">${rows(r.byService, (k) => t('svc.' + k))}</table></section>
    <section class="card"><h3>${t('rep.byMethod')}</h3><table class="sum">${rows(r.byMethod, (k) => t('pay.' + k))}</table></section>
    <section class="card"><h3>${t('rep.byProvider')}</h3><table class="sum">${rows(r.byProvider, (k) => k)}</table></section>
    <p class="muted small">${t('rep.note')}</p>
  </main>` };
};
A.ymShift = (el) => {
  const [y, m] = (st.ui.ym || todayISO().slice(0, 7)).split('-').map(Number);
  const d = new Date(y, m - 1 + Number(el.dataset.n), 1);
  st.ui.ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  render();
};
