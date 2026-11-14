// Telas: Hoje, Fichas, Exercício, Histórico, Sessão e Ajustes.
import {
  get, update, DIAS, DIAS_NOME, chaveData, diasDaSemana, indiceDia, sessoesDoDia, treinosNaSemana,
  metaSemanal, fichaPorId, fichaDeHoje, minutosEstimados, historicoDoExercicio, volumeDaSessao,
  seriesFeitas, importarTexto, exportarTexto, restaurarBackup, apagarTudo
} from './store.js';
import {
  esc, icone, fmtPeso, fmtDuracao, fmtVolume, fmtDataLonga, fmtDataCurta, fmtMes, fmtDataSemana,
  saudacao, toast, confirmar, recarregar
} from './ui.js';
import { lerVideo, miniatura, abrirVideo } from './video.js';
import { comecarTreino, descartarRascunho } from './treino.js';
import { EXEMPLO } from './exemplo.js';

const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const exDe = (id) => get().exercicios[id] || { id, nome: id, dicas: [] };

function vazioFichas() {
  return `
    <section class="vazio">
      <div class="vazio-sol" aria-hidden="true">${icone.haltere}</div>
      <h2>Nenhuma ficha ainda</h2>
      <p>Cole o texto da ficha em Ajustes, ou carregue um exemplo para conhecer o app.</p>
      <div class="vazio-acoes">
        <a class="btn btn-prim" href="#/mais">Importar ficha</a>
        <button class="btn btn-sec" data-exemplo>Carregar exemplo</button>
      </div>
    </section>`;
}

function aoClicarExemplo(app) {
  app.addEventListener('click', (e) => {
    if (!e.target.closest('[data-exemplo]')) return;
    const r = importarTexto(JSON.stringify(EXEMPLO));
    if (r.ok) { toast('Exemplo carregado.'); recarregar(); }
  });
}

/* =============== HOJE =============== */
let solJaSubiu = false;

function cenaSemana(feitosPorDia, p) {
  const cx = 160, cy = 160, raio = 130;
  const hoje = indiceDia();
  const letras = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const pontos = DIAS.map((dia, i) => {
    const a = ((165 - i * 25) * Math.PI) / 180;
    const x = (cx + raio * Math.cos(a)).toFixed(1);
    const y = (cy - raio * Math.sin(a)).toFixed(1);
    const feito = feitosPorDia[i];
    return `
      <g class="dia ${feito ? 'feito' : ''} ${i === hoje ? 'hoje' : ''}" role="img" aria-label="${DIAS_NOME[dia]}${feito ? ', treinou' : ''}${i === hoje ? ', hoje' : ''}">
        <circle cx="${x}" cy="${y}" r="13.5"/>
        <text x="${x}" y="${(Number(y) + 4.2).toFixed(1)}" text-anchor="middle">${letras[i]}</text>
      </g>`;
  }).join('');
  const y = ((1 - p) * 76).toFixed(0);
  return `
    <svg class="cena" viewBox="0 0 320 160" role="img" aria-label="Sol subindo conforme os treinos da semana">
      <defs>
        <radialGradient id="solGrad" cx="50%" cy="42%" r="60%">
          <stop offset="0" stop-color="#ffe27a"/><stop offset="0.6" stop-color="#ffb627"/><stop offset="1" stop-color="#ff8a5c"/>
        </radialGradient>
      </defs>
      <path class="trilho" d="M 34.4 126.4 A 130 130 0 0 1 285.6 126.4"/>
      <g class="sol ${solJaSubiu ? '' : 'antes'}" style="--y:${y}px">
        <circle cx="160" cy="150" r="86" class="halo"/>
        <circle cx="160" cy="150" r="62" fill="url(#solGrad)"/>
      </g>
      ${pontos}
    </svg>`;
}

