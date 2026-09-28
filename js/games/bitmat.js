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
// The finger must stay on the goat for this time. A ring around the finger fills in this time.
const HOLD_MS = 700;
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
  let shown = false;
  let saidNear = false;

  const field = el('div', { class: 'bitmat-field', attrs: { role: 'application', 'aria-label': t('bitmat.field') } });
  // The light under the finger. It is cold far from the goat and warm near the goat.
  const hand = el('div', {
    class: 'bitmat-hand',
    html: '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bitmat-ring" cx="50" cy="50" r="44" pathLength="100"/></svg>',
  });
  hand.style.setProperty('--hold', `${HOLD_MS}ms`);
  // One goat picture for each goat to catch. A caught goat gets its color.
  const goals = el('div', { class: 'bitmat-goals' });
  const soi = mascot('happy', 'bitmat-soi');
  const scarf = el('div', { class: 'bitmat-scarf' });
  field.append(scarf, hand, goals);
  screen.stage.replaceChildren(el('div', { class: 'bitmat-layout' }, [field, soi]));

  function place(node, p) {
    node.style.left = `${p.x * 100}%`;
    node.style.top = `${p.y * 100}%`;
  }

  function drawGoals() {
    goals.replaceChildren(...round.goats.map((_, i) => el('span', {
      class: `bitmat-goal ${round.caught.includes(i) ? 'is-caught' : ''}`,
      html: GOAT,
    })));
  }

  /** At the start, the goat stands in the yard. Then the scarf comes down and the goat hides. */
  async function showGoats() {
    field.classList.add('is-open');
    const demo = round.goats.map((_, i) => {
      const goat = el('div', { class: 'bitmat-goat bitmat-demo', html: GOAT });
      place(goat, { x: round.goats.length > 1 ? 0.35 + i * 0.3 : 0.5, y: 0.55 });
      goat.style.setProperty('--size', '30%');
      field.append(goat);
      return goat;
    });
    bleat(0.6, 0);
    await speak(round.goats.length > 1 ? 'bitmat.showTwo' : 'bitmat.show');
    if (!alive) return;
    field.classList.remove('is-open');
    demo.forEach((g) => g.classList.add('is-hiding'));
    await wait(800);
    demo.forEach((g) => g.remove());
  }

  async function newRound() {
    round = makeRound(level);
    busy = true;
    saidNear = false;
    field.querySelectorAll('.bitmat-goat').forEach((g) => g.remove());
    field.classList.remove('is-hint');
    drawGoals();
    if (!shown) {
      shown = true;
      await showGoats();
      if (!alive) return;
    }
    busy = false;
    round.goats.forEach((g, i) => {
      const goat = el('div', { class: 'bitmat-goat', html: GOAT, dataset: { goat: String(i) } });
      place(goat, g);
      goat.style.setProperty('--size', `${round.radius * 2 * 100}%`);
      field.append(goat);
    });
    field.classList.remove('is-open');
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
    if (i < 0) return;
    const near = nearness(finger, round.goats[i]);
    hand.style.setProperty('--near', near.toFixed(2));
    if (isOnGoat(round, finger, i)) {
      if (onGoat === i) return;
      onGoat = i;
      hand.classList.add('is-holding');
      if (!saidNear) {
        saidNear = true;
        speak('bitmat.near');
      }
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (alive && onGoat === i && pointer !== null) caught(i);
      }, HOLD_MS);
    } else {
      onGoat = -1;
      hand.classList.remove('is-holding');
      clearTimeout(holdTimer);
    }
  }

  async function caught(i) {
    if (busy) return;
    busy = true;
    clearTimeout(timer);
    onGoat = -1;
    hand.classList.remove('is-holding');
    const r = catchGoat(round, i);
    round = r.round;
    drawGoals();
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
    hand.classList.remove('is-on', 'is-holding');
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
