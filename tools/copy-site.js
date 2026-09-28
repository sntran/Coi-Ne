// Copy the files of the site into a folder, for GitHub Pages.
// Usage: node tools/copy-site.js _site

import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT, siteFiles } from './site.js';

const target = process.argv[2];
if (!target) {
  console.error('Give the name of the target folder.');
  process.exit(1);
}
const files = siteFiles();
for (const f of files) {
  const to = join(target, f);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(join(ROOT, f), to);
}
console.log(`Copied ${files.length} files to ${target}`);
