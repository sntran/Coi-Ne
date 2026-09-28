// Data for the musical instruments game (Nhạc cụ). These functions do not use the DOM.

export const INSTRUMENTS = ['trung', 'trong', 'sao', 'bau'];

// The notes of each instrument, as indexes into SCALE in js/core/sound.js.
export const NOTES = {
  trung: [0, 1, 2, 3, 4, 5],
  sao: [5, 6, 7, 8, 9, 10],
};

export const BAU_BASE = 196;
export const BAU_MAX_BEND = 7;

/** The pitch ratio of the đàn bầu for a lever position from 0 (rest) to 1 (full bend). */
export function bendRatio(position) {
  const p = Math.min(1, Math.max(0, position));
  return 2 ** ((p * BAU_MAX_BEND) / 12);
}
