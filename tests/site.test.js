import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readJson, readText } from './helpers.js';
import { siteFiles, cachedFiles, contentVersion, TAILWIND_URL } from '../tools/site.js';

test('the service worker keeps all the files of the site', () => {
  const sw = readText('sw.js');
  const list = [...sw.matchAll(/^ {2}'\.\/(.*)',$/gm)].map((m) => m[1]).filter(Boolean);
  assert.deepEqual(list, cachedFiles(), 'run: node tools/build-sw.js');
});

test('the version of the service worker matches the files', () => {
  const sw = readText('sw.js');
  const version = sw.match(/const VERSION = '([^']*)';/)[1];
  assert.equal(version, contentVersion(), 'run: node tools/build-sw.js');
});

test('the tests, the tools, and the workflow are not part of the site', () => {
  const files = siteFiles();
  assert.ok(files.includes('index.html'));
  assert.ok(files.every((f) => !f.startsWith('tests/') && !f.startsWith('tools/') && !f.startsWith('.github/')));
  assert.ok(files.every((f) => !f.endsWith('.test.js')));
});

test('the Tailwind script has a fixed version, and it is the same everywhere', () => {
  assert.match(TAILWIND_URL, /@tailwindcss\/browser@\d+\.\d+\.\d+\//);
  assert.ok(readText('index.html').includes(`src="${TAILWIND_URL}"`));
  assert.ok(readText('sw.js').includes(`'${TAILWIND_URL}'`));
});

test('the site uses only relative paths', () => {
  for (const f of siteFiles().filter((x) => /\.(html|css|js|webmanifest)$/.test(x))) {
    const src = readText(f);
    assert.doesNotMatch(src, /(src|href)="\/(?!\/)/, `${f} has an absolute path`);
    assert.doesNotMatch(src, /(fetch|import)\(['"`]\//, `${f} has an absolute path`);
    assert.doesNotMatch(src, /url\(["']?\//, `${f} has an absolute path`);
  }
});

test('the site sends no requests to other sites, except the Tailwind script', () => {
  for (const f of siteFiles().filter((x) => /\.(html|css|js|webmanifest)$/.test(x))) {
    const urls = readText(f).match(/https?:\/\/[^\s'"`)]+/g) || [];
    const other = urls.filter((u) => u !== TAILWIND_URL && !u.startsWith('http://www.w3.org/'));
    assert.deepEqual(other, [], f);
  }
});

test('the web app manifest and its icons exist', () => {
  const m = readJson('manifest.webmanifest');
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.equal(m.display, 'standalone');
  for (const icon of m.icons) assert.ok(existsSync(join(ROOT, icon.src)), icon.src);
  assert.ok(m.icons.some((i) => i.sizes === '512x512' && i.type === 'image/png'));
  assert.ok(m.icons.some((i) => i.sizes === '192x192'));
});

test('the workflow runs the tests before the deploy', () => {
  const wf = readText('.github/workflows/pages.yml');
  assert.match(wf, /npm test/);
  assert.match(wf, /needs: test/);
  assert.match(wf, /actions\/upload-pages-artifact@/);
  assert.match(wf, /actions\/deploy-pages@/);
  assert.match(wf, /node tools\/copy-site\.js _site/);
});

test('the list of recorded audio files is valid', () => {
  for (const lang of ['vi', 'en']) {
    const list = readJson(`audio/${lang}/index.json`);
    assert.ok(Array.isArray(list));
    for (const file of list) assert.ok(existsSync(join(ROOT, 'audio', lang, file)), `audio/${lang}/${file}`);
  }
});

test('package.json has only the module type and the test script', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.scripts.test, 'node --test');
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
});
