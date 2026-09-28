// Questions for the Letters game. These functions do not use the DOM.
// The letters are in data/letters.json. The texts are in the language files:
// abc.<lang>.<id>.sound (for example "bờ" for "b") and abc.<lang>.<id>.word.
// Level 1: tap a letter, hear its sound and a word, and see a picture.
// Level 2: see a picture and choose its first letter.
// Level 3: find the letter that the voice says.

import { pick, sample, shuffle } from './random.js';

export function soundKey(lang, letter) {
  return `abc.${lang}.${letter.id}.sound`;
}

export function wordKey(lang, letter) {
  return `abc.${lang}.${letter.id}.word`;
}

/** Letters that can be in a level 2 question: the word starts with the letter and the picture is clear. */
export function firstLetterSet(letters) {
  return letters.filter((l) => l.first && l.clear !== false);
}

export function makeQuestion(level, letters, rand = Math.random) {
  if (level <= 1) return { level: 1, letters };
  if (level === 2) {
    const set = firstLetterSet(letters);
    const answer = pick(rand, set);
    const others = sample(rand, letters.filter((l) => (l.base || l.id) !== (answer.base || answer.id)), 2);
    return { level, answer, choices: shuffle(rand, [answer, ...others]) };
  }
  const answer = pick(rand, letters);
  const others = sample(rand, letters.filter((l) => l.id !== answer.id), 3);
  return { level: 3, answer, choices: shuffle(rand, [answer, ...others]) };
}

export function checkLetter(question, letter) {
  return question.answer.id === letter.id;
}
