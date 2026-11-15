// Service worker: guarda o app inteiro no aparelho para abrir rápido e funcionar sem internet.
// Ao mudar qualquer arquivo do app, aumente VERSAO para o celular baixar a versão nova.
const VERSAO = 'v7';
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
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
  'img/ilu/abducao-cabo-0.svg',
  'img/ilu/abducao-cabo-1.svg',
  'img/ilu/cadeira-abdutora-0.svg',
  'img/ilu/cadeira-abdutora-1.svg',
  'img/ilu/cadeira-extensora-0.svg',
  'img/ilu/cadeira-extensora-1.svg',
  'img/ilu/cadeira-flexora-0.svg',
  'img/ilu/cadeira-flexora-1.svg',
  'img/ilu/cardio-bike-0.svg',
  'img/ilu/cardio-bike-1.svg',
  'img/ilu/cardio-eliptico-0.svg',
  'img/ilu/cardio-eliptico-1.svg',
  'img/ilu/cardio-esteira-0.svg',
  'img/ilu/cardio-esteira-1.svg',
  'img/ilu/cardio-livre-0.svg',
  'img/ilu/cardio-livre-1.svg',
  'img/ilu/coice-cabo-0.svg',
  'img/ilu/coice-cabo-1.svg',
  'img/ilu/crucifixo-inverso-0.svg',
  'img/ilu/crucifixo-inverso-1.svg',
  'img/ilu/crucifixo-maquina-0.svg',
  'img/ilu/crucifixo-maquina-1.svg',
  'img/ilu/dead-bug-0.svg',
  'img/ilu/dead-bug-1.svg',
  'img/ilu/desenvolvimento-halteres-0.svg',
  'img/ilu/desenvolvimento-halteres-1.svg',
  'img/ilu/elevacao-lateral-0.svg',
  'img/ilu/elevacao-lateral-1.svg',
  'img/ilu/hip-thrust-maquina-0.svg',
  'img/ilu/hip-thrust-maquina-1.svg',
  'img/ilu/hiperextensao-45-0.svg',
  'img/ilu/hiperextensao-45-1.svg',
  'img/ilu/isometria-quadriceps-0.svg',
  'img/ilu/isometria-quadriceps-1.svg',
  'img/ilu/leg-press-0.svg',
  'img/ilu/leg-press-1.svg',
  'img/ilu/mesa-flexora-0.svg',
  'img/ilu/mesa-flexora-1.svg',
  'img/ilu/mobilidade-tornozelo-0.svg',
  'img/ilu/mobilidade-tornozelo-1.svg',
  'img/ilu/panturrilha-em-pe-0.svg',
  'img/ilu/panturrilha-em-pe-1.svg',
  'img/ilu/pelvica-unilateral-0.svg',
  'img/ilu/pelvica-unilateral-1.svg',
  'img/ilu/ponte-minibanda-0.svg',
  'img/ilu/ponte-minibanda-1.svg',
  'img/ilu/prancha-0.svg',
  'img/ilu/prancha-1.svg',
  'img/ilu/prancha-lateral-0.svg',
  'img/ilu/prancha-lateral-1.svg',
  'img/ilu/puxada-frente-0.svg',
  'img/ilu/puxada-frente-1.svg',
  'img/ilu/remada-baixa-0.svg',
  'img/ilu/remada-baixa-1.svg',
  'img/ilu/remada-maquina-0.svg',
  'img/ilu/remada-maquina-1.svg',
  'img/ilu/rosca-martelo-0.svg',
  'img/ilu/rosca-martelo-1.svg',
  'img/ilu/supino-maquina-0.svg',
  'img/ilu/supino-maquina-1.svg',
  'img/ilu/terra-romeno-halteres-0.svg',
  'img/ilu/terra-romeno-halteres-1.svg',
  'img/ilu/triceps-corda-0.svg',
  'img/ilu/triceps-corda-1.svg',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' pula o cache do navegador, que pode guardar arquivos velhos por uns 10 minutos
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ARQUIVOS.map((u) => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
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
