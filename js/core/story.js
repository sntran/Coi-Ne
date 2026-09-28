// The short picture story at the start of each folk game.
// The pictures are original SVG scenes of children in a Vietnamese village.

import { speakAll, stopSpeech } from './speech.js';
import { el, iconButton, onTap } from './ui.js';
import { mascotMarkup } from './mascot.js';

const INK = '#3b2a2a';
const SKIN = '#f2c7a5';
const seen = new Set();

/** A child. pose: 'stand', 'sit', or 'squat'. hair: 'bob', 'short', or 'buns'. */
export function kid(x, y, { shirt = '#e0463c', pants = '#3f6fd8', hair = 'short', pose = 'stand', arms = 'down', flip = false } = {}) {
  const s = flip ? -1 : 1;
  const hairShape = {
    bob: `<path d="M-19 -4 Q-20 -30 0 -30 Q20 -30 19 -4 L14 -2 Q12 -18 0 -18 Q-12 -18 -14 -2 Z" fill="${INK}"/>`,
    short: `<path d="M-17 -10 Q-16 -30 0 -29 Q17 -30 17 -10 Q8 -20 -2 -18 Q-10 -18 -17 -10 Z" fill="${INK}"/>`,
    buns: `<path d="M-17 -8 Q-16 -30 0 -29 Q17 -30 17 -8 Q8 -20 0 -19 Q-8 -20 -17 -8 Z" fill="${INK}"/>
      <circle cx="-15" cy="-26" r="7" fill="${INK}"/><circle cx="15" cy="-26" r="7" fill="${INK}"/>`,
  }[hair];
  const head = `<circle cx="0" cy="-12" r="17" fill="${SKIN}" stroke="${INK}" stroke-width="2.5"/>${hairShape}
    <circle cx="-6" cy="-10" r="2.2" fill="${INK}"/><circle cx="6" cy="-10" r="2.2" fill="${INK}"/>
    <path d="M-5 -3 Q0 1 5 -3" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="-11" cy="-5" r="3" fill="#f5a3b5" opacity="0.7"/><circle cx="11" cy="-5" r="3" fill="#f5a3b5" opacity="0.7"/>`;
  const armPath = {
    down: 'M-14 12 L-20 34 M14 12 L20 34',
    up: 'M-14 12 L-24 -6 M14 12 L24 -6',
    front: 'M-14 12 L-4 30 M14 12 L26 26',
    back: 'M-14 12 L-10 32 M14 12 L10 32',
  }[arms];
  let body;
  if (pose === 'stand') {
    body = `<path d="M-8 40 L-9 62 M8 40 L9 62" stroke="${pants}" stroke-width="9" stroke-linecap="round"/>
      <path d="${armPath}" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>
      <rect x="-15" y="4" width="30" height="38" rx="10" fill="${shirt}" stroke="${INK}" stroke-width="2.5"/>`;
  } else {
    body = `<path d="M-10 34 Q-24 38 -26 48 M10 34 Q24 38 26 48" stroke="${pants}" stroke-width="10" stroke-linecap="round" fill="none"/>
      <path d="${armPath}" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>
      <rect x="-15" y="4" width="30" height="34" rx="10" fill="${shirt}" stroke="${INK}" stroke-width="2.5"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s} 1)">${body}${head}</g>`;
}

function village(extra = '', night = false) {
  return `
    <rect width="400" height="260" fill="${night ? '#34406b' : '#dff1fb'}"/>
    <circle cx="340" cy="46" r="24" fill="${night ? '#fff4c2' : '#ffd166'}"/>
    ${night ? [[40, 30], [110, 60], [180, 24], [250, 50], [300, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#fff4c2"/>`).join('') : ''}
    <path d="M0 150 Q80 120 160 146 Q260 110 400 140 V260 H0 Z" fill="#b5d99c"/>
    <path d="M0 190 Q200 170 400 190 V260 H0 Z" fill="#e8d3a3"/>
    <g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M36 150 L60 110 L112 110 L136 150 Z" fill="#d9a86a"/>
      <rect x="48" y="150" width="76" height="34" fill="#fff4dc"/>
      <rect x="78" y="160" width="16" height="24" fill="#9c6b43"/>
      <path d="M300 170 Q296 110 306 70" fill="none" stroke="#4f8f5a" stroke-width="8"/>
      <path d="M316 172 Q316 120 330 84" fill="none" stroke="#7cb87a" stroke-width="7"/>
      <path d="M306 76 q-22 -6 -34 6 q18 6 34 -6 M306 96 q24 -8 34 4 q-20 8 -34 -4 M330 90 q20 -10 32 0 q-18 10 -32 0" fill="#7cb87a"/>
      <path d="M200 176 L204 118" stroke="#9c6b43" stroke-width="10" fill="none"/>
      <circle cx="204" cy="102" r="30" fill="#7cb87a"/><circle cx="182" cy="116" r="20" fill="#9fcf7a"/><circle cx="226" cy="114" r="20" fill="#9fcf7a"/>
    </g>
    ${extra}`;
}

const pebbleDot = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="2.6" fill="#7d8ca3"/>`;

