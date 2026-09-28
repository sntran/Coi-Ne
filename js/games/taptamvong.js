// Folk game 9: Tập tầm vông. Sỏi hides a candy. The child finds it.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame } from '../core/ui.js';
import { mascot, setExpression, handMarkup } from '../core/mascot.js';
import { picture } from '../core/images.js';
import { playStory } from '../core/story.js';
import { gameLevel } from '../core/state.js';
import { makeRound, isCorrect } from '../logic/taptamvong.js';

const STORY = [
  { scene: 'village', key: 'story.taptamvong.1' },
  { scene: 'taptamvong', key: 'story.taptamvong.2' },
  { scene: 'soi', key: 'story.taptamvong.3' },
];

const CUP = `<svg viewBox="0 0 100 90" aria-hidden="true">
  <path d="M8 78 Q8 16 50 16 Q92 16 92 78 Z" fill="#8fd3f4" stroke="#3b2a2a" stroke-width="4" stroke-linejoin="round"/>
  <path d="M4 78 H96 V86 H4 Z" fill="#fff" stroke="#3b2a2a" stroke-width="4" stroke-linejoin="round"/>
  <path d="M22 50 Q50 40 78 50" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  <rect x="40" y="6" width="20" height="12" rx="4" fill="#fff" stroke="#3b2a2a" stroke-width="4"/></svg>`;

export function mount(screen) {
  const level = gameLevel('taptamvong');
  let alive = true;
  let round = null;
  let slots = [];
  let items = [];
  let accepting = false;

  const soi = mascot('happy', 'ttv-soi');
  const table = el('div', { class: 'ttv-table' });
  const rhyme = el('div', { class: 'rhyme-text', attrs: { lang: 'vi' } });
  const layout = el('div', { class: 'ttv-layout' }, [soi, rhyme, table]);

  function place(item, slot) {
    item.dataset.slot = String(slot);
    item.style.left = `${((slot + 1) / (round.count + 1)) * 100}%`;
  }

  function build() {
    table.replaceChildren();
    table.style.setProperty('--n', String(round.count));
    items = [];
    slots = [];
    for (let k = 0; k < round.count; k++) {
      const item = el('button', {
        class: `ttv-item ${round.cups ? 'is-cup' : 'is-hand'}`,
        attrs: { type: 'button', 'aria-label': t(round.cups ? 'taptamvong.cup' : 'taptamvong.hand') },
      });
      const candy = picture('candy', 'ttv-candy');
      const cover = el('div', { class: 'ttv-cover', html: round.cups ? CUP : handMarkup(false) });
      item.append(candy, cover);
      item.dataset.hasCandy = String(k === round.start);
      onTap(item, () => choose(item));
      table.append(item);
      items.push(item);
      slots.push(k);
      place(item, k);
    }
  }

  function open(item, isOpen) {
    item.classList.toggle('is-open', isOpen);
    if (!round.cups) item.querySelector('.ttv-cover').innerHTML = handMarkup(isOpen);
  }

  async function swapAll() {
    for (const [a, b] of round.swaps) {
      if (!alive) return;
      const ia = items.find((it) => Number(it.dataset.slot) === a);
      const ib = items.find((it) => Number(it.dataset.slot) === b);
      ia.classList.add('is-moving-up');
      ib.classList.add('is-moving-down');
      place(ia, b);
      place(ib, a);
      sfx.flip();
      await wait(750);
      ia.classList.remove('is-moving-up');
      ib.classList.remove('is-moving-down');
      await wait(150);
    }
  }

  async function sing(during) {
    rhyme.textContent = t('dongdao.taptamvong', undefined, 'vi');
    rhyme.classList.add('is-on');
    table.classList.add('is-singing');
    await Promise.all([speakAll([{ key: 'dongdao.taptamvong', lang: 'vi' }]), during ? during() : null]);
    table.classList.remove('is-singing');
    rhyme.classList.remove('is-on');
  }

  async function playRound() {
    round = makeRound(level);
    accepting = false;
    build();
    setExpression(soi, 'happy');
    const candyItem = items[round.start];
    if (!round.showStart) {
      // Level 1: the candy is in front of Sỏi. Then Sỏi hides the hands.
      table.classList.add('show-candy');
      await speak('taptamvong.show');
      if (!alive) return;
      await speak('taptamvong.hide');
      table.classList.add('is-hidden');
      await wait(900);
      table.classList.remove('show-candy');
      table.classList.remove('is-hidden');
      await wait(400);
      await sing();
    } else {
      open(candyItem, true);
      await speak(round.cups ? 'taptamvong.watchCup' : 'taptamvong.watchHand');
      if (!alive) return;
      await wait(500);
      open(candyItem, false);
      await wait(500);
      setExpression(soi, 'curious');
      await sing(swapAll);
    }
    if (!alive) return;
    setExpression(soi, 'thinking');
    accepting = true;
    screen.say(round.cups ? 'taptamvong.askCup' : 'taptamvong.askHand');
  }

  async function choose(item) {
    if (!accepting) return;
    accepting = false;
    sfx.tap();
    const slot = Number(item.dataset.slot);
    const correct = isCorrect(round, slot);
    open(item, true);
    await wait(400);
    let result;
    if (correct) {
      setExpression(soi, 'happy');
      result = await answer('taptamvong', true, item, ['taptamvong.found']);
    } else {
      const right = items.find((it) => it.dataset.hasCandy === 'true');
      await wait(300);
      open(right, true);
      setExpression(soi, 'curious');
      await speak('taptamvong.here');
      result = await answer('taptamvong', false, item);
    }
    if (!alive) return;
    if (result.levelUp) return reloadGame();
    await wait(900);
    if (alive) playRound();
  }

  screen.stage.replaceChildren(layout);
  playStory(screen, 'taptamvong', STORY).then(() => {
    if (alive) playRound();
  });
  return () => {
    alive = false;
  };
}
