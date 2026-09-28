// Game 6: Letters (Chữ cái). Vietnamese mode has 29 letters. English mode has 26 letters.

import { t, getLang } from '../core/i18n.js';
import { speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame, langBadge } from '../core/ui.js';
import { picture } from '../core/images.js';
import { gameLevel } from '../core/state.js';
import { makeQuestion, checkLetter, soundKey, wordKey } from '../logic/letters.js';

let dataPromise = null;
function loadLetters() {
  dataPromise ||= fetch('data/letters.json').then((r) => r.json());
  return dataPromise;
}

function glyphNode(letter, className = '') {
  return el('span', { class: `glyph ${className}`, text: letter.glyph, attrs: { lang: getLang() } });
}

export function mount(screen) {
  const level = gameLevel('letters');
  const lang = getLang();
  let alive = true;
  let busy = false;
  let letters = [];

  // The sound of the letter, then the word. For example "bờ... bò".
  const sayLetter = (letter) => speakAll([
    { key: soundKey(lang, letter) }, { pause: 350 }, { key: wordKey(lang, letter) },
  ]);

  function showGrid() {
    const card = el('div', { class: 'letter-card' });
    const grid = el('div', { class: 'letter-grid' });
    for (const letter of letters) {
      const b = el('button', { class: 'choice letter-tile', attrs: { type: 'button', 'aria-label': t(soundKey(lang, letter)) } }, [glyphNode(letter)]);
      onTap(b, () => {
        sfx.tap();
        grid.querySelectorAll('.is-on').forEach((n) => n.classList.remove('is-on'));
        b.classList.add('is-on');
        card.replaceChildren(
          el('div', { class: 'letter-big' }, [glyphNode(letter), el('span', { class: 'glyph-upper', text: letter.glyph.toUpperCase() })]),
          el('div', { class: 'letter-pic' }, [picture(letter.pic), langBadge(wordKey(lang, letter))]),
        );
        card.classList.add('is-open');
        onTap(card, () => sayLetter(letter));
        sayLetter(letter);
      });
      grid.append(b);
    }
    screen.stage.replaceChildren(el('div', { class: 'letters-layout' }, [card, el('div', { class: 'scroll-area' }, [grid])]));
    screen.say('letters.tap');
  }

  function ask() {
    busy = false;
    const q = makeQuestion(level, letters);
    const top = el('div', { class: 'letter-question' });
    if (q.level === 2) {
      top.append(el('div', { class: 'letter-pic is-big' }, [picture(q.answer.pic), langBadge(wordKey(lang, q.answer))]));
    } else {
      top.append(el('div', { class: 'letter-ear', html: '' }));
    }
    const choices = q.choices.map((letter) => {
      const b = el('button', { class: 'choice letter-choice', attrs: { type: 'button', 'aria-label': t(soundKey(lang, letter)) } }, [glyphNode(letter)]);
      onTap(b, async () => {
        if (busy) return;
        busy = true;
        sfx.tap();
        const correct = checkLetter(q, letter);
        if (correct) b.classList.add('is-right');
        const extra = correct ? [{ key: soundKey(lang, q.answer) }, { pause: 300 }, { key: wordKey(lang, q.answer) }] : [];
        const r = await answer('letters', correct, b, extra);
        if (!alive) return;
        if (r.levelUp) return reloadGame();
        if (correct) {
          await wait(500);
          if (alive) ask();
        } else {
          busy = false;
        }
      });
      return b;
    });
    screen.stage.replaceChildren(el('div', { class: 'letters-layout is-quiz' }, [top, el('div', { class: 'letter-choices' }, choices)]));
    if (q.level === 2) {
      screen.say([{ key: 'letters.first', params: { w: { key: wordKey(lang, q.answer) } } }]);
    } else {
      top.replaceChildren(el('div', { class: 'letter-listen' }, [el('div', { class: 'icon-big', html: screen.bar.querySelector('.speaker-btn').innerHTML })]));
      onTap(top, () => speakAll([{ key: 'letters.find', params: { s: { key: soundKey(lang, q.answer) } } }]));
      screen.say([{ key: 'letters.find', params: { s: { key: soundKey(lang, q.answer) } } }]);
    }
  }

  loadLetters().then((data) => {
    if (!alive) return;
    letters = data[lang] || data.vi;
    if (level <= 1) showGrid();
    else ask();
  });
  return () => {
    alive = false;
  };
}
