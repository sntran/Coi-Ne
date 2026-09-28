// Rules of Oẳn tù tì (rock, paper, scissors). These functions do not use the DOM.
// búa (rock) breaks kéo (scissors), kéo cuts bao (paper), and bao covers búa.

export const HANDS = ['bua', 'bao', 'keo'];

const BEATS = { bua: 'keo', keo: 'bao', bao: 'bua' };

/** The result for the first player: 'win', 'lose', or 'tie'. */
export function outcome(a, b) {
  if (!HANDS.includes(a) || !HANDS.includes(b)) throw new Error('Unknown hand.');
  if (a === b) return 'tie';
  return BEATS[a] === b ? 'win' : 'lose';
}

/** The winner of two hands, or null for a tie. */
export function winner(a, b) {
  const r = outcome(a, b);
  return r === 'tie' ? null : r === 'win' ? a : b;
}

/** The text key that tells why one hand wins, for example "búa breaks kéo". */
export function reasonKey(a, b) {
  const w = winner(a, b);
  if (!w) return 'oantuti.reason.tie';
  return `oantuti.reason.${w}`;
}

/** The hand of Sỏi. Sỏi chooses by chance. */
export function soiHand(rand = Math.random) {
  return HANDS[Math.floor(rand() * HANDS.length)];
}
