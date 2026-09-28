import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, playMove, refillSide, legalMoves, chooseMove, score, capturedValue, next, owner, LEVEL_RULES, SIDES,
} from '../js/logic/oanquan.js';
import { seeded } from '../js/logic/random.js';

// Make a game with a given board. cells has 12 numbers.
function board(cells, { stones = { 0: true, 6: true }, turn = 0, rules = LEVEL_RULES[3], captured } = {}) {
  const g = createGame(rules);
  g.cells = [...cells];
  g.stones = { ...stones };
  g.turn = turn;
  if (captured) g.captured = captured.map((c) => ({ ...c }));
  return g;
}

const total = (g) => g.cells.reduce((a, b) => a + b, 0)
  + g.captured[0].pebbles + g.captured[1].pebbles;

test('a new game has 5 pebbles in each square and a big stone in each quan', () => {
  const g = createGame();
  assert.deepEqual(g.cells, [0, 5, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5]);
  assert.equal(g.stones[0], true);
  assert.equal(g.stones[6], true);
  assert.equal(g.turn, 0);
  assert.deepEqual(createGame(LEVEL_RULES[2]).cells, [0, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2]);
});

test('the ring goes around and each side has 5 squares', () => {
  assert.equal(next(11, 1), 0);
  assert.equal(next(0, -1), 11);
  assert.equal(owner(9), 0);
  assert.equal(owner(3), 1);
  assert.equal(owner(0), null);
  assert.equal(owner(6), null);
});

test('sowing drops one pebble in each next square', () => {
  const g = createGame(LEVEL_RULES[1]);
  const { state, events } = playMove(g, 9, 1);
  assert.equal(state.cells[9], 0);
  assert.equal(state.cells[10], 6);
  assert.equal(state.cells[11], 6);
  assert.equal(state.cells[0], 1);
  assert.equal(state.cells[1], 6);
  assert.equal(state.cells[2], 6);
  const drops = events.filter((e) => e.type === 'drop');
  assert.deepEqual(drops.map((e) => e.count), [1, 2, 3, 4, 5]);
  assert.deepEqual(drops.map((e) => e.pos), [10, 11, 0, 1, 2]);
});

test('sowing in the other direction goes the other way', () => {
  const g = createGame(LEVEL_RULES[1]);
  const { state } = playMove(g, 8, -1);
  assert.deepEqual([state.cells[7], state.cells[6], state.cells[5], state.cells[4], state.cells[3]], [6, 1, 6, 6, 6]);
});

test('practice sowing does not capture and does not change the turn', () => {
  const g = createGame(LEVEL_RULES[1]);
  const { state, events } = playMove(g, 7, 1);
  assert.equal(events.some((e) => e.type === 'capture'), false);
  assert.equal(state.turn, 0);
});

test('if the next square has pebbles, the player picks them up and goes on', () => {
  // Square 11 has 1 pebble. It goes to 0 (the left quan). The next square is 1, with pebbles.
  const g = board([0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], { stones: { 0: true, 6: true } });
  const { events } = playMove(g, 11, 1);
  const picks = events.filter((e) => e.type === 'pick');
  assert.equal(picks.length, 2);
  assert.equal(picks[1].pos, 1);
  assert.equal(picks[1].count, 2);
});

test('an empty square and then a square with pebbles: the player takes the pebbles', () => {
  // 9 has 1 pebble. It goes to 10. Square 11 is empty. The left quan (0) has the stone and 3 pebbles.
  const g = board([3, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0]);
  const { state, events } = playMove(g, 9, 1);
  const cap = events.find((e) => e.type === 'capture');
  assert.ok(cap);
  assert.equal(cap.pos, 0);
  assert.equal(cap.pebbles, 3);
  assert.equal(cap.stone, true);
  assert.equal(state.stones[0], false);
  assert.equal(state.captured[0].pebbles, 3);
  assert.equal(state.captured[0].stones, 1);
  assert.equal(capturedValue(state, 0), 13);
});

test('capture of a square with pebbles', () => {
  // 7 has 1 pebble, goes to 8. 9 is empty. 10 has 4 pebbles.
  const g = board([0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 4, 1]);
  const { state, events } = playMove(g, 7, 1);
  const caps = events.filter((e) => e.type === 'capture');
  assert.equal(caps.length, 1);
  assert.equal(caps[0].pos, 10);
  assert.equal(state.cells[10], 0);
  assert.equal(state.captured[0].pebbles, 4);
});

test('with all rules, the player takes again: empty, full, empty, full', () => {
  // 7 -> 8. 9 empty, 10 has 2. 11 empty, 0 (quan) has the stone.
  const g = board([0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 2, 0]);
  const { state, events } = playMove(g, 7, 1);
  const caps = events.filter((e) => e.type === 'capture');
  assert.deepEqual(caps.map((c) => c.pos), [10, 0]);
  assert.equal(capturedValue(state, 0), 12);
});

test('in the small game, the player takes only one time', () => {
  const g = board([0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 2, 0], { rules: LEVEL_RULES[2] });
  const { events } = playMove(g, 7, 1);
  assert.deepEqual(events.filter((e) => e.type === 'capture').map((c) => c.pos), [10]);
});

test('two empty squares in a row end the turn', () => {
  const g = board([0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1]);
  const { state, events } = playMove(g, 7, 1);
  assert.equal(events.some((e) => e.type === 'capture'), false);
  assert.equal(events.find((e) => e.type === 'stop').reason, 'empty');
  assert.equal(state.turn, 1);
});

