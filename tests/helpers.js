// Helpers for the tests.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

export function readText(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

export function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(join(ROOT, d))) {
      const rel = `${d}/${name}`;
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
      else out.push(rel);
    }
  };
  walk(dir);
  return out;
}
