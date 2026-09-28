import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seeded, randInt, shuffle, sample } from '../js/logic/random.js';
import { makeQuestion, checkAnswer, nearbyChoices, DICE } from '../js/logic/numbers.js';
import { makePattern, checkPattern, UNITS, levelInfo, sameItem } from '../js/logic/patterns.js';
import { makeRound as sortRound, boxFor, isRightBox } from '../js/logic/sorting.js';
import { makeRound as shapeRound, findSlot, sameTurn, turn, DESIGNS } from '../js/logic/shapes.js';
import { deal, flip, closeOpen, isDone, CARD_COUNTS } from '../js/logic/memory.js';
import { makeQuestion as letterQuestion, checkLetter, firstLetterSet } from '../js/logic/letters.js';
import { makeRound as ttvRound, applySwaps, isCorrect } from '../js/logic/taptamvong.js';
import { outcome, winner, reasonKey, HANDS } from '../js/logic/oantuti.js';
import { createRound as ccRound, throwBall, pickStick, needed, stickLayout, STICKS } from '../js/logic/choichuyen.js';
import { createColoring, fillArea, clearAll, undo, canUndo, isComplete } from '../js/logic/coloring.js';
import { readJson } from './helpers.js';

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

test('random helpers give the same result for the same seed', () => {
  const a = seeded(5);
  const b = seeded(5);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
  const r = seeded(1);
  for (let i = 0; i < 100; i++) {
    const n = randInt(r, 2, 4);
    assert.ok(n >= 2 && n <= 4);
  }
  assert.deepEqual(shuffle(seeded(2), [1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
  assert.equal(new Set(sample(seeded(3), [1, 2, 3, 4, 5], 3)).size, 3);
});

test('numbers: the choices are different, near the answer, and have the answer', () => {
  for (const seed of SEEDS) {
    const c = nearbyChoices(seeded(seed), 1, 1, 10, 3);
    assert.equal(new Set(c).size, 3);
    assert.ok(c.includes(1));
    assert.ok(c.every((v) => v >= 1 && v <= 10));
  }
});

test('numbers: each dice pattern has the right number of pebbles', () => {
  for (let n = 1; n <= 6; n++) assert.equal(DICE[n].length, n);
});

test('numbers: each level makes a correct question', () => {
  for (const seed of SEEDS) {
    const r = seeded(seed);
    const q1 = makeQuestion(1, r);
    assert.ok(q1.n >= 1 && q1.n <= 10);
    assert.ok(q1.choices.includes(q1.n));
    assert.ok(checkAnswer(q1, q1.n));
    const quick = makeQuestion(2, r);
    assert.ok(quick.n >= 1 && quick.n <= 6);
    assert.equal(quick.dots.length, quick.n);
    assert.ok(quick.dots.every(([x, y]) => x > 10 && x < 90 && y > 10 && y < 90));
    assert.ok(quick.choices.includes(quick.n));
    assert.ok(quick.choices.every((v) => v >= 1 && v <= 6));
    const q2 = makeQuestion(3, r);
    assert.ok(q2.n >= 6 && q2.n <= 20);
    const q3 = makeQuestion(4, r);
    const [a, b] = q3.groups.map((g) => g.n);
    assert.notEqual(a, b);
    const more = a > b ? 0 : 1;
    assert.equal(q3.answer, q3.ask === 'more' ? more : 1 - more);
    const q4 = makeQuestion(5, r);
    assert.ok(q4.a >= 1 && q4.b >= 1 && q4.a + q4.b <= 10);
    assert.equal(q4.answer, q4.a + q4.b);
    assert.ok(q4.choices.includes(q4.answer));
    assert.equal(checkAnswer(q4, q4.answer + 1), false);
  }
});

test('patterns: the levels go AB, AAB or ABB, then ABC, with colors, shapes, then sizes', () => {
  assert.deepEqual(levelInfo(1), { kind: ['AB'], attr: 'color' });
  assert.deepEqual(levelInfo(2), { kind: ['AB'], attr: 'shape' });
  assert.deepEqual(levelInfo(3), { kind: ['AB'], attr: 'size' });
  assert.deepEqual(levelInfo(5), { kind: ['AAB', 'ABB'], attr: 'shape' });
  assert.deepEqual(levelInfo(9), { kind: ['ABC'], attr: 'size' });
});

test('patterns: the answer continues the row, and the choices have the answer one time', () => {
  for (let level = 1; level <= 9; level++) {
    for (const seed of SEEDS) {
      const q = makePattern(level, seeded(seed * 10 + level));
      const unit = UNITS[q.kind];
      const seq = [...q.row, q.answer];
      for (let i = unit.length; i < seq.length; i++) assert.ok(sameItem(seq[i], seq[i - unit.length]), `level ${level}`);
      assert.ok(q.row.length >= unit.length * 2);
      assert.equal(q.choices.filter((c) => checkPattern(q, c)).length, 1);
      assert.ok(q.choices.length >= 2 && q.choices.length <= 3);
      // Only the attribute of the level changes.
      for (const attr of ['color', 'shape', 'size']) {
        if (attr === q.attr) continue;
        assert.equal(new Set(seq.map((it) => it[attr])).size, 1);
      }
    }
  }
});

test('sorting: each thing has exactly one right box', () => {
  for (const level of [1, 2]) {
    for (const seed of SEEDS) {
      const round = sortRound(level, seeded(seed));
      assert.equal(round.boxes.length, level === 1 ? 2 : 4);
      assert.equal(round.attrs.length, level);
      for (const item of round.items) {
        const matches = round.boxes.filter((b, i) => isRightBox(item, round.boxes, i));
        assert.equal(matches.length, 1);
        assert.ok(boxFor(item, round.boxes) >= 0);
      }
      // Each box gets things.
      const counts = round.boxes.map((_, i) => round.items.filter((it) => boxFor(it, round.boxes) === i).length);
      assert.ok(counts.every((c) => c >= 2));
    }
  }
});

test('shape builder: turns and places', () => {
  assert.equal(turn(270), 0);
  assert.ok(sameTurn('circle', 0, 90));
  assert.ok(sameTurn('square', 0, 270));
  assert.ok(sameTurn('rectangle', 90, 270));
  assert.equal(sameTurn('rectangle', 0, 90), false);
  assert.equal(sameTurn('triangle', 0, 180), false);
  const design = DESIGNS[1].find((d) => d.id === 'house');
  const roof = { type: 'triangle', w: 62, h: 28, rot: 0 };
  assert.deepEqual(findSlot(design, roof, 50, 30), { slot: 1, needsTurn: false });
  assert.deepEqual(findSlot(design, { ...roof, rot: 180 }, 50, 30), { slot: null, needsTurn: true });
  assert.deepEqual(findSlot(design, roof, 10, 90), { slot: null, needsTurn: false });
  assert.deepEqual(findSlot(design, roof, 50, 30, new Set([1])), { slot: null, needsTurn: false });
});

test('shape builder: levels have 2, 4, and 6 shapes, and each piece fits a slot', () => {
  for (const [level, n] of [[1, 2], [2, 4], [3, 6]]) {
    for (const d of DESIGNS[level]) assert.equal(d.slots.length, n, d.id);
    for (const seed of SEEDS) {
      const { design, pieces } = shapeRound(level, seeded(seed));
      assert.equal(pieces.length, design.slots.length);
      if (level === 1) for (const p of pieces) assert.equal(p.rot, design.slots[p.id].rot);
      // With enough turns, each piece fits its slot.
      const filled = new Set();
      for (const p of pieces) {
        const s = design.slots[p.id];
        let piece = { ...p };
        let found = findSlot(design, piece, s.x, s.y, filled);
        for (let k = 0; k < 4 && found.slot == null; k++) {
          piece = { ...piece, rot: turn(piece.rot) };
          found = findSlot(design, piece, s.x, s.y, filled);
        }
        assert.notEqual(found.slot, null);
        filled.add(found.slot);
      }
    }
  }
});

test('memory: the cards are pairs, and a match or a mismatch works', () => {
  for (const level of [1, 2, 3, 4]) {
    const state = deal(level, seeded(level));
    assert.equal(state.cards.length, CARD_COUNTS[level]);
    const counts = {};
    for (const c of state.cards) counts[c.pic] = (counts[c.pic] || 0) + 1;
    assert.ok(Object.values(counts).every((n) => n === 2));
  }
  assert.deepEqual(Object.values(CARD_COUNTS), [4, 6, 8, 12]);
  let s = { cards: [{ pic: 'a' }, { pic: 'b' }, { pic: 'a' }, { pic: 'b' }].map((c, id) => ({ ...c, id, matched: false })), open: [], moves: 0 };
  let r = flip(s, 0);
  assert.equal(r.event, 'first');
  assert.equal(flip(r.state, 0).event, 'ignored');
  r = flip(r.state, 1);
  assert.equal(r.event, 'mismatch');
  assert.equal(flip(r.state, 2).event, 'ignored');
  s = closeOpen(r.state);
  r = flip(flip(s, 0).state, 2);
  assert.equal(r.event, 'match');
  assert.equal(r.done, false);
  r = flip(flip(r.state, 1).state, 3);
  assert.equal(r.event, 'match');
  assert.equal(r.done, true);
  assert.ok(isDone(r.state));
});

test('letters: 29 Vietnamese letters and 26 English letters', () => {
  const data = readJson('data/letters.json');
  assert.equal(data.vi.length, 29);
  assert.equal(data.en.length, 26);
  assert.equal(data.vi.map((l) => l.glyph).join(''), 'aăâbcdđeêghiklmnoôơpqrstuưvxy');
  assert.equal(data.en.map((l) => l.glyph).join(''), 'abcdefghijklmnopqrstuvwxyz');
  const images = readJson('data/images.json');
  for (const l of [...data.vi, ...data.en]) assert.ok(images[l.pic], `no picture ${l.pic}`);
});

test('letters: the questions have the answer and different choices', () => {
  const data = readJson('data/letters.json');
  for (const lang of ['vi', 'en']) {
    const set = firstLetterSet(data[lang]);
    assert.ok(set.length >= 10);
    for (const seed of SEEDS) {
      const q2 = letterQuestion(2, data[lang], seeded(seed));
      assert.ok(set.includes(q2.answer));
      assert.equal(q2.choices.length, 3);
      assert.equal(new Set(q2.choices.map((c) => c.base)).size, 3, 'letters with the same base are not together');
      assert.ok(checkLetter(q2, q2.answer));
      const q3 = letterQuestion(3, data[lang], seeded(seed));
      assert.equal(q3.choices.length, 4);
      assert.equal(new Set(q3.choices.map((c) => c.id)).size, 4);
      assert.ok(q3.choices.includes(q3.answer));
    }
  }
});

test('tập tầm vông: swaps move the thing, and the answer is its last place', () => {
  assert.equal(applySwaps(0, []), 0);
  assert.equal(applySwaps(0, [[0, 1]]), 1);
  assert.equal(applySwaps(0, [[0, 1], [1, 0]]), 0);
  assert.equal(applySwaps(2, [[0, 1]]), 2);
  assert.equal(applySwaps(0, [[0, 2], [2, 1]]), 1);
  for (const level of [1, 2, 3]) {
    for (const seed of SEEDS) {
      const r = ttvRound(level, seeded(seed));
      assert.equal(r.count, level === 3 ? 3 : 2);
      assert.equal(r.swaps.length === 0, level === 1);
      for (const [a, b] of r.swaps) assert.notEqual(a, b);
      assert.ok(isCorrect(r, applySwaps(r.start, r.swaps)));
    }
  }
});

test('oẳn tù tì: búa breaks kéo, kéo cuts bao, bao covers búa', () => {
  assert.equal(outcome('bua', 'keo'), 'win');
  assert.equal(outcome('keo', 'bao'), 'win');
  assert.equal(outcome('bao', 'bua'), 'win');
  assert.equal(outcome('keo', 'bua'), 'lose');
  assert.equal(outcome('bao', 'keo'), 'lose');
  assert.equal(outcome('bua', 'bao'), 'lose');
  for (const h of HANDS) assert.equal(outcome(h, h), 'tie');
  assert.equal(winner('bua', 'keo'), 'bua');
  assert.equal(winner('bua', 'bua'), null);
  assert.equal(reasonKey('keo', 'bua'), 'oantuti.reason.bua');
  assert.equal(reasonKey('bao', 'bao'), 'oantuti.reason.tie');
  assert.throws(() => outcome('rock', 'bua'));
});

test('chơi chuyền: the ball waits, and each throw needs more sticks at higher levels', () => {
  for (const level of [1, 2, 3]) {
    let s = ccRound(level);
    assert.equal(pickStick(s).ignored, true, 'no pick while the ball is in the hand');
    let throws = 0;
    while (s.remaining > 0) {
      s = throwBall(s);
      throws += 1;
      assert.equal(needed(s), Math.min(level, s.remaining));
      let r;
      do {
        r = pickStick(s);
        s = r.state;
      } while (!r.catchNow);
      assert.equal(s.inAir, false);
    }
    assert.equal(s.picked, STICKS);
    assert.equal(throws, Math.ceil(STICKS / level));
  }
  const layout = stickLayout(seeded(1), 10, 5);
  assert.equal(layout.length, 10);
  assert.ok(layout.every((p) => p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1));
});

test('coloring: fill, undo, clear, and white removes a color', () => {
  let s = createColoring();
  s = fillArea(s, 0, '#e84a3f');
  s = fillArea(s, 1, '#3f6fd8');
  assert.deepEqual(s.fills, { 0: '#e84a3f', 1: '#3f6fd8' });
  assert.equal(fillArea(s, 0, '#e84a3f'), s, 'the same color does nothing');
  s = fillArea(s, 0, '#ffffff');
  assert.deepEqual(s.fills, { 1: '#3f6fd8' });
  s = undo(s);
  assert.deepEqual(s.fills, { 0: '#e84a3f', 1: '#3f6fd8' });
  assert.ok(isComplete(s.fills, 2));
  assert.equal(isComplete(s.fills, 3), false);
  s = clearAll(s);
  assert.deepEqual(s.fills, {});
  s = undo(s);
  assert.deepEqual(s.fills, { 0: '#e84a3f', 1: '#3f6fd8' });
  s = undo(undo(s));
  assert.deepEqual(s.fills, {});
  assert.equal(canUndo(s), false);
  assert.equal(undo(s), s);
});

import { makeQuestion as toneQuestion, checkTone, distinct, TONES, PAIRS, FAMILIES } from '../js/logic/tones.js';

test('tones: the pairs differ only in the tone, and the questions are correct', () => {
  const vi = readJson('lang/vi.json');
  const images = readJson('data/images.json');
  const strip = (s) => s.normalize('NFD').replace(/[̣̀́̃̉]/g, '').normalize('NFC');
  for (const [a, b] of PAIRS) {
    assert.equal(strip(vi[a.key]), strip(vi[b.key]), `${vi[a.key]} and ${vi[b.key]}`);
    assert.notEqual(a.tone, b.tone);
    assert.ok(images[a.pic] && images[b.pic]);
  }
  for (const f of FAMILIES) {
    const words = TONES.map((tone) => vi[`tones.w.${f.id}.${tone}`]);
    assert.equal(new Set(words.map(strip)).size, 1);
    assert.equal(new Set(words).size, 6);
  }
  for (const seed of SEEDS) {
    const q2 = toneQuestion(2, seeded(seed));
    assert.equal(q2.choices.length, 2);
    assert.ok(checkTone(q2, q2.answer));
    const q3 = toneQuestion(3, seeded(seed));
    assert.equal(q3.choices.length, 3);
    assert.ok(q3.choices.includes(q3.answer));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(distinct(q3.choices[i], q3.choices[j]), 'hỏi and ngã are never together');
  }
  assert.equal(distinct('hoi', 'nga'), false);
  assert.equal(distinct('sac', 'huyen'), true);
});

import { samplePath, advance, isDone as traceDone, glyphsFor, DIGITS } from '../js/logic/trace.js';

test('tracing: the progress goes forward only near the next points, and never back', () => {
  const pts = samplePath(100, (d) => ({ x: d, y: 0 }), 10);
  assert.equal(pts.length, 11);
  let i = advance(0, { x: 0, y: 3 }, pts, 5);
  assert.equal(i, 1);
  i = advance(i, { x: 90, y: 0 }, pts, 5);
  assert.equal(i, 1, 'a jump to the end does not count');
  i = advance(i, { x: 20, y: 0 }, pts, 5, 5);
  assert.equal(i, 3);
  i = advance(i, { x: 0, y: 0 }, pts, 5);
  assert.equal(i, 3, 'the progress does not go back');
  for (let x = 30; x <= 100; x += 10) i = advance(i, { x, y: 1 }, pts, 5);
  assert.ok(traceDone(i, pts));
});

test('tracing: each letter and each digit has strokes', () => {
  const strokes = readJson('data/strokes.json');
  const letters = readJson('data/letters.json');
  for (const lang of ['vi', 'en']) {
    for (const g of glyphsFor(1, letters[lang])) assert.ok(strokes[g.glyph]?.length, `no strokes for ${g.glyph}`);
  }
  for (const d of DIGITS) assert.ok(strokes[d]?.length, `no strokes for ${d}`);
  assert.equal(glyphsFor(2, []).length, 10);
});

import { makeRound as dotsRound, tapDot, hitRadius, DESIGNS as DOT_DESIGNS } from '../js/logic/dots.js';

test('dot-to-dot: level 1 has 10 dots or fewer, level 2 has 20 or fewer, and the dots go in order', () => {
  const images = readJson('data/images.json');
  const vi = readJson('lang/vi.json');
  for (const d of DOT_DESIGNS[1]) assert.ok(d.points.length <= 10, d.id);
  for (const d of DOT_DESIGNS[2]) assert.ok(d.points.length <= 20, d.id);
  for (const d of [...DOT_DESIGNS[1], ...DOT_DESIGNS[2]]) {
    assert.ok(images[d.pic], `no picture ${d.pic}`);
    assert.ok(vi[d.name], `no name ${d.name}`);
    for (const p of d.points) assert.ok(p[0] >= 0 && p[0] <= 100 && p[1] >= 0 && p[1] <= 100);
    d.points.forEach((_, i) => assert.ok(hitRadius(d.points, i) >= 4));
  }
  let s = dotsRound(1, seeded(1));
  const n = s.design.points.length;
  assert.equal(tapDot(s, 1).event, 'wrong');
  for (let i = 0; i < n; i++) {
    const r = tapDot(s, i);
    assert.equal(r.event, i === n - 1 ? 'done' : 'next');
    s = r.state;
    if (i > 0) assert.equal(tapDot(s, i - 1).event, 'old');
  }
  const again = dotsRound(1, seeded(2), 'star');
  assert.notEqual(again.design.id, 'star');
});

import { makeRound as whereRound, zoneAt, OBJECTS, DROP_ZONES, POSITIONS } from '../js/logic/where.js';

test('where is Sỏi: the rounds use positions that each thing can show', () => {
  for (const ps of Object.values(OBJECTS)) for (const p of ps) assert.ok(POSITIONS.includes(p));
  for (const seed of SEEDS) {
    const r1 = whereRound(1, seeded(seed));
    assert.equal(r1.objects.length, 3);
    assert.ok(OBJECTS[r1.object].includes(r1.pos));
    assert.equal(r1.objects[r1.hidden], r1.object);
    const r2 = whereRound(2, seeded(seed));
    assert.equal(new Set(r2.choices).size, 3);
    assert.ok(r2.choices.includes(r2.pos));
    const r3 = whereRound(3, seeded(seed));
    assert.ok(DROP_ZONES[r3.object].some((z) => z.pos === r3.pos));
  }
  assert.equal(zoneAt('table', 100, 40), 'tren');
  assert.equal(zoneAt('table', 100, 120), 'duoi');
  assert.equal(zoneAt('table', 200, 120), 'canh');
  assert.equal(zoneAt('box', 100, 120), 'trong');
  assert.equal(zoneAt('basket', 100, 100), 'trong');
  assert.equal(zoneAt('tree', 100, 100), null);
});

import { makeQuestion as feelQuestion, checkFeeling, FEELINGS, FACES, STORIES } from '../js/logic/feelings.js';
import { EXPRESSIONS } from '../js/core/mascot.js';

test('feelings: each feeling has a face of Sỏi, and each story has one right feeling', () => {
  const images = readJson('data/images.json');
  for (const f of FEELINGS) assert.ok(EXPRESSIONS.includes(FACES[f]), f);
  for (const s of STORIES) {
    assert.ok(FEELINGS.includes(s.feeling));
    assert.ok(images[s.pic], s.pic);
  }
  for (const seed of SEEDS) {
    const q = feelQuestion(2, seeded(seed));
    assert.equal(q.choices.length, 3);
    assert.equal(q.choices.filter((c) => checkFeeling(q, c)).length, 1);
  }
});

import { makeOrder, addFruit, isComplete as orderDone, FRUITS, BOATS } from '../js/logic/market.js';

test('floating market: the order is on the boats, and the basket takes only what is needed', () => {
  const images = readJson('data/images.json');
  for (const pic of Object.values(FRUITS)) assert.ok(images[pic], pic);
  for (const level of [1, 2, 3]) {
    for (const seed of SEEDS) {
      let o = makeOrder(level, seeded(seed));
      assert.equal(o.items.length, level === 3 ? 2 : 1);
      assert.equal(o.boats.length, BOATS);
      assert.equal(new Set(o.boats).size, BOATS);
      for (const i of o.items) {
        assert.ok(o.boats.includes(i.fruit));
        assert.ok(i.n >= 1 && i.n <= (level === 2 ? 5 : 3));
      }
      const other = o.boats.find((b) => !o.items.some((i) => i.fruit === b));
      assert.equal(addFruit(o, other).event, 'notNeeded');
      for (const i of o.items) {
        for (let k = 0; k < i.n; k++) {
          const r = addFruit(o, i.fruit);
          assert.equal(r.event, 'added');
          o = r.order;
        }
        assert.equal(addFruit(o, i.fruit).event, 'enough');
      }
      assert.ok(orderDone(o));
    }
  }
});

import { bendRatio, NOTES, INSTRUMENTS } from '../js/logic/music.js';

test('instruments: the notes are in the scale, and the lever bends the pitch up to 7 half steps', () => {
  assert.deepEqual(INSTRUMENTS, ['trung', 'trong', 'sao', 'bau']);
  for (const notes of Object.values(NOTES)) for (const n of notes) assert.ok(n >= 0 && n <= 10);
  assert.equal(bendRatio(0), 1);
  assert.ok(Math.abs(bendRatio(1) - 2 ** (7 / 12)) < 1e-9);
  assert.equal(bendRatio(-1), 1);
  assert.equal(bendRatio(2), bendRatio(1));
});

import { makeTray, placeFruit, TRAY_FRUITS, makeLixi, takeLixi, makeLanterns, lightLantern, LANTERNS } from '../js/logic/festival.js';

test('festivals: the Southern fruit tray, lì xì, and lanterns', () => {
  const images = readJson('data/images.json');
  for (const f of [...TRAY_FRUITS, ...LANTERNS, 'lixi', 'mamnguqua', 'fullmoon']) assert.ok(images[f], f);
  let s = makeTray(seeded(4));
  assert.equal(s.choices.length, 6);
  const wrong = s.choices.find((c) => !TRAY_FRUITS.includes(c));
  assert.equal(placeFruit(s, wrong).event, 'wrong');
  TRAY_FRUITS.forEach((f, i) => {
    const r = placeFruit(s, f);
    assert.equal(r.event, 'placed');
    assert.equal(r.done, i === TRAY_FRUITS.length - 1);
    s = r.state;
  });
  assert.equal(placeFruit(s, TRAY_FRUITS[0]).event, 'old');
  let l = makeLixi(seeded(5));
  assert.ok(l.n >= 1 && l.n <= 5);
  for (let i = 0; i < l.n; i++) l = takeLixi(l).state;
  assert.equal(takeLixi(l).event, 'enough');
  let lan = makeLanterns(seeded(6));
  assert.ok(lan.lanterns.length >= 3 && lan.lanterns.length <= 6);
  let r;
  for (let i = 0; i < lan.lanterns.length; i++) {
    r = lightLantern(lan, i);
    lan = r.state;
  }
  assert.equal(r.done, true);
  assert.equal(lightLantern(lan, 0).event, 'old');
});

import {
  STICKERS, FREE, unlockedCount, unlocked, newSticker, emptyBook, normalizeBook, placeSticker, moveSticker, removeSticker,
} from '../js/logic/stickers.js';

test('sticker book: a star gives a new sticker, and the book saves places', () => {
  const images = readJson('data/images.json');
  const vi = readJson('lang/vi.json');
  for (const id of STICKERS) {
    assert.ok(images[id], `no picture ${id}`);
    assert.ok(vi[`pic.${id}`], `no name ${id}`);
  }
  assert.equal(new Set(STICKERS).size, STICKERS.length);
  assert.equal(unlockedCount(0), FREE);
  assert.equal(unlocked(2).length, FREE + 2);
  assert.equal(unlockedCount(999), STICKERS.length);
  assert.equal(newSticker(0, 1), STICKERS[FREE]);
  assert.equal(newSticker(1, 1), null);
  assert.equal(newSticker(999, 1000), null);
  let book = placeSticker(emptyBook(), 'village', 'nonla', 0.5, 1.4);
  const [p] = book.scenes.village;
  assert.equal(p.y, 1);
  book = moveSticker(book, 'village', p.key, 0.2, 0.3);
  assert.deepEqual([book.scenes.village[0].x, book.scenes.village[0].y], [0.2, 0.3]);
  const saved = normalizeBook(JSON.parse(JSON.stringify(book)));
  assert.deepEqual(saved.scenes.village, book.scenes.village);
  book = removeSticker(book, 'village', p.key);
  assert.equal(book.scenes.village.length, 0);
  assert.deepEqual(normalizeBook({ scenes: { village: [{ id: 'bad', x: 0, y: 0 }, null] } }).scenes.village, []);
  assert.deepEqual(normalizeBook('x'), emptyBook());
});

import { makeRound as shareRound, startPlates, give, takeBack, isFair, isFull, moods, skipCounts, fullRows, checkTotal, THINGS as SHARE_THINGS } from '../js/logic/share.js';

test('fair share: level 1 is fair only when the pool is empty and the plates are equal', () => {
  const images = readJson('data/images.json');
  for (const pic of [...SHARE_THINGS, 'seedling']) assert.ok(images[pic], pic);
  for (const seed of SEEDS) {
    const round = shareRound(1, seeded(seed));
    assert.ok(round.friends === 2 || round.friends === 3);
    assert.equal(round.total, round.friends * round.each);
    assert.ok(round.total >= 3 && round.total <= 6);
    let s = startPlates(round);
    assert.equal(s.pool, round.total);
    // Give all the things to the first friend: not fair, and the others are sad.
    for (let i = 0; i < round.total; i++) s = give(round, s, 0).state;
    assert.equal(give(round, s, 1).event, 'empty');
    assert.ok(!isFair(s));
    assert.deepEqual(moods(s), ['happy', ...Array(round.friends - 1).fill('sad')]);
    // Take back and share one by one.
    while (s.plates[0]) s = takeBack(s, 0).state;
    assert.equal(takeBack(s, 0).event, 'none');
    for (let i = 0; i < round.total; i++) s = give(round, s, i % round.friends).state;
    assert.ok(isFair(s));
    assert.ok(moods(s).every((m) => m === 'happy'));
  }
});

test('fair share: a friend with fewer things waits while the pool has more things', () => {
  const round = { level: 1, friends: 2, each: 2, total: 4 };
  const s = give(round, startPlates(round), 0).state;
  assert.deepEqual(moods(s), ['happy', 'wait']);
});

test('fair share: level 2 plates take only the number that the friend wants', () => {
  for (const seed of SEEDS) {
    const round = shareRound(2, seeded(seed));
    assert.ok(round.friends >= 2 && round.friends <= 4);
    assert.ok(round.each >= 2);
    assert.ok(round.total <= 10);
    assert.equal(round.choices.length, 3);
    assert.ok(round.choices.includes(round.total));
    let s = startPlates(round);
    assert.equal(s.pool, round.total + round.extra);
    for (let p = 0; p < round.friends; p++) {
      for (let i = 0; i < round.each; i++) s = give(round, s, p).state;
      assert.equal(give(round, s, p).event, 'full');
    }
    assert.ok(isFull(round, s));
    assert.equal(s.pool, round.extra);
    assert.ok(checkTotal(round, round.total));
    assert.ok(!checkTotal(round, round.total + 1));
  }
});

test('fair share: count by groups, and level 3 finds the full rows', () => {
  assert.deepEqual(skipCounts(2, 3), [2, 4, 6]);
  assert.deepEqual(skipCounts(5, 2), [5, 10]);
  for (const seed of SEEDS) {
    const round = shareRound(3, seeded(seed));
    assert.equal(round.total, round.rows * round.cols);
    assert.ok(round.total <= 12);
    assert.ok(round.choices.includes(round.total));
  }
  const round = { rows: 2, cols: 3 };
  const planted = new Set(['0,0', '0,1', '0,2', '1,0']);
  assert.deepEqual(fullRows(round, planted), [0]);
  planted.add('1,1');
  planted.add('1,2');
  assert.deepEqual(fullRows(round, planted), [0, 1]);
});
