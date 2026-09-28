// Folk game: Nu na nu nống. The child sings: each tap on the next leg sings one word.
// The leg at the last word folds in. This is counting one to one: one word, one leg.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame } from '../core/ui.js';
import { playStory } from '../core/story.js';
import { gameLevel } from '../core/state.js';
import { songWords, makeGame, tapLeg } from '../logic/nuna.js';

const INK = '#3b2a2a';
const SKIN = '#f2c7a5';
const LINE_KEYS = Array.from({ length: 10 }, (_, i) => `dongdao.nuna.${i + 1}`);
const STORY = [
  { scene: 'village', key: 'story.nuna.1' },
  { scene: 'nuna', key: 'story.nuna.2' },
  { scene: 'soi', key: 'story.nuna.3' },
];
const KIDS = [
  { shirt: '#e0463c', pants: '#3f6fd8', hair: 'buns' },
  { shirt: '#3fa35b', pants: '#9c6b43', hair: 'short' },
  { shirt: '#9b6bd6', pants: '#3f6fd8', hair: 'bob' },
];

function bodyMarkup(kid) {
  const hair = {
    buns: `<path d="M-19 -6 Q-18 -32 0 -31 Q19 -32 19 -6 Q9 -20 0 -19 Q-9 -20 -19 -6 Z" fill="${INK}"/><circle cx="-17" cy="-27" r="8" fill="${INK}"/><circle cx="17" cy="-27" r="8" fill="${INK}"/>`,
    short: `<path d="M-19 -8 Q-18 -32 0 -31 Q19 -32 19 -8 Q9 -22 -2 -20 Q-11 -20 -19 -8 Z" fill="${INK}"/>`,
    bob: `<path d="M-21 2 Q-22 -32 0 -32 Q22 -32 21 2 L15 4 Q14 -18 0 -18 Q-14 -18 -15 4 Z" fill="${INK}"/>`,
  }[kid.hair];
  return `<svg viewBox="-50 -40 100 90" aria-hidden="true">
    <path d="M-20 22 L-36 44 M20 22 L36 44" stroke="${SKIN}" stroke-width="9" stroke-linecap="round"/>
    <rect x="-22" y="14" width="44" height="36" rx="12" fill="${kid.shirt}" stroke="${INK}" stroke-width="3"/>
    <circle cx="0" cy="-6" r="20" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>${hair}
    <circle cx="-7" cy="-5" r="2.6" fill="${INK}"/><circle cx="7" cy="-5" r="2.6" fill="${INK}"/>
    <path d="M-6 4 Q0 9 6 4" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
}

function legMarkup(kid) {
  return `<svg viewBox="0 0 40 120" aria-hidden="true">
    <rect x="8" y="0" width="24" height="96" rx="12" fill="${kid.pants}" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="20" cy="104" rx="15" ry="11" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
    <path d="M10 100 h20" stroke="#e8b08e" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

export function mount(screen) {
  const level = gameLevel('nuna');
  let alive = true;
  let busy = false;
  const lineWords = LINE_KEYS.map((k) => songWords([t(k, undefined, 'vi')]));
  const words = lineWords.flat();
  let state = makeGame(level);
  let hint = level < 2;

  const lyric = el('div', { class: 'nuna-lyric', attrs: { lang: 'vi' } });
  const row = el('div', { class: 'nuna-row' });
  const legs = [];
  screen.stage.replaceChildren(el('div', { class: 'nuna-layout' }, [lyric, row]));

  function showLine(wordIndex) {
    let start = 0;
    let line = 0;
    while (line < lineWords.length - 1 && start + lineWords[line].length <= wordIndex) {
      start += lineWords[line].length;
      line += 1;
    }
    lyric.replaceChildren(...lineWords[line].map((w, i) => el('span', {
      class: `nuna-word ${start + i < wordIndex ? 'is-sung' : ''} ${start + i === wordIndex ? 'is-now' : ''}`,
      text: w,
    })));
  }

  function markNext() {
    legs.forEach((leg, i) => leg.classList.toggle('is-next', hint && i === state.next));
  }

  function build() {
    state = makeGame(level);
    legs.length = 0;
    row.replaceChildren(...Array.from({ length: state.kids }, (_, k) => {
      const kid = KIDS[k];
      const pair = [0, 1].map((side) => {
        const index = k * 2 + side;
        const leg = el('button', { class: 'nuna-leg', html: legMarkup(kid), attrs: { type: 'button', 'aria-label': t('nuna.leg') } });
        onTap(leg, () => tap(index));
        legs.push(leg);
        return leg;
      });
      return el('div', { class: 'nuna-kid' }, [el('div', { class: 'nuna-body', html: bodyMarkup(kid) }), el('div', { class: 'nuna-legs' }, pair)]);
    }));
    showLine(0);
    markNext();
  }

  async function tap(index) {
    if (busy || !state.out[index]) return;
    const r = tapLeg(state, index, words.length);
    if (r.event === 'wrong') {
      hint = true;
      markNext();
      legs[index].classList.remove('wiggle');
      void legs[index].offsetWidth;
      legs[index].classList.add('wiggle');
      speak('nuna.next');
      return;
    }
    state = r.state;
    if (level >= 2) hint = false;
    legs[index].classList.remove('is-touched');
    void legs[index].offsetWidth;
    legs[index].classList.add('is-touched');
    showLine(r.word);
    if (r.event === 'word') {
      markNext();
      speakAll([{ text: words[r.word], lang: 'vi' }]);
      return;
    }
    // The last word: this leg folds in.
    busy = true;
    markNext();
    legs.forEach((l) => l.classList.remove('is-next'));
    await speakAll([{ text: words[r.word], lang: 'vi' }]);
    if (!alive) return;
    legs[index].classList.add('is-folded');
    sfx.pop();
    await speak('nuna.fold');
    if (!alive) return;
    if (!r.done) {
      await speak('nuna.again');
      if (!alive) return;
      busy = false;
      showLine(0);
      hint = level < 2;
      markNext();
      return;
    }
    const res = await answer('nuna', true, row);
    if (!alive) return;
    if (res.levelUp) return reloadGame();
    await wait(400);
    if (!alive) return;
    busy = false;
    hint = level < 2;
    build();
    screen.say(['nuna.tap']);
  }

  playStory(screen, 'nuna', STORY).then(() => {
    if (!alive) return;
    build();
    screen.say(['nuna.tap']);
  });
  return () => {
    alive = false;
  };
}
