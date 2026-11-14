// Tela do treino ativo e resumo final.
import {
  get, update, fichaPorId, ultimoRegistro, recordeAnterior, parseReps,
  volumeDaSessao, seriesFeitas, novoId
} from './store.js';
import {
  esc, icone, fmtPeso, fmtTempo, fmtDuracao, fmtVolume, fmtDataCurta,
  abrirFolha, confirmar, toast, ehCardio
} from './ui.js';
import { lerVideo, miniatura, abrirVideo } from './video.js';
import { iniciarDescanso, pararDescanso, liberarSom } from './rest.js';
import { imagemDe, blocoImagem, abrirImagem, escolherFoto } from './imagem.js';

/* ---------- começar, continuar, descartar ---------- */
function montarRascunho(ficha) {
  const sets = {};
  ficha.itens.forEach((it) => {
    if (sets[it.ex]) return;
    const ult = ultimoRegistro(it.ex);
    const repsPadrao = parseReps(it.reps);
    sets[it.ex] = Array.from({ length: it.series }, (_, i) => {
      const base = ult ? (ult.sets[i] || ult.sets[ult.sets.length - 1]) : null;
      return { peso: base ? base.peso : 0, reps: base ? base.reps : repsPadrao, ok: false };
    });
  });
  return { id: novoId(), fichaId: ficha.id, nome: ficha.nome, inicio: Date.now(), idx: 0, sets, joelho: {} };
}

export function comecarTreino(fichaId) {
  const ficha = fichaPorId(fichaId);
  if (!ficha) return;
  const atual = get().rascunho;
  if (atual && atual.fichaId === fichaId) { location.hash = '#/treino'; return; }
  const iniciar = () => {
    pararDescanso();
    update((s) => { s.rascunho = montarRascunho(ficha); });
    location.hash = '#/treino';
  };
  if (!atual) { iniciar(); return; }
  confirmar({
    titulo: 'Já existe um treino em andamento',
    texto: 'Começar este descarta o que você registrou no outro.',
    ok: 'Começar este', perigo: true
  }).then((ok) => { if (ok) iniciar(); });
}

export function descartarRascunho() {
  pararDescanso();
  update((s) => { s.rascunho = null; });
}

/* ---------- tela do treino ---------- */
function htmlSerieCardio(s, i) {
  return `
    <li class="serie serie-cardio ${s.ok ? 'ok' : ''}" data-i="${i}">
      <span class="serie-n">${i + 1}</span>
      <div class="campo">
        <button class="passo" data-step data-campo="reps" data-d="-5" aria-label="Menos 5 minutos">${icone.menos}</button>
        <input type="text" inputmode="numeric" autocomplete="off" data-campo="reps" value="${s.reps}" aria-label="Minutos feitos">
        <span class="campo-un">min</span>
        <button class="passo" data-step data-campo="reps" data-d="5" aria-label="Mais 5 minutos">${icone.mais1}</button>
      </div>
      <button class="serie-ok" data-ok aria-pressed="${s.ok}" aria-label="Cardio feito">${icone.check}</button>
    </li>`;
}

function htmlSerie(s, i) {
  return `
    <li class="serie ${s.ok ? 'ok' : ''}" data-i="${i}">
      <span class="serie-n">${i + 1}</span>
      <div class="campo">
        <button class="passo" data-step data-campo="peso" data-d="-1" aria-label="Diminuir carga da série ${i + 1}">${icone.menos}</button>
        <input type="text" inputmode="decimal" autocomplete="off" data-campo="peso" value="${fmtPeso(s.peso)}" aria-label="Carga da série ${i + 1} em quilos">
        <button class="passo" data-step data-campo="peso" data-d="1" aria-label="Aumentar carga da série ${i + 1}">${icone.mais1}</button>
      </div>
      <div class="campo">
        <button class="passo" data-step data-campo="reps" data-d="-1" aria-label="Diminuir repetições da série ${i + 1}">${icone.menos}</button>
        <input type="text" inputmode="numeric" autocomplete="off" data-campo="reps" value="${s.reps}" aria-label="Repetições da série ${i + 1}">
        <button class="passo" data-step data-campo="reps" data-d="1" aria-label="Aumentar repetições da série ${i + 1}">${icone.mais1}</button>
      </div>
      <button class="serie-ok" data-ok aria-pressed="${s.ok}" aria-label="Série ${i + 1} feita">${icone.check}</button>
    </li>`;
}

