// Rules of Ô ăn quan. These functions do not use the DOM.
//
// The board is a ring of 12 places:
//   0       the left quan
//   1 to 5  the top row, from left to right. This is the side of player 1 (Sỏi).
//   6       the right quan
//   7 to 11 the bottom row, from right to left. This is the side of player 0 (the child).
// Direction +1 goes clockwise and -1 goes counterclockwise.

export const SIZE = 12;
export const QUANS = [0, 6];
export const SIDES = [[7, 8, 9, 10, 11], [1, 2, 3, 4, 5]];
export const STONE_VALUE = 10;
const MAX_PICKS = 200;

export const LEVEL_RULES = Object.freeze({
  1: { pebbles: 5, sowOnly: true, chain: false },
  2: { pebbles: 2, sowOnly: false, chain: false },
  3: { pebbles: 5, sowOnly: false, chain: true },
});

export function isQuan(i) {
  return i === 0 || i === 6;
}

export function next(i, dir) {
  return (i + dir + SIZE) % SIZE;
}

export function owner(i) {
  if (SIDES[0].includes(i)) return 0;
  if (SIDES[1].includes(i)) return 1;
  return null;
}

/**
 * Make a new game.
 * @param {{pebbles?: number, sowOnly?: boolean, chain?: boolean}} rules
 */
export function createGame(rules = LEVEL_RULES[3]) {
  const cells = new Array(SIZE).fill(0);
  for (const side of SIDES) for (const i of side) cells[i] = rules.pebbles ?? 5;
  return {
    cells,
    stones: { 0: true, 6: true },
    captured: [{ pebbles: 0, stones: 0 }, { pebbles: 0, stones: 0 }],
    debt: [0, 0],
    turn: 0,
    over: false,
    rules: { pebbles: rules.pebbles ?? 5, sowOnly: Boolean(rules.sowOnly), chain: Boolean(rules.chain) },
  };
}

function clone(state) {
  return {
    ...state,
    cells: [...state.cells],
    stones: { ...state.stones },
    captured: state.captured.map((c) => ({ ...c })),
    debt: [...state.debt],
  };
}

function hasContent(state, i) {
  return state.cells[i] > 0 || (isQuan(i) && state.stones[i]);
}

export function sideIsEmpty(state, player) {
  return SIDES[player].every((i) => state.cells[i] === 0);
}

export function quansAreEmpty(state) {
  return QUANS.every((q) => !hasContent(state, q));
}

export function legalMoves(state, player = state.turn) {
  if (state.over) return [];
  const moves = [];
  for (const pos of SIDES[player]) {
    if (state.cells[pos] > 0) moves.push({ pos, dir: 1 }, { pos, dir: -1 });
  }
  return moves;
}

/** The value of the captured things of a player. The big stone counts as 10 pebbles. */
export function capturedValue(state, player) {
  const c = state.captured[player];
  return c.pebbles + STONE_VALUE * c.stones;
}

/** The final score. Pebbles that a player borrowed go back to the other player. */
export function score(state, player) {
  const other = 1 - player;
  return capturedValue(state, player) - state.debt[player] + state.debt[other];
}

function capture(s, player, i, events) {
  const pebbles = s.cells[i];
  const stone = isQuan(i) && s.stones[i];
  s.cells[i] = 0;
  if (stone) s.stones[i] = false;
  s.captured[player].pebbles += pebbles;
  if (stone) s.captured[player].stones += 1;
  events.push({ type: 'capture', pos: i, player, pebbles, stone: Boolean(stone) });
}

/**
 * The empty side rule: at the start of a turn, a player with an empty side puts one
 * of the taken pebbles into each square of the side. A player with too few pebbles
 * borrows from the other player. If both have no pebbles, the game ends.
 */
export function refillSide(state, player) {
  const s = clone(state);
  const events = [];
  const other = 1 - player;
  const own = Math.min(5, s.captured[player].pebbles);
  const borrowed = Math.min(5 - own, s.captured[other].pebbles);
  const total = own + borrowed;
  if (total === 0) return { state: endGame(s, events), events };
  s.captured[player].pebbles -= own;
  s.captured[other].pebbles -= borrowed;
  s.debt[player] += borrowed;
  SIDES[player].slice(0, total).forEach((i) => { s.cells[i] = 1; });
  events.push({ type: 'refill', player, count: total, borrowed });
  return { state: s, events };
}

