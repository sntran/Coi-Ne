// Folk game: Chi chi chành chành. The child holds a finger on the open hand while the đồng dao
// plays. On the last word the hand closes, and the child pulls the finger out fast.

import { t } from '../core/i18n.js';
import { speak, speakAll, stopSpeech } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, answer, wait, reloadGame } from '../core/ui.js';
import { playStory } from '../core/story.js';
import { mascot, setExpression } from '../core/mascot.js';
import { gameLevel } from '../core/state.js';
import { LINES, closeTime, makeRound, lift } from '../logic/chichi.js';

const INK = '#3b2a2a';
const SKIN = '#f2c7a5';
const STORY = [
  { scene: 'village', key: 'story.chichi.1' },
  { scene: 'chichi', key: 'story.chichi.2' },
  { scene: 'soi', key: 'story.chichi.3' },
];
// Each finger: the base on the palm, the angle, the length, and the width.
const FINGERS = [
  [66, 100, -20, 62, 26],
  [94, 90, -6, 72, 27],
  [122, 92, 8, 66, 26],
  [146, 106, 22, 52, 23],
  [52, 150, -64, 50, 28],
];

function handMarkup() {
  const fingers = FINGERS.map(([x, y, a, len, w]) => `<g transform="rotate(${a} ${x} ${y})">
      <g class="chichi-finger" style="transform-origin: ${x}px ${y}px">
        <rect x="${x - w / 2}" y="${y - len}" width="${w}" height="${len + 14}" rx="${w / 2}" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
        <path d="M${x - w / 4} ${y - len + 12} h${w / 2}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
      </g></g>`).join('');
  return `<svg viewBox="0 0 200 230" aria-hidden="true">
    <path d="M70 214 Q66 196 64 188 L136 188 Q134 198 130 214 Z" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="102" cy="144" rx="64" ry="58" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
    <path d="M62 126 Q100 112 140 124 M66 150 Q96 140 128 152" fill="none" stroke="#d9a07e" stroke-width="3" stroke-linecap="round"/>
    <circle class="chichi-spot" cx="102" cy="150" r="20" fill="none" stroke="#e0463c" stroke-width="3" stroke-dasharray="6 6"/>
    <circle class="chichi-tip" cx="102" cy="150" r="14" fill="#ffd9a8" stroke="${INK}" stroke-width="3"/>
    ${fingers}
  </svg>`;
}

export function mount(screen) {
  const level = gameLevel('chichi');
  let alive = true;
  let round = makeRound(level);
  let phase = 'idle';
  let line = 0;
  let holding = null;
  let closeTimer = 0;

  const rhyme = el('div', { class: 'rhyme-text chichi-rhyme', attrs: { lang: 'vi' } });
  const hand = el('div', {
    class: 'chichi-hand',
    html: handMarkup(),
    attrs: { role: 'button', tabindex: '0', 'aria-label': t('chichi.hand') },
  });
  hand.style.setProperty('--close', `${closeTime(level)}ms`);
  const soi = mascot('happy', 'chichi-soi');
  const layout = el('div', { class: 'chichi-layout' }, [el('div', { class: 'chichi-top' }, [soi, rhyme]), hand]);

  function reset() {
    phase = 'idle';
    line = 0;
    round = makeRound(level);
    hand.classList.remove('is-closing', 'is-closed', 'is-held', 'is-trick');
    rhyme.classList.remove('is-on');
    setExpression(soi, 'happy');
    screen.say(['chichi.put']);
  }

  async function sing() {
    phase = 'song';
    setExpression(soi, 'happy');
    while (line < LINES) {
      const key = `dongdao.chichi.${line + 1}`;
      rhyme.textContent = t(key, undefined, 'vi');
      rhyme.classList.add('is-on');
      const finished = await speakAll([{ key, lang: 'vi' }]);
      if (!alive || phase !== 'song' || !finished) return;
      line += 1;
      if (line - 1 === round.trickAfter) {
        // The trick: the hand moves a little, but it does not close.
        hand.classList.add('is-trick');
        await wait(380);
        hand.classList.remove('is-trick');
        if (!alive || phase !== 'song') return;
      }
    }
    close();
  }

  function close() {
    phase = 'closing';
    hand.classList.add('is-closing');
    sfx.flip();
    closeTimer = setTimeout(() => {
      if (!alive || phase !== 'closing') return;
      phase = 'closed';
      hand.classList.add('is-closed');
      if (holding !== null) caught();
    }, closeTime(level));
  }

  async function caught() {
    phase = 'done';
    setExpression(soi, 'surprised');
    sfx.snap();
    await speak('chichi.caught');
    if (!alive) return;
    await answer('chichi', false, hand);
    if (!alive) return;
    await wait(600);
    if (alive) reset();
  }

  async function escaped() {
    phase = 'done';
    clearTimeout(closeTimer);
    hand.classList.add('is-closed');
    setExpression(soi, 'happy');
    const r = await answer('chichi', true, hand, ['chichi.escaped']);
    if (!alive) return;
    if (r.levelUp) return reloadGame();
    await wait(500);
    if (alive) reset();
  }

  hand.addEventListener('pointerdown', (e) => {
    if (holding !== null || e.button > 0) return;
    if (phase !== 'idle' && phase !== 'paused') return;
    e.preventDefault();
    holding = e.pointerId;
    hand.setPointerCapture?.(e.pointerId);
    hand.classList.add('is-held');
    sfx.tap();
    sing();
  });
  const up = (e) => {
    if (e.pointerId !== holding) return;
    holding = null;
    hand.classList.remove('is-held');
    const result = lift(phase);
    if (phase === 'song') {
      // The finger left too early. The song waits for the finger.
      phase = 'paused';
      stopSpeech();
      speak('chichi.wait');
    } else if (result === 'escaped' && phase === 'closing') {
      escaped();
    }
  };
  hand.addEventListener('pointerup', up);
  hand.addEventListener('pointercancel', up);
  hand.addEventListener('contextmenu', (e) => e.preventDefault());

  screen.stage.replaceChildren(layout);
  playStory(screen, 'chichi', STORY).then(() => {
    if (alive) reset();
  });
  return () => {
    alive = false;
    clearTimeout(closeTimer);
  };
}
