// Consentimiento en "modo paciente": iniciales por sección, autorización de fotos, firma.
// Luego el staff recupera el iPad con su código y firma como proveedor. Se guarda una copia del texto firmado.
import * as S from '../store.js';
import * as M from '../model.js';
import { CONSENTS, PHOTO_RELEASE, LEGAL_VERSION } from '../content.js';
import { html, todayISO } from '../util.js';
import { t, getLang } from '../i18n.js';
import { SCREENS, A, st, go, back, render, toast, navbar, fmtDate, icon, settings } from '../core.js';
import { verifyPin } from './auth.js';

A.startConsent = (el) => {
  const kind = el.dataset.kind, pid = el.dataset.pid;
  if (!CONSENTS[kind]) return toast(t('doc.sculptraPending'), 'bad');
  st.ui.consent = { pid, kind, stage: 'patient', release: '', missing: [] };
  st.ui.consentImgs = null;
  go('consent', { pid, kind });
};

SCREENS.consent = ({ pid, kind }) => {
  const c = CONSENTS[kind], p = M.patient(pid), cs = st.ui.consent || {};
  if (cs.stage === 'provider') return providerStage(c, p, cs);
  const miss = new Set(cs.missing || []);
  const approved = !!settings().legalApproved;
  return { html: html`<header class="nav patient-mode">
      <div class="nav-l"><button class="nav-back" data-act="exitPatientMode">${icon('lock')}<span>${t('cons.exit')}</span></button></div>
      <div class="nav-title">${settings().clinic.name}</div><div class="nav-r"><span class="pill">${p.name}</span></div>
    </header>
  <main class="page narrow consent">
    ${approved ? '' : html`<p class="banner amber">${icon('alert')}<span>${t('legal.pendingShort')}</span></p>`}
    <p class="eyebrow">${t('cons.eyebrow')}</p>
    <h1 class="serif">${c.title}</h1>
    <p class="muted">${t('cons.howto')}</p>
    <dl class="kv compact">
      <dt>${t('f.name')}</dt><dd>${p.name}</dd><dt>${t('f.dob')}</dt><dd>${p.dob ? fmtDate(p.dob) : '—'}</dd>
      <dt>${t('f.phone')}</dt><dd>${p.cell || p.phone || '—'}</dd><dt>${t('f.email')}</dt><dd>${p.email || '—'}</dd>
    </dl>
    <p class="legal">${c.intro}</p>
    ${c.sections.map((sec, i) => html`<section class="card legal-sec ${miss.has('i' + i) ? 'missing' : ''}">
      <h3>${sec.title}</h3><p class="legal">${sec.text}</p>
      ${sec.initial ? html`<div class="initial-row"><span>${t('cons.initial')}</span>
        <div class="pad-wrap small"><canvas data-pad="i${i}" class="pad initials"></canvas><button class="link" data-act="clearPad" data-pad="i${i}">${t('btn.clear')}</button></div></div>` : ''}
    </section>`)}
    <section class="card legal-sec ${miss.has('release') ? 'missing' : ''}">
      <h3>${PHOTO_RELEASE.title}</h3><p class="legal">${PHOTO_RELEASE.text}</p>
      <div class="radios">${PHOTO_RELEASE.options.map((o) => html`<button class="radio ${cs.release === o.v ? 'on' : ''}" data-act="setRelease" data-v="${o.v}"><i></i>${o.en}${getLang() === 'es' ? html`<small>${o.es}</small>` : ''}</button>`)}</div>
    </section>
    <section class="card legal-sec ${miss.has('sig') ? 'missing' : ''}">
      <p class="legal">${c.statement}</p>
      <div class="pad-wrap"><canvas data-pad="sig" class="pad"></canvas><button class="link" data-act="clearPad" data-pad="sig">${t('btn.clear')}</button></div>
      <div class="sig-meta"><span>${t('cons.printed')}: <b>${p.name}</b></span><span>${t('cons.date')}: <b>${fmtDate(todayISO())}</b></span></div>
    </section>
    ${miss.size ? html`<p class="banner red">${icon('alert')}<span>${t('cons.missing')}</span></p>` : ''}
    <button class="btn primary full big" data-act="consentSubmit">${t('cons.submit')}</button>
  </main>`, after: restoreConsentImgs };
};
// Si se re-renderiza (p. ej. al elegir la opción de fotos), los trazos se perderían: se guardan antes y se repintan.
async function snapshotPads() {
  const out = {};
  for (const [k, pad] of Object.entries(st.pads)) if (!pad.isEmpty()) out[k] = pad.c.toDataURL('image/png');
  st.ui.consentImgs = out;
}
function restoreConsentImgs() {
  const imgs = st.ui.consentImgs || {};
  for (const [k, url] of Object.entries(imgs)) {
    const pad = st.pads[k];
    if (!pad) continue;
    const im = new Image();
    im.onload = () => {
      const r = pad.c.getBoundingClientRect();
      pad.ctx.drawImage(im, 0, 0, r.width, r.height);
      pad.strokes = 1;
      pad.c.closest('.pad-wrap')?.classList.add('signed');
    };
    im.src = url;
  }
}
A.setRelease = async (el) => {
  await snapshotPads();
  const cs = st.ui.consent;
  cs.release = el.dataset.v;
  cs.missing = (cs.missing || []).filter((k) => k !== 'release' && !st.ui.consentImgs[k]);
  const y = window.scrollY; render(); window.scrollTo(0, y);
};
A.exitPatientMode = async () => { await snapshotPads(); verifyPin(() => { st.ui.consent = null; st.ui.consentImgs = null; back(); }, t('cons.exitTitle')); };

