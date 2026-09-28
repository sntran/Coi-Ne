// Rules of the Feelings game (Cảm xúc). These functions do not use the DOM.
// Level 1: meet the six feelings of Sỏi.
// Level 2: hear a short story and choose how Sỏi feels.
// Level 3: breathe slowly with Sỏi, to feel calm.

import { pick, sample, shuffle } from './random.js';

export const FEELINGS = ['vui', 'buon', 'gian', 'so', 'ngacnhien', 'buonngu'];

// The face of Sỏi for each feeling.
export const FACES = { vui: 'happy', buon: 'sad', gian: 'angry', so: 'scared', ngacnhien: 'surprised', buonngu: 'sleepy' };

// Short stories. The texts are in the language files: feel.story.<id>.
export const STORIES = [
  { id: 'icecream', pic: 'icecream', feeling: 'buon' },
  { id: 'balloon', pic: 'balloon', feeling: 'buon' },
  { id: 'gift', pic: 'gift', feeling: 'vui' },
  { id: 'cake', pic: 'cake', feeling: 'vui' },
  { id: 'thunder', pic: 'thunder', feeling: 'so' },
  { id: 'dog', pic: 'dog', feeling: 'so' },
  { id: 'teddy', pic: 'teddy', feeling: 'gian' },
  { id: 'butterfly', pic: 'butterfly', feeling: 'ngacnhien' },
  { id: 'night', pic: 'moon', feeling: 'buonngu' },
];

export const BREATHS = 3;

export function makeQuestion(level, rand = Math.random) {
  if (level <= 1) return { level: 1 };
  if (level >= 3) return { level: 3, breaths: BREATHS };
  const story = pick(rand, STORIES);
  const others = sample(rand, FEELINGS.filter((f) => f !== story.feeling), 2);
  return { level: 2, story, choices: shuffle(rand, [story.feeling, ...others]) };
}

export function checkFeeling(question, feeling) {
  return question.story.feeling === feeling;
}
