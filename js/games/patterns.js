// Game 3: Patterns (Quy luật). The child chooses what comes next.

import { t } from '../core/i18n.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, langBadge, reloadGame } from '../core/ui.js';
import { shapeSvg } from '../core/shapes.js';
import { gameLevel } from '../core/state.js';
import { makePattern, checkPattern, itemKey } from '../logic/patterns.js';

export function mount(screen) {
  const level = gameLevel('patterns');
  let alive = true;
  let busy = false;

  function ask() {
    busy = false;
    const q = makePattern(level);
    // The row is in one line, so that the child reads it from left to right.
    const row = el('div', { class: 'pattern-row', attrs: { role: 'img' } });
    row.style.setProperty('--count', String(q.row.length + 1));
    q.row.forEach((item, i) => {
      const cell = el('div', { class: 'pattern-item', html: shapeSvg(item) });
      cell.style.animationDelay = `${i * 0.08}s`;
      row.append(cell);
    });
    const blank = el('div', { class: 'pattern-item pattern-blank' });
    row.append(blank);

    const choices = q.choices.map((item) => {
      const b = el('button', {
        class: 'choice pattern-choice',
        html: shapeSvg(item),
        attrs: { type: 'button', 'aria-label': t(itemKey(item, q.attr)) },
      });
      b.append(langBadge(itemKey(item, q.attr)));
      onTap(b, async () => {
        if (busy) return;
        busy = true;
        sfx.tap();
        const correct = checkPattern(q, item);
        if (correct) {
          blank.innerHTML = shapeSvg(item);
          blank.classList.add('is-filled');
        }
        const r = await answer('patterns', correct, correct ? blank : b, [{ key: itemKey(item, q.attr) }]);
        if (!alive) return;
        if (r.levelUp) return reloadGame();
        if (correct) {
          await wait(600);
          if (alive) ask();
        } else {
          busy = false;
        }
      });
      return b;
    });
    screen.stage.replaceChildren(el('div', { class: 'pattern-layout' }, [
      row,
      el('div', { class: 'pattern-choices' }, choices),
    ]));
    screen.say(['soi.look', 'patterns.ask']);
  }

  ask();
  return () => {
    alive = false;
  };
}