test('if the next square is a quan, the turn ends', () => {
  // 10 has 1 pebble, goes to 11. The next square is the left quan.
  const g = board([5, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0]);
  const { state, events } = playMove(g, 10, 1);
  assert.equal(events.find((e) => e.type === 'stop').reason, 'quan');
  assert.equal(state.cells[0], 5);
  assert.equal(state.turn, 1);
});

test('the pebbles are not lost', () => {
  const rand = seeded(7);
  let g = createGame();
  for (let i = 0; i < 200 && !g.over; i++) {
    const before = total(g);
    const m = chooseMove(g, rand, 0.5);
    g = playMove(g, m.pos, m.dir).state;
    assert.equal(total(g), before);
  }
});

test('the empty side rule: the player puts a taken pebble in each square', () => {
  const g = board([1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], { turn: 0, captured: [{ pebbles: 7, stones: 0 }, { pebbles: 0, stones: 0 }] });
  const { state, events } = refillSide(g, 0);
  assert.deepEqual(SIDES[0].map((i) => state.cells[i]), [1, 1, 1, 1, 1]);
  assert.equal(state.captured[0].pebbles, 2);
  assert.equal(events[0].type, 'refill');
  assert.equal(events[0].borrowed, 0);
});

test('the empty side rule: a player with too few pebbles borrows from the other player', () => {
  const g = board([1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], { captured: [{ pebbles: 2, stones: 1 }, { pebbles: 10, stones: 0 }] });
  const { state, events } = refillSide(g, 0);
  assert.deepEqual(SIDES[0].map((i) => state.cells[i]), [1, 1, 1, 1, 1]);
  assert.equal(state.captured[0].pebbles, 0);
  assert.equal(state.captured[1].pebbles, 7);
  assert.equal(state.debt[0], 3);
  assert.equal(events[0].borrowed, 3);
});

test('after a move, the next player with an empty side refills the side', () => {
  // Sỏi (player 1) has no pebbles on the side. Player 0 plays a move that ends the turn.
  const g = board([1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1], { captured: [{ pebbles: 0, stones: 0 }, { pebbles: 6, stones: 0 }] });
  const { state, events } = playMove(g, 7, 1);
  assert.equal(state.turn, 1);
  assert.ok(events.some((e) => e.type === 'refill' && e.player === 1));
  assert.deepEqual(SIDES[1].map((i) => state.cells[i]), [1, 1, 1, 1, 1]);
  assert.ok(legalMoves(state).length > 0);
});

test('the game ends when both quans are empty, and each player takes the pebbles on the side', () => {
  // The right quan is empty. Player 0 takes the left quan with the move 9 -> 10, 11 empty, 0 full.
  const g = board([2, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0], { stones: { 0: true, 6: false }, captured: [{ pebbles: 4, stones: 0 }, { pebbles: 5, stones: 1 }] });
  const { state, events } = playMove(g, 9, 1);
  assert.equal(state.over, true);
  const end = events.find((e) => e.type === 'end');
  assert.ok(end);
  // Player 0: 4 pebbles + 2 from the quan + the stone (10) + 1 pebble on the side (square 10).
  assert.equal(score(state, 0), 4 + 2 + 10 + 1);
  // Player 1: 5 pebbles + a stone + 4 pebbles on the side.
  assert.equal(score(state, 1), 5 + 10 + 4);
  assert.deepEqual(end.scores, [17, 19]);
  assert.deepEqual(legalMoves(state), []);
});

test('the big stone counts as 10 pebbles', () => {
  const g = board([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { captured: [{ pebbles: 3, stones: 2 }, { pebbles: 0, stones: 0 }] });
  assert.equal(capturedValue(g, 0), 23);
});

test('borrowed pebbles go back at the end', () => {
  const g = board([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { captured: [{ pebbles: 3, stones: 0 }, { pebbles: 8, stones: 0 }] });
  g.debt = [2, 0];
  assert.equal(score(g, 0), 1);
  assert.equal(score(g, 1), 10);
});

test('a full game between two players always ends', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const rand = seeded(seed);
    let g = createGame(seed % 2 ? LEVEL_RULES[3] : LEVEL_RULES[2]);
    let moves = 0;
    while (!g.over && moves < 500) {
      const m = chooseMove(g, rand, 0.5);
      if (!m) break;
      g = playMove(g, m.pos, m.dir).state;
      moves += 1;
    }
    assert.equal(g.over, true, `seed ${seed} did not end`);
    assert.equal(score(g, 0) + score(g, 1), g.rules.pebbles * 10 + 20);
  }
});

test('Sỏi chooses only legal moves', () => {
  const rand = seeded(3);
  const g = board([0, 3, 0, 2, 0, 0, 0, 1, 1, 1, 1, 1], { turn: 1 });
  for (let i = 0; i < 50; i++) {
    const m = chooseMove(g, rand, 0.5);
    assert.ok([1, 3].includes(m.pos));
    assert.ok([1, -1].includes(m.dir));
  }
});

test('a wrong move is refused', () => {
  const g = createGame();
  assert.throws(() => playMove(g, 3, 1));
  assert.throws(() => playMove(g, 0, 1));
  g.cells[8] = 0;
  assert.throws(() => playMove(g, 8, 1));
  assert.throws(() => playMove(createGame(), 8, 2));
});