function river() {
  return `
    <rect width="400" height="260" fill="#dff1fb"/>
    <circle cx="60" cy="46" r="24" fill="#ffd166"/>
    <path d="M0 120 Q100 104 200 118 Q300 104 400 118 V150 H0 Z" fill="#9fcf7a"/>
    <g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
      ${[70, 150, 320].map((x) => `<path d="M${x} 122 Q${x - 4} 90 ${x + 6} 60" fill="none" stroke="#9c6b43" stroke-width="6"/>
        <path d="M${x + 6} 60 q-26 -2 -34 12 M${x + 6} 60 q24 -8 36 6 M${x + 6} 60 q-10 -20 -30 -18 M${x + 6} 60 q14 -20 32 -16" fill="none" stroke="#4f8f5a" stroke-width="5"/>`).join('')}
    </g>
    <path d="M0 140 H400 V260 H0 Z" fill="#7cc3e0"/>
    <path d="M20 180 q20 -8 40 0 M140 210 q20 -8 40 0 M280 176 q20 -8 40 0 M320 230 q20 -8 40 0" fill="none" stroke="#dff1fb" stroke-width="3" stroke-linecap="round"/>`;
}

/** Backgrounds for the sticker book. */
export const backdrops = {
  village: () => village(''),
  night: () => village('', true),
  river,
};

