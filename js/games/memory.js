// Game 7: Memory pairs (Lật hình). Turn over cards to find two cards that are the same.

import { t } from '../core/i18n.js';
import { speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame, langBadge } from '../core/ui.js';
import { picture } from '../core/images.js';
import { mascotMarkup } from '../core/mascot.js';
import { gameLevel } from '../core/state.js';
import { deal, flip, closeOpen, columns } from '../logic/memory.js';

export function mount(screen) {
  const level = gameLevel('memory');
  let alive = true;
  let state = null;
  let nodes = [];
  let waiting = false;
  const landscape = matchMedia('(orientation: landscape)');

  // Make the cards as large as possible, but all the cards must fit on the screen.
  function setColumns(grid) {
    const count = state.cards.length;
    const cols = columns(count, landscape.matches);
    const rows = Math.ceil(count / cols);
    const box = screen.stage.getBoundingClientRect();
    const gap = 12;
    const size = Math.max(80, Math.floor(Math.min((box.width - 24 - gap * (cols - 1)) / cols, (box.height - 24 - gap * (rows - 1)) / rows, 200)));
    grid.style.setProperty('--cols', String(cols));
    grid.style.setProperty('--size', `${size}px`);
  }

  function start() {
    state = deal(level);
    const grid = el('div', { class: 'memory-grid' });
    nodes = state.cards.map((card, i) => {
      const front = el('div', { class: 'card-face card-front' }, [picture(card.pic)]);
      const back = el('div', { class: 'card-face card-back', html: mascotMarkup('curious') });
      const node = el('button', { class: 'memory-card', attrs: { type: 'button', 'aria-label': t('memory.card') } }, [
        el('div', { class: 'card-inner' }, [back, front]),
      ]);
      onTap(node, () => turn(i));
      grid.append(node);
      return node;
    });
    screen.stage.replaceChildren(el('div', { class: 'memory-layout' }, [grid]));
    setColumns(grid);
    screen.say('memory.instruction');
  }

  async function turn(i) {
    if (waiting) return;
    const r = flip(state, i);
    if (r.event === 'ignored') return;
    state = r.state;
    sfx.flip();
    nodes[i].classList.add('is-open');
    if (r.event === 'first') return;
    if (r.event === 'mismatch') {
      waiting = true;
      await wait(1200);
      const [a, b] = state.open;
      nodes[a].classList.remove('is-open');
      nodes[b].classList.remove('is-open');
      state = closeOpen(state);
      waiting = false;
      return;
    }
    // A pair.
    const pic = state.cards[i].pic;
    state.cards.forEach((c, k) => {
      if (c.matched && c.pic === pic && !nodes[k].classList.contains('is-matched')) {
        nodes[k].classList.add('is-matched');
        nodes[k].append(langBadge(`pic.${pic}`));
      }
    });
    waiting = true;
    const res = await answer('memory', true, nodes[i], [{ key: `pic.${pic}` }]);
    waiting = false;
    if (!alive) return;
    if (res.levelUp) return reloadGame();
    if (r.done) {
      await speakAll(['memory.done']);
      await wait(600);
      if (alive) start();
    }
  }

  const onTurn = () => {
    const grid = screen.stage.querySelector('.memory-grid');
    if (grid && state) setColumns(grid);
  };
  landscape.addEventListener('change', onTurn);
  window.addEventListener('resize', onTurn);
  start();
  return () => {
    alive = false;
    landscape.removeEventListener('change', onTurn);
    window.removeEventListener('resize', onTurn);
  };
}
