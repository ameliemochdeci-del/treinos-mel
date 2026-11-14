// Service worker: guarda o app inteiro no aparelho para abrir rápido e funcionar sem internet.
// Ao mudar qualquer arquivo do app, aumente VERSAO para o celular baixar a versão nova.
const VERSAO = 'v2';
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
  'js/imagem.js',
  'js/rest.js',
  'js/exemplo.js',
  'fonts/bricolage-grotesque-latin-wght-normal.woff2',
  'fonts/figtree-latin-wght-normal.woff2',
  'planos/v3.json',
  'img/ref/abdutora-0.jpg',
  'img/ref/abdutora-1.jpg',
  'img/ref/bike-0.jpg',
  'img/ref/bike-1.jpg',
  'img/ref/cadeira-flexora-0.jpg',
  'img/ref/cadeira-flexora-1.jpg',
  'img/ref/coice-cabo-0.jpg',
  'img/ref/coice-cabo-1.jpg',
  'img/ref/crucifixo-inverso-0.jpg',
  'img/ref/crucifixo-inverso-1.jpg',
  'img/ref/dead-bug-0.jpg',
  'img/ref/dead-bug-1.jpg',
  'img/ref/desenvolvimento-0.jpg',
  'img/ref/desenvolvimento-1.jpg',
  'img/ref/elevacao-lateral-0.jpg',
  'img/ref/elevacao-lateral-1.jpg',
  'img/ref/eliptico-0.jpg',
  'img/ref/eliptico-1.jpg',
  'img/ref/esteira-0.jpg',
  'img/ref/esteira-1.jpg',
  'img/ref/extensora-0.jpg',
  'img/ref/extensora-1.jpg',
  'img/ref/hip-thrust-0.jpg',
  'img/ref/hip-thrust-1.jpg',
  'img/ref/hiperextensao-0.jpg',
  'img/ref/hiperextensao-1.jpg',
  'img/ref/leg-press-0.jpg',
  'img/ref/leg-press-1.jpg',
  'img/ref/mesa-flexora-0.jpg',
  'img/ref/mesa-flexora-1.jpg',
  'img/ref/panturrilha-em-pe-0.jpg',
  'img/ref/panturrilha-em-pe-1.jpg',
  'img/ref/peck-deck-0.jpg',
  'img/ref/peck-deck-1.jpg',
  'img/ref/ponte-glute-0.jpg',
  'img/ref/ponte-glute-1.jpg',
  'img/ref/ponte-unilateral-0.jpg',
  'img/ref/ponte-unilateral-1.jpg',
  'img/ref/prancha-0.jpg',
  'img/ref/prancha-1.jpg',
  'img/ref/prancha-lateral-0.jpg',
  'img/ref/prancha-lateral-1.jpg',
  'img/ref/puxada-0.jpg',
  'img/ref/puxada-1.jpg',
  'img/ref/remada-baixa-0.jpg',
  'img/ref/remada-baixa-1.jpg',
  'img/ref/remada-maquina-0.jpg',
  'img/ref/remada-maquina-1.jpg',
  'img/ref/rosca-martelo-0.jpg',
  'img/ref/rosca-martelo-1.jpg',
  'img/ref/supino-maquina-0.jpg',
  'img/ref/supino-maquina-1.jpg',
  'img/ref/terra-romeno-0.jpg',
  'img/ref/terra-romeno-1.jpg',
  'img/ref/triceps-corda-0.jpg',
  'img/ref/triceps-corda-1.jpg',
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
