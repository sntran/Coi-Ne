// Rest time. After some minutes of play, Sỏi gets sleepy and asks for a rest.
// Only the time when the app is on the screen counts. After a long break, the count starts again.
// These functions do not use the DOM.

export const REST_OPTIONS = [0, 15, 20, 30];
export const DEFAULT_REST = 20;
export const RESET_AFTER_MS = 15 * 60 * 1000;
const MAX_STEP_MS = 5000;

export function createRestClock() {
  return { active: 0, lastTick: null, hiddenSince: null, resting: false };
}

export function normalizeRest(value) {
  const n = Number(value);
  return REST_OPTIONS.includes(n) ? n : DEFAULT_REST;
}

/**
 * Move the clock forward.
 * @param {object} state
 * @param {{now: number, visible: boolean, minutes: number}} input minutes = 0 turns rest time off
 * @returns {{state: object, due: boolean}} due is true one time, when the rest starts
 */
export function tick(state, { now, visible, minutes }) {
  if (!minutes || state.resting) return { state, due: false };
  const s = { ...state };
  if (!visible) {
    if (s.hiddenSince == null) s.hiddenSince = now;
    s.lastTick = null;
    return { state: s, due: false };
  }
  if (s.hiddenSince != null && now - s.hiddenSince >= RESET_AFTER_MS) s.active = 0;
  s.hiddenSince = null;
  // A long step means that the device was asleep. Count only a short time for it.
  if (s.lastTick != null) s.active += Math.min(Math.max(0, now - s.lastTick), MAX_STEP_MS);
  s.lastTick = now;
  if (s.active >= minutes * 60 * 1000) {
    s.resting = true;
    return { state: s, due: true };
  }
  return { state: s, due: false };
}

/** A parent lets the child play again. The count starts again. */
export function resume(state, now) {
  return { ...state, active: 0, resting: false, lastTick: now, hiddenSince: null };
}
