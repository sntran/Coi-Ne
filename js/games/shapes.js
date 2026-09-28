// Game 4: Shape builder (Ghép hình). The child drags shapes into an outline.
// A tap on a shape turns it.

import { t } from '../core/i18n.js';
import { speak } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, svgEl, answer, wait, reloadGame, tryAgain, langBadge } from '../core/ui.js';
import { draggable } from '../core/drag.js';
import { gameLevel } from '../core/state.js';
import { makeRound, findSlot, turn } from '../logic/shapes.js';

const INK = '#3b2a2a';
const COLORS = { circle: '#ffd23f', square: '#6cc6f0', triangle: '#e84a3f', rectangle: '#a3d65c' };

function shapeNode(type, w, h, attrs) {
  if (type === 'circle') return svgEl('ellipse', { cx: w / 2, cy: h / 2, rx: w / 2, ry: h / 2, ...attrs });
  if (type === 'triangle') return svgEl('path', { d: `M${w / 2} 0 L${w} ${h} L0 ${h} Z`, ...attrs });
  return svgEl('rect', { x: 0, y: 0, width: w, height: h, rx: Math.min(w, h) * 0.12, ...attrs });
}

export function mount(screen) {
  const level = gameLevel('shapes');
  let alive = true;
  let round = null;
  let filled = new Set();
  let pieces = [];
  let scale = 1;

  const board = el('div', { class: 'sb-board' });
  const tray = el('div', { class: 'sb-tray' });
  const area = el('div', { class: 'sb-area' }, [board, tray]);
  screen.stage.replaceChildren(area);

  function drawBoard() {
    const svg = svgEl('svg', { viewBox: '0 0 100 100', class: 'sb-outline' });
    round.design.slots.forEach((slot, i) => {
      const g = svgEl('g', { transform: `translate(${slot.x} ${slot.y}) rotate(${slot.rot}) translate(${-slot.w / 2} ${-slot.h / 2})` });
      g.append(shapeNode(slot.type, slot.w, slot.h, {
        fill: filled.has(i) ? 'none' : '#fffdf8', stroke: '#b9a58c', 'stroke-width': 1.2, 'stroke-dasharray': '3 2.2', 'stroke-linejoin': 'round',
      }));
      svg.append(g);
    });
    board.replaceChildren(svg);
  }

  function pieceSvg(p) {
    const w = p.w * scale;
    const h = p.h * scale;
    const svg = svgEl('svg', { viewBox: `-2 -2 ${p.w + 4} ${p.h + 4}`, width: w + 4 * scale, height: h + 4 * scale });
    svg.append(shapeNode(p.type, p.w, p.h, { fill: COLORS[p.type], stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }));
    return svg;
  }

  function position(p) {
    const node = p.node;
    let cx;
    let cy;
    if (p.slot != null) {
      const s = round.design.slots[p.slot];
      cx = board.offsetLeft + s.x * scale;
      cy = board.offsetTop + s.y * scale;
    } else {
      cx = p.home.x;
      cy = p.home.y;
    }
    node.style.left = `${cx}px`;
    node.style.top = `${cy}px`;
    node.style.setProperty('--rot', `${p.rot}deg`);
    // In the tray, a piece is smaller, so that all pieces fit. On the board, it has its full size.
    node.style.setProperty('--k', p.slot == null && !node.classList.contains('is-lifted') ? String(p.traySize) : '1');
  }

  function layout() {
    scale = board.clientWidth / 100;
    const n = pieces.length;
    const tw = tray.clientWidth;
    const th = tray.clientHeight;
    const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt((n * tw) / Math.max(1, th)))));
    const rows = Math.ceil(n / cols);
    const cell = Math.min(tw / cols, th / rows) * 0.86;
    pieces.forEach((p, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      p.home = { x: tray.offsetLeft + ((c + 0.5) / cols) * tw, y: tray.offsetTop + ((r + 0.5) / rows) * th };
      const size = Math.max(p.w, p.h) * scale;
      const box = Math.max(80, size);
      p.traySize = Math.min(1, Math.max(80, cell) / box);
      p.node.style.width = `${box}px`;
      p.node.style.height = `${box}px`;
      p.node.replaceChildren(pieceSvg(p));
      position(p);
    });
    drawBoard();
  }

  function start() {
    round = makeRound(level);
    filled = new Set();
    area.querySelectorAll('.sb-piece').forEach((n) => n.remove());
    pieces = round.pieces.map((p) => ({ ...p, slot: null, node: el('div', { class: 'sb-piece', attrs: { role: 'button', 'aria-label': t(`shape.${p.type}`) } }) }));
    for (const p of pieces) {
      area.append(p.node);
      let offset = { x: 0, y: 0 };
      draggable(p.node, {
        enabled: () => p.slot == null,
        onTap: () => {
          p.rot = turn(p.rot);
          sfx.tap();
          position(p);
          speak(`shape.${p.type}`);
        },
        onStart: (x, y) => {
          const r = area.getBoundingClientRect();
          offset = { x: x - r.left - parseFloat(p.node.style.left), y: y - r.top - parseFloat(p.node.style.top) };
          p.node.classList.add('is-lifted');
          p.node.style.setProperty('--k', '1');
        },
        onMove: (x, y) => {
          const r = area.getBoundingClientRect();
          p.node.style.left = `${x - r.left - offset.x}px`;
          p.node.style.top = `${y - r.top - offset.y}px`;
        },
        onEnd: (x, y) => drop(p, x, y),
      });
    }
    layout();
    screen.say([{ key: 'shapes.makeThis', params: { d: { key: `shapes.design.${round.design.id}` } } }, 'shapes.instruction']);
    const badge = langBadge(`shapes.design.${round.design.id}`);
    badge.classList.add('inline');
    screen.tools.replaceChildren(badge);
  }

  async function drop(p, x, y) {
    p.node.classList.remove('is-lifted');
    const r = area.getBoundingClientRect();
    const bx = (parseFloat(p.node.style.left) - board.offsetLeft) / scale;
    const by = (parseFloat(p.node.style.top) - board.offsetTop) / scale;
    const found = findSlot(round.design, p, bx, by, filled);
    if (found.slot == null) {
      position(p);
      if (found.needsTurn) speak('shapes.turnHint');
      else if (x - r.left < board.offsetLeft + board.clientWidth && y - r.top < board.offsetTop + board.clientHeight
        && x - r.left > board.offsetLeft && y - r.top > board.offsetTop) tryAgain(p.node);
      return;
    }
    p.slot = found.slot;
    filled.add(found.slot);
    p.node.classList.add('is-placed');
    sfx.snap();
    position(p);
    drawBoard();
    if (filled.size === round.design.slots.length) {
      await wait(300);
      const res = await answer('shapes', true, board, [{ key: 'shapes.done', params: { d: { key: `shapes.design.${round.design.id}` } } }]);
      if (!alive) return;
      if (res.levelUp) return reloadGame();
      await wait(500);
      if (alive) start();
    }
  }

  const onResize = () => { if (round) layout(); };
  window.addEventListener('resize', onResize);
  requestAnimationFrame(() => { if (alive) start(); });
  return () => {
    alive = false;
    window.removeEventListener('resize', onResize);
  };
}
