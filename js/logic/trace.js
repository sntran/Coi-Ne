// Rules of the tracing game (Tập viết). These functions do not use the DOM.
// Each stroke of a letter is a list of checkpoints. The finger moves the progress forward
// when it comes near the next checkpoints. The progress never goes back.

export const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Sample points along a path.
 * @param {number} length the length of the path
 * @param {(d: number) => {x: number, y: number}} pointAt
 */
export function samplePath(length, pointAt, step = 5) {
  const n = Math.max(2, Math.ceil(length / step) + 1);
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = pointAt((length * i) / (n - 1));
    out.push({ x: p.x, y: p.y });
  }
  return out;
}

/**
 * Move the progress forward if the point is near one of the next checkpoints.
 * @returns {number} the index of the next checkpoint to reach
 */
export function advance(index, point, checkpoints, radius = 14, lookahead = 5) {
  let next = index;
  const last = Math.min(checkpoints.length - 1, index + lookahead);
  for (let k = index; k <= last; k++) {
    const c = checkpoints[k];
    if (Math.hypot(c.x - point.x, c.y - point.y) <= radius) next = k + 1;
  }
  return next;
}

export function isDone(index, checkpoints) {
  return index >= checkpoints.length;
}

/** The glyphs to trace: the letters of the alphabet at level 1, the digits at level 2. */
export function glyphsFor(level, letters) {
  if (level >= 2) return DIGITS.map((d) => ({ glyph: d, digit: true }));
  return letters.map((l) => ({ glyph: l.glyph, letter: l }));
}
