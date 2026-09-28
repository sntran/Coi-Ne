// Sorting rules for the Sorting game. These functions do not use the DOM.
// Level 1: one rule (color, shape, or size) and 2 boxes.
// Level 2: two rules, for example "big and red", and 4 boxes.

import { pick, sample, shuffle } from './random.js';

export const VALUES = {
  color: ['red', 'blue', 'yellow', 'green'],
  shape: ['circle', 'square', 'triangle', 'star'],
  size: ['small', 'big'],
};
export const ATTRS = ['color', 'shape', 'size'];

/** The box of an item: the index of the box whose values match the item. */
export function boxFor(item, boxes) {
  return boxes.findIndex((box) => Object.entries(box).every(([attr, value]) => item[attr] === value));
}

export function isRightBox(item, boxes, index) {
  return boxFor(item, boxes) === index;
}

function randomItem(rand, fixed) {
  return {
    color: fixed.color ?? pick(rand, VALUES.color),
    shape: fixed.shape ?? pick(rand, VALUES.shape),
    size: fixed.size ?? pick(rand, VALUES.size),
  };
}

export function makeRound(level, rand = Math.random) {
  const attrs = level >= 2 ? sample(rand, ATTRS, 2) : [pick(rand, ATTRS)];
  const choices = attrs.map((a) => (a === 'size' ? ['small', 'big'] : sample(rand, VALUES[a], 2)));
  const boxes = [];
  if (attrs.length === 1) {
    for (const v of choices[0]) boxes.push({ [attrs[0]]: v });
  } else {
    for (const v1 of choices[0]) for (const v2 of choices[1]) boxes.push({ [attrs[0]]: v1, [attrs[1]]: v2 });
  }
  const perBox = attrs.length === 1 ? 3 : 2;
  const items = [];
  boxes.forEach((box) => {
    for (let i = 0; i < perBox; i++) items.push({ ...randomItem(rand, box), id: items.length });
  });
  return { attrs, boxes, items: shuffle(rand, items) };
}

/** The text keys that name a box, for the voice. */
export function boxKeys(box) {
  return Object.entries(box).map(([attr, value]) => (attr === 'color' ? `color.${value}` : attr === 'shape' ? `shape.${value}` : `size.${value}`));
}
