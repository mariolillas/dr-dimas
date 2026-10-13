// Arranque: decide entre configuración inicial y bloqueo; auto-bloqueo por inactividad.
import * as S from './store.js';
import { st, go, render } from './core.js';
import { setLang } from './i18n.js';
import { lockNow } from './screens/auth.js';
import { TEST_MODE, TEST_PIN } from './config.js';
import { seedDemo } from './demo.js';
import { tab } from './core.js';
import './screens/home.js';
import './screens/patient.js';
import './screens/session.js';
import './screens/consent.js';
import './screens/settings.js';

async function boot() {
  const saved = localStorage.getItem('drdimas.lang');
  if (saved) setLang(saved);
  const has = await S.hasVault();
  const wantsTest = TEST_MODE && localStorage.getItem('drdimas.realSetup') !== '1';
  if (wantsTest && (!has || (await S.isTestVault()))) {
    if (!has) {
      await S.setup(TEST_PIN);
      await S.markTestVault();
      S.data.settings.lang = saved || 'en';
      await S.save('settings', S.data.settings);
      await seedDemo();
    } else await S.unlock(TEST_PIN);
    S.flags.test = true;
    setLang(S.data.settings.lang || saved || 'en');
    return tab('today');
  }
  if (has) go('lock', {}, { push: false });
  else { st.ui.setupStep = 'welcome'; go('setup', {}, { push: false }); }
}

// Auto-bloqueo: inactividad o app en segundo plano por más de N minutos.
let lastActive = Date.now(), hiddenAt = null;
const mins = () => (S.data.settings?.autoLockMin || 5) * 60000;
const protectedRoute = () => st.route.name === 'consent'; // el paciente puede tardar leyendo
document.addEventListener('pointerdown', () => { lastActive = Date.now(); }, true);
document.addEventListener('keydown', () => { lastActive = Date.now(); }, true);
setInterval(() => {
  if (S.isUnlocked() && !S.flags.test && !protectedRoute() && Date.now() - lastActive > mins()) lockNow();
}, 15000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (hiddenAt && S.isUnlocked() && !S.flags.test && Date.now() - hiddenAt > mins()) lockNow();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
}

boot();
