// Game: Floating market (Chợ nổi). The child buys fruit from the boats.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame, langBadge, burst } from '../core/ui.js';
import { picture, imageFile } from '../core/images.js';
import { gameLevel } from '../core/state.js';
import { FRUITS, makeOrder, addFruit } from '../logic/market.js';

const INK = '#3b2a2a';
const fruitName = (fruit, n) => ({ key: `market.fruit.${fruit}.${n === 1 ? '1' : 'n'}` });
let introDone = false;

/** A boat (ghe) with painted eyes, a seller in a nón lá, and a tall pole (cây bẹo) with the fruit on top. */
function boatMarkup(fruit) {
  const file = imageFile(FRUITS[fruit]);
  return `<svg viewBox="0 0 160 140" aria-hidden="true">
    <path d="M118 104 V14" stroke="#9c6b43" stroke-width="5" stroke-linecap="round"/>
    <image href="${file}" x="100" y="0" width="36" height="36"/>
    <path d="M46 70 L60 44 L74 70 Z" fill="#ecc98f" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="50" y="68" width="20" height="30" rx="7" fill="#e0463c" stroke="${INK}" stroke-width="2.5"/>
    <image href="${file}" x="76" y="74" width="22" height="22"/><image href="${file}" x="92" y="78" width="22" height="22"/>
    <path d="M8 96 Q20 92 150 92 Q146 118 120 122 H40 Q16 120 8 96 Z" fill="#9c6b43" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 98 H148" stroke="#e0463c" stroke-width="4"/>
    <ellipse cx="30" cy="108" rx="7" ry="5" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="31" cy="108" r="2.6" fill="${INK}"/>
  </svg>`;
}

export function mount(screen) {
  const level = gameLevel('market');
  let alive = true;
  let order = null;
  let busy = false;

  const card = el('div', { class: 'market-order' });
  const river = el('div', { class: 'market-river' });
  const tray = el('div', { class: 'market-tray' });
  screen.stage.replaceChildren(el('div', { class: 'market-layout' }, [card, river, tray]));

  function prompt() {
    const [a, b] = order.items;
    if (!b) return [{ key: 'market.order1', params: { n: a.n, f: fruitName(a.fruit, a.n) } }];
    return [{ key: 'market.order2', params: { n1: a.n, f1: fruitName(a.fruit, a.n), n2: b.n, f2: fruitName(b.fruit, b.n) } }];
  }

  function drawCard() {
    card.replaceChildren(...order.items.map((item) => {
      const have = order.basket[item.fruit] || 0;
      const slots = Array.from({ length: item.n }, (_, i) => el('span', { class: `market-slot ${i < have ? 'is-full' : ''}` }, [i < have ? picture(FRUITS[item.fruit]) : null]));
      return el('div', { class: 'market-need' }, [
        el('div', { class: 'market-need-pic' }, [picture(FRUITS[item.fruit]), langBadge(`market.fruit.${item.fruit}.1`)]),
        el('span', { class: 'market-count big-digit', text: String(item.n) }),
        el('div', { class: 'market-slots' }, slots),
      ]);
    }));
    onTap(card, () => speakAll(prompt()));
  }

  function openBoat(fruit, boat) {
    river.querySelectorAll('.is-open').forEach((n) => n.classList.remove('is-open'));
    boat.classList.add('is-open');
    sfx.tap();
    const fruits = Array.from({ length: 6 }, () => {
      const b = el('button', { class: 'choice market-fruit', attrs: { type: 'button', 'aria-label': t(`market.fruit.${fruit}.1`) } }, [picture(FRUITS[fruit])]);
      onTap(b, () => take(fruit, b));
      return b;
    });
    tray.replaceChildren(...fruits);
    speakAll([{ key: `market.fruit.${fruit}.1` }]);
  }

  async function take(fruit, button) {
    if (busy) return;
    const r = addFruit(order, fruit);
    if (r.event === 'notNeeded') {
      speak('market.notNeeded', { f: fruitName(fruit, 2) });
      return;
    }
    if (r.event === 'enough') {
      speak('market.enough', { f: fruitName(fruit, 2) });
      return;
    }
    order = r.order;
    button.classList.add('is-taken');
    button.disabled = true;
    sfx.pop();
    drawCard();
    speak(`num.${order.basket[fruit]}`);
    if (!r.done) return;
    busy = true;
    burst(card);
    await wait(700);
    const res = await answer('market', true, card, ['market.thanks']);
    if (!alive) return;
    if (res.levelUp) return reloadGame();
    await wait(500);
    if (alive) start();
  }

  function start() {
    busy = false;
    order = makeOrder(level);
    drawCard();
    tray.replaceChildren();
    river.replaceChildren(...order.boats.map((fruit) => {
      const boat = el('button', { class: 'market-boat', html: boatMarkup(fruit), attrs: { type: 'button', 'aria-label': t('market.boat', { f: fruitName(fruit, 2) }) } });
      onTap(boat, () => openBoat(fruit, boat));
      return boat;
    }));
    const intro = introDone ? [] : ['market.intro'];
    introDone = true;
    screen.say([...intro, ...prompt(), 'market.pick']);
  }

  start();
  return () => {
    alive = false;
  };
}
