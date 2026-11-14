// Cronômetro de descanso. Usa o horário de término (não conta segundos),
// então continua certo mesmo se o iPhone pausar o app por alguns instantes.
import { get } from './store.js';
import { icone, fmtTempo } from './ui.js';

let fim = 0;          // timestamp de término
let total = 0;        // duração original em segundos
let tick = null;
let audio = null;
let alvo = null;

function host() { return document.getElementById('rest-host'); }

// Precisa ser chamado dentro de um toque para o iOS liberar o som.
export function liberarSom() {
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch (e) { /* sem áudio, segue sem som */ }
}

function bip() {
  if (get().config.som && audio) {
    try {
      [0, 0.22, 0.44].forEach((atraso) => {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.type = 'sine';
        o.frequency.value = atraso === 0.44 ? 988 : 784;
        g.gain.setValueAtTime(0.0001, audio.currentTime + atraso);
        g.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + atraso + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + atraso + 0.18);
        o.connect(g); g.connect(audio.destination);
        o.start(audio.currentTime + atraso); o.stop(audio.currentTime + atraso + 0.2);
      });
    } catch (e) { /* ok */ }
  }
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) { /* iOS não vibra */ }
}

export function iniciarDescanso(segundos) {
  total = Math.max(5, segundos);
  fim = Date.now() + total * 1000;
  desenhar(true);
  clearInterval(tick);
  tick = setInterval(atualizar, 250);
}

export function descansoAtivo() { return fim > 0; }

export function pararDescanso() {
  clearInterval(tick);
  tick = null; fim = 0; alvo = null;
  const h = host();
  h.innerHTML = '';
}

function ajustar(delta) {
  fim += delta * 1000;
  total = Math.max(5, total + delta);
  if (fim - Date.now() <= 0) { concluir(); return; }
  atualizar();
}

function concluir() {
  bip();
  const el = host().querySelector('.descanso');
  if (el) {
    el.classList.add('pronto');
    el.querySelector('.descanso-tempo').textContent = 'Bora!';
    el.querySelector('.descanso-sub').textContent = 'Descanso terminou';
  }
  clearInterval(tick); tick = null; fim = 0;
  setTimeout(() => { if (!fim) pararDescanso(); }, 3500);
}

const C = 2 * Math.PI * 21;

function atualizar() {
  const resta = (fim - Date.now()) / 1000;
  if (resta <= 0) { concluir(); return; }
  if (!alvo) return;
  alvo.tempo.textContent = fmtTempo(Math.ceil(resta));
  alvo.anel.setAttribute('stroke-dashoffset', String(C * (1 - resta / total)));
}

function desenhar(novo) {
  const h = host();
  if (novo || !h.firstElementChild) {
    h.innerHTML = `
      <div class="descanso" role="timer" aria-label="Descanso">
        <svg class="descanso-anel" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="21" class="anel-fundo"/>
          <circle cx="24" cy="24" r="21" class="anel-prog" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 24 24)"/>
        </svg>
        <div class="descanso-txt">
          <span class="descanso-tempo">0:00</span>
          <span class="descanso-sub">Descansando</span>
        </div>
        <button class="descanso-btn" data-rest="-15" aria-label="Menos 15 segundos">${icone.menos}<span>15</span></button>
        <button class="descanso-btn" data-rest="15" aria-label="Mais 15 segundos">${icone.mais1}<span>15</span></button>
        <button class="descanso-pular" data-rest="pular">Pular</button>
      </div>`;
    h.firstElementChild.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rest]');
      if (!b) return;
      const v = b.dataset.rest;
      if (v === 'pular') pararDescanso(); else ajustar(Number(v));
    });
  }
  const el = h.firstElementChild;
  alvo = { tempo: el.querySelector('.descanso-tempo'), anel: el.querySelector('.anel-prog') };
  atualizar();
}

// Se o app voltar do segundo plano com o descanso já vencido, avisa na hora.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && fim) atualizar();
});
