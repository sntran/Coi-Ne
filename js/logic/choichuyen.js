// Rules of Chơi chuyền. These functions do not use the DOM.
// The child throws the ball up. While the ball is in the air, the child picks up sticks.
// The ball waits until the child picks the sticks for this throw. There is no time limit.
// Level 1: 1 stick for each throw. Level 2: 2 sticks. Level 3: 3 sticks.

export const STICKS = 10;

export function createRound(level) {
  const perThrow = Math.min(3, Math.max(1, level));
  return { perThrow, remaining: STICKS, picked: 0, inAir: false, throwPicked: 0, throws: 0 };
}

/** How many sticks the child must pick in this throw. */
export function needed(state) {
  return Math.min(state.perThrow, state.remaining + state.throwPicked) - state.throwPicked;
}

export function throwBall(state) {
  if (state.inAir || state.remaining === 0) return state;
  return { ...state, inAir: true, throwPicked: 0, throws: state.throws + 1 };
}

/**
 * Pick one stick while the ball is in the air.
 * @returns {{state: object, catchNow: boolean, done: boolean}}
 */
export function pickStick(state) {
  if (!state.inAir || state.remaining === 0 || needed(state) <= 0) {
    return { state, catchNow: false, done: state.remaining === 0, ignored: true };
  }
  const next = {
    ...state,
    remaining: state.remaining - 1,
    picked: state.picked + 1,
    throwPicked: state.throwPicked + 1,
  };
  const catchNow = needed(next) <= 0;
  if (catchNow) next.inAir = false;
  return { state: next, catchNow, done: next.remaining === 0, ignored: false };
}

/** Places for the sticks in a loose grid, with a small random turn for each stick. */
export function stickLayout(rand = Math.random, count = STICKS, cols = 5) {
  const rows = Math.ceil(count / cols);
  const out = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out.push({
      col: c,
      row: r,
      x: (c + 0.5) / cols + (rand() - 0.5) * 0.06,
      y: (r + 0.5) / rows + (rand() - 0.5) * 0.12,
      angle: Math.round((rand() - 0.5) * 70),
    });
  }
  return out;
}
