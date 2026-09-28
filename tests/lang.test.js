import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJson, readText, listFiles } from './helpers.js';
import { MAX_LEVELS } from '../js/logic/progress.js';
import { PALETTE } from '../js/logic/colors.js';
import { THINGS } from '../js/logic/numbers.js';
import { COLORS, SHAPES, SIZES } from '../js/logic/patterns.js';
import { VALUES } from '../js/logic/sorting.js';
import { DESIGNS, TYPES } from '../js/logic/shapes.js';
import { HANDS } from '../js/logic/oantuti.js';
import { PICTURES } from '../js/logic/memory.js';

const vi = readJson('lang/vi.json');
const en = readJson('lang/en.json');

test('each key in vi.json is also in en.json', () => {
  const missing = Object.keys(vi).filter((k) => !(k in en));
  assert.deepEqual(missing, []);
});

test('each key in en.json is also in vi.json', () => {
  const missing = Object.keys(en).filter((k) => !(k in vi));
  assert.deepEqual(missing, []);
});

test('no text is empty', () => {
  for (const [name, texts] of [['vi', vi], ['en', en]]) {
    const empty = Object.entries(texts).filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k);
    assert.deepEqual(empty, [], `empty texts in ${name}.json`);
  }
});

test('the params in a text are the same in both languages', () => {
  const params = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  const diff = Object.keys(vi).filter((k) => params(vi[k]) !== params(en[k]));
  assert.deepEqual(diff, []);
});

const PREFIXES = [
  'ui', 'praise', 'soi', 'home', 'game', 'settings', 'about', 'coloring', 'color', 'shape', 'size', 'num', 'thing',
  'numbers', 'patterns', 'shapes', 'sorting', 'letters', 'memory', 'oanquan', 'taptamvong', 'oantuti',
  'choichuyen', 'story', 'dongdao', 'pic', 'abc', 'app', 'rec', 'tones', 'trace', 'dots', 'where', 'feel', 'market',
  'music', 'fest', 'stickers', 'rest', 'share',
];

test('each text key in the JavaScript files is in the language files', () => {
  const pattern = new RegExp(`['"\`]((?:${PREFIXES.join('|')})\\.[\\w.-]+)['"\`]`, 'g');
  const missing = [];
  for (const file of listFiles('js')) {
    const src = readText(file);
    for (const m of src.matchAll(pattern)) {
      const key = m[1];
      if (key.endsWith('.') || key.endsWith('.js') || key.endsWith('.json')) continue;
      if (!(key in vi)) missing.push(`${file}: ${key}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('the keys that the games make from data are in the language files', () => {
  const need = [];
  for (const id of Object.keys(MAX_LEVELS)) need.push(`game.${id}.name`, `settings.levels.${id}`);
  for (const c of PALETTE) need.push(`color.${c.id}`);
  for (const c of [...COLORS, ...VALUES.color]) need.push(`color.${c}`);
  for (const s of [...SHAPES, ...VALUES.shape, ...TYPES]) need.push(`shape.${s}`);
  for (const s of SIZES) need.push(`size.${s}`);
  for (const t of THINGS) need.push(`thing.${t}.1`, `thing.${t}.n`);
  for (let n = 0; n <= 100; n++) need.push(`num.${n}`);
  for (const level of Object.values(DESIGNS)) for (const d of level) need.push(`shapes.design.${d.id}`);
  for (const h of HANDS) need.push(`oantuti.hand.${h}`, `oantuti.reason.${h}`);
  need.push('oantuti.reason.tie');
  for (const p of PICTURES) need.push(`pic.${p}`);
  for (const id of Object.keys(readJson('data/images.json'))) need.push(`pic.${id}`);
  for (const g of readJson('data/coloring.json').groups) need.push(`coloring.group.${g.id}`);
  const letters = readJson('data/letters.json');
  for (const lang of ['vi', 'en']) for (const l of letters[lang]) need.push(`abc.${lang}.${l.id}.sound`, `abc.${lang}.${l.id}.word`);
  for (let i = 1; i <= 28; i++) need.push(`dongdao.choichuyen.${String(i).padStart(2, '0')}`);
  const missing = need.filter((k) => !(k in vi));
  assert.deepEqual(missing, []);
});

test('the Vietnamese letter sounds are not single consonant letters', () => {
  const letters = readJson('data/letters.json');
  for (const l of letters.vi) {
    const sound = vi[`abc.vi.${l.id}.sound`];
    // A consonant alone would make the voice say its Latin name, for example "bê" for "b".
    if (!'aăâeêioôơuưy'.includes(l.glyph)) assert.notEqual(sound, l.glyph, `the sound of ${l.glyph}`);
  }
  assert.equal(vi['abc.vi.b.sound'], 'bờ');
});

test('the HTML file has no text for the user', () => {
  const html = readText('index.html');
  const body = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
  const text = body.replace(/<[^>]+>/g, '').trim();
  assert.equal(text, '');
  assert.match(html, /<title><\/title>/);
});
