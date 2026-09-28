// Rules of the Shape builder game. These functions do not use the DOM.
// A design is a list of slots on a grid of 100 x 100. A slot has a type, a center (x, y),
// a width w, a height h, and a turn (rot) of 0, 90, 180, or 270 degrees.

import { pick, shuffle } from './random.js';

export const TYPES = ['circle', 'square', 'triangle', 'rectangle'];

const s = (type, x, y, w, h, rot = 0) => ({ type, x, y, w, h, rot });

export const DESIGNS = {
  1: [
    { id: 'house', slots: [s('square', 50, 66, 48, 48), s('triangle', 50, 28, 62, 28)] },
    { id: 'icecream', slots: [s('triangle', 50, 66, 36, 46, 180), s('circle', 50, 32, 38, 38)] },
    { id: 'tree', slots: [s('rectangle', 50, 78, 18, 32), s('circle', 50, 40, 56, 56)] },
    { id: 'denongsao', slots: [s('triangle', 50, 44, 64, 56), s('triangle', 50, 62, 64, 56, 180)] },
    { id: 'boat', slots: [s('triangle', 52, 38, 42, 46), s('rectangle', 50, 74, 76, 20)] },
  ],
  2: [
    { id: 'house', slots: [s('square', 50, 64, 52, 52), s('triangle', 50, 25, 70, 28), s('rectangle', 38, 76, 16, 28), s('square', 64, 58, 16, 16)] },
    { id: 'rocket', slots: [s('rectangle', 50, 54, 28, 46), s('triangle', 50, 20, 28, 22), s('triangle', 28, 72, 16, 26), s('triangle', 72, 72, 16, 26)] },
    { id: 'boat', slots: [s('rectangle', 50, 78, 76, 18), s('triangle', 42, 44, 36, 48), s('triangle', 68, 50, 20, 34), s('circle', 84, 16, 20, 20)] },
    { id: 'denongsao', slots: [s('triangle', 50, 40, 60, 52), s('triangle', 50, 58, 60, 52, 180), s('circle', 50, 50, 20, 20), s('rectangle', 50, 90, 44, 12)] },
  ],
  3: [
    { id: 'car', slots: [s('rectangle', 50, 62, 80, 24), s('square', 44, 40, 30, 30), s('circle', 28, 78, 20, 20), s('circle', 72, 78, 20, 20), s('square', 44, 40, 14, 14), s('circle', 86, 58, 10, 10)] },
    { id: 'rocket', slots: [s('rectangle', 50, 50, 28, 44), s('triangle', 50, 18, 28, 20), s('triangle', 28, 66, 16, 24), s('triangle', 72, 66, 16, 24), s('circle', 50, 46, 14, 14), s('triangle', 50, 84, 18, 20, 180)] },
    { id: 'cat', slots: [s('circle', 50, 72, 46, 46), s('circle', 50, 38, 38, 38), s('triangle', 36, 18, 16, 18), s('triangle', 64, 18, 16, 18), s('rectangle', 80, 80, 10, 30), s('triangle', 50, 42, 10, 8, 180)] },
    { id: 'robot', slots: [s('square', 50, 22, 30, 30), s('rectangle', 50, 58, 42, 38), s('rectangle', 20, 58, 12, 32), s('rectangle', 80, 58, 12, 32), s('circle', 43, 22, 10, 10), s('circle', 57, 22, 10, 10)] },
  ],
};

/** True when two turns give the same picture for this type of shape. */
export function sameTurn(type, a, b) {
  const x = ((a % 360) + 360) % 360;
  const y = ((b % 360) + 360) % 360;
  if (type === 'circle') return true;
  if (type === 'square') return x % 90 === y % 90;
  if (type === 'rectangle') return x % 180 === y % 180;
  return x === y;
}

export function turn(rot) {
  return (rot + 90) % 360;
}

/**
 * Make a round: a design and the pieces for the tray.
 * Level 1 pieces have the correct turn. At higher levels, some pieces need turns.
 */
export function makeRound(level, rand = Math.random) {
  const design = pick(rand, DESIGNS[level] || DESIGNS[1]);
  const pieces = design.slots.map((slot, i) => {
    let rot = slot.rot;
    if (level > 1 && slot.type !== 'circle' && slot.type !== 'square' && rand() < 0.6) {
      rot = (slot.rot + (slot.type === 'rectangle' ? 90 : 90 * (1 + Math.floor(rand() * 3)))) % 360;
    }
    return { id: i, type: slot.type, w: slot.w, h: slot.h, rot };
  });
  return { design, pieces: shuffle(rand, pieces) };
}

/**
 * Find the free slot for a piece that the child drops at (x, y) on the board.
 * @returns {{slot: number|null, needsTurn: boolean}}
 */
export function findSlot(design, piece, x, y, filled = new Set()) {
  let best = null;
  let bestDist = Infinity;
  let turnSlot = null;
  design.slots.forEach((slot, i) => {
    if (filled.has(i)) return;
    if (slot.type !== piece.type || slot.w !== piece.w || slot.h !== piece.h) return;
    const d = Math.hypot(slot.x - x, slot.y - y);
    const reach = Math.max(14, Math.min(slot.w, slot.h) * 0.6);
    if (d > reach) return;
    if (!sameTurn(slot.type, slot.rot, piece.rot)) {
      if (turnSlot == null) turnSlot = i;
      return;
    }
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return { slot: best, needsTurn: best == null && turnSlot != null };
}
