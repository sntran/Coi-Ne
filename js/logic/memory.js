// Rules of the Memory pairs game. These functions do not use the DOM.

import { sample, shuffle } from './random.js';

export const CARD_COUNTS = { 1: 4, 2: 6, 3: 8, 4: 12 };

export const PICTURES = [
  'cat', 'dog', 'duck', 'pig', 'rabbit', 'frog', 'goldfish', 'bear', 'lion', 'chick', 'cow2', 'elephant',
  'monkey', 'butterfly', 'ladybug', 'crab', 'octopus', 'apple', 'banana', 'watermelon', 'cherries',
  'strawberry', 'grapes', 'orange', 'lotus', 'lantern',
];

export function deal(level, rand = Math.random, pool = PICTURES) {
  const count = CARD_COUNTS[level] || 4;
  const pics = sample(rand, pool, count / 2);
  const cards = shuffle(rand, [...pics, ...pics]).map((pic, i) => ({ id: i, pic, matched: false }));
  return { cards, open: [], moves: 0 };
}

/**
 * Turn over one card.
 * @returns {{state: object, event: 'first'|'match'|'mismatch'|'ignored', done: boolean}}
 */
export function flip(state, index) {
  const card = state.cards[index];
  if (!card || card.matched || state.open.includes(index) || state.open.length >= 2) {
    return { state, event: 'ignored', done: isDone(state) };
  }
  const open = [...state.open, index];
  if (open.length === 1) return { state: { ...state, open }, event: 'first', done: false };
  const [a, b] = open;
  const moves = state.moves + 1;
  if (state.cards[a].pic === state.cards[b].pic) {
    const cards = state.cards.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
    const next = { cards, open: [], moves };
    return { state: next, event: 'match', done: isDone(next) };
  }
  return { state: { ...state, open, moves }, event: 'mismatch', done: false };
}

/** Turn the two open cards back after a mismatch. */
export function closeOpen(state) {
  return { ...state, open: [] };
}

export function isDone(state) {
  return state.cards.every((c) => c.matched);
}

/** Columns for a grid of cards. */
export function columns(count, landscape = false) {
  if (count <= 4) return 2;
  if (count === 6) return landscape ? 3 : 2;
  if (count === 8) return landscape ? 4 : 2;
  return landscape ? 4 : 3;
}
