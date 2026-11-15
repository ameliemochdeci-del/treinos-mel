// Roteador e inicialização.
import { pedirArmazenamentoPersistente } from './store.js';
import { desenharAbas, definirRecarga, icone } from './ui.js';
import {
  viewHoje, viewFichas, viewFicha, viewExercicio, viewHistorico, viewSessao, viewAjustes
} from './views.js';
import { viewTreino, viewResumo } from './treino.js';

const ROTAS = [
  { re: /^\/$/, view: viewHoje, aba: 'hoje' },
  { re: /^\/fichas$/, view: viewFichas, aba: 'fichas' },
  { re: /^\/fichas\/([^/]+)$/, view: viewFicha, aba: 'fichas' },
  { re: /^\/ex\/([^/]+)$/, view: viewExercicio, aba: 'fichas' },
  { re: /^\/historico$/, view: viewHistorico, aba: 'historico' },
  { re: /^\/sessao\/([^/]+)$/, view: viewSessao, aba: 'historico' },
  { re: /^\/mais$/, view: viewAjustes, aba: 'mais' },
  { re: /^\/treino$/, view: viewTreino, aba: null, treino: true },
  { re: /^\/resumo\/([^/]+)$/, view: viewResumo, aba: null }
];

const app = document.getElementById('app');
let limpar = null;

function renderizar(manterScroll = false) {
  const y = manterScroll ? window.scrollY : 0;
  if (limpar) { limpar(); limpar = null; }
  const raw = (location.hash || '#/').slice(1) || '/';
  const rota = ROTAS.find((r) => r.re.test(raw));
  if (!rota) { location.hash = '#/'; return; }
  const m = raw.match(rota.re);
  let id;
  try { id = m[1] ? decodeURIComponent(m[1]) : undefined; } catch (e) { id = m[1]; }

  const el = document.createElement('div');
  el.className = 'rota';
  app.replaceChildren(el);
  document.body.classList.toggle('em-treino', !!rota.treino);
  desenharAbas(rota.aba);
  const retorno = rota.view(el, { id });
  limpar = typeof retorno === 'function' ? retorno : null;
  window.scrollTo(0, y);
}

definirRecarga(() => renderizar(true));
window.addEventListener('hashchange', () => renderizar(false));

// Miniatura que não carregou (sem internet): troca pelo ícone.
document.addEventListener('error', (e) => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.hasAttribute('data-thumb')) {
    const m = t.closest('.mini');
    t.remove();
    if (m) { m.classList.add('mini-vazia'); m.insertAdjacentHTML('afterbegin', icone.haltere); }
  }
}, true);

pedirArmazenamentoPersistente();
renderizar();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  // Quando uma versão nova do app assume, recarrega uma vez para você já ver a versão nova.
  const tinhaControlador = !!navigator.serviceWorker.controller;
  let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!tinhaControlador || recarregou) return;
    recarregou = true;
    location.reload();
  });
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* sem cache offline */ }); });
}