export function viewHoje(app) {
  const s = get();
  const agora = Date.now();
  const semana = diasDaSemana(agora);
  const feitosPorDia = semana.map((d) => sessoesDoDia(chaveData(d)).length > 0);
  const feitos = treinosNaSemana(agora);
  const meta = metaSemanal();
  const p = Math.min(1, feitos / meta);
  const nome = s.config.nome ? `, ${esc(s.config.nome)}` : '';
  const rasc = s.rascunho;
  const fichaRasc = rasc && fichaPorId(rasc.fichaId);
  const hoje = fichaDeHoje();
  const feitoHoje = sessoesDoDia(chaveData(agora));
  const temAgenda = Object.values(s.agenda).some(Boolean);

  let bloco;
  if (!s.fichas.length) {
    bloco = vazioFichas();
  } else if (fichaRasc) {
    const feitas = Object.values(rasc.sets).reduce((t, l) => t + l.filter((x) => x.ok).length, 0);
    bloco = `
      <section class="agora">
        <h2 class="agora-titulo">Treino em andamento</h2>
        <p class="agora-nome">${esc(fichaRasc.nome)}</p>
        <p class="agora-sub">${plural(feitas, 'série feita', 'séries feitas')} até agora</p>
        <a class="btn btn-prim btn-grande btn-bloco" href="#/treino">Continuar treino</a>
        <button class="link link-quieto" data-descartar>Descartar este treino</button>
      </section>`;
  } else if (hoje && feitoHoje.length) {
    bloco = `
      <section class="agora feito">
        <h2 class="agora-titulo">${icone.check}<span>Treino de hoje concluído</span></h2>
        <p class="agora-nome">${esc(feitoHoje[feitoHoje.length - 1].nome)}</p>
        <a class="btn btn-sec btn-bloco" href="#/sessao/${feitoHoje[feitoHoje.length - 1].id}">Ver o que você fez</a>
        <button class="link link-quieto" data-comecar="${esc(hoje.id)}">Treinar de novo</button>
      </section>`;
  } else if (hoje) {
    bloco = `
      <section class="agora">
        <h2 class="agora-titulo">Treino de hoje</h2>
        <p class="agora-nome">${esc(hoje.nome)}</p>
        <p class="agora-sub">${hoje.foco ? `${esc(hoje.foco)}. ` : ''}${plural(hoje.itens.length, 'exercício', 'exercícios')}, cerca de ${minutosEstimados(hoje)} min</p>
        <button class="btn btn-prim btn-grande btn-bloco" data-comecar="${esc(hoje.id)}">Começar treino</button>
      </section>`;
  } else if (temAgenda) {
    bloco = `
      <section class="agora descanso-dia">
        <h2 class="agora-titulo">Hoje é dia de descanso</h2>
        <p class="agora-sub">Descansar também faz parte da evolução. Se quiser treinar mesmo assim, escolha uma ficha abaixo.</p>
      </section>`;
  } else {
    bloco = `
      <section class="agora">
        <h2 class="agora-titulo">Qual ficha hoje?</h2>
        <p class="agora-sub">Escolha uma ficha abaixo. Para o app sugerir o treino do dia, marque os dias da semana dentro de cada ficha.</p>
      </section>`;
  }

  const outras = s.fichas.filter((f) => !(hoje && f.id === hoje.id && !feitoHoje.length && !fichaRasc));
  const lista = s.fichas.length && !fichaRasc ? `
    <section class="secao">
      <h2 class="secao-titulo">${hoje && !feitoHoje.length ? 'Outras fichas' : 'Fichas'}</h2>
      <ul class="linhas">
        ${outras.map((f) => `
          <li class="linha">
            <a class="linha-corpo" href="#/fichas/${esc(f.id)}">
              <span class="linha-titulo">${esc(f.nome)}</span>
              <span class="linha-sub">${plural(f.itens.length, 'exercício', 'exercícios')}, cerca de ${minutosEstimados(f)} min</span>
            </a>
            <button class="redondo" data-comecar="${esc(f.id)}" aria-label="Começar ${esc(f.nome)}">${icone.play}</button>
          </li>`).join('')}
      </ul>
    </section>` : '';

  app.innerHTML = `
    <div class="hoje">
      <header class="hero">
        <p class="hero-data">${maiuscula(fmtDataLonga(agora))}</p>
        <h1 class="hero-titulo">${saudacao()}${nome}</h1>
        ${cenaSemana(feitosPorDia, p)}
      </header>
      <div class="chao">
        <p><strong>${feitos} de ${meta}</strong> ${meta === 1 ? 'treino' : 'treinos'} nesta semana</p>
      </div>
      <div class="conteudo">${bloco}${lista}</div>
    </div>`;

  if (!solJaSubiu) {
    solJaSubiu = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const sol = app.querySelector('.sol');
      if (sol) sol.classList.remove('antes');
    }));
  }

  aoClicarExemplo(app);
  app.addEventListener('click', (e) => {
    const c = e.target.closest('[data-comecar]');
    if (c) { comecarTreino(c.dataset.comecar); return; }
    if (e.target.closest('[data-descartar]')) {
      confirmar({ titulo: 'Descartar treino em andamento?', texto: 'O que você registrou nele será apagado.', ok: 'Descartar', perigo: true })
        .then((ok) => { if (ok) { descartarRascunho(); recarregar(); } });
    }
  });
}

