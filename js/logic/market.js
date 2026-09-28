// Rules of the floating market game (Chợ nổi). These functions do not use the DOM.
// Level 1: buy 1 to 3 of one fruit. Level 2: buy 1 to 5 of one fruit.
// Level 3: buy two kinds of fruit.
// Level 4: buy fruit in bags, for example 3 bags with 2 mangoes in each bag. Equal groups are
//          the start of the thinking for the times table.

import { randInt, sample, shuffle } from './random.js';

// Each fruit has a picture id. The names are in the language files: market.fruit.<id>.1 and .n.
export const FRUITS = {
  xoai: 'mango',
  dua: 'coconut',
  chuoi: 'banana',
  duahau: 'watermelon',
  thom: 'pineapple',
  cam: 'orange',
};

export const BOATS = 4;

// Small fruit that people sell in bags.
export const BAG_FRUITS = ['xoai', 'cam', 'chuoi'];

export function makeOrder(level, rand = Math.random) {
  if (level >= 4) {
    const fruit = BAG_FRUITS[randInt(rand, 0, BAG_FRUITS.length - 1)];
    const bags = randInt(rand, 2, 3);
    const per = randInt(rand, 2, bags === 2 ? 5 : 3);
    const others = sample(rand, Object.keys(FRUITS).filter((f) => f !== fruit), BOATS - 1);
    return { items: [{ fruit, n: bags * per, bags, per }], boats: shuffle(rand, [fruit, ...others]), basket: {} };
  }
  const kinds = level >= 3 ? 2 : 1;
  const max = level === 2 ? 5 : 3;
  const wanted = sample(rand, Object.keys(FRUITS), kinds);
  const items = wanted.map((fruit) => ({ fruit, n: randInt(rand, 1, max) }));
  const others = sample(rand, Object.keys(FRUITS).filter((f) => !wanted.includes(f)), BOATS - kinds);
  return { items, boats: shuffle(rand, [...wanted, ...others]), basket: {} };
}

export function needOf(order, fruit) {
  return order.items.find((i) => i.fruit === fruit)?.n || 0;
}

export function isComplete(order) {
  return order.items.every((i) => (order.basket[i.fruit] || 0) === i.n);
}

/**
 * Put one fruit in the basket.
 * @returns {{order: object, event: 'added'|'notNeeded'|'enough', done: boolean}}
 */
export function addFruit(order, fruit) {
  const need = needOf(order, fruit);
  if (!need) return { order, event: 'notNeeded', done: isComplete(order) };
  const have = order.basket[fruit] || 0;
  if (have >= need) return { order, event: 'enough', done: isComplete(order) };
  const next = { ...order, basket: { ...order.basket, [fruit]: have + 1 } };
  return { order: next, event: 'added', done: isComplete(next) };
}

/** The number of fruit in each bag, when the basket has `have` fruit. The bags fill one after the other. */
export function bagCounts(item, have) {
  return Array.from({ length: item.bags }, (_, i) => Math.max(0, Math.min(item.per, have - i * item.per)));
}
