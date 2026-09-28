// Folk game 8: Ô ăn quan. The child plays against Sỏi.

import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, svgEl, onTap, iconButton, answer, wait, burst, reloadGame } from '../core/ui.js';
import { mascot, setExpression } from '../core/mascot.js';
import { playStory } from '../core/story.js';
import { gameLevel } from '../core/state.js';
import {
  createGame, playMove, chooseMove, owner, isQuan, next, score, sideIsEmpty, LEVEL_RULES,
} from '../logic/oanquan.js';

const INK = '#3b2a2a';
const STORY = [
  { scene: 'village', key: 'story.oanquan.1' },
  { scene: 'oanquan', key: 'story.oanquan.2' },
  { scene: 'soi', key: 'story.oanquan.3' },
];

// Places on the board in the horizontal layout (viewBox 0 0 720 320).
function cellBox(i) {
  if (i >= 1 && i <= 5) return { x: 110 + (i - 1) * 100, y: 60, w: 100, h: 100 };
  if (i >= 7 && i <= 11) return { x: 110 + (11 - i) * 100, y: 160, w: 100, h: 100 };
  return null;
}
function center(i) {
  if (i === 0) return { x: 62, y: 160 };
  if (i === 6) return { x: 658, y: 160 };
  const b = cellBox(i);
  return { x: b.x + 50, y: b.y + 50 };
}

const PEBBLE_COLORS = ['#9aa6b4', '#b5a48f', '#8e9bab', '#c2b39b', '#a7b3c1', '#9c8f7e'];
function pebbles(i, count) {
  const c = center(i);
  const g = svgEl('g', { class: 'oaq-pebbles' });
  const spread = isQuan(i) ? 9 : 8.2;
  const offset = isQuan(i) ? 34 : 0;
  for (let k = 0; k < count; k++) {
    const r = spread * Math.sqrt(k + 0.6);
    const a = k * 2.39996 + i;
    const x = c.x + Math.cos(a) * Math.min(r, 40) + (i === 0 ? -10 : i === 6 ? 10 : 0);
    const y = c.y + Math.sin(a) * Math.min(r, 40) + (isQuan(i) ? offset * (k % 2 ? 1 : -1) * 0.5 : 0);
    g.append(svgEl('ellipse', {
      cx: x.toFixed(1), cy: y.toFixed(1), rx: 7.5, ry: 6, fill: PEBBLE_COLORS[(k + i) % PEBBLE_COLORS.length], stroke: INK, 'stroke-width': 1.5,
    }));
  }
  return g;
}

