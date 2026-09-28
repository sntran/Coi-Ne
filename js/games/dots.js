// Game: Dot-to-dot (Nối điểm). The child connects the dots in the order of the numbers.

import { speak } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, svgEl, answer, wait, reloadGame, langBadge } from '../core/ui.js';
import { picture } from '../core/images.js';
import { gameLevel } from '../core/state.js';
import { makeRound, tapDot, hitRadius } from '../logic/dots.js';

const INK = '#3b2a2a';

export function mount(screen) {
  const level = gameLevel('dots');
  let alive = true;
  let state = null;
  let lastId = null;
  let busy = false;

  const svg = svgEl('svg', { viewBox: '-6 -6 112 112', class: 'dots-svg' });
  const reward = el('div', { class: 'dots-reward' });
  const board = el('div', { class: 'dots-board' }, [svg]);
  screen.stage.replaceChildren(el('div', { class: 'dots-layout' }, [board, reward]));

  function start() {
    state = makeRound(level, Math.random, lastId);
    lastId = state.design.id;
    busy = false;
    reward.replaceChildren();
    draw();
    screen.say([{ key: 'dots.instruction' }]);
  }

  function draw() {
    const pts = state.design.points;
    svg.replaceChildren();
    if (state.next >= pts.length) {
      svg.append(svgEl('polygon', { points: pts.map((p) => p.join(',')).join(' '), fill: state.design.color, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', class: 'dots-fill' }));
    } else if (state.next > 1) {
      svg.append(svgEl('polyline', { points: pts.slice(0, state.next).map((p) => p.join(',')).join(' '), fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    }
    pts.forEach((p, i) => {
      const g = svgEl('g', { class: `dot ${i < state.next ? 'is-done' : ''} ${i === state.next ? 'is-next' : ''}`, transform: `translate(${p[0]} ${p[1]})` });
      if (i === state.next) g.append(svgEl('circle', { r: 6, class: 'dot-ring' }));
      g.append(svgEl('circle', { r: 2.8, fill: i < state.next ? '#3fa35b' : INK }));
      const label = svgEl('text', { x: p[0] > 50 ? 4 : -4, y: -4, 'text-anchor': p[0] > 50 ? 'start' : 'end', class: 'dot-num' });
      label.textContent = String(i + 1);
      g.append(label);
      svg.append(g);
    });
  }

  function toSvg(e) {
    const m = svg.getScreenCTM();
    if (!m) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  }

  function nearest(p) {
    const pts = state.design.points;
    let best = -1;
    let bestD = Infinity;
    pts.forEach((q, i) => {
      const d = Math.hypot(q[0] - p.x, q[1] - p.y);
      if (d <= hitRadius(pts, i) && d < bestD) {
        best = i;
        bestD = d;
      }
    });
    return best;
  }

  async function touch(e, isDown) {
    if (busy || !state) return;
    const p = toSvg(e);
    if (!p) return;
    const i = nearest(p);
    if (i < 0) return;
    const r = tapDot(state, i);
    if (r.event === 'wrong') {
      if (isDown) speak('dots.findNumber', { n: state.next + 1 });
      return;
    }
    if (r.event === 'old') return;
    state = r.state;
    sfx.pop();
    draw();
    speak(`num.${state.next}`);
    if (r.event !== 'done') return;
    busy = true;
    reward.replaceChildren(picture(state.design.pic, 'dots-pic'), langBadge(state.design.name));
    await wait(700);
    const res = await answer('dots', true, board, [{ key: state.design.name }]);
    if (!alive) return;
    if (res.levelUp) return reloadGame();
    await wait(600);
    if (alive) start();
  }

  let pressed = false;
  svg.addEventListener('pointerdown', (e) => {
    pressed = true;
    svg.setPointerCapture?.(e.pointerId);
    touch(e, true);
  });
  svg.addEventListener('pointermove', (e) => { if (pressed) touch(e, false); });
  const up = () => { pressed = false; };
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);

  start();
  return () => {
    alive = false;
  };
}