function endGame(s, events) {
  // Each player takes the pebbles that are still on the side of the player.
  for (const player of [0, 1]) {
    let pebbles = 0;
    for (const i of SIDES[player]) {
      pebbles += s.cells[i];
      s.cells[i] = 0;
    }
    s.captured[player].pebbles += pebbles;
    if (pebbles) events.push({ type: 'collect', player, pebbles });
  }
  s.over = true;
  events.push({ type: 'end', scores: [score(s, 0), score(s, 1)] });
  return s;
}

/**
 * Play one move for the player whose turn it is.
 * @returns {{state: object, events: object[]}} The events tell the UI what to show, step by step.
 */
export function playMove(state, pos, dir) {
  if (state.over) throw new Error('The game is over.');
  const player = state.turn;
  if (owner(pos) !== player) throw new Error('The square is not on the side of the player.');
  if (state.cells[pos] === 0) throw new Error('The square is empty.');
  if (dir !== 1 && dir !== -1) throw new Error('The direction must be 1 or -1.');

  const s = clone(state);
  const events = [];
  let i = pos;
  let hand = s.cells[i];
  s.cells[i] = 0;
  events.push({ type: 'pick', pos: i, count: hand });
  let picks = 1;

  for (;;) {
    let count = 0;
    while (hand > 0) {
      i = next(i, dir);
      s.cells[i] += 1;
      hand -= 1;
      count += 1;
      events.push({ type: 'drop', pos: i, count });
    }
    if (s.rules.sowOnly) {
      events.push({ type: 'stop', reason: 'sown' });
      break;
    }
    const n1 = next(i, dir);
    if (isQuan(n1)) {
      events.push({ type: 'stop', reason: 'quan', pos: n1 });
      break;
    }
    if (s.cells[n1] > 0) {
      if (picks >= MAX_PICKS) {
        events.push({ type: 'stop', reason: 'limit' });
        break;
      }
      hand = s.cells[n1];
      s.cells[n1] = 0;
      i = n1;
      picks += 1;
      events.push({ type: 'pick', pos: i, count: hand });
      continue;
    }
    // The next square is empty.
    let n2 = next(n1, dir);
    if (!hasContent(s, n2)) {
      events.push({ type: 'stop', reason: 'empty', pos: n1 });
      break;
    }
    capture(s, player, n2, events);
    // With all rules, the player takes again while an empty square comes before a full one.
    while (s.rules.chain) {
      const e = next(n2, dir);
      const f = next(e, dir);
      if (isQuan(e) || s.cells[e] > 0 || !hasContent(s, f)) break;
      capture(s, player, f, events);
      n2 = f;
    }
    events.push({ type: 'stop', reason: 'captured' });
    break;
  }

  if (s.rules.sowOnly) return { state: s, events };
  return afterMove(s, events);
}

function afterMove(s, events) {
  if (quansAreEmpty(s)) return { state: endGame(s, events), events };
  s.turn = 1 - s.turn;
  if (sideIsEmpty(s, s.turn)) {
    const r = refillSide(s, s.turn);
    events.push(...r.events);
    return { state: r.state, events };
  }
  return { state: s, events };
}

/**
 * The move of Sỏi. Sỏi does not always choose the best move.
 * @param {number} skill the chance (0 to 1) that Sỏi chooses the best move
 */
export function chooseMove(state, rand = Math.random, skill = 0.5) {
  const moves = legalMoves(state);
  if (!moves.length) return null;
  if (rand() >= skill) return moves[Math.floor(rand() * moves.length)];
  const player = state.turn;
  let best = moves[0];
  let bestGain = -Infinity;
  for (const m of moves) {
    const { state: after } = playMove(state, m.pos, m.dir);
    const gain = capturedValue(after, player) - capturedValue(state, player);
    if (gain > bestGain) {
      bestGain = gain;
      best = m;
    }
  }
  return best;
}
