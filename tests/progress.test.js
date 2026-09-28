import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyProgress, normalizeProgress, getLevel, setLevel, recordAnswer, clampLevel, MAX_LEVELS, STREAK_FOR_STAR,
} from '../js/logic/progress.js';
import {
  createStore, memoryStorage, loadSettings, saveSettings, loadGallery, saveToGallery, removeFromGallery, DEFAULT_SETTINGS,
} from '../js/logic/save.js';

test('after 5 correct answers in a row, the child gets a star and a suggestion', () => {
  let p = normalizeProgress(null);
  let r;
  for (let i = 0; i < STREAK_FOR_STAR - 1; i++) {
    r = recordAnswer(p, 'numbers', true);
    assert.equal(r.star, false);
    p = r.progress;
  }
  r = recordAnswer(p, 'numbers', true);
  assert.equal(r.star, true);
  assert.equal(r.suggestNext, true);
  assert.equal(r.progress.games.numbers.stars, 1);
  assert.equal(r.progress.games.numbers.streak, 0);
});

test('a wrong answer sets the streak to 0 but does not take away stars or levels', () => {
  let p = normalizeProgress({ games: { numbers: { level: 3, streak: 4, stars: 2 } } });
  p = recordAnswer(p, 'numbers', false).progress;
  assert.deepEqual(p.games.numbers, { level: 3, streak: 0, stars: 2 });
});

test('at the last level, a star does not suggest a next level', () => {
  const p = normalizeProgress({ games: { memory: { level: 4, streak: 4, stars: 0 } } });
  const r = recordAnswer(p, 'memory', true);
  assert.equal(r.star, true);
  assert.equal(r.suggestNext, false);
});

test('levels stay in the range of each game', () => {
  assert.equal(clampLevel('numbers', 9), MAX_LEVELS.numbers);
  assert.equal(clampLevel('numbers', 0), 1);
  assert.equal(clampLevel('numbers', 'x'), 1);
  let p = emptyProgress();
  p = setLevel(p, 'patterns', 7);
  assert.equal(getLevel(p, 'patterns'), 7);
  p = setLevel(p, 'patterns', 20);
  assert.equal(getLevel(p, 'patterns'), 9);
  assert.equal(getLevel(emptyProgress(), 'letters'), 1);
});

test('bad saved progress becomes a clean progress', () => {
  const p = normalizeProgress({ games: { numbers: { level: -3, streak: 'a', stars: null } }, extra: 1 });
  assert.deepEqual(p.games.numbers, { level: 1, streak: 0, stars: 0 });
  assert.deepEqual(Object.keys(p.games).sort(), Object.keys(MAX_LEVELS).sort());
});

test('settings: save and load, with safe values', () => {
  const store = createStore(memoryStorage());
  assert.deepEqual(loadSettings(store), { ...DEFAULT_SETTINGS });
  saveSettings(store, { lang: 'en', voice: false, rate: 1.1 });
  assert.deepEqual(loadSettings(store), { lang: 'en', voice: false, rate: 1.1 });
  saveSettings(store, { lang: 'fr', voice: 'yes', rate: 9 });
  assert.deepEqual(loadSettings(store), { lang: 'vi', voice: true, rate: 1.3 });
});

test('the store survives bad JSON and a full storage', () => {
  const storage = memoryStorage();
  storage.setItem('coine.settings', '{bad');
  const store = createStore(storage);
  assert.equal(store.read('settings', 'fallback'), 'fallback');
  const full = createStore({ getItem: () => null, setItem: () => { throw new Error('full'); } });
  assert.equal(full.write('x', 1), false);
});

test('the gallery adds, updates, and removes pictures', () => {
  const store = createStore(memoryStorage());
  let list = loadGallery(store);
  assert.deepEqual(list, []);
  let r = saveToGallery(list, { picture: 'fish', fills: { 0: '#e84a3f' } }, 1000);
  list = r.list;
  const id = r.entry.id;
  r = saveToGallery(list, { id, picture: 'fish', fills: { 0: '#e84a3f', 1: '#3f6fd8' } }, 2000);
  list = r.list;
  assert.equal(list.length, 1);
  assert.deepEqual(list[0].fills, { 0: '#e84a3f', 1: '#3f6fd8' });
  list = saveToGallery(list, { picture: 'cow', fills: {} }, 3000).list;
  assert.equal(list.length, 2);
  assert.equal(list[0].picture, 'cow', 'the newest picture is first');
  store.write('gallery', list);
  assert.equal(loadGallery(store).length, 2);
  list = removeFromGallery(list, id);
  assert.deepEqual(list.map((g) => g.picture), ['cow']);
  store.write('gallery', [{ bad: true }, null, ...list]);
  assert.equal(loadGallery(store).length, 1);
});
