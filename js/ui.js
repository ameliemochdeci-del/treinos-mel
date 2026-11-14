// Peças visuais compartilhadas: ícones, formatação, folha inferior, aviso rápido.

export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const tracos = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const icone = {
  hoje: tracos('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>'),
  fichas: tracos('<rect x="4.5" y="3.5" width="15" height="17" rx="3"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>'),
  historico: tracos('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'),
  mais: tracos('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
  play: tracos('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>'),
  check: tracos('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  mais1: tracos('<path d="M12 5v14M5 12h14"/>'),
  menos: tracos('<path d="M5 12h14"/>'),
  esq: tracos('<path d="M14.5 5.5L8 12l6.5 6.5"/>'),
  dir: tracos('<path d="M9.5 5.5L16 12l-6.5 6.5"/>'),
  fechar: tracos('<path d="M6 6l12 12M18 6L6 18"/>'),
  dica: tracos('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>'),
  baixar: tracos('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>'),
  subir: tracos('<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14"/>'),
  lixo: tracos('<path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7M10.5 11v5M13.5 11v5"/>'),
  link: tracos('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>'),
  externo: tracos('<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>'),
  relogio: tracos('<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/>'),
  haltere: tracos('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>'),
  camera: tracos('<path d="M4.5 8.5a2 2 0 0 1 2-2h1.6l1.2-2h5.4l1.2 2h1.6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.4"/>'),
  chama: tracos('<path d="M12 3c.5 3-3.5 4.8-3.5 9a3.5 3.5 0 0 0 7 0c0-1.5-.7-2.5-1.5-3.5 0 1.5-.8 2-1.5 2 .8-2.2 0-5.5-.5-7.5z"/>')
};

/* ---------- formatação ---------- */
export function fmtPeso(n) {
  const v = Number(n) || 0;
  return (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace('.', ',');
}

export const ehCardio = (ex) => !!ex && /^cardio$/i.test(ex.grupo || '');

// Série registrada: "40 kg × 12", "30 s", "15 min" ou "12 reps".
export function fmtSerie(x, ex) {
  if (ehCardio(ex)) return `${x.reps} min`;
  return x.peso ? `${fmtPeso(x.peso)} kg × ${x.reps}` : `${x.reps} reps`;
}

export function fmtTempo(seg) {
  const s = Math.max(0, Math.round(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtDuracao(ms) {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

export function fmtVolume(kg) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1).replace('.', ',')} t` : `${Math.round(kg)} kg`;
}

const f1 = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const f2 = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const f3 = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const f4 = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtDataLonga = (ms) => f1.format(ms);
export const fmtDataCurta = (ms) => f2.format(ms).replace('.', '');
export const fmtMes = (ms) => f3.format(ms);
export const fmtDataSemana = (ms) => f4.format(ms).replace(/\./g, '');

export function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/* ---------- recarregar a tela atual ---------- */
let recarga = () => {};
export const definirRecarga = (f) => { recarga = f; };
export const recarregar = () => recarga();

/* ---------- aviso rápido ---------- */
let tToast;
export function toast(msg) {
  const host = document.getElementById('toast-host');
  host.innerHTML = `<div class="toast">${esc(msg)}</div>`;
  clearTimeout(tToast);
  tToast = setTimeout(() => { host.innerHTML = ''; }, 2600);
}

/* ---------- folha inferior ---------- */
let fecharAtual = null;

export function abrirFolha(conteudo, { aoMontar, aoFechar, classe = '' } = {}) {
  if (fecharAtual) fecharAtual();
  const host = document.getElementById('sheet-host');
  host.innerHTML = `
    <div class="sheet-fundo" data-fechar></div>
    <section class="sheet ${classe}" role="dialog" aria-modal="true" tabindex="-1">
      <div class="sheet-alca" data-fechar aria-hidden="true"></div>
      <div class="sheet-corpo">${conteudo}</div>
    </section>`;
  document.body.classList.add('travado');
  const folha = host.querySelector('.sheet');
  const fundo = host.querySelector('.sheet-fundo');
  requestAnimationFrame(() => { folha.classList.add('aberta'); fundo.classList.add('aberta'); folha.focus({ preventScroll: true }); });

  const teclado = (e) => { if (e.key === 'Escape') fechar(); };
  const clique = (e) => { if (e.target.closest('[data-fechar]')) fechar(); };
  document.addEventListener('keydown', teclado);
  host.addEventListener('click', clique);

  function fechar() {
    if (fecharAtual !== fechar) return;
    fecharAtual = null;
    document.removeEventListener('keydown', teclado);
    host.removeEventListener('click', clique);
    document.body.classList.remove('travado');
    if (aoFechar) aoFechar();
    folha.classList.remove('aberta'); fundo.classList.remove('aberta');
    setTimeout(() => { if (!fecharAtual) host.innerHTML = ''; }, 220);
  }
  fecharAtual = fechar;
  if (aoMontar) aoMontar(host.querySelector('.sheet-corpo'), fechar);
  return fechar;
}

export function fecharFolha() { if (fecharAtual) fecharAtual(); }

export function confirmar({ titulo, texto, ok = 'Confirmar', perigo = false }) {
  return new Promise((resolve) => {
    let resolvido = false;
    const fim = (v) => { if (!resolvido) { resolvido = true; resolve(v); } };
    abrirFolha(`
      <h2 class="sheet-titulo">${esc(titulo)}</h2>
      ${texto ? `<p class="sheet-texto">${esc(texto)}</p>` : ''}
      <div class="sheet-acoes">
        <button class="btn btn-sec" data-fechar>Voltar</button>
        <button class="btn ${perigo ? 'btn-perigo' : 'btn-prim'}" data-ok>${esc(ok)}</button>
      </div>`, {
      aoMontar: (el, fechar) => { el.querySelector('[data-ok]').addEventListener('click', () => { fim(true); fechar(); }); },
      aoFechar: () => fim(false)
    });
  });
}

/* ---------- barra de abas ---------- */
const ABAS = [
  { id: 'hoje', rota: '#/', rotulo: 'Hoje' },
  { id: 'fichas', rota: '#/fichas', rotulo: 'Fichas' },
  { id: 'historico', rota: '#/historico', rotulo: 'Histórico' },
  { id: 'mais', rota: '#/mais', rotulo: 'Ajustes' }
];

export function desenharAbas(ativa) {
  const nav = document.getElementById('tabbar');
  if (!ativa) { nav.hidden = true; nav.innerHTML = ''; return; }
  nav.hidden = false;
  nav.innerHTML = ABAS.map((a) => `
    <a href="${a.rota}" class="aba ${a.id === ativa ? 'ativa' : ''}" ${a.id === ativa ? 'aria-current="page"' : ''}>
      <span class="aba-icone">${icone[a.id]}</span>
      <span class="aba-rotulo">${a.rotulo}</span>
    </a>`).join('');
}
