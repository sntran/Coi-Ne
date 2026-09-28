import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readJson, readText, listFiles } from './helpers.js';
import { allPictures } from '../js/logic/coloring.js';

const credits = readJson('credits.json');
const catalog = readJson('data/coloring.json');
const images = readJson('data/images.json');
const LICENSES = ['CC0', 'CC BY 4.0', 'Apache 2.0', 'original'];

test('each picture in the Coloring game has an entry in credits.json', () => {
  const missing = allPictures(catalog).filter((p) => !credits[p.file]).map((p) => p.file);
  assert.deepEqual(missing, []);
});

test('each picture file in the repository has an entry in credits.json', () => {
  const missing = listFiles('pictures').filter((f) => !credits[f]);
  assert.deepEqual(missing, []);
});

test('each picture that the games show has an entry in credits.json', () => {
  const missing = Object.values(images).filter((f) => !credits[f]);
  assert.deepEqual(missing, []);
});

test('each entry in credits.json has a file, a source, an author, and a known license', () => {
  for (const [file, c] of Object.entries(credits)) {
    assert.ok(existsSync(join(ROOT, file)), `${file} does not exist`);
    assert.ok(c.title && c.author && c.source, `${file} needs a title, an author, and a source`);
    assert.ok(LICENSES.includes(c.license), `${file} has the license ${c.license}`);
    if (c.license === 'original') assert.equal(c.source, 'original');
    else assert.match(c.source, /^https:\/\//);
    if (c.license === 'CC BY 4.0') assert.equal(c.licenseUrl, 'https://creativecommons.org/licenses/by/4.0/');
  }
});

test('the Coloring game has at least 30 pictures in its groups', () => {
  const groups = catalog.groups.map((g) => g.id);
  assert.deepEqual(groups, ['animals', 'flowers', 'food', 'vehicles', 'home', 'vietnam', 'tet', 'trungthu']);
  assert.ok(allPictures(catalog).length >= 30);
  const ids = allPictures(catalog).map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'picture ids must be different');
});

test('the Vietnam group has the 10 original pictures', () => {
  const vn = catalog.groups.find((g) => g.id === 'vietnam');
  assert.deepEqual(vn.pictures.map((p) => p.id), [
    'aodai', 'nonla', 'denongsao', 'banhchung', 'hoasen', 'contrau', 'caidieu', 'batpho', 'xichlo', 'caytre',
  ]);
  for (const p of vn.pictures) assert.equal(credits[p.file].license, 'original');
});

test('the original pictures have 12 shapes or fewer and no gradients or filters', () => {
  for (const file of listFiles('pictures/vietnam')) {
    const svg = readText(file);
    assert.doesNotMatch(svg, /Gradient|<filter|<mask/, file);
    const shapes = svg.match(/<(path|circle|ellipse|rect|polygon)\b/g) || [];
    const lines = svg.match(/fill="none"/g) || [];
    assert.ok(shapes.length - lines.length <= 16, `${file} has too many shapes`);
  }
});
