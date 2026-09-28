// Rules of the fair share game (Chia đều). These functions do not use the DOM.
// Level 1: share things between 2 or 3 friends. Each friend must get the same number.
// Level 2: equal groups. Each friend wants the same number of things. How many things in all?
// Level 3: rows. Plant rice in rows. Count by rows. Turn the field: the total stays the same.

import { randInt, pick } from './random.js';
import { nearbyChoices } from './numbers.js';

// Pictures to share. The names are in the language files: share.thing.<id>.1 and .n.
export const THINGS = ['mooncake', 'candy', 'orange', 'strawberry'];

// The largest total at level 3 is 12, so the choices go to 12.
const MAX_TOTAL = 12;

export function makeRound(level, rand = Math.random) {
  const thing = pick(rand, THINGS);
  if (level <= 1) {
    const friends = pick(rand, [2, 2, 3]);
    const each = friends === 2 ? randInt(rand, 2, 3) : randInt(rand, 1, 2);
    return { level: 1, thing, friends, each, total: friends * each };
  }
  if (level === 2) {
    const friends = randInt(rand, 2, 4);
    const each = randInt(rand, 2, Math.floor(10 / friends));
    const total = friends * each;
    return { level: 2, thing, friends, each, total, extra: 2, choices: nearbyChoices(rand, total, 1, MAX_TOTAL, 3) };
  }
  const rows = randInt(rand, 2, 3);
  const cols = randInt(rand, 2, 4);
  const total = rows * cols;
  return { level: 3, thing: 'seedling', rows, cols, total, choices: nearbyChoices(rand, total, 1, MAX_TOTAL, 3) };
}

/** The start of a level 1 or level 2 round: empty plates, and all the things in the pool. */
export function startPlates(round) {
  return { plates: Array(round.friends).fill(0), pool: round.total + (round.extra || 0) };
}

/**
 * Put one thing from the pool on a plate.
 * At level 2, a plate takes only the number that the friend wants.
 * @returns {{state: object, event: 'added'|'empty'|'full'}}
 */
export function give(round, state, plate) {
  if (state.pool <= 0) return { state, event: 'empty' };
  if (round.level === 2 && state.plates[plate] >= round.each) return { state, event: 'full' };
  const plates = state.plates.slice();
  plates[plate] += 1;
  return { state: { plates, pool: state.pool - 1 }, event: 'added' };
}

/** Put one thing from a plate back in the pool. */
export function takeBack(state, plate) {
  if (!state.plates[plate]) return { state, event: 'none' };
  const plates = state.plates.slice();
  plates[plate] -= 1;
  return { state: { plates, pool: state.pool + 1 }, event: 'back' };
}

/** Level 1: all things are on the plates, and each plate has the same number. */
export function isFair(state) {
  return state.pool === 0 && state.plates.every((n) => n === state.plates[0]);
}

/** Level 2: each plate has the number that the friend wants. */
export function isFull(round, state) {
  return state.plates.every((n) => n === round.each);
}

/**
 * The face of each friend.
 * A friend with the most things is happy. A friend with fewer things waits,
 * and is sad when no things are left in the pool.
 * @returns {Array<'happy'|'wait'|'sad'>}
 */
export function moods(state) {
  const most = Math.max(...state.plates);
  return state.plates.map((n) => (n === most ? 'happy' : state.pool > 0 ? 'wait' : 'sad'));
}

/** Count by groups: 2, 4, 6. */
export function skipCounts(each, groups) {
  return Array.from({ length: groups }, (_, i) => each * (i + 1));
}

/** Level 3: the rows that have a plant in each hole. `planted` has one "row,col" text for each plant. */
export function fullRows(round, planted) {
  const rows = [];
  for (let r = 0; r < round.rows; r++) {
    let full = true;
    for (let c = 0; c < round.cols; c++) if (!planted.has(`${r},${c}`)) full = false;
    if (full) rows.push(r);
  }
  return rows;
}

export function checkTotal(round, n) {
  return n === round.total;
}
