// Rules of the festival game (Lễ hội): Tết and Trung Thu. These functions do not use the DOM.

import { randInt, sample, shuffle, pick } from './random.js';

export const FESTIVALS = {
  tet: ['mam', 'lixi', 'color'],
  trungthu: ['lanterns', 'color'],
};

// The Southern mâm ngũ quả: "cầu vừa đủ xài" = mãng cầu, dừa, đu đủ, xoài.
export const TRAY_FRUITS = ['mangcau', 'coconut', 'dudu', 'mango'];
export const OTHER_FRUITS = ['apple', 'banana', 'grapes', 'pineapple', 'strawberry'];

export function makeTray(rand = Math.random) {
  const wrong = sample(rand, OTHER_FRUITS, 2);
  return { choices: shuffle(rand, [...TRAY_FRUITS, ...wrong]), placed: [] };
}

/** @returns {{state: object, event: 'placed'|'wrong'|'old', done: boolean}} */
export function placeFruit(state, fruit) {
  if (state.placed.includes(fruit)) return { state, event: 'old', done: false };
  if (!TRAY_FRUITS.includes(fruit)) return { state, event: 'wrong', done: false };
  const placed = [...state.placed, fruit];
  return { state: { ...state, placed }, event: 'placed', done: placed.length === TRAY_FRUITS.length };
}

export function makeLixi(rand = Math.random) {
  return { n: randInt(rand, 1, 5), envelopes: 6, taken: 0 };
}

/** @returns {{state: object, event: 'taken'|'enough', done: boolean}} */
export function takeLixi(state) {
  if (state.taken >= state.n) return { state, event: 'enough', done: true };
  const taken = state.taken + 1;
  return { state: { ...state, taken }, event: 'taken', done: taken === state.n };
}

export const LANTERNS = ['denongsao', 'longdencachep', 'lantern'];

export function makeLanterns(rand = Math.random) {
  const n = randInt(rand, 3, 6);
  return { lanterns: Array.from({ length: n }, () => pick(rand, LANTERNS)), lit: [] };
}

/** @returns {{state: object, event: 'lit'|'old', done: boolean}} */
export function lightLantern(state, index) {
  if (state.lit.includes(index) || index < 0 || index >= state.lanterns.length) {
    return { state, event: 'old', done: state.lit.length === state.lanterns.length };
  }
  const lit = [...state.lit, index];
  return { state: { ...state, lit }, event: 'lit', done: lit.length === state.lanterns.length };
}