export function mount(screen) {
  const level = gameLevel('oanquan');
  const rules = LEVEL_RULES[level];
  let game = createGame(rules);
  let view = structuredClone(game);
  let busy = false;
  let selected = null;
  let alive = true;
  const vertical = matchMedia('(max-width: 600px) and (orientation: portrait)');

  const soi = mascot('happy', 'oaq-soi');
  const soiPocket = el('div', { class: 'oaq-pocket' });
  const kidPocket = el('div', { class: 'oaq-pocket' });
  const board = svgEl('svg', { class: 'oaq-board', role: 'img' });
  const soiRow = el('div', { class: 'oaq-row oaq-row-soi' }, [soi, soiPocket]);
  const kidRow = el('div', { class: 'oaq-row oaq-row-kid' }, [el('div', { class: 'oaq-kid', html: kidIcon() }), kidPocket]);
  const layout = el('div', { class: 'oaq-layout' }, [soiRow, el('div', { class: 'oaq-board-wrap' }, [board]), kidRow]);
  if (rules.sowOnly) soiRow.classList.add('is-quiet');

  screen.tools.replaceChildren(iconButton('again', 'ui.again', () => restart(), 'tool-btn'));

  function kidIcon() {
    return `<svg viewBox="0 0 80 80">${'<g transform="translate(40 44) scale(0.95)">'}
      <circle cx="0" cy="-8" r="22" fill="#f2c7a5" stroke="${INK}" stroke-width="3"/>
      <path d="M-22 -8 Q-22 -34 0 -33 Q22 -34 22 -8 Q12 -22 0 -20 Q-12 -22 -22 -8Z" fill="${INK}"/>
      <circle cx="-20" cy="-30" r="8" fill="${INK}"/><circle cx="20" cy="-30" r="8" fill="${INK}"/>
      <circle cx="-7" cy="-6" r="3" fill="${INK}"/><circle cx="7" cy="-6" r="3" fill="${INK}"/>
      <path d="M-6 3 Q0 8 6 3" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/></g></svg>`;
  }

  function pocket(node, player) {
    const c = view.captured[player];
    const stones = Array.from({ length: c.stones }, () => el('span', { class: 'oaq-stone' }));
    node.replaceChildren(
      el('span', { class: 'oaq-pebble-icon' }),
      el('span', { class: 'oaq-count', text: String(c.pebbles) }),
      ...stones,
    );
  }

  function render() {
    const isV = vertical.matches;
    board.setAttribute('viewBox', isV ? '0 0 320 720' : '0 0 720 320');
    board.replaceChildren();
    const g = svgEl('g', { transform: isV ? 'translate(320 0) rotate(90)' : '' });
    board.append(g);
    // The board is drawn on the ground.
    g.append(svgEl('path', { d: 'M110 60 A100 100 0 0 0 110 260 Z', class: 'oaq-quan', fill: '#e8c38f', stroke: INK, 'stroke-width': 4 }));
    g.append(svgEl('path', { d: 'M610 60 A100 100 0 0 1 610 260 Z', class: 'oaq-quan', fill: '#e8c38f', stroke: INK, 'stroke-width': 4 }));
    for (let i = 0; i < 12; i++) {
      if (isQuan(i)) continue;
      const b = cellBox(i);
      const mine = owner(i) === 0;
      const cell = svgEl('g', { class: `oaq-cell ${mine ? 'is-mine' : ''} ${selected === i ? 'is-selected' : ''}`, 'data-pos': i });
      cell.append(svgEl('rect', { x: b.x, y: b.y, width: b.w, height: b.h, fill: mine ? '#f6dcb4' : '#f1d3a6', stroke: INK, 'stroke-width': 4 }));
      g.append(cell);
    }
    for (let i = 0; i < 12; i++) {
      const c = center(i);
      if (isQuan(i) && view.stones[i]) {
        g.append(svgEl('ellipse', { cx: c.x + (i === 0 ? -8 : 8), cy: c.y, rx: 26, ry: 20, fill: '#7d8ca3', stroke: INK, 'stroke-width': 2.5, class: 'oaq-big' }));
      }
      g.append(pebbles(i, view.cells[i]));
      const n = view.cells[i];
      if (!isQuan(i) || n > 0) {
        const bx = isQuan(i) ? c.x + (i === 0 ? -30 : 30) : cellBox(i).x + 86;
        const by = isQuan(i) ? c.y - 58 : cellBox(i).y + 14;
        const badge = svgEl('g', { class: 'oaq-num', transform: `translate(${bx} ${by})${isV ? ' rotate(-90)' : ''}` });
        badge.append(svgEl('circle', { r: 14, fill: '#fff', stroke: INK, 'stroke-width': 2 }));
        const tx = svgEl('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 17, 'font-weight': 800, fill: INK });
        tx.textContent = String(n);
        badge.append(tx);
        g.append(badge);
      }
    }
    if (selected != null && !busy) {
      for (const dir of [1, -1]) {
        const from = center(selected);
        const to = center(next(selected, dir));
        const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
        const arrow = svgEl('g', { class: 'oaq-arrow', transform: `translate(${to.x} ${to.y}) rotate(${angle})` });
        const pulse = svgEl('g', { class: 'oaq-arrow-pulse' });
        pulse.append(svgEl('circle', { r: 44, fill: '#7cb87a', stroke: '#fff', 'stroke-width': 5 }));
        pulse.append(svgEl('path', { d: 'M-18 0 H16 M4 -14 L18 0 L4 14', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
        arrow.append(pulse);
        onTap(arrow, () => chooseDir(dir));
        g.append(arrow);
      }
    }
    pocket(soiPocket, 1);
    pocket(kidPocket, 0);
  }

  board.addEventListener('pointerup', (e) => {
    if (e.target.closest('.oaq-arrow')) return;
    const cell = e.target.closest('.oaq-cell');
    if (!cell || busy || game.over || game.turn !== 0) return;
    const pos = Number(cell.dataset.pos);
    if (owner(pos) !== 0) {
      speak('oanquan.notYours');
      return;
    }
    if (game.cells[pos] === 0) {
      speak('oanquan.emptySquare');
      return;
    }
    sfx.tap();
    selected = pos;
    render();
    screen.say('oanquan.chooseDir');
  });

  const pace = () => (rules.sowOnly ? 750 : 600);

  async function animate(events, player) {
    let picks = 0;
    for (const ev of events) {
      if (!alive) return;
      if (ev.type === 'pick') {
        view.cells[ev.pos] = 0;
        selected = null;
        render();
        highlight(ev.pos);
        sfx.tap();
        picks += 1;
        // The player picks up the pebbles of the next square and goes on. The count starts again.
        if (picks > 1) await speak('oanquan.continue');
        await wait(400);
      } else if (ev.type === 'drop') {
        view.cells[ev.pos] += 1;
        render();
        highlight(ev.pos);
        sfx.pebble();
        await Promise.all([Promise.race([speak(`num.${ev.count}`), wait(1100)]), wait(pace())]);
      } else if (ev.type === 'capture') {
        view.cells[ev.pos] = 0;
        if (ev.stone) view.stones[ev.pos] = false;
        view.captured[player].pebbles += ev.pebbles;
        if (ev.stone) view.captured[player].stones += 1;
        render();
        sfx.happy();
        burst(player === 0 ? kidPocket : soiPocket);
        const key = player === 0 ? (ev.stone ? 'oanquan.captureQuan' : 'oanquan.capture') : (ev.stone ? 'oanquan.soiCaptureQuan' : 'oanquan.soiCapture');
        await speak(key);
      } else if (ev.type === 'stop') {
        if (ev.reason === 'quan') await speak('oanquan.stopQuan');
        else if (ev.reason === 'empty') await speak('oanquan.stopEmpty');
      } else if (ev.type === 'refill') {
        await speak(ev.borrowed ? 'oanquan.refillBorrow' : 'oanquan.refill');
      }
    }
  }

  function highlight(pos) {
    const node = board.querySelector(`.oaq-cell[data-pos="${pos}"]`);
    node?.classList.add('is-active');
  }

  async function chooseDir(dir) {
    if (busy || selected == null) return;
    const pos = selected;
    busy = true;
    sfx.tap();
    const result = playMove(game, pos, dir);
    await animate(result.events, 0);
    game = result.state;
    view = structuredClone(game);
    render();
    if (!alive) return;
    if (rules.sowOnly) {
      const r = await answer('oanquan', true, board);
      if (r.levelUp) return restart();
      if (sideIsEmpty(game, 0)) {
        await speak('oanquan.practiceAgain');
        game = createGame(rules);
        view = structuredClone(game);
        render();
      }
      busy = false;
      screen.say('oanquan.practice');
      return;
    }
    await afterTurn();
  }

  async function afterTurn() {
    if (game.over) return finish();
    if (game.turn === 1) return soiTurn();
    busy = false;
    screen.say('oanquan.yourTurn');
  }

  async function soiTurn() {
    busy = true;
    setExpression(soi, 'thinking');
    await speak('oanquan.soiTurn');
    await wait(900);
    if (!alive) return;
    const move = chooseMove(game, Math.random, level === 3 ? 0.55 : 0.35);
    if (!move) return finish();
    selected = move.pos;
    busy = false;
    render();
    busy = true;
    await wait(1100);
    setExpression(soi, 'curious');
    const result = playMove(game, move.pos, move.dir);
    await animate(result.events, 1);
    game = result.state;
    view = structuredClone(game);
    setExpression(soi, 'happy');
    render();
    if (!alive) return;
    await afterTurn();
  }

  async function countAloud(n) {
    // Count by tens, then one by one.
    const items = [];
    let k = 0;
    while (k + 10 <= n) {
      k += 10;
      items.push({ key: `num.${k}` });
    }
    while (k < n) {
      k += 1;
      items.push({ key: `num.${k}` });
    }
    await speakAll(items);
  }

  async function finish() {
    busy = true;
    const kid = score(game, 0);
    const other = score(game, 1);
    await speak('oanquan.end');
    const pile = (n) => {
      const box = el('div', { class: 'oaq-pile' });
      for (let i = 0; i < n; i++) box.append(el('span', { class: `oaq-dot ${i % 10 === 9 ? 'is-ten' : ''}` }));
      return box;
    };
    const kidPile = pile(kid);
    const soiPile = pile(other);
    const result = el('div', { class: 'oaq-result' }, [
      el('div', { class: 'oaq-result-row' }, [mascot('happy', 'oaq-result-soi'), soiPile]),
      el('div', { class: 'oaq-result-row' }, [el('div', { class: 'oaq-kid', html: kidIcon() }), kidPile]),
    ]);
    screen.stage.replaceChildren(result);
    if (!alive) return;
    await speak('oanquan.stoneNote');
    kidPile.classList.add('is-counting');
    await countAloud(kid);
    await speak('oanquan.countKid', { n: kid });
    kidPile.classList.remove('is-counting');
    soiPile.classList.add('is-counting');
    await countAloud(other);
    await speak('oanquan.countSoi', { n: other });
    soiPile.classList.remove('is-counting');
    if (!alive) return;
    const key = kid > other ? 'oanquan.resultKidWins' : kid < other ? 'oanquan.resultSoiWins' : 'oanquan.resultTie';
    screen.setInstruction([key]);
    await speak(key);
    const r = await answer('oanquan', true, result);
    const again = iconButton('again', 'ui.again', () => restart(), 'big-again');
    result.append(again);
    if (r.levelUp) restart();
  }

  function restart() {
    const lvl = gameLevel('oanquan');
    if (lvl !== level) {
      alive = false;
      reloadGame();
      return;
    }
    game = createGame(rules);
    view = structuredClone(game);
    selected = null;
    busy = false;
    screen.stage.replaceChildren(layout);
    setExpression(soi, 'happy');
    render();
    screen.say(rules.sowOnly ? 'oanquan.practice' : 'oanquan.yourTurn');
  }

  const onResize = () => render();
  vertical.addEventListener('change', onResize);
  screen.stage.replaceChildren(layout);
  render();
  playStory(screen, 'oanquan', STORY).then(() => {
    if (!alive) return;
    render();
    screen.say(rules.sowOnly ? 'oanquan.practice' : 'oanquan.yourTurn');
  });
  return () => {
    alive = false;
    vertical.removeEventListener('change', onResize);
  };
}
