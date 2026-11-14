// Dados do app. Tudo fica no aparelho (localStorage), nada vai para servidor.
const CHAVE = 'treinos:v1';

export const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
export const DIAS_NOME = {
  seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo'
};

function vazio() {
  return {
    v: 1,
    exercicios: {},   // id -> { id, nome, grupo, dicas[], cuidado, video }
    fichas: [],       // { id, nome, foco, itens: [{ ex, series, reps, descanso, obs }] }
    agenda: {},       // seg..dom -> id da ficha
    sessoes: [],      // { id, fichaId, nome, inicio, fim, sets: {exId: [{peso, reps, ok}]}, joelho: {exId: 0|1|2} }
    rascunho: null,   // treino em andamento
    config: { nome: '', som: true, passo: 2.5, meta: 0 }
  };
}

let estado = carregar();
const ouvintes = new Set();

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return { ...vazio(), ...JSON.parse(bruto) };
  } catch (e) { /* dados corrompidos: começa limpo */ }
  return vazio();
}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    return true;
  } catch (e) {
    return false;
  }
}

export const get = () => estado;

export function update(fn, avisar = true) {
  fn(estado);
  const ok = salvar();
  if (avisar) ouvintes.forEach((f) => f());
  return ok;
}

export function subscribe(f) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export function pedirArmazenamentoPersistente() {
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ok */ }
}

/* ---------- datas ---------- */
export const chaveData = (ms) => {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
};

export const indiceDia = (ms = Date.now()) => (new Date(ms).getDay() + 6) % 7; // 0 = segunda

export function diasDaSemana(ms = Date.now()) {
  const d = new Date(ms);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - indiceDia(ms));
  return DIAS.map((_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x.getTime();
  });
}

export function sessoesDoDia(chave) {
  return estado.sessoes.filter((s) => chaveData(s.fim || s.inicio) === chave);
}

export function treinosNaSemana(ms = Date.now()) {
  const chaves = new Set(diasDaSemana(ms).map(chaveData));
  const dias = new Set();
  estado.sessoes.forEach((s) => {
    const c = chaveData(s.fim || s.inicio);
    if (chaves.has(c)) dias.add(c);
  });
  return dias.size;
}

export function metaSemanal() {
  if (estado.config.meta > 0) return estado.config.meta;
  const naAgenda = Object.values(estado.agenda).filter(Boolean).length;
  return naAgenda || 3;
}

/* ---------- consultas ---------- */
export const fichaPorId = (id) => estado.fichas.find((f) => f.id === id);

export function fichaDeHoje() {
  const id = estado.agenda[DIAS[indiceDia()]];
  return id ? fichaPorId(id) : null;
}

