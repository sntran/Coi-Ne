import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRestClock, tick, resume, normalizeRest, RESET_AFTER_MS, DEFAULT_REST } from '../js/logic/rest.js';

function run(clock, from, seconds, visible = true, minutes = 1) {
  let s = clock;
  let due = false;
  for (let i = 0; i <= seconds; i++) {
    const r = tick(s, { now: from + i * 1000, visible, minutes });
    s = r.state;
    if (r.due) due = true;
  }
  return { state: s, due };
}

test('rest time starts after the minutes of play', () => {
  let r = run(createRestClock(), 0, 59);
  assert.equal(r.due, false);
  r = run(r.state, 60000, 2);
  assert.equal(r.due, true);
  assert.equal(r.state.resting, true);
});

test('the time when the app is not on the screen does not count', () => {
  let r = run(createRestClock(), 0, 30);
  r = run(r.state, 31000, 120, false);
  r = run(r.state, 152000, 20);
  assert.equal(r.due, false);
  assert.ok(r.state.active < 60000);
});

test('after a long break, the count starts again', () => {
  let r = run(createRestClock(), 0, 50);
  r = run(r.state, 51000, 1, false);
  r = run(r.state, 52000 + RESET_AFTER_MS, 20);
  assert.equal(r.due, false);
  assert.ok(r.state.active <= 21000);
});

test('a device that sleeps does not add a long time', () => {
  let s = tick(createRestClock(), { now: 0, visible: true, minutes: 1 }).state;
  const r = tick(s, { now: 10 * 60000, visible: true, minutes: 1 });
  assert.equal(r.due, false);
});

test('rest time can be off, and a parent can resume', () => {
  const off = run(createRestClock(), 0, 200, true, 0);
  assert.equal(off.due, false);
  const r = run(createRestClock(), 0, 61);
  const s = resume(r.state, 70000);
  assert.equal(s.resting, false);
  assert.equal(s.active, 0);
  assert.equal(normalizeRest(15), 15);
  assert.equal(normalizeRest('x'), DEFAULT_REST);
  assert.equal(normalizeRest(0), 0);
});
