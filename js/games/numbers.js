// Game 2: Numbers (Số đếm).

import { t } from '../core/i18n.js';
import { speak } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, langBadge, reloadGame } from '../core/ui.js';
import { picture } from '../core/images.js';
import { gameLevel } from '../core/state.js';
import { makeQuestion, checkAnswer } from '../logic/numbers.js';
import { shuffle } from '../logic/random.js';

const thingName = (thing, n) => ({ key: `thing.${thing}.${n === 1 ? '1' : 'n'}` });

/** A group of things in a frame of ten places. */
function tenFrame(thing, n) {
  const frame = el('div', { class: `ten-frame ${n > 10 ? 'is-wide' : ''}` });
  const places = Math.max(10, Math.ceil(n / 5) * 5);
  for (let i = 0; i < places; i++) {
    frame.append(el('span', { class: 'ten-place' }, [i < n ? picture(thing) : null]));
  }
  return frame;
}

function digitCard(n, onPick) {
  const b = el('button', { class: 'choice digit-choice', attrs: { type: 'button', 'aria-label': t(`num.${n}`) } }, [
    el('span', { class: 'big-digit', text: String(n) }),
    langBadge(`num.${n}`),
  ]);
  onTap(b, () => onPick(n, b));
  return b;
}

export function mount(screen) {
  const level = gameLevel('numbers');
  let alive = true;
  let busy = false;

  async function done(correct, anchor, extra) {
    busy = true;
    const r = await answer('numbers', correct, anchor, extra);
    if (!alive) return;
    if (r.levelUp) return reloadGame();
    if (correct) {
      await wait(500);
      if (alive) ask();
    } else {
      busy = false;
    }
  }

  function ask() {
    busy = false;
    const q = makeQuestion(level);
    if (q.type === 'match') return showMatch(q);
    if (q.type === 'count') return showCount(q);
    if (q.type === 'compare') return showCompare(q);
    return showAdd(q);
  }

  function showMatch(q) {
    const digit = el('button', { class: 'num-digit', attrs: { type: 'button', 'aria-label': t(`num.${q.n}`) } }, [
      el('span', { class: 'big-digit', text: String(q.n) }),
      langBadge(`num.${q.n}`),
    ]);
    onTap(digit, () => speak(`num.${q.n}`));
    const cards = q.choices.map((n) => {
      const b = el('button', { class: 'choice group-card', attrs: { type: 'button', 'aria-label': t('numbers.group') } }, [tenFrame(q.thing, n)]);
      onTap(b, () => {
        if (busy) return;
        sfx.tap();
        done(checkAnswer(q, n), b, [{ key: `num.${n}` }]);
      });
      return b;
    });
    screen.stage.replaceChildren(el('div', { class: 'num-layout' }, [
      el('div', { class: 'num-top' }, [digit]),
      el('div', { class: 'num-cards' }, cards),
    ]));
    screen.say([{ key: 'numbers.match', params: { n: q.n, t: thingName(q.thing, q.n) } }]);
  }

  function showCount(q) {
    let counted = 0;
    const grid = el('div', { class: 'count-grid' });
    const counter = el('div', { class: 'num-counter big-digit', text: '0' });
    const order = shuffle(Math.random, Array.from({ length: q.n }, (_, i) => i));
    for (const i of order) {
      const b = el('button', { class: 'count-thing', attrs: { type: 'button', 'aria-label': t(`thing.${q.thing}.1`) } }, [picture(q.thing)]);
      b.style.setProperty('--tilt', `${(i % 5) * 4 - 8}deg`);
      onTap(b, () => {
        if (busy || b.classList.contains('is-counted')) return;
        counted += 1;
        b.classList.add('is-counted');
        b.append(el('span', { class: 'count-badge', text: String(counted) }));
        counter.textContent = String(counted);
        sfx.pop();
        if (counted < q.n) {
          speak(`num.${counted}`);
        } else {
          busy = true;
          speak(`num.${counted}`).then(() => {
            if (!alive) return;
            done(true, counter, [{ key: 'numbers.counted', params: { n: q.n, t: thingName(q.thing, q.n) } }]);
          });
        }
      });
      grid.append(b);
    }
    screen.stage.replaceChildren(el('div', { class: 'num-layout' }, [
      el('div', { class: 'num-top' }, [counter, langBadge(`thing.${q.thing}.n`)]),
      grid,
    ]));
    screen.say([{ key: 'numbers.count', params: { t1: thingName(q.thing, 1) } }]);
  }

  function showCompare(q) {
    const cards = q.groups.map((g, i) => {
      const b = el('button', { class: 'choice group-card', attrs: { type: 'button', 'aria-label': t('numbers.group') } }, [tenFrame(g.thing, g.n)]);
      onTap(b, () => {
        if (busy) return;
        sfx.tap();
        done(i === q.answer, b, [{ key: `num.${q.groups[q.answer].n}` }]);
      });
      return b;
    });
    screen.stage.replaceChildren(el('div', { class: 'num-layout' }, [
      el('div', { class: 'num-top' }, [picture(q.groups[0].thing, 'num-thing'), langBadge(`thing.${q.groups[0].thing}.n`)]),
      el('div', { class: 'num-cards is-two' }, cards),
    ]));
    screen.say([{ key: q.ask === 'more' ? 'numbers.more' : 'numbers.fewer', params: { t: thingName(q.groups[0].thing, 2) } }]);
  }

  function showAdd(q) {
    const sum = el('div', { class: 'add-row' }, [
      el('div', { class: 'add-group' }, [tenFrame(q.thing, q.a)]),
      el('span', { class: 'add-sign big-digit', text: t('numbers.plusSign') }),
      el('div', { class: 'add-group' }, [tenFrame(q.thing, q.b)]),
    ]);
    const choices = q.choices.map((n) => digitCard(n, (value, b) => {
      if (busy) return;
      sfx.tap();
      done(checkAnswer(q, value), b, [{ key: 'numbers.addResult', params: { a: q.a, b: q.b, n: q.n } }]);
    }));
    screen.stage.replaceChildren(el('div', { class: 'num-layout' }, [
      sum,
      el('div', { class: 'num-digits' }, choices),
    ]));
    screen.say([{
      key: 'numbers.add',
      params: { a: q.a, b: q.b, ta: thingName(q.thing, q.a), tb: thingName(q.thing, q.b), t: thingName(q.thing, 2) },
    }]);
  }

  ask();
  return () => {
    alive = false;
  };
}
