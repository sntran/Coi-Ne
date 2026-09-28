// Folk game: Bịt mắt bắt dê. The eyes of the child are covered. The child moves a finger on the
// dark screen. Near the goat, the goat calls louder and more often. A finger on the goat catches it.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx, bleat, hasSound } from '../core/sound.js';
import { el, answer, wait, reloadGame, burst } from '../core/ui.js';
import { playStory } from '../core/story.js';
import { mascot } from '../core/mascot.js';
import { gameLevel } from '../core/state.js';
import { makeRound, nearness, bleatGap, bleatGain, bleatPan, nearestGoat, isOnGoat, catchGoat } from '../logic/bitmat.js';

const INK = '#3b2a2a';
const STORY = [
  { scene: 'village', key: 'story.bitmat.1' },
  { scene: 'bitmat', key: 'story.bitmat.2' },
  { scene: 'soi', key: 'story.bitmat.3' },
];
// The finger must stay on the goat for this time. A fast move over the goat does not catch it.
const HOLD_MS = 300;
// After this time, the goat shows a little.
const HINT_MS = 25000;

const GOAT = `<svg viewBox="0 0 120 100" aria-hidden="true">
  <path d="M30 34 Q22 14 34 8 M44 32 Q44 12 56 10" fill="none" stroke="#9c6b43" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="72" cy="62" rx="34" ry="22" fill="#fff" stroke="${INK}" stroke-width="4"/>
  <path d="M50 80 V94 M62 82 V96 M84 82 V96 M96 80 V94" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <path d="M104 56 q12 -4 10 8" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <path d="M24 36 Q20 60 34 66 Q48 70 52 50 Q54 34 40 30 Q28 28 24 36 Z" fill="#fff" stroke="${INK}" stroke-width="4"/>
  <path d="M30 64 q2 12 -4 16" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <path d="M22 40 l-12 -4 q2 8 12 10" fill="#fff" stroke="${INK}" stroke-width="3"/>
  <circle cx="38" cy="44" r="3.5" fill="${INK}"/><ellipse cx="30" cy="58" rx="4" ry="2.5" fill="#f5a3b5"/>
</svg>`;

export function mount(screen) {
  const level = gameLevel('bitmat');
  let alive = true;
  let round = null;
  let finger = null;
  let pointer = null;
  let onGoat = -1;
  let holdTimer = 0;
  let timer = 0;
  let hintTimer = 0;
  let busy = false;

  const field = el('div', { class: 'bitmat-field', attrs: { role: 'application', 'aria-label': t('bitmat.field') } });
  const hand = el('div', { class: 'bitmat-hand' });
  const soi = mascot('happy', 'bitmat-soi');
  const scarf = el('div', { class: 'bitmat-scarf' });
  field.append(scarf, hand);
  screen.stage.replaceChildren(el('div', { class: 'bitmat-layout' }, [field, soi]));

  function place(node, p) {
    node.style.left = `${p.x * 100}%`;
    node.style.top = `${p.y * 100}%`;
  }

  function newRound() {
    round = makeRound(level);
    busy = false;
    field.querySelectorAll('.bitmat-goat').forEach((g) => g.remove());
    round.goats.forEach((g, i) => {
      const goat = el('div', { class: 'bitmat-goat', html: GOAT, dataset: { goat: String(i) } });
      place(goat, g);
      goat.style.setProperty('--size', `${round.radius * 2 * 100}%`);
      field.append(goat);
    });
    field.classList.remove('is-open', 'is-hint');
    field.classList.toggle('is-quiet', !hasSound());
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      if (!alive || busy) return;
      field.classList.add('is-hint');
      speak('bitmat.hint');
    }, hasSound() ? HINT_MS : 3000);
    screen.say(['bitmat.move']).then(() => {
      if (alive) call();
    });
  }

  // The goat calls again and again. The time between the calls depends on the finger.
  function call() {
    clearTimeout(timer);
    if (!alive || busy || !round) return;
    const i = finger ? nearestGoat(round, finger) : round.goats.findIndex((_, k) => !round.caught.includes(k));
    if (i < 0) return;
    const goat = round.goats[i];
    const near = finger ? nearness(finger, goat) : 0.2;
    bleat(bleatGain(near), finger ? bleatPan(finger, goat) : 0);
    field.querySelector(`.bitmat-goat[data-goat="${i}"]`)?.classList.add('is-calling');
    setTimeout(() => field.querySelector(`.bitmat-goat[data-goat="${i}"]`)?.classList.remove('is-calling'), 500);
    timer = setTimeout(call, bleatGap(near) + 550);
  }

  function pointAt(e) {
    const r = field.getBoundingClientRect();
    finger = { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
    place(hand, finger);
    hand.classList.add('is-on');
    const i = nearestGoat(round, finger);
    if (i >= 0 && isOnGoat(round, finger, i)) {
      if (onGoat === i) return;
      onGoat = i;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (alive && onGoat === i && pointer !== null) caught(i);
      }, HOLD_MS);
    } else {
      onGoat = -1;
      clearTimeout(holdTimer);
    }
  }

  async function caught(i) {
    if (busy) return;
    busy = true;
    clearTimeout(timer);
    onGoat = -1;
    const r = catchGoat(round, i);
    round = r.round;
    const goat = field.querySelector(`.bitmat-goat[data-goat="${i}"]`);
    goat.classList.add('is-caught');
    sfx.happy();
    burst(goat);
    bleat(0.8, 0);
    if (!r.done) {
      await speakAll(['bitmat.caught', 'bitmat.more']);
      if (!alive) return;
      busy = false;
      call();
      return;
    }
    clearTimeout(hintTimer);
    field.classList.add('is-open');
    await wait(400);
    if (!alive) return;
    const res = await answer('bitmat', true, soi, ['bitmat.caught']);
    if (!alive) return;
    if (res.levelUp) return reloadGame();
    await wait(400);
    if (alive) newRound();
  }

  field.addEventListener('pointerdown', (e) => {
    if (pointer !== null || !round) return;
    e.preventDefault();
    pointer = e.pointerId;
    field.setPointerCapture?.(e.pointerId);
    pointAt(e);
    // A touch starts the next call soon, so the child hears the change.
    clearTimeout(timer);
    timer = setTimeout(call, 150);
  });
  field.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointer || busy) return;
    pointAt(e);
  });
  const up = (e) => {
    if (e.pointerId !== pointer) return;
    pointer = null;
    onGoat = -1;
    clearTimeout(holdTimer);
    hand.classList.remove('is-on');
  };
  field.addEventListener('pointerup', up);
  field.addEventListener('pointercancel', up);

  playStory(screen, 'bitmat', STORY).then(() => {
    if (alive) newRound();
  });
  return () => {
    alive = false;
    clearTimeout(timer);
    clearTimeout(hintTimer);
    clearTimeout(holdTimer);
  };
}
