// The list of the files of the site. The deploy workflow, the service worker, and the tests use it.

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Files and folders that go to GitHub Pages. Tests, tools, and workflow files do not go.
export const SITE_ITEMS = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'credits.json',
  'css',
  'js',
  'lang',
  'data',
  'pictures',
  'icons',
  'audio',
];

// The Tailwind script is the only file from another site. The service worker keeps it in the cache.
export const TAILWIND_URL = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3/dist/index.global.js';

function walk(dir, out) {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
}

/** All the files of the site, as paths relative to the root, with "/" between the parts. */
export function siteFiles(root = ROOT) {
  const out = [];
  for (const item of SITE_ITEMS) {
    const full = join(root, item);
    let isDir;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) walk(full, out);
    else out.push(full);
  }
  return out.map((f) => relative(root, f).split(sep).join('/'));
}

/** The files that the service worker keeps. sw.js itself is not in the list. */
export function cachedFiles(root = ROOT) {
  return siteFiles(root).filter((f) => f !== 'sw.js');
}

/** A short hash of the content of all the cached files. It changes when a file changes. */
export function contentVersion(root = ROOT) {
  const hash = createHash('sha256');
  for (const f of cachedFiles(root)) {
    hash.update(f);
    hash.update(readFileSync(join(root, f)));
  }
  return hash.digest('hex').slice(0, 12);
}
