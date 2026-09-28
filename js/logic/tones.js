// The tones game (Thanh điệu). These functions do not use the DOM.
// Vietnamese has 6 tones: ngang, sắc, huyền, hỏi, ngã, and nặng.
// In the South, people say hỏi and ngã the same way. The game never asks the child to hear
// the difference between hỏi and ngã.
// Level 1: listen to the 6 tones of a syllable.
// Level 2: hear a word and choose its picture. The two pictures differ only in the tone.
// Level 3: hear a syllable and choose its tone.

import { pick, shuffle } from './random.js';

export const TONES = ['ngang', 'sac', 'huyen', 'hoi', 'nga', 'nang'];

// The syllables of each family. The texts are in the language files: tones.w.<family>.<tone>.
// A picture shows the meaning of some syllables.
export const FAMILIES = [
  { id: 'ma', pics: { sac: 'mom', nang: 'seedling' } },
  { id: 'ba', pics: { ngang: 'dad', huyen: 'grandma' } },
  { id: 'ca', pics: { sac: 'goldfish', huyen: 'eggplant' } },
];

// Pairs of words that differ only in the tone. Each word has a picture.
export const PAIRS = [
  [{ key: 'tones.w.ca.sac', pic: 'goldfish', tone: 'sac' }, { key: 'tones.w.ca.huyen', pic: 'eggplant', tone: 'huyen' }],
  [{ key: 'tones.w.ba.ngang', pic: 'dad', tone: 'ngang' }, { key: 'tones.w.ba.huyen', pic: 'grandma', tone: 'huyen' }],
  [{ key: 'tones.w.ma.sac', pic: 'mom', tone: 'sac' }, { key: 'tones.w.ma.nang', pic: 'seedling', tone: 'nang' }],
  [{ key: 'tones.w.dua.ngang', pic: 'watermelon', tone: 'ngang' }, { key: 'tones.w.dua.huyen', pic: 'coconut', tone: 'huyen' }],
  [{ key: 'tones.w.keo.nang', pic: 'candy', tone: 'nang' }, { key: 'tones.w.keo.sac', pic: 'scissors2', tone: 'sac' }],
];

export function wordKey(family, tone) {
  return `tones.w.${family}.${tone}`;
}

/** Two tones that the child can tell apart. In the South, hỏi and ngã sound the same. */
export function distinct(a, b) {
  if (a === b) return false;
  const merged = ['hoi', 'nga'];
  return !(merged.includes(a) && merged.includes(b));
}

export function makeQuestion(level, rand = Math.random) {
  if (level <= 1) return { level: 1, family: pick(rand, FAMILIES) };
  if (level === 2) {
    const pair = pick(rand, PAIRS);
    const answer = pick(rand, pair);
    return { level: 2, answer, choices: shuffle(rand, pair) };
  }
  const family = pick(rand, FAMILIES);
  const answer = pick(rand, TONES);
  const others = [];
  for (const t of shuffle(rand, TONES)) {
    if (others.length === 2) break;
    if (distinct(t, answer) && others.every((o) => distinct(o, t))) others.push(t);
  }
  return { level: 3, family, answer, choices: shuffle(rand, [answer, ...others]) };
}

export function checkTone(question, choice) {
  if (question.level === 2) return choice.key === question.answer.key;
  return choice === question.answer;
}