/* =============== FICHAS =============== */
export function viewFichas(app) {
  const s = get();
  const diasDa = (id) => DIAS.filter((d) => s.agenda[d] === id).map((d) => d);
  app.innerHTML = `
    <div class="pagina">
      <h1 class="titulo">Fichas</h1>
      ${s.fichas.length ? `
      <ul class="linhas">
        ${s.fichas.map((f, i) => {
          const dias = diasDa(f.id);
          return `
          <li class="linha">
            <a class="linha-corpo" href="#/fichas/${esc(f.id)}">
              <span class="linha-titulo">${esc(f.nome)}</span>
              <span class="linha-sub">${f.foco ? `${esc(f.foco)}. ` : ''}${plural(f.itens.length, 'exercício', 'exercícios')}</span>
              ${dias.length ? `<span class="linha-dias">${dias.map((d) => `<span class="mini-dia">${d}</span>`).join('')}</span>` : ''}
            </a>
            <span class="linha-seta">${icone.dir}</span>
          </li>`;
        }).join('')}
      </ul>
      <p class="rodape-nota">Para trocar ou criar fichas, cole o texto novo em <a href="#/mais">Ajustes</a>.</p>` : vazioFichas()}
    </div>`;
  aoClicarExemplo(app);
}

export function viewFicha(app, { id }) {
  const f = fichaPorId(id);
  if (!f) { location.hash = '#/fichas'; return; }
  const s = get();
  app.innerHTML = `
    <div class="pagina">
      <a class="voltar" href="#/fichas">${icone.esq}<span>Fichas</span></a>
      <h1 class="titulo">${esc(f.nome)}</h1>
      <p class="sub">${f.foco ? `${esc(f.foco)}. ` : ''}${plural(f.itens.length, 'exercício', 'exercícios')}, cerca de ${minutosEstimados(f)} min</p>
      <button class="btn btn-prim btn-grande btn-bloco" data-comecar="${esc(f.id)}">Começar treino</button>

      <section class="secao">
        <h2 class="secao-titulo">Dias da semana</h2>
        <div class="dias-sel" role="group" aria-label="Dias em que você faz esta ficha">
          ${DIAS.map((d) => {
            const minha = s.agenda[d] === f.id;
            const outra = s.agenda[d] && !minha ? fichaPorId(s.agenda[d]) : null;
            return `<button class="dia-chip ${minha ? 'sel' : ''}" data-dia="${d}" aria-pressed="${minha}" ${outra ? `title="Hoje usa: ${esc(outra.nome)}"` : ''}>${d}${outra ? '<i class="dia-outra" aria-hidden="true"></i>' : ''}</button>`;
          }).join('')}
        </div>
        <p class="nota">O app sugere esta ficha nos dias marcados. O ponto indica um dia que já tem outra ficha.</p>
      </section>

      <section class="secao">
        <h2 class="secao-titulo">Exercícios</h2>
        <ol class="exlista">
          ${f.itens.map((it) => {
            const ex = exDe(it.ex);
            return `
            <li>
              <a class="exlinha" href="#/ex/${encodeURIComponent(it.ex)}">
                ${miniatura(ex, 'm')}
                <span class="exlinha-txt">
                  <span class="linha-titulo">${esc(ex.nome)}</span>
                  <span class="linha-sub">${it.series} séries de ${esc(it.reps)}, descanso de ${it.descanso} s</span>
                </span>
                <span class="linha-seta">${icone.dir}</span>
              </a>
            </li>`;
          }).join('')}
        </ol>
      </section>
      <button class="link link-perigo" data-excluir>${icone.lixo}<span>Excluir esta ficha</span></button>
    </div>`;

  app.addEventListener('click', (e) => {
    const c = e.target.closest('[data-comecar]');
    if (c) { comecarTreino(c.dataset.comecar); return; }
    const d = e.target.closest('[data-dia]');
    if (d) {
      const dia = d.dataset.dia;
      update((st) => { if (st.agenda[dia] === f.id) delete st.agenda[dia]; else st.agenda[dia] = f.id; }, false);
      recarregar();
      return;
    }
    if (e.target.closest('[data-excluir]')) {
      confirmar({ titulo: `Excluir "${f.nome}"?`, texto: 'Os treinos já feitos continuam no histórico.', ok: 'Excluir', perigo: true }).then((ok) => {
        if (!ok) return;
        update((st) => {
          st.fichas = st.fichas.filter((x) => x.id !== f.id);
          Object.keys(st.agenda).forEach((k) => { if (st.agenda[k] === f.id) delete st.agenda[k]; });
        }, false);
        location.hash = '#/fichas';
      });
    }
  });
}

