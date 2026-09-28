// Rules of Chi chi chành chành. These functions do not use the DOM.
// The child holds a finger on the open hand while the đồng dao plays. On the last word, the hand
// closes. The child must pull the finger out while the hand closes.
// Level 1: the hand closes slowly. Level 2: the hand closes fast, and one time in the song it
// moves a little, as a trick. A finger that leaves the hand before the end only stops the song.

import { randInt } from './random.js';

export const LINES = 6;

/** The time in milliseconds that the hand takes to close. */
export function closeTime(level) {
  return level >= 2 ? 750 : 1300;
}

export function makeRound(level, rand = Math.random) {
  // The trick comes after a line in the middle of the song, not after the last line.
  return { level, trickAfter: level >= 2 ? randInt(rand, 1, LINES - 2) : -1 };
}

/**
 * What happens when the finger leaves the hand.
 * @param {'song'|'closing'|'closed'} phase
 * @returns {'wait'|'escaped'|'caught'}
 */
export function lift(phase) {
  if (phase === 'closing') return 'escaped';
  if (phase === 'closed') return 'caught';
  return 'wait';
}
