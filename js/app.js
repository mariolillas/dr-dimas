// Arranque: decide entre configuración inicial y bloqueo; auto-bloqueo por inactividad.
import * as S from './store.js';
import { st, go, render } from './core.js';
import { setLang } from './i18n.js';
import { lockNow } from './screens/auth.js';
import './screens/home.js';
import './screens/patient.js';
import './screens/session.js';
import './screens/consent.js';
import './screens/settings.js';

async function boot() {
  const saved = localStorage.getItem('drdimas.lang');
  if (saved) setLang(saved);
  if (await S.hasVault()) go('lock', {}, { push: false });
  else { st.ui.setupStep = 'welcome'; go('setup', {}, { push: false }); }
}

// Auto-bloqueo: inactividad o app en segundo plano por más de N minutos.
let lastActive = Date.now(), hiddenAt = null;
const mins = () => (S.data.settings?.autoLockMin || 5) * 60000;
const protectedRoute = () => st.route.name === 'consent'; // el paciente puede tardar leyendo
document.addEventListener('pointerdown', () => { lastActive = Date.now(); }, true);
document.addEventListener('keydown', () => { lastActive = Date.now(); }, true);
setInterval(() => {
  if (S.isUnlocked() && !protectedRoute() && Date.now() - lastActive > mins()) lockNow();
}, 15000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (hiddenAt && S.isUnlocked() && Date.now() - hiddenAt > mins()) lockNow();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
}

boot();
