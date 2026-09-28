// Game 5: Sorting (Phân loại). The child drags things into boxes.

import { t } from '../core/i18n.js';
import { speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame, tryAgain, langBadge } from '../core/ui.js';
import { draggable, elementBelow } from '../core/drag.js';
import { shapeSvg } from '../core/shapes.js';
import { gameLevel } from '../core/state.js';
import { makeRound, isRightBox, boxKeys } from '../logic/sorting.js';

/** The label of a box shows only the values of the rules. */
function boxLabel(box) {
  return shapeSvg({ shape: box.shape || 'blob', color: box.color || 'none', size: box.size || 'medium' });
}

function boxSpeech(box) {
  const keys = boxKeys(box);
  if (keys.length === 1) return { key: 'sorting.box1', params: { a: { key: keys[0] } } };
  return { key: 'sorting.box2', params: { a: { key: keys[0] }, b: { key: keys[1] } } };
}

export function mount(screen) {
  const level = gameLevel('sorting');
  let alive = true;

  function start() {
    const round = makeRound(level);
    let left = round.items.length;
    const pool = el('div', { class: 'sort-pool' });
    const boxes = el('div', { class: `sort-boxes is-${round.boxes.length}` });
    round.boxes.forEach((box, i) => {
      const label = el('div', { class: 'sort-label', html: boxLabel(box) });
      const inside = el('div', { class: 'sort-inside' });
      const node = el('div', { class: 'sort-box', dataset: { box: String(i) }, attrs: { role: 'button', tabindex: '0', 'aria-label': t(boxSpeech(box).key, boxSpeech(box).params) } }, [label, inside]);
      const badge = langBadge(boxSpeech(box).key, boxSpeech(box).params);
      node.append(badge);
      onTap(node, () => speakAll([boxSpeech(box)]));
      boxes.append(node);
    });
    for (const item of round.items) {
      const node = el('div', { class: 'sort-item', html: shapeSvg(item), attrs: { role: 'button', 'aria-label': t('sorting.item') } });
      pool.append(node);
      const home = () => {
        node.classList.remove('is-dragging');
        node.style.transform = '';
      };
      let start0 = null;
      draggable(node, {
        enabled: () => !node.classList.contains('is-sorted'),
        onTap: () => speakAll(boxKeys({ color: item.color, shape: item.shape, size: item.size }).map((key) => ({ key }))),
        onStart: (x, y) => { start0 = { x, y }; },
        onMove: (x, y) => { node.style.transform = `translate(${x - start0.x}px, ${y - start0.y}px) scale(1.08)`; },
        onEnd: async (x, y) => {
          const target = elementBelow(x, y, node)?.closest?.('.sort-box');
          if (!target) return home();
          const index = Number(target.dataset.box);
          if (!isRightBox(item, round.boxes, index)) {
            home();
            tryAgain(node);
            return;
          }
          node.style.transform = '';
          node.classList.add('is-sorted');
          target.querySelector('.sort-inside').append(node);
          sfx.snap();
          left -= 1;
          if (left === 0) {
            await wait(300);
            const r = await answer('sorting', true, boxes, ['sorting.done']);
            if (!alive) return;
            if (r.levelUp) return reloadGame();
            await wait(400);
            if (alive) start();
          }
        },
      });
    }
    screen.stage.replaceChildren(el('div', { class: 'sort-layout' }, [pool, boxes]));
    screen.say(['sorting.instruction1', ...round.boxes.map(boxSpeech)]);
  }

  start();
  return () => {
    alive = false;
  };
}