/** The pictures for the stories. */
export const scenes = {
  village: () => village(`${kid(150, 190, { shirt: '#e0463c', hair: 'buns', arms: 'up' })}${kid(250, 196, { shirt: '#3fa35b', pants: '#9c6b43', arms: 'up', flip: true })}${kid(360, 200, { shirt: '#f7923a', hair: 'bob' })}`),
  oanquan: () => village(`
    <g stroke="${INK}" stroke-width="2.5" fill="none">
      <path d="M150 214 H270 V244 H150 Z M150 214 A15 15 0 0 0 150 244 M270 214 A15 15 0 0 1 270 244 M150 229 H270 M174 214 V244 M198 214 V244 M222 214 V244 M246 214 V244"/>
    </g>
    ${[160, 186, 210, 234, 258].map((x) => pebbleDot(x, 221) + pebbleDot(x + 5, 224) + pebbleDot(x, 236) + pebbleDot(x + 5, 238)).join('')}
    <ellipse cx="140" cy="229" rx="6" ry="5" fill="#7d8ca3"/><ellipse cx="280" cy="229" rx="6" ry="5" fill="#7d8ca3"/>
    ${kid(110, 196, { shirt: '#e0463c', hair: 'buns', pose: 'squat', arms: 'front' })}
    ${kid(310, 196, { shirt: '#6cc6f0', pose: 'squat', arms: 'front', flip: true })}`),
  taptamvong: () => village(`
    ${kid(150, 186, { shirt: '#f58fb8', hair: 'bob', arms: 'back' })}
    ${kid(250, 186, { shirt: '#3fa35b', arms: 'front', flip: true })}
    <path d="M200 120 q0 -16 12 -16 q12 0 12 12 q0 10 -12 12 v8" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="212" cy="138" r="3" fill="${INK}"/>`),
  oantuti: () => village(`
    ${kid(140, 186, { shirt: '#f7923a', hair: 'short', arms: 'front' })}
    ${kid(260, 186, { shirt: '#9b6bd6', hair: 'buns', arms: 'front', flip: true })}
    <g stroke="${INK}" stroke-width="2.5"><circle cx="176" cy="206" r="9" fill="${SKIN}"/>
    <path d="M224 214 l-8 -18 M228 212 l2 -20" stroke="${SKIN}" stroke-width="6" stroke-linecap="round"/><circle cx="226" cy="214" r="8" fill="${SKIN}"/></g>`),
  choichuyen: () => village(`
    ${kid(140, 200, { shirt: '#e0463c', hair: 'buns', pose: 'sit', arms: 'up' })}
    ${kid(270, 200, { shirt: '#f58fb8', hair: 'bob', pose: 'sit', arms: 'front', flip: true })}
    <circle cx="164" cy="112" r="11" fill="#f7923a" stroke="${INK}" stroke-width="2.5"/>
    <g stroke="#9c6b43" stroke-width="4" stroke-linecap="round">
      <path d="M180 240 L214 232 M190 246 L226 244 M200 236 L236 238 M214 248 L246 242 M178 250 L206 250"/>
    </g>`),
  tet: () => village(`
    ${[[188, 96], [204, 84], [220, 98], [196, 112], [214, 118], [178, 116], [230, 112], [204, 102]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#ffd23f" stroke="${INK}" stroke-width="1.5"/>`).join('')}
    <g stroke="${INK}" stroke-width="2"><path d="M60 150 V158 M112 150 V158" /><ellipse cx="60" cy="166" rx="9" ry="10" fill="#e0463c"/><ellipse cx="112" cy="166" rx="9" ry="10" fill="#e0463c"/></g>
    ${kid(160, 196, { shirt: '#e0463c', hair: 'buns', arms: 'front' })}
    ${kid(262, 190, { shirt: '#9b6bd6', pants: '#3b2a2a', hair: 'bob', arms: 'front', flip: true })}
    <rect x="200" y="196" width="18" height="24" rx="3" fill="#e0463c" stroke="${INK}" stroke-width="2"/><circle cx="209" cy="206" r="4" fill="#ffd23f"/>`),
  trungthu: () => village(`
    ${kid(140, 196, { shirt: '#e0463c', hair: 'buns', arms: 'up' })}
    ${kid(250, 196, { shirt: '#3fa35b', arms: 'up', flip: true })}
    <g stroke="${INK}" stroke-width="2"><path d="M116 176 L108 130 M274 176 L282 130" stroke-width="3"/>
      <path d="M108 104 L113 118 L128 118 L116 127 L121 142 L108 133 L95 142 L100 127 L88 118 L103 118 Z" fill="#e0463c"/>
      <ellipse cx="284" cy="120" rx="16" ry="11" fill="#f7923a"/><path d="M298 120 L310 112 V128 Z" fill="#ffd23f"/></g>
    <circle cx="108" cy="124" r="22" fill="#ffd166" opacity="0.25"/><circle cx="284" cy="120" r="22" fill="#ffd166" opacity="0.25"/>`, true),
  chichi: () => village(`
    ${kid(120, 196, { shirt: '#3f6fd8', pose: 'sit', arms: 'front' })}
    ${kid(290, 196, { shirt: '#f58fb8', hair: 'buns', pose: 'sit', arms: 'front', flip: true })}
    ${kid(205, 170, { shirt: '#f7923a', hair: 'bob', pose: 'sit', arms: 'front' })}
    <g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M176 224 Q172 206 186 202 L226 200 Q240 204 236 222 Q226 236 204 236 Q182 236 176 224 Z" fill="${SKIN}"/>
      <path d="M186 204 L180 190 M196 201 L194 186 M208 200 L210 185 M220 201 L226 188" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>
      <path d="M150 222 L196 218 M262 222 L214 216" stroke="${SKIN}" stroke-width="6" stroke-linecap="round"/>
    </g>`),
  nuna: () => village(`
    ${[[110, '#e0463c', 'buns'], [200, '#3fa35b', 'short'], [290, '#9b6bd6', 'bob']].map(([x, shirt, hair]) => `
      <g stroke="${INK}" stroke-width="2.5"><rect x="${x - 15}" y="222" width="11" height="32" rx="5" fill="#3f6fd8"/><rect x="${x + 4}" y="222" width="11" height="32" rx="5" fill="#3f6fd8"/>
      <ellipse cx="${x - 9}" cy="254" rx="8" ry="5" fill="${SKIN}"/><ellipse cx="${x + 9}" cy="254" rx="8" ry="5" fill="${SKIN}"/></g>
      ${kid(x, 188, { shirt, hair, pose: 'sit', arms: 'down' }).replace(/<path d="M-10 34[^>]*\/>/, '')}`).join('')}
    <path d="M232 246 l-8 -10" stroke="${SKIN}" stroke-width="6" stroke-linecap="round"/>`),
  loco: () => village(`
    <g stroke="#fff" stroke-width="2.5" fill="none" opacity="0.95">
      <path d="M120 250 L150 214 H200 L186 250 Z M150 214 L166 196 H212 L200 214 M166 196 L178 182 H226 L212 196"/>
      <path d="M178 182 L190 168 H262 L248 182 Z M226 182 L236 168 M190 168 L200 156 H244 L234 168"/>
      <path d="M200 156 L208 146 H280 L270 156 Z M244 156 L252 146"/>
    </g>
    <ellipse cx="226" cy="175" rx="5" ry="4" fill="#7d8ca3" stroke="${INK}" stroke-width="1.5"/>
    ${kid(150, 172, { shirt: '#e0463c', hair: 'buns', arms: 'up' }).replace('M8 40 L9 62', 'M8 40 L16 52')}
    ${kid(320, 196, { shirt: '#6cc6f0', arms: 'front', flip: true })}`),
  bitmat: () => village(`
    ${kid(200, 186, { shirt: '#f7923a', hair: 'short', arms: 'up' })}
    <rect x="182" y="170" width="36" height="9" rx="3" fill="#e0463c" stroke="${INK}" stroke-width="2"/>
    <path d="M216 174 l12 6 l-2 -10 z" fill="#e0463c" stroke="${INK}" stroke-width="2"/>
    ${kid(100, 200, { shirt: '#f58fb8', hair: 'bob', arms: 'up' })}
    ${kid(310, 196, { shirt: '#3fa35b', hair: 'buns', arms: 'up', flip: true })}
    <g fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round">
      <path d="M78 150 q-6 -8 0 -16 M70 154 q-10 -12 0 -24"/><path d="M332 146 q6 -8 0 -16 M340 150 q10 -12 0 -24"/></g>`),
  rongran: () => village(`
    ${[[70, '#9b6bd6', 'bob'], [120, '#3fa35b', 'short'], [170, '#f58fb8', 'buns'], [220, '#e0463c', 'short']].map(([x, shirt, hair]) => kid(x, 196, { shirt, hair, arms: 'front' })).join('')}
    <g transform="translate(250 190)">${mascotMarkup('happy').replace('<svg ', '<svg width="54" height="50" ')}</g>
    ${kid(340, 190, { shirt: '#f4ecd8', pants: '#9c6b43', hair: 'short', arms: 'front', flip: true })}
    <g stroke="${INK}" stroke-width="2"><path d="M330 184 Q340 200 350 184" fill="#fff"/><path d="M314 162 L340 148 L366 162 Z" fill="#ecc98f"/></g>`),
  soi: () => village(`<g transform="translate(140 110) scale(1)">${mascotMarkup('happy').replace('<svg ', '<svg width="120" height="110" ')}</g>
    ${kid(300, 196, { shirt: '#e0463c', hair: 'buns', arms: 'up', flip: true })}`),
};

/**
 * Show a picture story, one panel after the other. Each panel has a picture and a text key.
 * @param {object} screen the game screen
 * @param {string} id the game id; the story plays one time each visit
 * @param {Array<{scene: string, key: string}>} panels
 * @param {{force?: boolean}} [opts]
 */
export function playStory(screen, id, panels, { force = false } = {}) {
  if (seen.has(id) && !force) return Promise.resolve();
  seen.add(id);
  return new Promise((resolve) => {
    let index = 0;
    let done = false;
    const pic = el('div', { class: 'story-picture' });
    const dots = el('div', { class: 'story-dots' }, panels.map(() => el('span')));
    const nextBtn = iconButton('next', 'ui.next', () => show(index + 1), 'story-next');
    const skipBtn = iconButton('play', 'ui.play', finish, 'story-skip');
    const view = el('div', { class: 'story' }, [pic, el('div', { class: 'story-actions' }, [dots, nextBtn, skipBtn])]);
    const old = [...screen.stage.childNodes];
    screen.stage.replaceChildren(view);
    onTap(pic, () => show(index + 1));
    function finish() {
      if (done) return;
      done = true;
      stopSpeech();
      screen.stage.replaceChildren(...old);
      resolve();
    }
    async function show(i) {
      if (done) return;
      if (i >= panels.length) return finish();
      index = i;
      const p = panels[i];
      pic.innerHTML = `<svg viewBox="0 0 400 260" role="img">${scenes[p.scene]()}</svg>`;
      [...dots.children].forEach((d, k) => d.classList.toggle('is-on', k === i));
      nextBtn.hidden = i === panels.length - 1;
      screen.setInstruction([p.key]);
      const finished = await speakAll([p.key]);
      if (finished && !done && index === i && i < panels.length - 1) setTimeout(() => { if (index === i) show(i + 1); }, 900);
    }
    show(0);
  });
}
