// Rules of Rồng rắn lên mây. These functions do not use the DOM.
// Part 1: the song. For each line, one friend holds on to the tail of the dragon.
// Part 2: the talk with the doctor (thầy thuốc). "Con lên mấy?" The child answers 1, 2, 3, … 10.
// Part 3: the chase. The head follows the finger. Each friend follows the friend in front.
// The doctor runs to the tail. The dragon wins when the tail is safe until the time ends.
// Level 1: the next number shines, and the doctor is slow. Level 2: choose the next number from
// three numbers, and the doctor is faster.
// The places are in pixels.

import { nearbyChoices } from './numbers.js';

export const SONG_LINES = 4;
export const AGES = 10;

export function chaseTime(level) {
  return level >= 2 ? 15000 : 12000;
}

/** The speed of the doctor, in parts of the short side of the yard for each second. */
export function doctorSpeed(level) {
  return level >= 2 ? 0.3 : 0.2;
}

/** The numbers to show for the next age. Level 1 shows all numbers. */
export function ageChoices(level, age, rand = Math.random) {
  if (level < 2) return Array.from({ length: AGES }, (_, i) => i + 1);
  return nearbyChoices(rand, age, 1, AGES, 3);
}

/**
 * Move each friend toward the friend in front, so that the gap between them is `gap` or less.
 * @param {Array<{x: number, y: number}>} chain the head is first
 */
export function follow(chain, head, gap) {
  const next = [{ x: head.x, y: head.y }];
  for (let i = 1; i < chain.length; i++) {
    const front = next[i - 1];
    const p = chain[i];
    const d = Math.hypot(p.x - front.x, p.y - front.y);
    if (d <= gap) next.push({ x: p.x, y: p.y });
    else next.push({ x: front.x + ((p.x - front.x) * gap) / d, y: front.y + ((p.y - front.y) * gap) / d });
  }
  return next;
}

/** Move the doctor toward the target by `step` pixels or less. */
export function stepToward(from, to, step) {
  if (!(step > 0)) return { x: from.x, y: from.y };
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  if (d <= step) return { x: to.x, y: to.y };
  return { x: from.x + ((to.x - from.x) * step) / d, y: from.y + ((to.y - from.y) * step) / d };
}

/**
 * Move the doctor one step to the tail. The head and the body block the doctor with their arms.
 * A blocked doctor goes around the friend who blocks, on the side of the tail.
 * @param {{x: number, y: number}} doctor
 * @param {Array<{x: number, y: number}>} chain the head is first, and the tail is last
 * @param {number} step the length of the step in pixels
 * @param {number} room the distance that a friend keeps the doctor away
 */
export function doctorMove(doctor, chain, step, room) {
  const tail = chain[chain.length - 1];
  let next = stepToward(doctor, tail, step);
  for (const p of chain.slice(0, -1)) {
    const d = Math.hypot(next.x - p.x, next.y - p.y);
    if (d >= room) continue;
    const n = d > 0 ? { x: (next.x - p.x) / d, y: (next.y - p.y) / d } : { x: 1, y: 0 };
    let side = { x: -n.y, y: n.x };
    if (side.x * (tail.x - p.x) + side.y * (tail.y - p.y) < 0) side = { x: -side.x, y: -side.y };
    next = { x: p.x + n.x * room + side.x * step, y: p.y + n.y * room + side.y * step };
  }
  return next;
}

export function isCaught(tail, doctor, radius) {
  return Math.hypot(tail.x - doctor.x, tail.y - doctor.y) <= radius;
}
