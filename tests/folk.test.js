import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from '../js/logic/random.js';
import { readJson } from './helpers.js';
import { LINES as CHICHI_LINES, closeTime, makeRound as chichiRound, lift } from '../js/logic/chichi.js';
import { songWords, makeGame, nextOut, tapLeg, foldingLeg, legsOut } from '../js/logic/nuna.js';
import { makeRound as locoRound, hopPath, hop, ROWS, SQUARES } from '../js/logic/loco.js';
import { makeRound as goatRound, nearness, bleatGap, bleatGain, bleatPan, nearestGoat, isOnGoat, catchGoat } from '../js/logic/bitmat.js';
import { SONG_LINES, AGES, ageChoices, follow, stepToward, isCaught, chaseTime, doctorSpeed } from '../js/logic/rongran.js';

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
const vi = readJson('lang/vi.json');
const lines = (prefix, n) => Array.from({ length: n }, (_, i) => vi[`${prefix}.${i + 1}`]);

test('chi chi chành chành: the finger escapes only while the hand closes', () => {
  assert.ok(lines('dongdao.chichi', CHICHI_LINES).every(Boolean));
  assert.ok(closeTime(2) < closeTime(1));
  assert.equal(lift('song'), 'wait');
  assert.equal(lift('closing'), 'escaped');
  assert.equal(lift('closed'), 'caught');
  for (const seed of SEEDS) {
    assert.equal(chichiRound(1, seeded(seed)).trickAfter, -1);
    const r = chichiRound(2, seeded(seed));
    assert.ok(r.trickAfter >= 1 && r.trickAfter <= CHICHI_LINES - 2);
  }
});

test('nu na nu nống: one word for each leg, and the leg at the last word folds', () => {
  const words = songWords(lines('dongdao.nuna', 10));
  assert.equal(words.length, 40);
  assert.equal(words[0], 'Nu');
  assert.equal(words[39], 'rụt');
  let s = makeGame(1);
  assert.equal(s.out.length, 4);
  assert.equal(tapLeg(s, 1, words.length).event, 'wrong');
  const expected = foldingLeg(s.out, 0, words.length);
  assert.equal(expected, 39 % 4);
  let r;
  for (let w = 0; w < words.length; w++) {
    r = tapLeg(s, s.next, words.length);
    s = r.state;
  }
  assert.equal(r.event, 'fold');
  assert.ok(r.done);
  assert.equal(s.out[expected], false);
  assert.equal(legsOut(s), 3);
  assert.equal(nextOut([false, false, true], 0), 2);
  assert.equal(nextOut([false, false], 0), -1);
});

test('nu na nu nống: level 2 plays two songs', () => {
  let s = makeGame(2);
  assert.equal(s.out.length, 6);
  let songs = 0;
  let r;
  do {
    for (let w = 0; w < 40; w++) {
      r = tapLeg(s, s.next, 40);
      s = r.state;
    }
    songs += 1;
  } while (!r.done);
  assert.equal(songs, 2);
  assert.equal(legsOut(s), 4);
});

test('nhảy lò cò: hop over the pebble, and at level 2 come back', () => {
  assert.deepEqual(ROWS.flat(), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const seed of SEEDS) {
    for (const level of [1, 2]) {
      const round = locoRound(level, seeded(seed));
      assert.ok(round.pebble >= 1 && round.pebble <= SQUARES);
      const path = hopPath(round);
      assert.ok(!path.includes(round.pebble));
      assert.equal(path.length, level === 1 ? 7 : 13);
      assert.equal(hop(round, 0, round.pebble).event, 'pebble');
      let step = 0;
      for (const sq of path) {
        const wrong = sq === 8 ? 1 : 8;
        if (wrong !== round.pebble && wrong !== sq) assert.equal(hop(round, step, wrong).event, 'wrong');
        const r = hop(round, step, sq);
        step = r.step;
        assert.equal(r.event, step === path.length ? 'done' : 'hop');
      }
    }
  }
  assert.deepEqual(hopPath({ level: 2, pebble: 8 }), [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1]);
});

test('bịt mắt bắt dê: the bleat is louder and faster near the goat, and a finger on it catches it', () => {
  for (const seed of SEEDS) {
    for (const level of [1, 2]) {
      const round = goatRound(level, seeded(seed));
      assert.equal(round.goats.length, level);
      for (const g of round.goats) assert.ok(g.x >= 0.15 && g.x <= 0.85 && g.y >= 0.15 && g.y <= 0.85);
    }
  }
  const goat = { x: 0.5, y: 0.5 };
  assert.equal(nearness(goat, goat), 1);
  assert.ok(nearness({ x: 0.1, y: 0.1 }, goat) < nearness({ x: 0.4, y: 0.4 }, goat));
  assert.ok(bleatGap(1) < bleatGap(0));
  assert.ok(bleatGain(1) > bleatGain(0));
  assert.ok(bleatPan({ x: 0.1, y: 0.5 }, goat) > 0);
  assert.ok(bleatPan({ x: 0.9, y: 0.5 }, goat) < 0);
  let round = { level: 2, radius: 0.1, goats: [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.8 }], caught: [] };
  assert.equal(nearestGoat(round, { x: 0.7, y: 0.7 }), 1);
  assert.ok(isOnGoat(round, { x: 0.75, y: 0.8 }, 1));
  assert.ok(!isOnGoat(round, { x: 0.6, y: 0.8 }, 1));
  let r = catchGoat(round, 1);
  assert.equal(r.done, false);
  round = r.round;
  assert.equal(nearestGoat(round, { x: 0.8, y: 0.8 }), 0);
  r = catchGoat(round, 0);
  assert.ok(r.done);
});

test('rồng rắn lên mây: the song, the ages, and the chase', () => {
  assert.ok(lines('dongdao.rongran', SONG_LINES).every(Boolean));
  assert.deepEqual(ageChoices(1, 4), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const seed of SEEDS) {
    for (let age = 1; age <= AGES; age++) {
      const c = ageChoices(2, age, seeded(seed));
      assert.equal(c.length, 3);
      assert.ok(c.includes(age));
    }
  }
  assert.ok(chaseTime(2) > chaseTime(1));
  assert.ok(doctorSpeed(2) > doctorSpeed(1));
  const chain = follow([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], { x: 100, y: 0 }, 30);
  assert.deepEqual(chain[0], { x: 100, y: 0 });
  assert.ok(Math.abs(chain[1].x - 70) < 1e-9);
  assert.ok(Math.abs(chain[2].x - 40) < 1e-9);
  const still = follow(chain, { x: 100, y: 0 }, 30);
  assert.deepEqual(still, chain);
  assert.deepEqual(stepToward({ x: 0, y: 0 }, { x: 10, y: 0 }, 4), { x: 4, y: 0 });
  assert.deepEqual(stepToward({ x: 0, y: 0 }, { x: 3, y: 0 }, 4), { x: 3, y: 0 });
  assert.ok(isCaught({ x: 0, y: 0 }, { x: 3, y: 4 }, 5));
  assert.ok(!isCaught({ x: 0, y: 0 }, { x: 3, y: 4 }, 4.9));
});