export function parseReps(reps) {
  const n = parseInt(String(reps).replace(/[^\d-]/g, '').split('-')[0], 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

// Séries feitas na última sessão que teve este exercício.
export function ultimoRegistro(exId, ignorarSessao) {
  for (let i = estado.sessoes.length - 1; i >= 0; i--) {
    const s = estado.sessoes[i];
    if (s.id === ignorarSessao) continue;
    const sets = (s.sets[exId] || []).filter((x) => x.ok);
    if (sets.length) return { quando: s.fim || s.inicio, sets };
  }
  return null;
}

export function historicoDoExercicio(exId) {
  const lista = [];
  estado.sessoes.forEach((s) => {
    const sets = (s.sets[exId] || []).filter((x) => x.ok);
    if (!sets.length) return;
    const maximo = Math.max(...sets.map((x) => x.peso || 0));
    lista.push({ id: s.id, quando: s.fim || s.inicio, maximo, sets, joelho: s.joelho ? s.joelho[exId] : undefined });
  });
  return lista;
}

export function recordeAnterior(exId, ignorarSessao) {
  let melhor = 0;
  estado.sessoes.forEach((s) => {
    if (s.id === ignorarSessao) return;
    (s.sets[exId] || []).forEach((x) => { if (x.ok && x.peso > melhor) melhor = x.peso; });
  });
  return melhor;
}

export function volumeDaSessao(s) {
  let total = 0;
  Object.values(s.sets).forEach((lista) => lista.forEach((x) => { if (x.ok) total += (x.peso || 0) * (x.reps || 0); }));
  return total;
}

export function seriesFeitas(s) {
  let n = 0;
  Object.values(s.sets).forEach((lista) => lista.forEach((x) => { if (x.ok) n++; }));
  return n;
}

export function minutosEstimados(ficha) {
  const seg = ficha.itens.reduce((t, it) => {
    const ex = estado.exercicios[it.ex];
    if (ex && /^cardio$/i.test(ex.grupo || '')) return t + parseReps(it.reps) * 60 * it.series;
    return t + it.series * (40 + (it.descanso || 60));
  }, 0);
  return Math.max(5, Math.round(seg / 60 / 5) * 5);
}

/* ---------- importar e exportar ---------- */
function limparTexto(texto) {
  return String(texto).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
}

function validarPlano(obj) {
  const erros = [];
  const exs = Array.isArray(obj.exercicios) ? obj.exercicios : [];
  const fichas = Array.isArray(obj.fichas) ? obj.fichas : [];
  const ids = new Set(Object.keys(estado.exercicios));
  exs.forEach((e, i) => {
    if (!e || typeof e.id !== 'string' || typeof e.nome !== 'string') erros.push(`Exercício ${i + 1}: faltam "id" ou "nome".`);
    else ids.add(e.id);
  });
  fichas.forEach((f, i) => {
    if (!f || typeof f.id !== 'string' || typeof f.nome !== 'string') { erros.push(`Ficha ${i + 1}: faltam "id" ou "nome".`); return; }
    if (!Array.isArray(f.itens) || !f.itens.length) { erros.push(`Ficha "${f.nome}": sem exercícios em "itens".`); return; }
    f.itens.forEach((it, j) => {
      if (!it || !ids.has(it.ex)) erros.push(`Ficha "${f.nome}", item ${j + 1}: o exercício "${it && it.ex}" não existe.`);
      else if (!(Number(it.series) > 0)) erros.push(`Ficha "${f.nome}", item ${j + 1}: "series" precisa ser um número.`);
    });
  });
  if (obj.agenda && typeof obj.agenda === 'object') {
    const idsFichas = new Set([...fichas.map((f) => f.id), ...estado.fichas.map((f) => f.id)]);
    Object.entries(obj.agenda).forEach(([dia, id]) => {
      if (!DIAS.includes(dia)) erros.push(`Agenda: "${dia}" não é um dia válido (use seg, ter, qua, qui, sex, sab, dom).`);
      else if (id && !idsFichas.has(id)) erros.push(`Agenda: a ficha "${id}" não existe.`);
    });
  }
  return erros;
}

// Aceita um plano (fichas e exercícios) ou um backup completo.
export function importarTexto(texto) {
  let obj;
  try { obj = JSON.parse(limparTexto(texto)); }
  catch (e) { return { ok: false, erros: ['Esse texto não é um JSON válido. Copie o bloco inteiro, do { até o }.'] }; }
  if (!obj || typeof obj !== 'object') return { ok: false, erros: ['O conteúdo precisa ser um objeto JSON.'] };

  if (Array.isArray(obj.sessoes)) return { ok: true, backup: true, obj };

  const erros = validarPlano(obj);
  if (erros.length) return { ok: false, erros };

  let novosEx = 0, exAtualizados = 0, novasFichas = 0, atualizadas = 0, removidas = 0, agendaMudou = false;
  update((s) => {
    (obj.exercicios || []).forEach((e) => {
      const antigo = s.exercicios[e.id];
      if (!antigo) novosEx++; else exAtualizados++;
      s.exercicios[e.id] = {
        id: e.id,
        nome: e.nome,
        grupo: e.grupo || (antigo && antigo.grupo) || '',
        dicas: Array.isArray(e.dicas) ? e.dicas : (antigo && antigo.dicas) || [],
        cuidado: e.cuidado !== undefined ? e.cuidado : (antigo && antigo.cuidado) || '',
        monitorar: e.monitorar !== undefined ? String(e.monitorar) : (antigo && antigo.monitorar) || '',
        // o link de vídeo que você salvou no app não é apagado por uma importação sem vídeo
        // "manterVideos": true no plano = o vídeo que você já tem salvo vence o do plano
        video: (obj.manterVideos ? ((antigo && antigo.video) || e.video) : (e.video || (antigo && antigo.video))) || '',
        // nome da imagem de referência que vem junto com o app (pasta img/ref)
        ref: (typeof e.ref === 'string' && /^[a-z0-9-]+$/.test(e.ref) ? e.ref : '') || (antigo && antigo.ref) || ''
      };
    });
    (obj.fichas || []).forEach((f) => {
      const ficha = {
        id: f.id,
        nome: f.nome,
        foco: f.foco || '',
        itens: f.itens.map((it) => ({
          ex: it.ex,
          series: Number(it.series),
          reps: it.reps === undefined ? '10' : String(it.reps),
          descanso: Number(it.descanso) > 0 ? Number(it.descanso) : 60,
          obs: it.obs || ''
        }))
      };
      const pos = s.fichas.findIndex((x) => x.id === f.id);
      if (pos >= 0) { s.fichas[pos] = ficha; atualizadas++; } else { s.fichas.push(ficha); novasFichas++; }
    });
    // "removerFichas": ["id", ...] tira fichas antigas (o histórico de treinos continua salvo)
    if (Array.isArray(obj.removerFichas)) {
      obj.removerFichas.forEach((id) => {
        const pos = s.fichas.findIndex((x) => x.id === id);
        if (pos >= 0) { s.fichas.splice(pos, 1); removidas++; }
        Object.keys(s.agenda).forEach((dia) => { if (s.agenda[dia] === id) { delete s.agenda[dia]; agendaMudou = true; } });
        if (s.rascunho && s.rascunho.fichaId === id) s.rascunho = null;
      });
    }
    if (obj.agenda) Object.entries(obj.agenda).forEach(([dia, id]) => { agendaMudou = true; if (id) s.agenda[dia] = id; else delete s.agenda[dia]; });
    if (obj.config && typeof obj.config === 'object') {
      if (typeof obj.config.nome === 'string') s.config.nome = obj.config.nome;
      if (Number(obj.config.meta) >= 0) s.config.meta = Number(obj.config.meta);
    }
  });
  return { ok: true, novosEx, exAtualizados, novasFichas, atualizadas, removidas, agendaMudou };
}

/* ---------- fotos dos aparelhos (cada uma numa chave própria, para não pesar o resto) ---------- */
const FOTO = 'treinos:foto:';
export function fotoDe(exId) {
  try { return localStorage.getItem(FOTO + exId) || ''; } catch (e) { return ''; }
}
export function salvarFoto(exId, dataUrl) {
  try { localStorage.setItem(FOTO + exId, dataUrl); return true; } catch (e) { return false; }
}
export function removerFoto(exId) {
  try { localStorage.removeItem(FOTO + exId); } catch (e) { /* ok */ }
}
function todasFotos() {
  const o = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(FOTO)) o[k.slice(FOTO.length)] = localStorage.getItem(k);
    }
  } catch (e) { /* ok */ }
  return o;
}
function apagarFotos() {
  Object.keys(todasFotos()).forEach(removerFoto);
}

export function exportarTexto() {
  const fotos = todasFotos();
  return JSON.stringify(Object.keys(fotos).length ? { ...estado, fotos } : estado, null, 2);
}

export function restaurarBackup(obj) {
  const { fotos, ...resto } = obj;
  estado = { ...vazio(), ...resto, config: { ...vazio().config, ...(resto.config || {}) } };
  salvar();
  if (fotos && typeof fotos === 'object') {
    apagarFotos();
    Object.entries(fotos).forEach(([id, url]) => { if (typeof url === 'string' && url.startsWith('data:image/')) salvarFoto(id, url); });
  }
  ouvintes.forEach((f) => f());
}

export function apagarTudo() {
  estado = vazio();
  salvar();
  apagarFotos();
  ouvintes.forEach((f) => f());
}

export const novoId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
