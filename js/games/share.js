// Game: Fair share (Chia đều). The start of the thinking for the times table.
// Level 1: share things fairly. Level 2: equal groups. Level 3: rows of rice plants.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame, langBadge, burst } from '../core/ui.js';
import { draggable, elementBelow } from '../core/drag.js';
import { picture } from '../core/images.js';
import { gameLevel } from '../core/state.js';
import { makeRound, startPlates, give, takeBack, isFair, isFull, moods, skipCounts, fullRows, checkTotal } from '../logic/share.js';

const INK = '#3b2a2a';
const FRIENDS = [
  { shirt: '#e0463c', hair: 'short' },
  { shirt: '#3f6fd8', hair: 'buns' },
  { shirt: '#7cb87a', hair: 'bob' },
  { shirt: '#f2a93b', hair: 'short' },
];
const MOUTHS = {
  happy: 'M-8 5 Q0 14 8 5',
  wait: 'M-6 8 H6',
  sad: 'M-8 11 Q0 3 8 11',
};

const thingName = (thing, n) => ({ key: `share.thing.${thing}.${n === 1 ? '1' : 'n'}` });

/** The head of a friend. The mouth shows the mood. */
function friendFace(i, mood) {
  const f = FRIENDS[i % FRIENDS.length];
  const hair = {
    short: `<path d="M-21 -6 Q-20 -30 0 -29 Q21 -30 21 -6 Q10 -20 -2 -18 Q-12 -18 -21 -6 Z" fill="${INK}"/>`,
    buns: `<path d="M-21 -4 Q-20 -30 0 -29 Q21 -30 21 -4 Q10 -20 0 -19 Q-10 -20 -21 -4 Z" fill="${INK}"/>
      <circle cx="-19" cy="-24" r="8" fill="${INK}"/><circle cx="19" cy="-24" r="8" fill="${INK}"/>`,
    bob: `<path d="M-23 4 Q-24 -30 0 -30 Q24 -30 23 4 L17 6 Q15 -16 0 -16 Q-15 -16 -17 6 Z" fill="${INK}"/>`,
  }[f.hair];
  const tear = mood === 'sad' ? '<path d="M-12 2 q-3 6 0 8 q3 -2 0 -8z" fill="#8fd3f4"/>' : '';
  return `<svg viewBox="-30 -35 60 75" aria-hidden="true">
    <path d="M-26 40 Q-26 20 0 20 Q26 20 26 40 Z" fill="${f.shirt}" stroke="${INK}" stroke-width="3"/>
    <circle cx="0" cy="-4" r="22" fill="#f2c7a5" stroke="${INK}" stroke-width="3"/>${hair}
    <circle cx="-8" cy="-4" r="2.8" fill="${INK}"/><circle cx="8" cy="-4" r="2.8" fill="${INK}"/>
    <circle cx="-14" cy="4" r="3.5" fill="#f5a3b5" opacity="0.7"/><circle cx="14" cy="4" r="3.5" fill="#f5a3b5" opacity="0.7"/>
    <path d="${MOUTHS[mood]}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>${tear}
  </svg>`;
}

function digitChoices(round, onPick) {
  return round.choices.map((n) => {
    const b = el('button', { class: 'choice digit-choice', attrs: { type: 'button', 'aria-label': t(`num.${n}`) } }, [
      el('span', { class: 'big-digit', text: String(n) }),
      langBadge(`num.${n}`),
    ]);
    onTap(b, () => onPick(n, b));
    return b;
  });
}