A.consentSubmit = async () => {
  const { kind } = st.route.params;
  const c = CONSENTS[kind], cs = st.ui.consent;
  const missing = [];
  c.sections.forEach((sec, i) => { if (sec.initial && (!st.pads['i' + i] || st.pads['i' + i].isEmpty())) missing.push('i' + i); });
  if (!cs.release) missing.push('release');
  if (!st.pads.sig || st.pads.sig.isEmpty()) missing.push('sig');
  if (missing.length) {
    await snapshotPads();
    cs.missing = missing;
    render();
    document.querySelector('.missing')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  // Guardar las imágenes ya (los paneles se destruyen al cambiar de pantalla).
  const imgs = {};
  for (const [k, pad] of Object.entries(st.pads)) if (!pad.isEmpty()) imgs[k] = await S.putImage(await pad.toBytes(), 'image/png');
  cs.imgs = imgs;
  cs.patientSignedAt = new Date().toISOString();
  st.ui.consentImgs = null;
  // El paciente devuelve el iPad: el staff lo desbloquea con su código.
  verifyPin(() => { cs.stage = 'provider'; render(); window.scrollTo(0, 0); }, t('cons.handBack'));
};

function providerStage(c, p, cs) {
  return { html: html`${navbar(t('cons.providerTitle'), { backBtn: false })}
  <main class="page narrow">
    <p class="banner mint">${icon('check')}<span>${t('cons.patientDone', { name: p.name })}</span></p>
    <section class="card legal-sec">
      <p class="legal">${c.provider}</p>
      <label class="field"><span>${t('cons.provider')}</span><select id="provName">${settings().providers.map((n) => html`<option>${n}</option>`)}</select></label>
      <div class="pad-wrap"><canvas data-pad="prov" class="pad"></canvas><button class="link" data-act="clearPad" data-pad="prov">${t('btn.clear')}</button></div>
    </section>
    <button class="btn primary full big" data-act="consentFinish">${t('cons.finish')}</button>
  </main>` };
}
A.consentFinish = async () => {
  const { pid, kind } = st.route.params;
  const c = CONSENTS[kind], cs = st.ui.consent;
  if (!st.pads.prov || st.pads.prov.isEmpty()) return toast(t('cons.needProvSig'), 'bad');
  const provImg = await S.putImage(await st.pads.prov.toBytes(), 'image/png');
  const p = M.patient(pid);
  const doc = {
    pid, kind, version: LEGAL_VERSION, approvedText: !!settings().legalApproved,
    title: c.title, intro: c.intro, statement: c.statement, providerText: c.provider,
    sections: c.sections.map((sec, i) => ({ title: sec.title, text: sec.text, initialImg: cs.imgs['i' + i] || null })),
    release: cs.release, releaseText: PHOTO_RELEASE.text,
    printedName: p.name, patientSig: cs.imgs.sig, patientSignedAt: cs.patientSignedAt,
    provider: document.getElementById('provName').value, providerSig: provImg,
    signedAt: new Date().toISOString(), device: navigator.userAgent,
  };
  const saved = await S.save('doc', doc);
  p.photoRelease = cs.release;
  await S.save('patient', p);
  st.ui.consent = null;
  toast(t('cons.saved'));
  st.stack.pop(); // quita la pantalla de consentimiento del historial
  go('doc', { id: saved.id }, { replace: true });
};

// ---------- Documento firmado (imprimible) ----------
SCREENS.doc = ({ id }) => {
  const d = S.data.doc[id];
  if (!d) return { html: html`${navbar('')}<main class="page"><div class="empty">—</div></main>` };
  const p = M.patient(d.pid);
  const rel = PHOTO_RELEASE.options.find((o) => o.v === d.release);
  return { html: html`${navbar(t('doc.consent.' + d.kind), { right: html`<button class="link" data-act="print">${icon('print')}</button>` })}
  <main class="page narrow doc" id="print-area">
    <p class="eyebrow">${settings().clinic.name} · ${settings().clinic.address}</p>
    <h1 class="serif">${d.title}</h1>
    ${d.approvedText ? '' : html`<p class="banner amber">${icon('alert')}<span>${t('doc.draftText')}</span></p>`}
    <dl class="kv compact"><dt>${t('f.name')}</dt><dd>${p?.name || d.printedName}</dd><dt>${t('f.dob')}</dt><dd>${p?.dob ? fmtDate(p.dob) : '—'}</dd>
      <dt>${t('f.address')}</dt><dd>${p?.address || '—'}</dd><dt>${t('f.phone')}</dt><dd>${p?.cell || p?.phone || '—'}</dd></dl>
    <p class="legal">${d.intro}</p>
    ${d.sections.map((sec) => html`<div class="doc-sec"><h3>${sec.title}</h3><p class="legal">${sec.text}</p>
      ${sec.initialImg ? html`<p class="small">${t('cons.initial')}: <img class="sig-mini" data-img="${sec.initialImg}" alt=""></p>` : ''}</div>`)}
    <div class="doc-sec"><h3>${PHOTO_RELEASE.title}</h3><p class="legal">${d.releaseText}</p><p><b>☑ ${rel ? rel.en : '—'}</b></p></div>
    <p class="legal">${d.statement}</p>
    <div class="sig-block"><img data-img="${d.patientSig}" alt=""><span>${d.printedName} · ${new Date(d.patientSignedAt).toLocaleString('en-US')}</span></div>
    <p class="legal">${d.providerText}</p>
    <div class="sig-block"><img data-img="${d.providerSig}" alt=""><span>${d.provider} · ${new Date(d.signedAt).toLocaleString('en-US')}</span></div>
    <p class="muted small">${t('doc.footer', { v: d.version })}</p>
  </main>` };
};
