// Game: Where is Sỏi hiding? (Sỏi trốn đâu?)

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, svgEl, onTap, answer, wait, reloadGame, langBadge, tryAgain } from '../core/ui.js';
import { draggable } from '../core/drag.js';
import { mascot } from '../core/mascot.js';
import { gameLevel } from '../core/state.js';
import { sceneMarkup } from '../core/where-scenes.js';
import { makeRound, zoneAt } from '../logic/where.js';

const where = (pos, object) => ({ key: 'where.is', params: { p: { key: `where.pos.${pos}` }, o: { key: `where.obj.${object}` } } });

function scene(object, pos, expression) {
  return `<svg viewBox="-10 0 230 160" class="where-scene" role="img">${sceneMarkup(object, pos, expression)}</svg>`;
}

export function mount(screen) {
  const level = gameLevel('where');
  let alive = true;
  let busy = false;

  async function next(correct, anchor, extra) {
    busy = true;
    const r = await answer('where', correct, anchor, extra);
    if (!alive) return;
    if (r.levelUp) return reloadGame();
    if (correct) {
      await wait(600);
      if (alive) ask();
    } else busy = false;
  }

  function ask() {
    busy = false;
    const q = makeRound(level);
    if (q.level === 1) return findSoi(q);
    if (q.level === 2) return choosePicture(q);
    return dragSoi(q);
  }

  function findSoi(q) {
    const places = q.objects.map((object, i) => {
      const b = el('button', {
        class: 'choice where-place',
        html: scene(object, i === q.hidden ? q.pos : null, 'curious'),
        attrs: { type: 'button', 'aria-label': t(`where.obj.${object}`) },
      });
      b.append(langBadge(`where.obj.${object}`));
      onTap(b, async () => {
        if (busy) return;
        sfx.tap();
        if (i !== q.hidden) {
          tryAgain(b);
          speak('where.notHere');
          return;
        }
        b.innerHTML = scene(object, q.pos, 'happy');
        b.classList.add('is-right');
        next(true, b, ['where.found', where(q.pos, object)]);
      });
      return b;
    });
    screen.stage.replaceChildren(el('div', { class: 'where-layout' }, [el('div', { class: 'where-row' }, places)]));
    screen.say(['where.find']);
  }

  function choosePicture(q) {
    const cards = q.choices.map((pos) => {
      const b = el('button', { class: 'choice where-place', html: scene(q.object, pos, 'happy'), attrs: { type: 'button', 'aria-label': t(`where.pos.${pos}`) } });
      b.append(langBadge(`where.pos.${pos}`));
      onTap(b, () => {
        if (busy) return;
        sfx.tap();
        const correct = pos === q.pos;
        if (correct) b.classList.add('is-right');
        next(correct, b, correct ? [where(q.pos, q.object)] : []);
      });
      return b;
    });
    screen.stage.replaceChildren(el('div', { class: 'where-layout' }, [el('div', { class: 'where-row' }, cards)]));
    screen.say([where(q.pos, q.object), 'where.whichPicture']);
  }

  function dragSoi(q) {
    const svg = svgEl('svg', { viewBox: '-10 0 230 160', class: 'where-scene where-drag-scene' });
    svg.innerHTML = sceneMarkup(q.object, null);
    const board = el('div', { class: 'where-board' }, [svg]);
    const piece = mascot('happy', 'where-piece');
    const home = el('div', { class: 'where-home' }, [piece]);
    const layout = el('div', { class: 'where-layout is-drag' }, [board, home]);
    screen.stage.replaceChildren(layout);
    const prompt = [{ key: `where.drag.${q.pos}`, params: { o: { key: `where.obj.${q.object}` } } }];
    let startPoint = null;
    draggable(piece, {
      enabled: () => !busy,
      onTap: () => speakAll(prompt),
      onStart: (x, y) => { startPoint = { x, y }; },
      onMove: (x, y) => { piece.style.transform = `translate(${x - startPoint.x}px, ${y - startPoint.y}px)`; },
      onEnd: (x, y) => {
        piece.style.transform = '';
        const m = svg.getScreenCTM();
        const p = m ? new DOMPoint(x, y).matrixTransform(m.inverse()) : null;
        const pos = p ? zoneAt(q.object, p.x, p.y) : null;
        if (!pos) return;
        svg.innerHTML = sceneMarkup(q.object, pos, pos === q.pos ? 'happy' : 'curious');
        home.classList.add('is-empty');
        sfx.snap();
        if (pos === q.pos) {
          next(true, board, [where(pos, q.object)]);
        } else {
          // Say where Sỏi is now. Then Sỏi goes back, and the child tries again.
          speakAll([{ key: 'where.nowAt', params: { p: { key: `where.pos.${pos}` }, o: { key: `where.obj.${q.object}` } } }, 'praise.tryAgain', ...prompt]);
          setTimeout(() => {
            if (!alive) return;
            svg.innerHTML = sceneMarkup(q.object, null);
            home.classList.remove('is-empty');
          }, 1600);
        }
      },
    });
    screen.say(prompt);
  }

  ask();
  return () => {
    alive = false;
  };
}
