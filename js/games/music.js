// Game: Musical instruments (Nhạc cụ). Free play with four Vietnamese instruments.

import { t } from '../core/i18n.js';
import { speak } from '../core/speech.js';
import { SCALE, instruments } from '../core/sound.js';
import { el, onTap, langBadge, iconButton } from '../core/ui.js';
import { INSTRUMENTS, NOTES, BAU_BASE, bendRatio } from '../logic/music.js';

const INK = '#3b2a2a';
const st = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const PICTURES = {
  trung: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M14 20 V100 M106 20 V100" ${st} fill="none"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${18 + i * 4}" y="${24 + i * 16}" width="${84 - i * 8}" height="11" rx="5" fill="${i % 2 ? '#c9d97a' : '#a3c65c'}" ${st}/>`).join('')}</svg>`,
  trong: `<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="44" rx="42" ry="16" fill="#f5deb3" ${st}/>
    <path d="M18 44 V84 Q60 110 102 84 V44 Q60 70 18 44 Z" fill="#e0463c" ${st}/><path d="M30 60 L40 92 M60 70 V100 M90 60 L80 92" stroke="#ffd166" stroke-width="3"/>
    <path d="M86 10 L66 36 M100 20 L74 40" ${st}/></svg>`,
  sao: `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="8" y="50" width="104" height="20" rx="10" fill="#d9b36a" ${st}/>
    ${[36, 52, 68, 84, 100].map((x) => `<circle cx="${x}" cy="60" r="4" fill="${INK}"/>`).join('')}<ellipse cx="18" cy="60" rx="4" ry="6" fill="${INK}"/></svg>`,
  bau: `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="10" y="62" width="100" height="22" rx="8" fill="#c28b5c" ${st}/>
    <path d="M22 62 L30 22" ${st}/><circle cx="32" cy="28" r="9" fill="#ecc98f" ${st}/><path d="M30 26 L104 66" stroke="${INK}" stroke-width="2"/></svg>`,
};

function floatNote(x, y) {
  const n = el('span', { class: 'music-note', html: `<svg viewBox="0 0 24 24"><path d="M9 18 A3 3 0 1 1 9 17.9 Z M12 18 V4 L20 2 V6 L12 8" fill="#e56b9a" stroke="#e56b9a" stroke-width="2" stroke-linejoin="round"/></svg>` });
  n.style.left = `${x}px`;
  n.style.top = `${y}px`;
  document.body.append(n);
  setTimeout(() => n.remove(), 1200);
}

function go(path) {
  location.hash = `#/play/music${path ? `/${path}` : ''}`;
}

export function mount(screen, { path }) {
  const which = INSTRUMENTS.includes(path) ? path : null;
  const cleanups = [];

  if (!which) {
    const grid = el('div', { class: 'choice-grid music-choices' }, INSTRUMENTS.map((id) => {
      const b = el('button', { class: 'choice music-choice', html: PICTURES[id], attrs: { type: 'button', 'aria-label': t(`music.${id}`) } });
      b.append(langBadge(`music.${id}`));
      onTap(b, async () => {
        await speak(`music.${id}`);
        go(id);
      });
      return b;
    }));
    screen.stage.replaceChildren(el('div', { class: 'scroll-area' }, [grid]));
    screen.say(['music.choose']);
    return () => {};
  }

  screen.tools.replaceChildren(iconButton('pictures', 'music.other', () => go(''), 'tool-btn'));
  const name = langBadge(`music.${which}`);
  name.classList.add('inline');
  screen.tools.append(name);
  const area = el('div', { class: `music-area music-${which}` });
  screen.stage.replaceChildren(area);

  if (which === 'trung') {
    NOTES.trung.forEach((note, i) => {
      const tube = el('button', { class: 'trung-tube', attrs: { type: 'button', 'aria-label': t('music.trung') } });
      tube.style.setProperty('--size', `${100 - i * 8}%`);
      tube.addEventListener('pointerdown', (e) => {
        instruments.trung(SCALE[note]);
        tube.classList.remove('is-hit');
        void tube.offsetWidth;
        tube.classList.add('is-hit');
        floatNote(e.clientX, e.clientY);
      });
      area.append(tube);
    });
  } else if (which === 'trong') {
    area.innerHTML = `<svg viewBox="0 0 300 300" class="drum-svg" role="img">
      <circle cx="150" cy="150" r="144" class="drum-rim" fill="#e0463c" stroke="${INK}" stroke-width="5"/>
      ${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<circle cx="${150 + Math.cos(a) * 126}" cy="${150 + Math.sin(a) * 126}" r="5" fill="#ffd166" pointer-events="none"/>`; }).join('')}
      <circle cx="150" cy="150" r="104" class="drum-skin" fill="#f5deb3" stroke="${INK}" stroke-width="5"/>
      <circle cx="150" cy="150" r="30" fill="#e8c38f" pointer-events="none"/></svg>`;
    const hit = (cls, fn) => area.querySelector(cls).addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      fn();
      area.classList.remove('is-hit');
      void area.offsetWidth;
      area.classList.add('is-hit');
      floatNote(e.clientX, e.clientY);
    });
    hit('.drum-skin', instruments.drum);
    hit('.drum-rim', instruments.rim);
  } else if (which === 'sao') {
    const flute = el('div', { class: 'flute' });
    NOTES.sao.forEach((note) => {
      const hole = el('button', { class: 'flute-hole', attrs: { type: 'button', 'aria-label': t('music.sao') } });
      let sound = null;
      const stop = () => {
        sound?.stop();
        sound = null;
        hole.classList.remove('is-on');
      };
      hole.addEventListener('pointerdown', (e) => {
        hole.setPointerCapture?.(e.pointerId);
        stop();
        sound = instruments.flute(SCALE[note]);
        hole.classList.add('is-on');
        floatNote(e.clientX, e.clientY);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => hole.addEventListener(ev, stop));
      cleanups.push(stop);
      flute.append(hole);
    });
    area.append(flute);
  } else {
    // Đàn bầu: pluck the string. Move the lever to change the pitch.
    const lever = el('div', { class: 'bau-lever', attrs: { role: 'slider', 'aria-label': t('music.lever') } });
    const string = el('button', { class: 'bau-string', attrs: { type: 'button', 'aria-label': t('music.bau') } }, [el('span', { class: 'bau-line' })]);
    const board = el('div', { class: 'bau-board' }, [el('div', { class: 'bau-gourd' }), lever, string]);
    area.append(board);
    let sound = null;
    let position = 0;
    string.addEventListener('pointerdown', (e) => {
      sound = instruments.bau(BAU_BASE);
      sound.bend(bendRatio(position));
      string.classList.remove('is-hit');
      void string.offsetWidth;
      string.classList.add('is-hit');
      floatNote(e.clientX, e.clientY);
    });
    let drag = null;
    lever.addEventListener('pointerdown', (e) => {
      drag = { y: e.clientY, start: position };
      lever.setPointerCapture?.(e.pointerId);
    });
    lever.addEventListener('pointermove', (e) => {
      if (!drag) return;
      position = Math.min(1, Math.max(0, drag.start + (drag.y - e.clientY) / 160));
      lever.style.setProperty('--bend', String(position));
      sound?.bend(bendRatio(position));
    });
    const end = () => { drag = null; };
    lever.addEventListener('pointerup', end);
    lever.addEventListener('pointercancel', end);
  }
  screen.say([`music.${which}`, `music.how.${which}`]);
  return () => cleanups.forEach((fn) => fn());
}
