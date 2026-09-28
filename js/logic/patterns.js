// Pattern rules for the Patterns game. These functions do not use the DOM.
// Levels 1-3: AB. Levels 4-6: AAB or ABB. Levels 7-9: ABC.
// In each group of 3 levels: colors first, then shapes, then sizes.

import { pick, sample, shuffle } from './random.js';

export const COLORS = ['red', 'blue', 'yellow', 'green', 'purple'];
export const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
export const SIZES = ['small', 'medium', 'big'];

export const UNITS = {
  AB: [0, 1],
  AAB: [0, 0, 1],
  ABB: [0, 1, 1],
  ABC: [0, 1, 2],
};

export function levelInfo(level) {
  const l = Math.min(9, Math.max(1, level));
  const kind = l <= 3 ? ['AB'] : l <= 6 ? ['AAB', 'ABB'] : ['ABC'];
  const attr = ['color', 'shape', 'size'][(l - 1) % 3];
  return { kind, attr };
}

function valuesFor(attr) {
  if (attr === 'color') return COLORS;
  if (attr === 'shape') return SHAPES;
  return SIZES;
}

function makeItem(attr, value, base) {
  return { ...base, [attr]: value };
}

export function sameItem(a, b) {
  return a.color === b.color && a.shape === b.shape && a.size === b.size;
}

/**
 * Make a pattern question.
 * @returns {{kind: string, attr: string, row: object[], answer: object, choices: object[]}}
 */
export function makePattern(level, rand = Math.random) {
  const info = levelInfo(level);
  const kind = pick(rand, info.kind);
  const unit = UNITS[kind];
  const distinct = Math.max(...unit) + 1;
  const all = valuesFor(info.attr);
  let values;
  if (info.attr === 'size') {
    // Two sizes: small and big. Three sizes: small, medium, and big.
    values = distinct === 2 ? shuffle(rand, ['small', 'big']) : shuffle(rand, SIZES);
  } else {
    values = sample(rand, all, distinct);
  }
  const base = {
    color: info.attr === 'color' ? null : pick(rand, COLORS),
    shape: info.attr === 'shape' ? null : pick(rand, ['circle', 'square', 'star', 'heart']),
    size: info.attr === 'size' ? null : 'big',
  };
  const offset = Math.floor(rand() * unit.length);
  const length = unit.length * 2 + offset;
  const seq = [];
  for (let i = 0; i <= length; i++) seq.push(makeItem(info.attr, values[unit[i % unit.length]], base));
  const answer = seq[length];
  const row = seq.slice(0, length);

  // Choices: the values of the pattern, and one more value if there are only two.
  const choiceValues = [...values];
  if (choiceValues.length < 3) {
    const extra = all.filter((v) => !choiceValues.includes(v) && !(info.attr === 'size' && v === 'medium'));
    if (extra.length) choiceValues.push(pick(rand, extra));
  }
  const choices = shuffle(rand, choiceValues.map((v) => makeItem(info.attr, v, base)));
  return { kind, attr: info.attr, row, answer, choices };
}

export function checkPattern(question, choice) {
  return sameItem(question.answer, choice);
}

/** The text keys that name an item, for the voice. */
export function itemKey(item, attr) {
  if (attr === 'color') return `color.${item.color}`;
  if (attr === 'shape') return `shape.${item.shape}`;
  return `size.${item.size}`;
}
