// Configuración inicial, bloqueo, recuperación y cambio de código.
import * as S from '../store.js';
import { html } from '../util.js';
import { t, setLang, getLang } from '../i18n.js';
import { SCREENS, SHEETS, A, st, go, tab, render, keypad, pinFail, toast, openSheet, closeSheet, icon, pickJSON, showError, ask } from '../core.js';
import { seedDemo } from '../demo.js';
import { TEST_MODE, TEST_PIN } from '../config.js';

const logo = () => html`<img class="logo-big" src="icons/logo.png" alt="Dr. Dimas Beauty Services">`;

// ---------- Configuración inicial ----------
SCREENS.setup = () => {
  const step = st.ui.setupStep || 'welcome';
  if (step === 'welcome') {
    return { dark: true, html: html`<main class="auth">
      ${logo()}
      <h1 class="serif">${t('setup.welcome')}</h1>
      <p class="muted-l">${t('setup.intro')}</p>
      <ul class="auth-list">
        <li>${icon('lock')} ${t('setup.p1')}</li>
        <li>${icon('shield')} ${t('setup.p2')}</li>
        <li>${icon('cloud')} ${t('setup.p3')}</li>
      </ul>
      <div class="row gap center">
        <button class="btn ghost-l" data-act="langToggle">${getLang() === 'en' ? 'Español' : 'English'}</button>
        <button class="btn mint" data-act="setupStart">${t('setup.start')}</button>
      </div>
      <button class="link-l" data-act="restoreFirst">${t('setup.restore')}</button>
    </main>` };
  }
  if (step === 'pin1' || step === 'pin2') {
    st.ui.onPin = step === 'pin1'
      ? (pin) => { st.ui.firstPin = pin; st.ui.pin = ''; st.ui.setupStep = 'pin2'; render(); }
      : async (pin) => {
        if (pin !== st.ui.firstPin) { st.ui.setupStep = 'pin1'; return pinFail(t('pin.mismatch')); }
        st.ui.pin = ''; st.ui.busy = true; render();
        st.ui.recovery = await S.setup(pin);
        S.data.settings.lang = getLang();
        await S.save('settings', S.data.settings);
        st.ui.busy = false; st.ui.setupStep = 'recovery'; render();
      };
    return { dark: true, html: html`<main class="auth">${logo()}${st.ui.busy ? html`<p class="muted-l">${t('setup.creating')}</p>`
      : keypad({ title: t(step === 'pin1' ? 'pin.choose' : 'pin.confirm'), sub: t('pin.chooseSub'), err: st.ui.pinErr })}</main>` };
  }
  if (step === 'recovery') {
    return { dark: true, html: html`<main class="auth">
      <h1 class="serif">${t('rec.title')}</h1>
      <p class="muted-l">${t('rec.explain')}</p>
      <div class="recovery-code" id="print-area">${st.ui.recovery}</div>
      <p class="muted-l small">${t('rec.where')}</p>
      <div class="row gap center">
        <button class="btn ghost-l" data-act="printRecovery">${icon('print')} ${t('btn.print')}</button>
        <button class="btn ghost-l" data-act="copyRecovery">${t('btn.copy')}</button>
      </div>
      <label class="check-l"><input type="checkbox" data-live="recSaved" ${st.ui.recSaved ? 'checked' : ''}> ${t('rec.saved')}</label>
      <button class="btn mint" data-act="setupDemo" ${st.ui.recSaved ? '' : 'disabled'}>${t('btn.continue')}</button>
    </main>` };
  }
  // step demo
  return { dark: true, html: html`<main class="auth">
    ${logo()}
    <h1 class="serif">${t('demo.title')}</h1>
    <p class="muted-l">${t('demo.explain')}</p>
    <div class="col gap">
      <button class="btn mint" data-act="setupFinish" data-demo="1">${t('demo.yes')}</button>
      <button class="btn ghost-l" data-act="setupFinish" data-demo="0">${t('demo.no')}</button>
    </div>
  </main>` };
};
A.setupStart = () => { st.ui.setupStep = 'pin1'; st.ui.pin = ''; render(); };
A.restoreFirst = () => pickJSON(async (text) => {
  try { await S.importBackup(text); } catch (e) { return toast(t('setup.restoreBad'), 'bad'); }
  st.ui.lockNote = t('bk.imported');
  go('lock', {}, { push: false });
});
A.langToggle = () => { setLang(getLang() === 'en' ? 'es' : 'en'); render(); };
A.recSaved = (el) => { st.ui.recSaved = el.checked; render(); };
A.printRecovery = () => window.print();
A.copyRecovery = async () => {
  try { await navigator.clipboard.writeText(st.ui.recovery); toast(t('msg.copied')); } catch { toast(t('msg.copyFail'), 'bad'); }
};
A.setupDemo = () => { st.ui.setupStep = 'demo'; st.ui.recovery = null; render(); };
A.setupFinish = async (el) => {
  if (el.dataset.demo === '1') await seedDemo();
  st.ui.setupStep = null;
  tab('today');
};

