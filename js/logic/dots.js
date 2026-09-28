// Rules of the dot-to-dot game (Nối điểm). These functions do not use the DOM.
// Level 1: pictures with 10 dots or fewer. Level 2: pictures with up to 20 dots.

import { pick } from './random.js';
import { DESIGNS } from './dots-data.js';

export { DESIGNS };

export function makeRound(level, rand = Math.random, lastId = null) {
  const list = DESIGNS[level >= 2 ? 2 : 1];
  const choices = list.length > 1 ? list.filter((d) => d.id !== lastId) : list;
  return { design: pick(rand, choices), next: 0 };
}

/**
 * The child taps a dot.
 * @returns {{state: object, event: 'next'|'done'|'wrong'|'old'}}
 */
export function tapDot(state, index) {
  const count = state.design.points.length;
  if (state.next >= count) return { state, event: 'old' };
  if (index < state.next) return { state, event: 'old' };
  if (index !== state.next) return { state, event: 'wrong' };
  const next = state.next + 1;
  return { state: { ...state, next }, event: next === count ? 'done' : 'next' };
}

/** The radius around each dot that a tap can hit. Near dots get a smaller radius. */
export function hitRadius(points, i, max = 11) {
  let near = Infinity;
  points.forEach((p, k) => {
    if (k !== i) near = Math.min(near, Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  });
  return Math.max(4, Math.min(max, near / 2));
}
