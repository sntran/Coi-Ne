// Folk game: Nhảy lò cò (hopscotch). The child throws the pebble, then hops on the squares
// in order and jumps over the square with the pebble.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame } from '../core/ui.js';
import { playStory } from '../core/story.js';
import { mascot } from '../core/mascot.js';
import { gameLevel } from '../core/state.js';
import { ROWS, SQUARES, makeRound, hopPath, hop } from '../logic/loco.js';

const STORY = [
  { scene: 'village', key: 'story.loco.1' },
  { scene: 'loco', key: 'story.loco.2' },
  { scene: 'soi', key: 'story.loco.3' },
];
const PEBBLE = `<svg viewBox="0 0 60 50" aria-hidden="true">
  <ellipse cx="30" cy="27" rx="24" ry="19" fill="#aab8cc" stroke="#3b2a2a" stroke-width="4"/>
  <path d="M18 18 q8 -6 18 -4" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8"/></svg>`;

export function mount(screen) {
  const level = gameLevel('loco');
  let alive = true;
  let round = null;
  let step = 0;
  let phase = 'throw';

  const squares = new Map();
  const board = el('div', { class: 'loco-board' });
  ROWS.forEach((row, r) => {
    row.forEach((n, i) => {
      const lane = row.length === 1 ? 'mid' : i === 0 ? 'a' : 'b';
      const sq = el('button', {
        class: `loco-square row-${r + 1} lane-${lane}`,
        attrs: { type: 'button', 'aria-label': t('loco.square', { n }) },
      }, [el('span', { class: 'loco-number', text: String(n) })]);
      onTap(sq, () => tapSquare(n));
      squares.set(n, sq);
      board.append(sq);
    });
  });
  const pebble = el('button', { class: 'loco-pebble', html: PEBBLE, attrs: { type: 'button', 'aria-label': t('loco.stone') } });
  const soi = mascot('happy', 'loco-soi');
  const start = el('div', { class: 'loco-start' }, [soi, pebble]);
  const layout = el('div', { class: 'loco-layout' }, [start, board]);

  function markNext(show) {
    squares.forEach((sq) => sq.classList.remove('is-next'));
    if (show && phase === 'hop') squares.get(hopPath(round)[step])?.classList.add('is-next');
  }

  function newRound() {
    round = makeRound(level);
    step = 0;
    phase = 'throw';
    squares.forEach((sq) => sq.classList.remove('has-pebble', 'is-visited', 'is-next'));
    start.replaceChildren(soi, pebble);
    screen.say(['loco.throw']);
  }

  /** The pebble flies in an arc from the hand of the child to the square. */
  async function fly(target) {
    const from = pebble.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const dist = Math.hypot(dx, dy);
    // The top of the arc stays on the screen.
    const fromY = from.top + from.height / 2;
    const high = Math.max(30, Math.min(220, 80 + dist * 0.35, fromY + dy / 2 - 40));
    const duration = Math.min(1300, 600 + dist * 0.9);
    pebble.classList.add('is-flying');
    const flight = pebble.animate([
      { transform: 'translate(0, 0) rotate(0deg) scale(1)', easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)' },
      { transform: `translate(${dx / 2}px, ${dy / 2 - high}px) rotate(200deg) scale(1.15)`, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
      { transform: `translate(${dx}px, ${dy}px) rotate(400deg) scale(0.75)` },
    ], { duration, fill: 'forwards' });
    await flight.finished.catch(() => {});
    pebble.classList.remove('is-flying');
    target.append(pebble);
    flight.cancel();
    pebble.animate([{ transform: 'scale(1.3, 0.7)' }, { transform: 'scale(1)' }], { duration: 250, easing: 'ease-out' });
    target.classList.add('is-hit');
    setTimeout(() => target.classList.remove('is-hit'), 500);
  }

  onTap(pebble, async () => {
    if (phase !== 'throw') return;
    phase = 'flying';
    sfx.up();
    const target = squares.get(round.pebble);
    await fly(target);
    if (!alive) return;
    target.classList.add('has-pebble');
    sfx.pebble();
    phase = 'hop';
    await speakAll([{ key: 'loco.landed', params: { n: round.pebble } }]);
    if (!alive) return;
    screen.say(['loco.hop']);
    if (level < 2) markNext(true);
  });

  async function tapSquare(n) {
    if (phase !== 'hop') return;
    const r = hop(round, step, n);
    const sq = squares.get(n);
    if (r.event === 'pebble' || r.event === 'wrong') {
      sq.classList.remove('wiggle');
      void sq.offsetWidth;
      sq.classList.add('wiggle');
      speak(r.event === 'pebble' ? 'loco.pebble' : 'loco.which');
      markNext(true);
      return;
    }
    step = r.step;
    sq.append(soi);
    sq.classList.add('is-visited');
    soi.classList.remove('is-hop');
    void soi.offsetWidth;
    soi.classList.add('is-hop');
    sfx.pop();
    markNext(level < 2);
    if (r.event === 'done') {
      phase = 'done';
      await speak(`num.${n}`);
      if (!alive) return;
      const res = await answer('loco', true, board, ['loco.done']);
      if (!alive) return;
      if (res.levelUp) return reloadGame();
      await wait(400);
      if (alive) newRound();
      return;
    }
    // The way up has one square less than the board, because the child jumps over the pebble.
    if (level >= 2 && step === SQUARES - 1) {
      await speakAll([{ key: `num.${n}` }, 'loco.back']);
      if (alive) screen.setInstruction(['loco.back']);
      return;
    }
    speak(`num.${n}`);
  }

  screen.stage.replaceChildren(layout);
  playStory(screen, 'loco', STORY).then(() => {
    if (alive) newRound();
  });
  return () => {
    alive = false;
  };
}
