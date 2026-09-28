// Write the list of files and the version into sw.js.
// Run this after you add or change a file: node tools/build-sw.js

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, cachedFiles, contentVersion } from './site.js';

const file = join(ROOT, 'sw.js');
const text = readFileSync(file, 'utf8');
const list = cachedFiles().map((f) => `  './${f}',`).join('\n');
const next = text
  .replace(/const VERSION = '[^']*';/, `const VERSION = '${contentVersion()}';`)
  .replace(/const FILES = \[[\s\S]*?\n\];/, `const FILES = [\n  './',\n${list}\n];`);
writeFileSync(file, next);
console.log(`sw.js: ${cachedFiles().length} files, version ${contentVersion()}`);
