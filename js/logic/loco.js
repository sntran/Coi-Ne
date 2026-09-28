// Rules of Nhảy lò cò (hopscotch). These functions do not use the DOM.
// The child throws the pebble onto a square. Then the child hops on the squares 1 to 8 in order,
// and jumps over the square with the pebble.
// Level 1: hop up to 8. Level 2: hop up to 8, then back down to 1.

import { randInt } from './random.js';

export const SQUARES = 8;
// The rows of the board, from the bottom to the top.
export const ROWS = [[1], [2], [3], [4, 5], [6], [7, 8]];

export function makeRound(level, rand = Math.random) {
  return { level, pebble: randInt(rand, 1, SQUARES) };
}

/** The squares to hop on, in order. */
export function hopPath(round) {
  const up = [];
  for (let n = 1; n <= SQUARES; n++) if (n !== round.pebble) up.push(n);
  return round.level >= 2 ? [...up, ...up.slice(0, -1).reverse()] : up;
}

/**
 * The child taps a square.
 * @returns {{step: number, event: 'hop'|'done'|'pebble'|'wrong'}}
 */
export function hop(round, step, square) {
  const path = hopPath(round);
  if (square === round.pebble) return { step, event: 'pebble' };
  if (square !== path[step]) return { step, event: 'wrong' };
  return { step: step + 1, event: step + 1 === path.length ? 'done' : 'hop' };
}