/* =============== EXERCÍCIO =============== */
function graficoCarga(hist) {
  const pts = hist.slice(-12);
  if (pts.length < 2) {
    return `<p class="nota">${pts.length ? 'Falta mais um treino com este exercício para desenhar a evolução.' : 'Registre este exercício em um treino para ver a evolução da carga.'}</p>`;
  }
  const W = 300, H = 120, mx = 14, my = 18;
  const vals = pts.map((p) => p.maximo);
  const min = Math.min(...vals), max = Math.max(...vals);
  const fx = (i) => mx + (i * (W - 2 * mx)) / (pts.length - 1);
  const fy = (v) => (max === min ? H / 2 : H - my - ((v - min) / (max - min)) * (H - 2 * my));
  const linha = pts.map((p, i) => `${i ? 'L' : 'M'}${fx(i).toFixed(1)} ${fy(p.maximo).toFixed(1)}`).join(' ');
  const area = `${linha} L${fx(pts.length - 1).toFixed(1)} ${H} L${fx(0).toFixed(1)} ${H} Z`;
  return `
    <svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="Carga máxima por treino, de ${fmtPeso(vals[0])} a ${fmtPeso(vals[vals.length - 1])} quilos">
      <path d="${area}" class="grafico-area"/>
      <path d="${linha}" class="grafico-linha"/>
      ${pts.map((p, i) => `<circle cx="${fx(i).toFixed(1)}" cy="${fy(p.maximo).toFixed(1)}" r="${i === pts.length - 1 ? 5 : 3}" class="grafico-ponto ${i === pts.length - 1 ? 'ultimo' : ''}"/>`).join('')}
      <text x="${fx(0).toFixed(1)}" y="${(fy(vals[0]) - 9).toFixed(1)}" text-anchor="start" class="grafico-txt">${fmtPeso(vals[0])} kg</text>
      <text x="${fx(pts.length - 1).toFixed(1)}" y="${(fy(vals[vals.length - 1]) - 11).toFixed(1)}" text-anchor="end" class="grafico-txt forte">${fmtPeso(vals[vals.length - 1])} kg</text>
    </svg>`;
}

