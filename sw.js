// Service worker: guarda la app (solo código e íconos) para que funcione sin internet.
// Los datos de pacientes NO pasan por aquí: viven cifrados en IndexedDB.
const VERSION = 'drdimas-v0.1.2';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './js/app.js', './js/core.js', './js/store.js', './js/db.js', './js/crypto.js', './js/util.js', './js/i18n.js',
  './js/model.js', './js/content.js', './js/face.js', './js/pad.js', './js/demo.js',
  './js/screens/auth.js', './js/screens/home.js', './js/screens/patient.js', './js/screens/session.js',
  './js/screens/consent.js', './js/screens/settings.js',
  './icons/logo.png', './icons/face-front.jpg', './icons/face-profile.jpg', './icons/mark.png', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Red primero (para recibir actualizaciones), caché si no hay internet.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