// ---------- Bloqueo ----------
SCREENS.lock = () => {
  st.ui.onPin = async (pin) => {
    st.ui.busy = true; render();
    try {
      await S.unlock(pin);
      st.ui.busy = false; st.ui.pin = '';
      setLang(S.data.settings.lang || 'en');
      const resume = st.ui.resume;
      st.ui.resume = null;
      if (resume) { st.route = resume; render(); } else tab('today');
    } catch {
      st.ui.busy = false;
      pinFail(t('pin.wrong'));
    }
  };
  return { dark: true, html: html`<main class="auth">
    ${logo()}
    ${st.ui.busy ? html`<p class="muted-l">${t('lock.opening')}</p>` : keypad({ title: t('lock.title'), err: st.ui.pinErr })}
    <button class="link-l" data-act="goRecover">${t('lock.forgot')}</button>
    ${st.ui.lockNote ? html`<p class="muted-l small">${st.ui.lockNote}</p>` : ''}
    ${TEST_MODE && localStorage.getItem('drdimas.realSetup') !== '1' ? html`<button class="link-l" data-act="resetToTest">${t('test.reset')}</button>` : ''}
  </main>` };
};
A.resetToTest = () => ask(t('test.resetQ'), async () => { await S.wipeEverything(); location.reload(); }, { yes: t('test.resetYes'), danger: true });
A.goRecover = () => { st.ui.recStep = 'code'; st.ui.pin = ''; go('recover', {}, { push: false }); };

// Bloquea y borra todo de memoria.
export function lockNow(resumeRoute = null, note = '') {
  S.lock();
  st.ui = { pin: '', view: 'front', selPt: null, lastAmt: {}, resume: resumeRoute, lockNote: note };
  st.stack = []; st.sheet = null; st.draft = null;
  st.route = { name: 'lock', params: {} };
  render();
}
A.lockNow = () => lockNow();

// ---------- Recuperación ----------
SCREENS.recover = () => {
  const step = st.ui.recStep || 'code';
  if (step === 'code') {
    return { dark: true, html: html`<main class="auth">
      <h1 class="serif">${t('recov.title')}</h1>
      <p class="muted-l">${t('recov.explain')}</p>
      <input class="input-l mono" id="recCode" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autocapitalize="characters" autocomplete="off" spellcheck="false">
      <p class="pin-err">${st.ui.pinErr || ''}</p>
      <div class="row gap center">
        <button class="btn ghost-l" data-act="recoverCancel">${t('btn.cancel')}</button>
        <button class="btn mint" data-act="recoverCode">${t('btn.continue')}</button>
      </div>
    </main>` };
  }
  st.ui.onPin = step === 'new1'
    ? (pin) => { st.ui.firstPin = pin; st.ui.pin = ''; st.ui.recStep = 'new2'; render(); }
    : async (pin) => {
      if (pin !== st.ui.firstPin) { st.ui.recStep = 'new1'; return pinFail(t('pin.mismatch')); }
      try {
        await S.unlockRecovery(st.ui.recCode, pin);
        st.ui.recCode = null; st.ui.pin = '';
        setLang(S.data.settings.lang || 'en');
        toast(t('recov.done'));
        tab('today');
      } catch { st.ui.recStep = 'code'; st.ui.pinErr = t('recov.bad'); st.ui.pin = ''; render(); }
    };
  return { dark: true, html: html`<main class="auth">${keypad({ title: t(step === 'new1' ? 'pin.chooseNew' : 'pin.confirm'), err: st.ui.pinErr })}</main>` };
};
A.recoverCode = () => {
  const v = document.getElementById('recCode').value.trim();
  if (v.replace(/[^0-9a-z]/gi, '').length < 20) { st.ui.pinErr = t('recov.bad'); return render(); }
  st.ui.recCode = v; st.ui.pinErr = ''; st.ui.recStep = 'new1'; st.ui.pin = ''; render();
};
A.recoverCancel = () => { st.ui.pinErr = ''; go('lock', {}, { push: false }); };

// ---------- Cambiar código (desde Ajustes) ----------
SHEETS.changePin = () => {
  const step = st.ui.chStep || 'cur';
  st.ui.onPin = async (pin) => {
    if (step === 'cur') {
      if (!(await S.checkPasscode(pin))) return pinFail(t('pin.wrong'));
      st.ui.chStep = 'new1';
    } else if (step === 'new1') { st.ui.firstPin = pin; st.ui.chStep = 'new2'; }
    else {
      if (pin !== st.ui.firstPin) { st.ui.chStep = 'new1'; return pinFail(t('pin.mismatch')); }
      await S.changePasscode(pin);
      st.ui.chStep = null; st.ui.pin = ''; closeSheet(); toast(t('pin.changed')); return;
    }
    st.ui.pin = ''; render();
  };
  const title = { cur: 'pin.current', new1: 'pin.chooseNew', new2: 'pin.confirm' }[step];
  return { html: html`<div class="sheet-body">${keypad({ title: t(title), err: st.ui.pinErr, light: true })}
    <button class="btn ghost full" data-act="closeSheet">${t('btn.cancel')}</button></div>` };
};
A.changePin = () => { st.ui.chStep = 'cur'; st.ui.pin = ''; st.ui.pinErr = ''; openSheet('changePin', { modal: true }); };

// Pide el código para salir del modo paciente (o cualquier acción protegida).
SHEETS.verifyPin = ({ title }) => {
  st.ui.onPin = async (pin) => {
    if (!(await S.checkPasscode(pin))) return pinFail(t('pin.wrong'));
    st.ui.pin = '';
    const fn = st.ui.afterVerify; st.ui.afterVerify = null;
    closeSheet();
    if (fn) await fn();
  };
  return { html: html`<div class="sheet-body">${keypad({ title: title || t('pin.staff'), sub: S.flags.test ? t('test.pinHint', { pin: TEST_PIN }) : '', err: st.ui.pinErr, light: true })}
    <button class="btn ghost full" data-act="closeSheet">${t('btn.cancel')}</button></div>` };
};
export function verifyPin(fn, title) {
  st.ui.afterVerify = fn; st.ui.pin = ''; st.ui.pinErr = '';
  openSheet('verifyPin', { title, modal: true });
}
