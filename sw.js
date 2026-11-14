// Service worker: guarda o app inteiro no aparelho para abrir rápido e funcionar sem internet.
// Ao mudar qualquer arquivo do app, aumente VERSAO para o celular baixar a versão nova.
const VERSAO = 'v1';
const CACHE = `treinos-${VERSAO}`;
const ARQUIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/store.js',
  'js/ui.js',
  'js/views.js',
  'js/treino.js',
  'js/video.js',
  'js/rest.js',
  'js/exemplo.js',
  'fonts/bricolage-grotesque-latin-wght-normal.woff2',
  'fonts/figtree-latin-wght-normal.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Só o próprio app entra no cache. Vídeos e miniaturas do YouTube passam direto.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      }).catch(() => caches.match('index.html'));
    })
  );
});
