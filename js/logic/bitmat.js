// Rules of Bịt mắt bắt dê. These functions do not use the DOM.
// Sỏi covers the eyes of the child, and a goat hides. The child moves a finger on the dark screen.
// Near the goat, the goat bleats louder and more often. A finger on the goat catches it.
// The places are in the box from 0 to 1. Level 1: a large goat. Level 2: a small goat, and two goats.

export function makeRound(level, rand = Math.random) {
  const count = level >= 2 ? 2 : 1;
  const goats = [];
  while (goats.length < count) {
    const g = { x: 0.15 + rand() * 0.7, y: 0.15 + rand() * 0.7 };
    if (goats.every((o) => Math.hypot(o.x - g.x, o.y - g.y) > 0.4)) goats.push(g);
  }
  return { level, radius: level >= 2 ? 0.1 : 0.15, goats, caught: [] };
}

/** How near the finger is to the goat: 1 on the goat, 0 far away. */
export function nearness(finger, goat) {
  const d = Math.hypot(finger.x - goat.x, finger.y - goat.y);
  return Math.max(0, 1 - d / 0.9);
}

/** The time in milliseconds between two bleats. */
export function bleatGap(near) {
  return Math.round(1600 - near * 1250);
}

/** The loudness of the bleat, from 0.15 to 1. */
export function bleatGain(near) {
  return 0.15 + near * near * 0.85;
}

/** Left (-1) to right (1): where the goat is from the finger. */
export function bleatPan(finger, goat) {
  return Math.max(-1, Math.min(1, (goat.x - finger.x) * 2.5));
}

/** The goat that is not caught and is nearest to the finger. */
export function nearestGoat(round, finger) {
  let best = -1;
  let bestD = Infinity;
  round.goats.forEach((g, i) => {
    if (round.caught.includes(i)) return;
    const d = Math.hypot(finger.x - g.x, finger.y - g.y);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

export function isOnGoat(round, finger, i) {
  const g = round.goats[i];
  return Boolean(g) && Math.hypot(finger.x - g.x, finger.y - g.y) <= round.radius;
}

export function catchGoat(round, i) {
  if (round.caught.includes(i)) return { round, done: round.caught.length === round.goats.length };
  const next = { ...round, caught: [...round.caught, i] };
  return { round: next, done: next.caught.length === next.goats.length };
}