export function viewTreino(app) {
  const r0 = get().rascunho;
  const ficha = r0 && fichaPorId(r0.fichaId);
  if (!r0 || !ficha) { location.hash = '#/'; return; }
  const itens = ficha.itens;
  let lock = null;
  let relogio = null;

  const rasc = () => get().rascunho;
  const itemAtual = () => itens[Math.min(rasc().idx, itens.length - 1)];
  const exDe = (item) => get().exercicios[item.ex] || { id: item.ex, nome: item.ex, dicas: [] };
  const seriesDe = (item) => {
    const r = rasc();
    if (!r.sets[item.ex]) update((s) => { s.rascunho.sets[item.ex] = Array.from({ length: item.series }, () => ({ peso: 0, reps: parseReps(item.reps), ok: false })); }, false);
    return r.sets[item.ex];
  };

  app.innerHTML = `
    <div class="treino">
      <header class="treino-topo">
        <button class="icone-btn" data-sair aria-label="Sair do treino">${icone.fechar}</button>
        <div class="progresso" role="group" aria-label="Exercícios"></div>
        <span class="treino-relogio" aria-label="Tempo de treino">0:00</span>
      </header>
      <main class="treino-corpo" id="ex"></main>
      <footer class="treino-rodape">
        <button class="btn btn-sec btn-icone" data-ant aria-label="Exercício anterior">${icone.esq}</button>
        <button class="btn btn-prim btn-grande" data-prox></button>
      </footer>
    </div>`;

  const corpo = app.querySelector('#ex');
  const prog = app.querySelector('.progresso');
  const btnProx = app.querySelector('[data-prox]');
  const btnAnt = app.querySelector('[data-ant]');

  function desenharProgresso() {
    const r = rasc();
    prog.innerHTML = itens.map((it, i) => {
      const sets = r.sets[it.ex] || [];
      const feitas = sets.filter((x) => x.ok).length;
      const estado = feitas && feitas === sets.length ? 'feito' : feitas ? 'parcial' : '';
      return `<button class="seg ${estado} ${i === r.idx ? 'atual' : ''}" data-ir="${i}" aria-label="Exercício ${i + 1} de ${itens.length}" ${i === r.idx ? 'aria-current="step"' : ''}></button>`;
    }).join('');
    const ultimo = r.idx === itens.length - 1;
    btnProx.textContent = ultimo ? 'Finalizar treino' : 'Próximo exercício';
    btnAnt.disabled = r.idx === 0;
  }

  function desenharExercicio() {
    const r = rasc();
    const item = itemAtual();
    const ex = exDe(item);
    const sets = seriesDe(item);
    const ult = ultimoRegistro(item.ex, r.id);
    const v = lerVideo(ex.video);
    const temDicas = (ex.dicas && ex.dicas.length) || ex.cuidado;
    const ultTxt = ult
      ? `Última vez em ${fmtDataCurta(ult.quando)}: ${ult.sets.length} ${ult.sets.length === 1 ? 'série' : 'séries'} com até ${fmtPeso(Math.max(...ult.sets.map((x) => x.peso)))} kg`
      : 'Primeira vez neste exercício. Anote a carga que usar.';
    const joelho = r.joelho[item.ex];
    const cardio = ehCardio(ex);
    const temVideo = !!(v && v.tipo !== 'invalido');
    const tinhaImagem = !!imagemDe(ex);
    corpo.innerHTML = `
      <div class="ex-cab">
        ${ex.grupo ? `<span class="chip">${esc(ex.grupo)}</span>` : ''}
        <h1 class="ex-nome">${esc(ex.nome)}</h1>
        <p class="ex-meta">${cardio ? esc(item.reps) : `${item.series} séries de ${esc(item.reps)}, descanso de ${item.descanso} s`}</p>
        ${item.obs ? `<p class="ex-obs">${esc(item.obs)}</p>` : ''}
      </div>

      ${tinhaImagem ? blocoImagem(ex, { video: temVideo }) : `
      <button class="ex-video ${temVideo ? '' : 'sem'}" data-video aria-label="${temVideo ? 'Ver vídeo de execução' : 'Adicionar vídeo de execução'}">
        ${temVideo ? `${miniatura(ex, 'g')}<span class="ex-video-txt"><strong>Ver como fazer</strong><span>Vídeo de execução</span></span>`
          : `<span class="ex-video-txt"><strong>Sem vídeo ainda</strong><span>Toque para adicionar um link</span></span>`}
      </button>
      <button class="link ex-add-foto" data-foto>${icone.camera}<span>Adicionar foto do aparelho</span></button>`}

      <p class="ex-ultima">${ultTxt}</p>

      ${cardio
        ? `<div class="series-cab series-cab-cardio" aria-hidden="true"><span></span><span>Tempo feito</span><span></span></div>`
        : `<div class="series-cab" aria-hidden="true"><span></span><span>Carga em kg</span><span>Repetições</span><span></span></div>`}
      <ol class="series">${sets.map(cardio ? htmlSerieCardio : htmlSerie).join('')}</ol>
      <div class="series-acoes">
        ${cardio ? '' : `<button class="link" data-add-serie>${icone.mais1}<span>Adicionar série</span></button>
        ${sets.length > 1 ? `<button class="link link-quieto" data-rem-serie>Remover última</button>` : ''}`}
      </div>

      ${ex.monitorar ? `
      <div class="monitor" role="group" aria-label="Como ficou o ${esc(ex.monitorar)}">
        <p>Como ficou o ${esc(ex.monitorar)}?</p>
        <div class="monitor-opcoes">
          ${[['Sem dor', 0], ['Desconforto leve', 1], ['Dor forte', 2]].map(([t, n]) => `<button class="opcao ${joelho === n ? 'sel n' + n : ''}" data-joelho="${n}" aria-pressed="${joelho === n}">${t}</button>`).join('')}
        </div>
      </div>` : ''}

      ${temDicas ? `
      <details class="dicas" ${ult ? '' : 'open'}>
        <summary>${icone.dica}<span>Como fazer</span></summary>
        ${ex.dicas && ex.dicas.length ? `<ul>${ex.dicas.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
        ${ex.cuidado ? `<p class="cuidado">${esc(ex.cuidado)}</p>` : ''}
      </details>` : ''}
      <a class="link link-quieto ex-detalhe" href="#/ex/${encodeURIComponent(item.ex)}">Ver histórico e editar este exercício</a>
    `;
    desenharProgresso();
  }

  /* ----- ações ----- */
  function ir(i) {
    const n = Math.max(0, Math.min(itens.length - 1, i));
    update((s) => { s.rascunho.idx = n; }, false);
    desenharExercicio();
    window.scrollTo({ top: 0 });
  }

  function mudarCampo(linha, campo, valor) {
    const r = rasc();
    const item = itemAtual();
    const i = Number(linha.dataset.i);
    const s = r.sets[item.ex][i];
    const antigo = s[campo];
    if (valor === antigo) return;
    update((st) => { st.rascunho.sets[item.ex][i][campo] = valor; }, false);
    // Carga ou repetições novas valem também para as próximas séries que ainda não foram feitas.
    r.sets[item.ex].forEach((outra, j) => {
      if (j > i && !outra.ok && outra[campo] === antigo) {
        update((st) => { st.rascunho.sets[item.ex][j][campo] = valor; }, false);
        const campoEl = corpo.querySelector(`.serie[data-i="${j}"] input[data-campo="${campo}"]`);
        if (campoEl) campoEl.value = campo === 'peso' ? fmtPeso(valor) : String(valor);
      }
    });
  }

  function lerNumero(txt, inteiro) {
    const n = parseFloat(String(txt).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return null;
    return inteiro ? Math.round(n) : Math.round(n * 100) / 100;
  }

  corpo.addEventListener('click', (e) => {
    const alvo = e.target;
    const passo = alvo.closest('[data-step]');
    if (passo) {
      const linha = passo.closest('.serie');
      const campo = passo.dataset.campo;
      const input = linha.querySelector(`input[data-campo="${campo}"]`);
      const atual = lerNumero(input.value, campo === 'reps') ?? 0;
      const delta = Number(passo.dataset.d) * (campo === 'peso' ? get().config.passo : 1);
      const novo = Math.max(0, Math.round((atual + delta) * 100) / 100);
      input.value = campo === 'peso' ? fmtPeso(novo) : String(novo);
      mudarCampo(linha, campo, novo);
      return;
    }
    const ok = alvo.closest('[data-ok]');
    if (ok) {
      const linha = ok.closest('.serie');
      const item = itemAtual();
      const i = Number(linha.dataset.i);
      const novo = !rasc().sets[item.ex][i].ok;
      update((s) => { s.rascunho.sets[item.ex][i].ok = novo; }, false);
      linha.classList.toggle('ok', novo);
      ok.setAttribute('aria-pressed', String(novo));
      if (novo) {
        liberarSom();
        const ehFim = rasc().idx === itens.length - 1 && i === rasc().sets[item.ex].length - 1;
        if (!ehFim && !ehCardio(exDe(item))) iniciarDescanso(item.descanso || 60);
      } else {
        pararDescanso();
      }
      desenharProgresso();
      return;
    }
    if (alvo.closest('[data-ver-img]')) { abrirImagem(exDe(itemAtual())); return; }
    if (alvo.closest('[data-foto]')) { escolherFoto(exDe(itemAtual()), desenharExercicio); return; }
    if (alvo.closest('[data-video]')) {
      const item = itemAtual();
      const ex = exDe(item);
      const v = lerVideo(ex.video);
      if (v && v.tipo !== 'invalido') abrirVideo(ex); else location.hash = `#/ex/${encodeURIComponent(item.ex)}`;
      return;
    }
    if (alvo.closest('[data-add-serie]')) {
      const item = itemAtual();
      const sets = rasc().sets[item.ex];
      const base = sets[sets.length - 1] || { peso: 0, reps: parseReps(item.reps) };
      update((s) => { s.rascunho.sets[item.ex].push({ peso: base.peso, reps: base.reps, ok: false }); }, false);
      desenharExercicio();
      return;
    }
    if (alvo.closest('[data-rem-serie]')) {
      const item = itemAtual();
      update((s) => { if (s.rascunho.sets[item.ex].length > 1) s.rascunho.sets[item.ex].pop(); }, false);
      desenharExercicio();
      return;
    }
    const j = alvo.closest('[data-joelho]');
    if (j) {
      const item = itemAtual();
      const n = Number(j.dataset.joelho);
      update((s) => { s.rascunho.joelho[item.ex] = n; }, false);
      desenharExercicio();
      if (n === 2) toast('Dor forte: pare esse exercício e troque por outro mais leve.');
    }
  });

  // Digitar a carga na mão também vale.
  corpo.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-campo]');
    if (!input) return;
    const campo = input.dataset.campo;
    const linha = input.closest('.serie');
    const n = lerNumero(input.value, campo === 'reps');
    const item = itemAtual();
    const atual = rasc().sets[item.ex][Number(linha.dataset.i)][campo];
    if (n === null) { input.value = campo === 'peso' ? fmtPeso(atual) : String(atual); return; }
    input.value = campo === 'peso' ? fmtPeso(n) : String(n);
    mudarCampo(linha, campo, n);
  });
  corpo.addEventListener('focusin', (e) => { if (e.target.matches('input[data-campo]')) e.target.select(); });

  app.addEventListener('click', (e) => {
    if (e.target.closest('[data-ir]')) { ir(Number(e.target.closest('[data-ir]').dataset.ir)); return; }
    if (e.target.closest('[data-ant]')) { ir(rasc().idx - 1); return; }
    if (e.target.closest('[data-prox]')) {
      if (rasc().idx < itens.length - 1) ir(rasc().idx + 1); else finalizar();
      return;
    }
    if (e.target.closest('[data-sair]')) sair();
  });

  function sair() {
    abrirFolha(`
      <h2 class="sheet-titulo">Sair do treino?</h2>
      <p class="sheet-texto">O que você registrou fica salvo se quiser continuar depois.</p>
      <div class="sheet-pilha">
        <button class="btn btn-prim" data-continuar>Continuar depois</button>
        <button class="btn btn-sec" data-fechar>Voltar ao treino</button>
        <button class="btn btn-perigo-suave" data-descartar>Descartar este treino</button>
      </div>`, {
      aoMontar: (el, fechar) => {
        el.querySelector('[data-continuar]').addEventListener('click', () => { fechar(); location.hash = '#/'; });
        el.querySelector('[data-descartar]').addEventListener('click', () => { fechar(); descartarRascunho(); location.hash = '#/'; });
      }
    });
  }

  function finalizar() {
    const r = rasc();
    const feitas = Object.values(r.sets).reduce((t, l) => t + l.filter((x) => x.ok).length, 0);
    const total = Object.values(r.sets).reduce((t, l) => t + l.length, 0);
    if (!feitas) {
      confirmar({ titulo: 'Nenhuma série marcada', texto: 'Se finalizar assim, o treino não entra no histórico. Descartar?', ok: 'Descartar treino', perigo: true })
        .then((ok) => { if (ok) { descartarRascunho(); location.hash = '#/'; } });
      return;
    }
    confirmar({
      titulo: 'Finalizar treino?',
      texto: `Você marcou ${feitas} de ${total} séries. As que ficaram sem marcar não entram no histórico.`,
      ok: 'Finalizar'
    }).then((ok) => {
      if (!ok) return;
      const sessao = { id: r.id, fichaId: r.fichaId, nome: r.nome, inicio: r.inicio, fim: Date.now(), sets: {}, joelho: { ...r.joelho }, recordes: [] };
      Object.entries(r.sets).forEach(([exId, lista]) => {
        const feitasEx = lista.filter((x) => x.ok).map((x) => ({ peso: x.peso, reps: x.reps, ok: true }));
        if (!feitasEx.length) return;
        sessao.sets[exId] = feitasEx;
        const anterior = recordeAnterior(exId, r.id);
        const maximo = Math.max(...feitasEx.map((x) => x.peso));
        if (anterior > 0 && maximo > anterior) sessao.recordes.push(exId);
      });
      pararDescanso();
      update((s) => { s.sessoes.push(sessao); s.rascunho = null; });
      location.hash = `#/resumo/${sessao.id}`;
    });
  }

  /* ----- relógio e tela acesa ----- */
  const pintarRelogio = () => { app.querySelector('.treino-relogio').textContent = fmtTempo((Date.now() - rasc().inicio) / 1000); };
  pintarRelogio();
  relogio = setInterval(() => { if (rasc()) pintarRelogio(); }, 1000);

  async function pedirTela() {
    try { if ('wakeLock' in navigator && document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen'); } catch (e) { /* sem tela acesa, segue */ }
  }
  const aoVoltar = () => { if (document.visibilityState === 'visible') pedirTela(); };
  document.addEventListener('visibilitychange', aoVoltar);
  pedirTela();

  desenharExercicio();

  return () => {
    clearInterval(relogio);
    document.removeEventListener('visibilitychange', aoVoltar);
    try { lock && lock.release(); } catch (e) { /* ok */ }
  };
}

/* ---------- resumo ---------- */
export function viewResumo(app, { id }) {
  const s = get().sessoes.find((x) => x.id === id);
  if (!s) { location.hash = '#/'; return; }
  const dur = (s.fim || s.inicio) - s.inicio;
  const recs = (s.recordes || []).map((exId) => (get().exercicios[exId] || { nome: exId }).nome);
  const dor = Object.entries(s.joelho || {}).filter(([, n]) => n > 0)
    .map(([exId, n]) => `${(get().exercicios[exId] || { nome: exId }).nome}: ${n === 2 ? 'dor forte' : 'desconforto leve'}`);
  app.innerHTML = `
    <main class="resumo">
      <div class="resumo-sol" aria-hidden="true">${icone.check}</div>
      <h1 class="resumo-titulo">Treino concluído</h1>
      <p class="resumo-sub">${esc(s.nome)}</p>
      <dl class="resumo-nums">
        <div><dt>Tempo</dt><dd>${fmtDuracao(dur)}</dd></div>
        <div><dt>Séries</dt><dd>${seriesFeitas(s)}</dd></div>
        <div><dt>Volume</dt><dd>${fmtVolume(volumeDaSessao(s))}</dd></div>
      </dl>
      ${recs.length ? `<section class="resumo-bloco"><h2>Novas cargas máximas</h2><ul>${recs.map((n) => `<li>${icone.chama}<span>${esc(n)}</span></li>`).join('')}</ul></section>` : ''}
      ${dor.length ? `<section class="resumo-bloco"><h2>Para ajustar na próxima ficha</h2><ul class="lista-simples">${dor.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><p class="resumo-nota">Leve essas anotações para a próxima conversa sobre os treinos.</p></section>` : ''}
      <a class="btn btn-prim btn-bloco btn-grande" href="#/">Concluir</a>
    </main>`;
}
