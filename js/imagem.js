// Imagem de cada exercício: a foto que a Mel tirou do aparelho dela ou, se não tiver,
// uma imagem de referência que vem junto com o app (2 posições, que alternam sozinhas).
import { fotoDe, salvarFoto, removerFoto } from './store.js';
import { esc, icone, abrirFolha, toast } from './ui.js';

// Imagem de referência padrão de cada exercício (vale mesmo sem carregar o plano).
const REF_PADRAO = {
 "leg-press": "leg-press",
 "puxada-frente": "puxada-frente",
 "ponte-minibanda": "ponte-glute",
 "mesa-flexora": "mesa-flexora",
 "terra-romeno-halteres": "terra-romeno",
 "cadeira-abdutora": "abdutora",
 "pelvica-unilateral": "ponte-unilateral",
 "cadeira-flexora": "cadeira-flexora",
 "panturrilha-em-pe": "panturrilha-em-pe",
 "prancha-lateral": "prancha-lateral",
 "supino-maquina": "supino-maquina",
 "desenvolvimento-halteres": "desenvolvimento",
 "crucifixo-maquina": "peck-deck",
 "elevacao-lateral": "elevacao-lateral",
 "triceps-corda": "triceps-corda",
 "prancha": "prancha",
  "remada-baixa": "remada-baixa",
 "remada-maquina": "remada-maquina",
 "crucifixo-inverso": "crucifixo-inverso",
 "rosca-martelo": "rosca-martelo",
 "dead-bug": "dead-bug",
 "cadeira-extensora": "extensora",
 "hiperextensao-45": "hiperextensao",
 "coice-cabo": "coice-cabo",
 "cardio-bike": "bike",
 "cardio-eliptico": "eliptico",
 "cardio-esteira": "esteira"
};

// Ilustrações próprias, só para exercícios sem foto de referência segura.
const ILU = new Set(["hip-thrust-maquina", "mobilidade-tornozelo", "isometria-quadriceps", "abducao-cabo", "cardio-livre"]);

export function imagemDe(ex) {
  const foto = fotoDe(ex.id);
  if (foto) return { tipo: 'foto', src: foto };
  // um ref antigo salvo no aparelho só vale se a foto ainda existe no app
  const refs = Object.values(REF_PADRAO);
  const ref = REF_PADRAO[ex.id] || (refs.includes(ex.ref) ? ex.ref : '');
  if (ref) return { tipo: 'ref', a: `img/ref/${ref}-0.jpg`, b: `img/ref/${ref}-1.jpg` };
  if (ILU.has(ex.id)) {
    return { tipo: 'ilu', a: `img/ilu/${ex.id}-0.svg`, b: `img/ilu/${ex.id}-1.svg` };
  }
  return null;
}

// Miniatura quadrada para listas. Cai no vídeo ou no ícone quando não há imagem.
export function miniaturaImagem(ex, tamanho = 'm', fallback = '') {
  const im = imagemDe(ex);
  if (!im) return fallback;
  const src = im.tipo === 'foto' ? im.src : im.a;
  return `<span class="mini mini-${tamanho} mini-img"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"></span>`;
}

// Bloco grande do exercício. Tocar na imagem abre as duas posições em tela cheia.
// video: mostra o botão "Vídeo" em cima da imagem. vazio: sem imagem, mostra o convite para tirar a foto.
export function blocoImagem(ex, { video = false, vazio = false } = {}) {
  const im = imagemDe(ex);
  if (!im) {
    if (!vazio) return '';
    return `<button class="ex-img ex-img-vazia" data-foto aria-label="Adicionar foto do aparelho">
      <span class="ex-img-vazio">${icone.camera}<strong>Foto do aparelho</strong><span>Tire uma foto para reconhecer o aparelho na academia</span></span>
    </button>`;
  }
  const pilula = video ? `<button class="ex-img-video" data-video aria-label="Ver vídeo de execução">${icone.play}<span>Vídeo</span></button>` : '';
  const miolo = im.tipo === 'foto'
    ? `<img src="${im.src}" alt="Foto do aparelho: ${esc(ex.nome)}">`
    : `<img class="troca a" src="${im.a}" alt="${esc(ex.nome)}, posição inicial"><img class="troca b" src="${im.b}" alt="posição final">`;
  return `<div class="ex-img">
    <button class="ex-img-ver" data-ver-img aria-label="Ampliar imagem">${miolo}</button>
    <span class="ex-img-selo">${im.tipo === 'foto' ? 'Sua foto' : im.tipo === 'ilu' ? 'Ilustração' : 'Referência'}</span>
    <button class="ex-img-cam" data-foto aria-label="${im.tipo === 'foto' ? 'Trocar foto do aparelho' : 'Tirar foto do meu aparelho'}">${icone.camera}</button>
    ${pilula}
  </div>`;
}

export function abrirImagem(ex, aoFechar) {
  const im = imagemDe(ex);
  if (!im) return;
  const corpo = im.tipo === 'foto'
    ? `<img class="img-grande" src="${im.src}" alt="Foto do aparelho: ${esc(ex.nome)}">`
    : `<figure class="img-fig"><img class="img-grande" src="${im.a}" alt="Posição inicial"><figcaption>Início</figcaption></figure>
       <figure class="img-fig"><img class="img-grande" src="${im.b}" alt="Posição final"><figcaption>Final</figcaption></figure>`;
  abrirFolha(`
    <h2 class="sheet-titulo">${esc(ex.nome)}</h2>
    <div class="img-pilha">${corpo}</div>
    <p class="sheet-nota">${im.tipo === 'foto' ? 'Foto tirada por você.' : 'Imagem de referência. O aparelho da sua academia pode ser um pouco diferente.'}</p>`,
  { classe: 'sheet-imagem', aoFechar });
}

/* ---------- foto do aparelho ---------- */
function reduzir(arquivo, maximo = 640, qualidade = 0.68) {
  return new Promise((ok, falha) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const f = Math.min(1, maximo / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * f));
      c.height = Math.max(1, Math.round(img.naturalHeight * f));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('imagem')); };
    img.src = url;
  });
}

// Abre a câmera (ou a galeria) e guarda a foto reduzida neste aparelho.
export function escolherFoto(ex, aoSalvar) {
  const entrada = document.createElement('input');
  entrada.type = 'file';
  entrada.accept = 'image/*';
  entrada.style.display = 'none';
  entrada.addEventListener('change', async () => {
    const arq = entrada.files && entrada.files[0];
    entrada.remove();
    if (!arq) return;
    try {
      const url = await reduzir(arq);
      if (!salvarFoto(ex.id, url)) { toast('Não coube. Apague outra foto ou faça um backup e tente de novo.'); return; }
      toast('Foto salva.');
      if (aoSalvar) aoSalvar();
    } catch (e) {
      toast('Não consegui abrir essa foto. Tente outra.');
    }
  });
  document.body.appendChild(entrada);
  entrada.click();
}

export function tirarFoto(ex, aoSalvar) {
  removerFoto(ex.id);
  if (aoSalvar) aoSalvar();
}
