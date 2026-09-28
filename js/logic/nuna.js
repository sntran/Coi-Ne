// Rules of Nu na nu nống. These functions do not use the DOM.
// Children sit in a row with their legs out. Each word of the đồng dao touches the next leg that
// is still out. The leg at the last word folds in. The next song starts at the next leg.
// This is counting one to one: one word, one leg.
// Level 1: 2 children, one song. The next leg shines.
// Level 2: 3 children and two songs. The next leg shines only after a mistake.
// (In the real game, children sing until one leg is out. That is too many taps for a small child.)

/** The words of the đồng dao, without punctuation. */
export function songWords(lines) {
  return lines.join(' ').split(/\s+/).map((w) => w.replace(/[.,!?;:]/g, '')).filter(Boolean);
}

export function makeGame(level) {
  const kids = level >= 2 ? 3 : 2;
  return { level, kids, out: Array(kids * 2).fill(true), next: 0, word: 0 };
}

/** The first leg that is still out, at `from` or after it. The row goes around to the start. */
export function nextOut(out, from) {
  for (let k = 0; k < out.length; k++) {
    const i = (from + k) % out.length;
    if (out[i]) return i;
  }
  return -1;
}

/** The number of songs in one game. */
export function songsFor(level) {
  return level >= 2 ? 2 : 1;
}

export function legsOut(state) {
  return state.out.filter(Boolean).length;
}

/**
 * The child taps a leg.
 * @param {object} state
 * @param {number} leg the index of the leg
 * @param {number} total the number of words in the song
 * @returns {{state: object, event: 'wrong'|'word'|'fold', word?: number, done?: boolean}}
 *   word is the index of the word to sing. done is true when the game is over.
 */
export function tapLeg(state, leg, total) {
  if (leg !== state.next) return { state, event: 'wrong' };
  const word = state.word;
  if (word < total - 1) {
    return { state: { ...state, next: nextOut(state.out, leg + 1), word: word + 1 }, event: 'word', word };
  }
  const out = state.out.slice();
  out[leg] = false;
  const next = { ...state, out, next: nextOut(out, leg + 1), word: 0 };
  const done = next.out.length - legsOut(next) >= songsFor(state.level);
  return { state: next, event: 'fold', word, done };
}

/** The leg that folds at the end of a song that starts at leg `start`. */
export function foldingLeg(out, start, total) {
  let leg = nextOut(out, start);
  for (let w = 1; w < total; w++) leg = nextOut(out, leg + 1);
  return leg;
}