export function mount(screen) {
  const level = gameLevel('share');
  let alive = true;

  async function finish(anchor, extra) {
    const r = await answer('share', true, anchor, extra);
    if (!alive) return;
    if (r.levelUp) return reloadGame();
    await wait(500);
    if (alive) start();
  }

  /** Light the groups one after the other, and count by groups: 2, 4, 6. */
  async function countByGroups(nodes, each) {
    const counts = skipCounts(each, nodes.length);
    for (let i = 0; i < nodes.length; i++) {
      if (!alive) return;
      nodes[i].classList.add('is-counted');
      nodes[i].dataset.count = String(counts[i]);
      sfx.pop();
      await speak(`num.${counts[i]}`);
      await wait(150);
    }
  }

  // Levels 1 and 2: friends with plates.
  function platesRound(round) {
    let state = startPlates(round);
    let busy = false;
    const pool = el('div', { class: 'share-pool' });
    const friends = el('div', { class: `share-friends is-${round.friends}` });
    const ask = el('div', { class: 'share-ask' });
    const cards = [];

    const intro = round.level === 1
      ? [{ key: 'share.intro1', params: { n: round.total, t: thingName(round.thing, round.total), f: round.friends } }, { key: 'share.how', params: { t1: thingName(round.thing, 1) } }]
      : [{ key: 'share.intro2', params: { f: round.friends, e: round.each, t: thingName(round.thing, round.each) } }];

    function drawPool() {
      const items = Array.from({ length: state.pool }, () => {
        const node = el('div', { class: 'share-thing', attrs: { role: 'button', 'aria-label': t(`share.thing.${round.thing}.1`) } }, [picture(round.thing)]);
        let from = null;
        draggable(node, {
          enabled: () => !busy,
          onTap: () => speak(`share.thing.${round.thing}.1`),
          onStart: (x, y) => { from = { x, y }; },
          onMove: (x, y) => { node.style.transform = `translate(${x - from.x}px, ${y - from.y}px) scale(1.1)`; },
          onEnd: (x, y) => {
            node.style.transform = '';
            const card = elementBelow(x, y, node)?.closest?.('.share-card');
            if (card) put(Number(card.dataset.plate));
          },
        });
        return node;
      });
      pool.replaceChildren(...items);
      pool.classList.toggle('is-empty', state.pool === 0);
    }

    function drawPlates() {
      const faces = moods(state);
      cards.forEach((card, i) => {
        card.querySelector('.share-face').innerHTML = friendFace(i, round.level === 1 ? faces[i] : state.plates[i] === round.each ? 'happy' : 'wait');
        const plate = card.querySelector('.share-plate');
        const things = Array.from({ length: state.plates[i] }, () => {
          const pic = el('span', { class: 'share-on-plate', attrs: { role: 'img' } }, [picture(round.thing)]);
          if (round.level === 1) {
            // A tap on a thing on the plate puts it back in the pool. A drag moves it to another plate.
            pic.addEventListener('pointerdown', (e) => e.stopPropagation());
            let from = null;
            draggable(pic, {
              enabled: () => !busy,
              onTap: () => back(i),
              onStart: (x, y) => { from = { x, y }; },
              onMove: (x, y) => { pic.style.transform = `translate(${x - from.x}px, ${y - from.y}px) scale(1.2)`; },
              onEnd: (x, y) => {
                pic.style.transform = '';
                const target = elementBelow(x, y, pic)?.closest?.('.share-card');
                const to = target ? Number(target.dataset.plate) : -1;
                if (to === i) return;
                back(i, false);
                if (to >= 0) put(to);
              },
            });
          }
          return pic;
        });
        const slots = round.level === 2
          ? Array.from({ length: Math.max(0, round.each - state.plates[i]) }, () => el('span', { class: 'share-slot' }))
          : [];
        plate.replaceChildren(...things, ...slots);
      });
    }

    function put(i) {
      if (busy) return;
      const r = give(round, state, i);
      if (r.event === 'empty') return speak('share.noMore');
      if (r.event === 'full') {
        cards[i].classList.remove('wiggle');
        void cards[i].offsetWidth;
        cards[i].classList.add('wiggle');
        return speak('share.full');
      }
      state = r.state;
      sfx.snap();
      drawPool();
      drawPlates();
      speak(`num.${state.plates[i]}`);
      check();
    }

    function back(i, redraw = true) {
      const r = takeBack(state, i);
      if (r.event !== 'back') return;
      state = r.state;
      sfx.tap();
      if (redraw) {
        drawPool();
        drawPlates();
      }
    }

    async function check() {
      if (round.level === 1) {
        if (state.pool > 0) return;
        if (!isFair(state)) {
          await wait(500);
          if (alive && state.pool === 0 && !isFair(state)) speak('share.unfair', { t1: thingName(round.thing, 1) });
          return;
        }
        busy = true;
        burst(friends);
        await wait(500);
        if (alive) finish(friends, [{ key: 'share.fair', params: { e: round.each, t: thingName(round.thing, round.each) } }]);
        return;
      }
      if (!isFull(round, state)) return;
      busy = true;
      await wait(400);
      if (!alive) return;
      pool.replaceChildren();
      pool.classList.add('is-empty');
      const q = { key: 'share.howMany', params: { t: thingName(round.thing, 2) } };
      ask.replaceChildren(el('div', { class: 'num-digits' }, digitChoices(round, async (n, b) => {
        if (!busy || ask.dataset.done) return;
        sfx.tap();
        if (!checkTotal(round, n)) {
          await answer('share', false, b);
          return;
        }
        ask.dataset.done = '1';
        b.classList.add('is-right');
        await countByGroups(cards, round.each);
        if (!alive) return;
        finish(friends, [{ key: 'share.groupsResult', params: { f: round.friends, e: round.each, te: thingName(round.thing, round.each), n: round.total, t: thingName(round.thing, round.total) } }]);
      })));
      screen.say([q]);
    }

    for (let i = 0; i < round.friends; i++) {
      const card = el('div', {
        class: 'share-card',
        dataset: { plate: String(i) },
        attrs: { role: 'button', tabindex: '0', 'aria-label': t('share.plate') },
      }, [el('div', { class: 'share-face' }), el('div', { class: 'share-plate' })]);
      onTap(card, () => put(i));
      cards.push(card);
      friends.append(card);
    }
    screen.stage.replaceChildren(el('div', { class: `share-layout is-level-${round.level}` }, [pool, friends, ask]));
    drawPool();
    drawPlates();
    screen.say(intro);
  }

  // Level 3: plant rice in rows.
  function rowsRound(round) {
    const planted = new Set();
    let busy = false;
    let doneRows = 0;
    const field = el('div', { class: 'share-field' });
    const ask = el('div', { class: 'share-ask' });

    function drawField(rows, cols, full = false) {
      field.style.setProperty('--cols', String(cols));
      field.classList.toggle('is-turned', full);
      const rowNodes = [];
      for (let r = 0; r < rows; r++) {
        const row = el('div', { class: 'share-row', dataset: { count: '' } });
        for (let c = 0; c < cols; c++) {
          // After the turn, the holes are only a picture. The child does not tap them.
          const hole = full
            ? el('div', { class: 'share-hole is-planted' }, [picture('seedling')])
            : el('button', { class: 'share-hole', attrs: { type: 'button', 'aria-label': t('share.hole') } });
          if (!full) onTap(hole, () => plant(r, c, hole));
          row.append(hole);
        }
        rowNodes.push(row);
      }
      field.replaceChildren(...rowNodes);
      return rowNodes;
    }

    let rowNodes = drawField(round.rows, round.cols);

    function plant(r, c, hole) {
      if (busy || planted.has(`${r},${c}`)) return;
      planted.add(`${r},${c}`);
      hole.append(picture('seedling'));
      hole.classList.add('is-planted');
      sfx.pop();
      const rows = fullRows(round, planted);
      if (!rows.includes(r)) return;
      // A row is full: count by rows.
      doneRows += 1;
      rowNodes[r].classList.add('is-counted');
      rowNodes[r].dataset.count = String(doneRows * round.cols);
      speak(`num.${doneRows * round.cols}`);
      if (doneRows === round.rows) askTotal();
    }

    async function askTotal() {
      busy = true;
      await wait(900);
      if (!alive) return;
      ask.replaceChildren(el('div', { class: 'num-digits' }, digitChoices(round, async (n, b) => {
        if (ask.dataset.done) return;
        sfx.tap();
        if (!checkTotal(round, n)) {
          await answer('share', false, b);
          return;
        }
        ask.dataset.done = '1';
        b.classList.add('is-right');
        await speakAll([{ key: 'share.rowsResult', params: { r: round.rows, c: round.cols, n: round.total } }, 'share.turn']);
        if (!alive) return;
        // Turn the field. The rows become columns, and the total stays the same.
        field.classList.add('is-turning');
        await wait(900);
        if (!alive) return;
        field.classList.remove('is-turning');
        rowNodes = drawField(round.cols, round.rows, true);
        await countByGroups(rowNodes, round.rows);
        if (!alive) return;
        finish(field, [{ key: 'share.turned', params: { r: round.cols, c: round.rows, n: round.total } }]);
      })));
      screen.say([{ key: 'share.howMany', params: { t: thingName('seedling', 2) } }]);
    }

    screen.stage.replaceChildren(el('div', { class: 'share-layout is-level-3' }, [field, ask]));
    screen.say([{ key: 'share.intro3', params: { c: round.cols } }]);
  }

  function start() {
    const round = makeRound(level);
    if (round.level === 3) rowsRound(round);
    else platesRound(round);
  }

  start();
  return () => {
    alive = false;
  };
}
