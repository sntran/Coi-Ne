// Rules of the Coloring game. These functions do not use the DOM.

import { WHITE } from './colors.js';

/** Make a new coloring state. fills maps the index of a tap area to a color. */
export function createColoring(fills = {}) {
  return { fills: { ...fills }, history: [] };
}

/** Fill one area. White removes the color. */
export function fillArea(state, area, color) {
  const key = String(area);
  const prev = state.fills[key] ?? null;
  const next = color === WHITE ? null : color;
  if (prev === next) return state;
  const fills = { ...state.fills };
  if (next == null) delete fills[key];
  else fills[key] = next;
  return { fills, history: [...state.history, { type: 'fill', area: key, prev }] };
}

/** Remove all colors. Undo can bring them back. */
export function clearAll(state) {
  if (!Object.keys(state.fills).length) return state;
  return { fills: {}, history: [...state.history, { type: 'clear', prev: { ...state.fills } }] };
}

export function canUndo(state) {
  return state.history.length > 0;
}

/** Take back the last change. */
export function undo(state) {
  if (!state.history.length) return state;
  const history = state.history.slice(0, -1);
  const last = state.history[state.history.length - 1];
  if (last.type === 'clear') return { fills: { ...last.prev }, history };
  const fills = { ...state.fills };
  if (last.prev == null) delete fills[last.area];
  else fills[last.area] = last.prev;
  return { fills, history };
}

/** True when each area has a color. */
export function isComplete(fills, areaCount) {
  if (!areaCount) return false;
  for (let i = 0; i < areaCount; i++) if (!fills[String(i)]) return false;
  return true;
}

/** Find a picture in the catalog (data/coloring.json). */
export function findPicture(catalog, id) {
  for (const group of catalog.groups) {
    const pic = group.pictures.find((p) => p.id === id);
    if (pic) return { ...pic, group: group.id };
  }
  return null;
}

export function findGroup(catalog, id) {
  return catalog.groups.find((g) => g.id === id) || null;
}

/** All pictures of the catalog in one list. */
export function allPictures(catalog) {
  return catalog.groups.flatMap((g) => g.pictures.map((p) => ({ ...p, group: g.id })));
}
