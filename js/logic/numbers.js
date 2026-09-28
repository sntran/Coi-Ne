// Questions for the Numbers game. These functions do not use the DOM.
// Level 1: match a digit (1 to 10) to a group with the same number of things.
// Level 2: quick look. A group of 1 to 6 pebbles shows for a short time. The child sees the number
//          without counting (subitizing).
// Level 3: count to 20. Each tap on a thing speaks the next number.
// Level 4: which group has more (or fewer)?
// Level 5: add two groups to 10 or less.

import { randInt, pick, shuffle } from './random.js';

// Pictures to count. The names are in the language files: thing.<id>.1 and thing.<id>.n.
export const THINGS = ['duck', 'goldfish', 'star', 'apple', 'lotus', 'lantern', 'chick', 'blossom'];

// The places of the pebbles for 1 to 6, like on a dice. The box is 100 by 100.
export const DICE = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[24, 24], [50, 50], [76, 76]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
};

/** Turn the places a quarter turn around the middle of the box. */
function turnQuarter(points) {
  return points.map(([x, y]) => [100 - y, x]);
}

/** count different numbers from min to max. One of them is n. The others are near n. */
export function nearbyChoices(rand, n, min, max, count = 3) {
  const set = new Set([n]);
  let spread = 1;
  while (set.size < count && spread < 20) {
    const options = [];
    for (let d = -spread; d <= spread; d++) {
      const v = n + d;
      if (v >= min && v <= max && !set.has(v)) options.push(v);
    }
    if (options.length) set.add(pick(rand, options));
    else spread += 1;
    if (set.size < count && options.length <= 1) spread += 1;
  }
  return shuffle(rand, [...set]);
}

export function makeQuestion(level, rand = Math.random) {
  const thing = pick(rand, THINGS);
  if (level === 1) {
    const n = randInt(rand, 1, 10);
    const counts = nearbyChoices(rand, n, 1, 10, 3);
    return { level, type: 'match', thing, n, choices: counts, answer: n };
  }
  if (level === 2) {
    const n = randInt(rand, 1, 6);
    const dots = rand() < 0.5 ? DICE[n] : turnQuarter(DICE[n]);
    return { level, type: 'quick', n, dots, choices: nearbyChoices(rand, n, 1, 6, 3), answer: n };
  }
  if (level === 3) {
    const n = randInt(rand, 6, 20);
    return { level, type: 'count', thing, n, answer: n };
  }
  if (level === 4) {
    const a = randInt(rand, 1, 10);
    let b = randInt(rand, 1, 9);
    if (b >= a) b += 1;
    const ask = rand() < 0.7 ? 'more' : 'fewer';
    const answer = ask === 'more' ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
    return { level, type: 'compare', ask, groups: [{ thing, n: a }, { thing, n: b }], answer };
  }
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 10 - a);
  return { level, type: 'add', thing, a, b, n: a + b, choices: nearbyChoices(rand, a + b, 1, 10, 3), answer: a + b };
}

export function checkAnswer(question, choice) {
  return choice === question.answer;
}