export function viewExercicio(app, { id }) {
  const ex = get().exercicios[id];
  if (!ex) { location.hash = '#/fichas'; return; }
  const hist = historicoDoExercicio(id);
  const v = lerVideo(ex.video);
  const nomesJoelho = ['sem dor', 'desconforto leve', 'dor forte'];
  app.innerHTML = `
    <div class="pagina">
      <button class="voltar" data-voltar>${icone.esq}<span>Voltar</span></button>
      ${ex.grupo ? `<span class="chip">${esc(ex.grupo)}</span>` : ''}
      <h1 class="titulo">${esc(ex.nome)}</h1>

      ${v && v.tipo !== 'invalido' ? `
      <button class="ex-video" data-video>${miniatura(ex, 'g')}<span class="ex-video-txt"><strong>Ver como fazer</strong><span>${v.tipo === 'youtube' ? 'Toca aqui dentro do app' : `Abre no ${esc(v.nome)}`}</span></span></button>` : ''}

      <section class="secao">
        <h2 class="secao-titulo">Link do vídeo</h2>
        <form class="video-form" data-form>
          <input type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" name="url" placeholder="Cole um link do YouTube, Shorts, TikTok ou Instagram" value="${esc(ex.video || '')}" aria-label="Link do vídeo">
          <button class="btn btn-prim" type="submit">Salvar</button>
        </form>
        ${v && v.tipo === 'invalido' ? '<p class="erro">Esse link não parece válido.</p>' : ''}
        ${ex.video ? `<button class="link link-quieto" data-tirar-video>Remover vídeo</button>` : ''}
      </section>

      ${(ex.dicas && ex.dicas.length) || ex.cuidado ? `
      <section class="secao">
        <h2 class="secao-titulo">Como fazer</h2>
        ${ex.dicas && ex.dicas.length ? `<ul class="dicas-lista">${ex.dicas.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
        ${ex.cuidado ? `<p class="cuidado">${esc(ex.cuidado)}</p>` : ''}
      </section>` : ''}

      <section class="secao">
        <h2 class="secao-titulo">Evolução da carga</h2>
        ${graficoCarga(hist)}
        ${hist.length ? `
        <ul class="hist-lista">
          ${hist.slice(-6).reverse().map((h) => `
            <li>
              <a href="#/sessao/${esc(h.id)}">
                <span>${fmtDataCurta(h.quando)}</span>
                <span>${h.sets.map((x) => (x.peso ? `${fmtPeso(x.peso)}×${x.reps}` : `${x.reps} reps`)).join(', ')}</span>
                ${h.joelho > 0 ? `<span class="tag n${h.joelho}">${nomesJoelho[h.joelho]}</span>` : ''}
              </a>
            </li>`).join('')}
        </ul>` : ''}
      </section>
    </div>`;

  app.addEventListener('click', (e) => {
    if (e.target.closest('[data-voltar]')) { history.length > 1 ? history.back() : (location.hash = '#/fichas'); return; }
    if (e.target.closest('[data-video]')) { abrirVideo(ex); return; }
    if (e.target.closest('[data-tirar-video]')) {
      update((st) => { st.exercicios[id].video = ''; }, false);
      recarregar();
    }
  });
  app.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = new FormData(e.target).get('url').trim();
    if (url && lerVideo(url).tipo === 'invalido') { toast('Esse link não parece válido.'); return; }
    update((st) => { st.exercicios[id].video = url; }, false);
    toast(url ? 'Vídeo salvo.' : 'Vídeo removido.');
    recarregar();
  });
}

/* =============== HISTÓRICO =============== */
let mesRef = null;

export function viewHistorico(app) {
  const s = get();
  const agora = new Date();
  if (mesRef === null) mesRef = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
  const ref = new Date(mesRef);
  const ano = ref.getFullYear(), mes = ref.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const deslocamento = (new Date(ano, mes, 1).getDay() + 6) % 7;
  const hojeChave = chaveData(Date.now());

  const doMes = s.sessoes.filter((x) => { const d = new Date(x.fim || x.inicio); return d.getFullYear() === ano && d.getMonth() === mes; });
  const porDia = {};
  doMes.forEach((x) => { const k = chaveData(x.fim || x.inicio); (porDia[k] = porDia[k] || []).push(x); });

  const celulas = [];
  for (let i = 0; i < deslocamento; i++) celulas.push('<span class="cel vaz"></span>');
  for (let d = 1; d <= diasNoMes; d++) {
    const k = chaveData(new Date(ano, mes, d, 12).getTime());
    const ss = porDia[k];
    const tag = ss ? 'a' : 'span';
    celulas.push(`<${tag} class="cel ${ss ? 'treinou' : ''} ${k === hojeChave ? 'hoje' : ''}" ${ss ? `href="#/sessao/${ss[ss.length - 1].id}" aria-label="Dia ${d}, treinou"` : ''}><b>${d}</b></${tag}>`);
  }

  const volume = doMes.reduce((t, x) => t + volumeDaSessao(x), 0);
  const series = doMes.reduce((t, x) => t + seriesFeitas(x), 0);
  const ehMesAtual = ano === agora.getFullYear() && mes === agora.getMonth();

  app.innerHTML = `
    <div class="pagina">
      <h1 class="titulo">Histórico</h1>
      <div class="mes-nav">
        <button class="icone-btn" data-mes="-1" aria-label="Mês anterior">${icone.esq}</button>
        <h2>${maiuscula(fmtMes(mesRef))}</h2>
        <button class="icone-btn" data-mes="1" aria-label="Próximo mês" ${ehMesAtual ? 'disabled' : ''}>${icone.dir}</button>
      </div>
      <div class="cal" role="grid">
        ${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => `<span class="cal-dia" aria-label="${DIAS_NOME[DIAS[i]]}">${l}</span>`).join('')}
        ${celulas.join('')}
      </div>

      <dl class="resumo-nums compacto">
        <div><dt>Treinos</dt><dd>${doMes.length}</dd></div>
        <div><dt>Séries</dt><dd>${series}</dd></div>
        <div><dt>Volume</dt><dd>${fmtVolume(volume)}</dd></div>
      </dl>

      ${doMes.length ? `
      <section class="secao">
        <h2 class="secao-titulo">Treinos do mês</h2>
        <ul class="linhas">
          ${doMes.slice().reverse().map((x) => `
            <li class="linha">
              <a class="linha-corpo" href="#/sessao/${esc(x.id)}">
                <span class="linha-titulo">${esc(x.nome)}</span>
                <span class="linha-sub">${fmtDataSemana(x.fim || x.inicio)}, ${fmtDuracao((x.fim || x.inicio) - x.inicio)}, ${plural(seriesFeitas(x), 'série', 'séries')}</span>
              </a>
              <span class="linha-seta">${icone.dir}</span>
            </li>`).join('')}
        </ul>
      </section>` : `<p class="nota centro">${s.sessoes.length ? 'Nenhum treino neste mês.' : 'Seus treinos aparecem aqui assim que você finalizar o primeiro.'}</p>`}
    </div>`;

  app.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mes]');
    if (!b || b.disabled) return;
    mesRef = new Date(ano, mes + Number(b.dataset.mes), 1).getTime();
    recarregar();
  });
}

export function viewSessao(app, { id }) {
  const x = get().sessoes.find((y) => y.id === id);
  if (!x) { location.hash = '#/historico'; return; }
  const nomesJoelho = ['sem dor', 'desconforto leve', 'dor forte'];
  app.innerHTML = `
    <div class="pagina">
      <a class="voltar" href="#/historico">${icone.esq}<span>Histórico</span></a>
      <h1 class="titulo">${esc(x.nome)}</h1>
      <p class="sub">${maiuscula(fmtDataLonga(x.fim || x.inicio))}</p>
      <dl class="resumo-nums compacto">
        <div><dt>Tempo</dt><dd>${fmtDuracao((x.fim || x.inicio) - x.inicio)}</dd></div>
        <div><dt>Séries</dt><dd>${seriesFeitas(x)}</dd></div>
        <div><dt>Volume</dt><dd>${fmtVolume(volumeDaSessao(x))}</dd></div>
      </dl>
      <ul class="sessao-ex">
        ${Object.entries(x.sets).map(([exId, lista]) => {
          const ex = exDe(exId);
          const j = x.joelho ? x.joelho[exId] : undefined;
          return `
          <li>
            <a class="sessao-ex-nome" href="#/ex/${encodeURIComponent(exId)}">${esc(ex.nome)}${(x.recordes || []).includes(exId) ? `<span class="tag rec">${icone.chama}<span>Nova carga máxima</span></span>` : ''}</a>
            <p>${lista.map((y) => (y.peso ? `${fmtPeso(y.peso)} kg × ${y.reps}` : `${y.reps} reps`)).join(', ')}</p>
            ${j > 0 ? `<p class="tag n${j}">Joelho: ${nomesJoelho[j]}</p>` : ''}
          </li>`;
        }).join('')}
      </ul>
      <button class="link link-perigo" data-excluir>${icone.lixo}<span>Excluir este treino</span></button>
    </div>`;
  app.addEventListener('click', (e) => {
    if (!e.target.closest('[data-excluir]')) return;
    confirmar({ titulo: 'Excluir este treino do histórico?', texto: 'Não dá para desfazer.', ok: 'Excluir', perigo: true }).then((ok) => {
      if (!ok) return;
      update((st) => { st.sessoes = st.sessoes.filter((y) => y.id !== id); }, false);
      location.hash = '#/historico';
    });
  });
}

/* =============== AJUSTES =============== */
const FORMATO = `Monte minhas fichas neste formato JSON (responda só com o bloco de código):
{
  "config": { "nome": "Seu nome", "meta": 4 },
  "exercicios": [
    { "id": "elevacao-pelvica", "nome": "Elevação pélvica", "grupo": "Glúteos",
      "dicas": ["Dica curta 1", "Dica curta 2"],
      "cuidado": "Aviso de segurança (opcional)",
      "monitorar": "joelho (opcional: pergunta como ficou depois do exercício)",
      "video": "https://youtube.com/shorts/... (opcional)" }
  ],
  "fichas": [
    { "id": "ficha-a", "nome": "Ficha A", "foco": "Superiores",
      "itens": [ { "ex": "elevacao-pelvica", "series": 3, "reps": "12", "descanso": 60, "obs": "opcional" } ] }
  ],
  "agenda": { "seg": "ficha-a", "qua": "ficha-b" }
}
Regras: "id" em minúsculas e sem acento, "ex" precisa ser um "id" da lista de exercícios, "descanso" em segundos, dias da agenda são seg, ter, qua, qui, sex, sab, dom.`;

const SALVAR_PASSOS = [1, 2, 2.5, 5];

function nomeArquivoBackup() { return `treinos-backup-${chaveData(Date.now())}.json`; }

async function exportarBackup() {
  const texto = exportarTexto();
  const nome = nomeArquivoBackup();
  const arquivo = new File([texto], nome, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try { await navigator.share({ files: [arquivo], title: 'Backup dos treinos' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function resultadoImportacao(r, saida) {
  if (!r.ok) {
    saida.className = 'import-saida erro';
    saida.innerHTML = `<strong>Não consegui importar:</strong><ul>${r.erros.slice(0, 6).map((e) => `<li>${esc(e)}</li>`).join('')}</ul>${r.erros.length > 6 ? `<p>E mais ${r.erros.length - 6} problemas.</p>` : ''}`;
    return;
  }
  saida.className = 'import-saida ok';
  const partes = [];
  if (r.novasFichas) partes.push(plural(r.novasFichas, 'ficha nova', 'fichas novas'));
  if (r.atualizadas) partes.push(plural(r.atualizadas, 'ficha atualizada', 'fichas atualizadas'));
  if (r.novosEx) partes.push(plural(r.novosEx, 'exercício novo', 'exercícios novos'));
  if (r.exAtualizados) partes.push(plural(r.exAtualizados, 'exercício atualizado', 'exercícios atualizados'));
  if (r.agendaMudou) partes.push('agenda da semana atualizada');
  saida.textContent = partes.length ? `Pronto: ${partes.join(', ')}.` : 'Importado. Nada mudou nas fichas.';
}

export function viewAjustes(app) {
  const s = get();
  const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  app.innerHTML = `
    <div class="pagina">
      <h1 class="titulo">Ajustes</h1>

      ${!standalone && ios ? `
      <section class="aviso-instalar">
        <h2>Instale no iPhone</h2>
        <p>No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Assim o app abre em tela cheia e funciona sem internet.</p>
      </section>` : ''}

      <section class="secao">
        <h2 class="secao-titulo">Você</h2>
        <label class="campo-linha"><span>Nome</span><input type="text" data-nome value="${esc(s.config.nome)}" placeholder="Como quer ser chamada" autocomplete="off"></label>
        <div class="campo-linha">
          <span>Meta de treinos por semana<small>${s.config.meta ? '' : 'Automática, pelos dias das fichas'}</small></span>
          <div class="stepper" role="group" aria-label="Meta de treinos por semana">
            <button class="passo" data-meta="-1" aria-label="Diminuir meta">${icone.menos}</button>
            <output>${s.config.meta || 'Auto'}</output>
            <button class="passo" data-meta="1" aria-label="Aumentar meta">${icone.mais1}</button>
          </div>
        </div>
      </section>

      <section class="secao">
        <h2 class="secao-titulo">Durante o treino</h2>
        <div class="campo-linha">
          <span>Passo da carga<small>Em kg, quanto o mais e o menos mudam</small></span>
          <div class="seg-ctl" role="group" aria-label="Passo da carga">
            ${SALVAR_PASSOS.map((p) => `<button data-passo="${p}" class="${s.config.passo === p ? 'sel' : ''}" aria-pressed="${s.config.passo === p}">${fmtPeso(p)}</button>`).join('')}
          </div>
        </div>
        <div class="campo-linha">
          <span>Som ao fim do descanso</span>
          <button class="chave ${s.config.som ? 'on' : ''}" data-som role="switch" aria-checked="${s.config.som}" aria-label="Som ao fim do descanso"><i></i></button>
        </div>
      </section>

      <section class="secao">
        <h2 class="secao-titulo">Importar ficha</h2>
        <p class="nota">Peça a ficha no chat, copie o bloco de código que vier e cole aqui. Fichas com o mesmo id são atualizadas, e os vídeos que você salvou continuam.</p>
        <textarea class="import-texto" data-import placeholder='Cole aqui o texto da ficha, começando em {' rows="6" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
        <div class="import-acoes">
          <button class="btn btn-prim" data-importar>Importar</button>
          <button class="btn btn-sec" data-colar>Colar texto copiado</button>
        </div>
        <div class="import-saida" data-saida aria-live="polite"></div>
        <button class="link" data-formato>${icone.link}<span>Copiar o formato para pedir fichas no chat</span></button>
        <button class="link link-quieto" data-exemplo-a>Carregar fichas de exemplo</button>
      </section>

      <section class="secao">
        <h2 class="secao-titulo">Backup</h2>
        <p class="nota">Seus dados ficam só neste iPhone. Salve um backup de vez em quando, principalmente antes de trocar de celular.</p>
        <div class="import-acoes">
          <button class="btn btn-sec" data-exportar>${icone.subir}<span>Salvar backup</span></button>
          <label class="btn btn-sec arquivo">${icone.baixar}<span>Restaurar backup</span><input type="file" accept=".json,application/json" data-arquivo hidden></label>
        </div>
      </section>

      <section class="secao">
        <h2 class="secao-titulo">Dados</h2>
        <button class="link link-perigo" data-apagar>${icone.lixo}<span>Apagar tudo neste aparelho</span></button>
      </section>
      <p class="rodape-nota">Treinos, versão 1</p>
    </div>`;

  const saida = app.querySelector('[data-saida]');
  const area = app.querySelector('[data-import]');

  async function processar(texto) {
    const r = importarTexto(texto);
    if (r.ok && r.backup) {
      const ok = await confirmar({ titulo: 'Restaurar este backup?', texto: 'Ele substitui tudo o que está neste aparelho: fichas, histórico e ajustes.', ok: 'Restaurar', perigo: true });
      if (!ok) return;
      restaurarBackup(r.obj);
      toast('Backup restaurado.');
      recarregar();
      return;
    }
    resultadoImportacao(r, saida);
    if (r.ok) area.value = '';
  }

  app.addEventListener('click', async (e) => {
    const t = e.target;
    const meta = t.closest('[data-meta]');
    if (meta) {
      update((st) => { st.config.meta = Math.max(0, Math.min(7, st.config.meta + Number(meta.dataset.meta))); }, false);
      recarregar(); return;
    }
    const passo = t.closest('[data-passo]');
    if (passo) { update((st) => { st.config.passo = Number(passo.dataset.passo); }, false); recarregar(); return; }
    if (t.closest('[data-som]')) { update((st) => { st.config.som = !st.config.som; }, false); recarregar(); return; }
    if (t.closest('[data-importar]')) { if (!area.value.trim()) { toast('Cole o texto da ficha primeiro.'); return; } processar(area.value); return; }
    if (t.closest('[data-colar]')) {
      try { area.value = await navigator.clipboard.readText(); if (area.value.trim()) processar(area.value); else toast('A área de transferência está vazia.'); }
      catch (err) { toast('O iPhone não deixou colar sozinho. Segure no campo e toque em Colar.'); }
      return;
    }
    if (t.closest('[data-formato]')) {
      try { await navigator.clipboard.writeText(FORMATO); toast('Formato copiado. Cole no chat com o pedido da ficha.'); }
      catch (err) { area.value = FORMATO; toast('Copie o texto que apareceu no campo.'); }
      return;
    }
    if (t.closest('[data-exemplo-a]')) { const r = importarTexto(JSON.stringify(EXEMPLO)); resultadoImportacao(r, saida); return; }
    if (t.closest('[data-exportar]')) { exportarBackup(); return; }
    if (t.closest('[data-apagar]')) {
      const ok = await confirmar({ titulo: 'Apagar tudo?', texto: 'Fichas, histórico e ajustes somem deste aparelho. Salve um backup antes se quiser guardar.', ok: 'Apagar tudo', perigo: true });
      if (ok) { apagarTudo(); toast('Tudo apagado.'); recarregar(); }
    }
  });

  app.addEventListener('input', (e) => {
    if (e.target.matches('[data-nome]')) update((st) => { st.config.nome = e.target.value.trim(); }, false);
  });
  app.addEventListener('change', async (e) => {
    if (!e.target.matches('[data-arquivo]')) return;
    const arq = e.target.files[0];
    if (!arq) return;
    try { await processar(await arq.text()); } catch (err) { toast('Não consegui ler esse arquivo.'); }
    e.target.value = '';
  });
}
