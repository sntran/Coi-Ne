// Rules of Tập tầm vông. These functions do not use the DOM.
// Level 1: Sỏi hides a small thing in one of 2 hands.
// Level 2: Sỏi shows the hand with the thing, then moves the hands.
// Level 3: Sỏi puts the thing under one of 3 cups, then moves the cups.

import { randInt } from './random.js';

/** Swap the things in two places. Return the new place of the thing that was at start. */
export function applySwaps(start, swaps) {
  let pos = start;
  for (const [a, b] of swaps) {
    if (pos === a) pos = b;
    else if (pos === b) pos = a;
  }
  return pos;
}

export function makeRound(level, rand = Math.random) {
  const count = level >= 3 ? 3 : 2;
  const start = randInt(rand, 0, count - 1);
  const swaps = [];
  if (level >= 2) {
    const n = level === 2 ? randInt(rand, 1, 3) : randInt(rand, 2, 4);
    for (let i = 0; i < n; i++) {
      const a = randInt(rand, 0, count - 1);
      let b = randInt(rand, 0, count - 2);
      if (b >= a) b += 1;
      swaps.push([a, b]);
    }
  }
  return {
    level,
    count,
    cups: level >= 3,
    showStart: level >= 2,
    start,
    swaps,
    answer: applySwaps(start, swaps),
  };
}

export function isCorrect(round, choice) {
  return choice === round.answer;
}
