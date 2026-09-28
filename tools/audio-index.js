// Write the lists of recorded audio files: audio/vi/index.json and audio/en/index.json.
// Run this after you add or remove a recorded file: node tools/audio-index.js

import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site.js';

const AUDIO = /\.(mp3|m4a|aac|ogg|oga|wav|webm)$/i;

for (const lang of ['vi', 'en']) {
  const dir = join(ROOT, 'audio', lang);
  const files = readdirSync(dir).filter((f) => AUDIO.test(f)).sort();
  writeFileSync(join(dir, 'index.json'), `${JSON.stringify(files, null, 2)}\n`);
  console.log(`audio/${lang}: ${files.length} files`);
}
