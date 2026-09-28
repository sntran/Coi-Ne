import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordableGroups, isRecordable, groupOf, clipId, GROUPS } from '../js/logic/recordings.js';
import { readJson } from './helpers.js';

const vi = readJson('lang/vi.json');
const en = readJson('lang/en.json');

test('a recording id has the language and the key', () => {
  assert.equal(clipId('vi', 'praise.great'), 'vi:praise.great');
});

test('texts with params and texts for the parent are not in the list', () => {
  assert.equal(isRecordable('numbers.match', vi['numbers.match'], 'vi'), false);
  assert.equal(isRecordable('settings.title', vi['settings.title'], 'vi'), false);
  assert.equal(isRecordable('about.goal1', vi['about.goal1'], 'vi'), false);
  assert.equal(isRecordable('ui.home', vi['ui.home'], 'vi'), false);
  assert.equal(isRecordable('praise.great', vi['praise.great'], 'vi'), true);
});

test('the sound of a letter is recorded only in the language of its alphabet', () => {
  assert.equal(isRecordable('abc.vi.b.sound', vi['abc.vi.b.sound'], 'vi'), true);
  assert.equal(isRecordable('abc.en.b.sound', vi['abc.en.b.sound'], 'vi'), false);
  assert.equal(isRecordable('abc.en.b.word', vi['abc.en.b.word'], 'vi'), true);
});

test('the groups have the important texts, in a good order', () => {
  for (const [lang, texts] of [['vi', vi], ['en', en]]) {
    const groups = recordableGroups(texts, lang);
    assert.deepEqual(groups.map((g) => g.id), GROUPS);
    const all = groups.flatMap((g) => g.keys);
    assert.equal(new Set(all).size, all.length, 'each key is in one group only');
    assert.ok(all.includes('praise.great'));
    assert.ok(all.includes('praise.tryAgain'));
    assert.ok(all.includes('dongdao.taptamvong'));
    assert.ok(all.includes('pic.cat'));
    assert.ok(all.every((k) => !/\{\w+\}/.test(texts[k])));
    const nums = groups.find((g) => g.id === 'numbers').keys;
    assert.deepEqual(nums.slice(0, 3), ['num.0', 'num.1', 'num.2']);
    assert.equal(nums.at(-1), 'num.100');
  }
  assert.equal(groupOf('game.coloring.name'), 'games');
  assert.equal(groupOf('color.red'), 'colors');
  assert.equal(groupOf('coloring.instruction'), 'instructions');
  assert.equal(groupOf('story.oanquan.1'), 'rhymes');
});
