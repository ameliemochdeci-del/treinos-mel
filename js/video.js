// Links de vídeo por exercício. YouTube (inclusive Shorts) toca dentro do app.
// TikTok, Instagram e outros abrem no app deles.
import { esc, icone, abrirFolha } from './ui.js';

export function lerVideo(url) {
  const u = String(url || '').trim();
  if (!u) return null;
  let o;
  try { o = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`); } catch (e) { return { tipo: 'invalido', url: u }; }
  const host = o.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id = '';
  let vertical = false;
  if (host === 'youtu.be') id = o.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (o.pathname.startsWith('/shorts/')) { id = o.pathname.split('/')[2]; vertical = true; }
    else if (o.pathname.startsWith('/embed/')) id = o.pathname.split('/')[2];
    else if (o.pathname.startsWith('/live/')) id = o.pathname.split('/')[2];
    else id = o.searchParams.get('v') || '';
  }
  if (id && /^[\w-]{11}$/.test(id)) return { tipo: 'youtube', id, vertical, url: o.href };
  if (host.endsWith('tiktok.com')) return { tipo: 'tiktok', url: o.href, nome: 'TikTok' };
  if (host.endsWith('instagram.com')) return { tipo: 'instagram', url: o.href, nome: 'Instagram' };
  return { tipo: 'outro', url: o.href, nome: host };
}

export function miniatura(ex, tamanho = 'm') {
  const v = lerVideo(ex.video);
  const selo = v && v.tipo !== 'invalido' ? `<span class="mini-play">${icone.play}</span>` : '';
  if (v && v.tipo === 'youtube') {
    return `<span class="mini mini-${tamanho}"><img data-thumb src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy">${selo}</span>`;
  }
  return `<span class="mini mini-${tamanho} mini-vazia">${icone.haltere}${selo}</span>`;
}

export function abrirVideo(ex) {
  const v = lerVideo(ex.video);
  if (!v || v.tipo === 'invalido') return;
  if (v.tipo === 'youtube') {
    abrirFolha(`
      <h2 class="sheet-titulo">${esc(ex.nome)}</h2>
      <div class="player ${v.vertical ? 'player-vertical' : ''}">
        <iframe src="https://www.youtube-nocookie.com/embed/${v.id}?playsinline=1&rel=0&modestbranding=1"
          title="Vídeo de ${esc(ex.nome)}" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>
      <p class="sheet-nota">Sem internet o vídeo não carrega. O restante do app funciona normalmente.</p>
      <a class="btn btn-sec btn-bloco" href="${esc(v.url)}" target="_blank" rel="noopener">${icone.externo}<span>Abrir no YouTube</span></a>`,
      { classe: 'sheet-video', aoFechar: () => { const f = document.querySelector('.player iframe'); if (f) f.src = 'about:blank'; } });
    return;
  }
  abrirFolha(`
    <h2 class="sheet-titulo">${esc(ex.nome)}</h2>
    <p class="sheet-texto">Esse vídeo é do ${esc(v.nome)} e abre no app dele.</p>
    <a class="btn btn-prim btn-bloco" href="${esc(v.url)}" target="_blank" rel="noopener">${icone.externo}<span>Abrir no ${esc(v.nome)}</span></a>`);
}
