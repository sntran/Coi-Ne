// Folk game 11: Chơi chuyền. The child throws the ball and picks up sticks.
// The ball waits in the air until the child picks the sticks. There is no time limit.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, langBadge, reloadGame } from '../core/ui.js';
import { playStory } from '../core/story.js';
import { gameLevel } from '../core/state.js';
import { createRound, throwBall, pickStick, needed, stickLayout, STICKS } from '../logic/choichuyen.js';

const RHYME_LINES = 28;
const STORY = [
  { scene: 'village', key: 'story.choichuyen.1' },
  { scene: 'choichuyen', key: 'story.choichuyen.2' },
  { scene: 'soi', key: 'story.choichuyen.3' },
];

const BALL = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="52" r="40" fill="#f7923a" stroke="#3b2a2a" stroke-width="5"/>
  <path d="M30 30 Q40 20 54 20" fill="none" stroke="#ffd9a8" stroke-width="7" stroke-linecap="round"/>
  <path d="M46 12 Q50 4 58 6" fill="none" stroke="#3fa35b" stroke-width="6" stroke-linecap="round"/></svg>`;
const STICK = `<svg viewBox="0 0 140 30" aria-hidden="true">
  <rect x="4" y="8" width="132" height="14" rx="7" fill="#d9b36a" stroke="#3b2a2a" stroke-width="4"/>
  <path d="M20 13 H60" stroke="#f3dca6" stroke-width="3" stroke-linecap="round"/></svg>`;

export function mount(screen) {
  const level = gameLevel('choichuyen');
  let alive = true;
  let state = createRound(level);
  let line = 0;
  let busy = false;

  const ball = el('button', { class: 'cc-ball', html: BALL, attrs: { type: 'button', 'aria-label': t('choichuyen.ball') } });
  const sky = el('div', { class: 'cc-sky' }, [ball]);
  const mat = el('div', { class: 'cc-mat' });
  const pile = el('div', { class: 'cc-pile' });
  const count = el('div', { class: 'cc-count big-digit', text: '0' });
  const rhyme = el('div', { class: 'rhyme-text cc-rhyme', attrs: { lang: 'vi' } });
  const side = el('div', { class: 'cc-side' }, [count, langBadge('choichuyen.stick'), pile]);
  const layout = el('div', { class: 'cc-layout' }, [el('div', { class: 'cc-play' }, [sky, rhyme, mat]), side]);

  function instruction() {
    if (!state.inAir) return ['choichuyen.throw'];
    const n = needed(state);
    return [n === 1 ? { key: 'choichuyen.pick1' } : { key: 'choichuyen.pickN', params: { n } }];
  }

  function buildMat() {
    mat.replaceChildren();
    pile.replaceChildren();
    count.textContent = '0';
    // A tall mat has 3 columns of sticks. A wide mat has 5 columns.
    const box = mat.getBoundingClientRect();
    const cols = box.width && box.width < box.height * 1.2 ? 3 : 5;
    for (const s of stickLayout(Math.random, STICKS, cols)) {
      const b = el('button', { class: 'cc-stick', html: STICK, attrs: { type: 'button', 'aria-label': t('choichuyen.stick') } });
      b.style.left = `${s.x * 100}%`;
      b.style.top = `${s.y * 100}%`;
      b.style.setProperty('--angle', `${s.angle}deg`);
      onTap(b, () => pick(b));
      mat.append(b);
    }
  }

  onTap(ball, async () => {
    if (busy || state.inAir) return;
    state = throwBall(state);
    ball.classList.remove('is-caught');
    ball.classList.add('is-up');
    sfx.up();
    // Sing the next line of the đồng dao while the ball flies.
    const key = `dongdao.choichuyen.${String((line % RHYME_LINES) + 1).padStart(2, '0')}`;
    line += 1;
    rhyme.textContent = t(key, undefined, 'vi');
    rhyme.classList.add('is-on');
    screen.setInstruction(instruction());
    await speakAll([{ key, lang: 'vi' }, ...instruction()]);
  });

  async function pick(stick) {
    if (busy || stick.classList.contains('is-picked')) return;
    if (!state.inAir) {
      speak('choichuyen.throw');
      ball.classList.remove('wiggle');
      void ball.offsetWidth;
      ball.classList.add('wiggle');
      return;
    }
    const r = pickStick(state);
    if (r.ignored) return;
    state = r.state;
    stick.classList.add('is-picked');
    sfx.pop();
    pile.append(el('span', { class: 'cc-pile-stick', html: STICK }));
    count.textContent = String(state.picked);
    speak(`num.${state.picked}`);
    if (!r.catchNow) {
      screen.setInstruction(instruction());
      return;
    }
    busy = true;
    await wait(700);
    ball.classList.remove('is-up');
    ball.classList.add('is-caught');
    sfx.down();
    rhyme.classList.remove('is-on');
    await wait(500);
    if (!alive) return;
    if (r.done) {
      const res = await answer('choichuyen', true, pile, ['choichuyen.allDone']);
      if (!alive) return;
      if (res.levelUp) return reloadGame();
      state = createRound(level);
      buildMat();
      busy = false;
      screen.say(instruction());
      return;
    }
    await speak('choichuyen.caught');
    busy = false;
    screen.say(instruction());
  }

  screen.stage.replaceChildren(layout);
  playStory(screen, 'choichuyen', STORY).then(() => {
    if (!alive) return;
    buildMat();
    screen.say(instruction());
  });
  return () => {
    alive = false;
  };
}
