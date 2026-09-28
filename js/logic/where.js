// Rules of the game "Sỏi trốn đâu?" (Where is Sỏi hiding?). These functions do not use the DOM.
// The game teaches the words trên (on), dưới (under), trong (in), sau (behind),
// trước (in front of), and cạnh (next to).
// Level 1: find Sỏi. Then the voice says where Sỏi is.
// Level 2: hear where Sỏi is and choose the picture.
// Level 3: drag Sỏi to the place that the voice says.

import { pick, sample, shuffle } from './random.js';

export const POSITIONS = ['tren', 'duoi', 'trong', 'sau', 'truoc', 'canh'];

// The positions that each thing can show well in a flat picture.
export const OBJECTS = {
  box: ['tren', 'trong', 'sau', 'truoc', 'canh'],
  table: ['tren', 'duoi', 'canh'],
  basket: ['trong', 'sau', 'canh'],
  tree: ['tren', 'sau', 'canh'],
};

// The positions for dragging, and the areas that give them. The picture is 220 x 160.
export const DROP_ZONES = {
  box: [
    { pos: 'trong', x: [60, 140], y: [80, 150] },
    { pos: 'tren', x: [45, 155], y: [0, 80] },
    { pos: 'canh', x: [145, 220], y: [70, 160] },
    { pos: 'canh', x: [-20, 55], y: [70, 160] },
  ],
  table: [
    { pos: 'tren', x: [35, 165], y: [0, 70] },
    { pos: 'duoi', x: [58, 142], y: [80, 160] },
    { pos: 'canh', x: [160, 220], y: [60, 160] },
    { pos: 'canh', x: [-20, 45], y: [60, 160] },
  ],
  basket: [
    { pos: 'trong', x: [60, 140], y: [50, 150] },
    { pos: 'canh', x: [145, 220], y: [60, 160] },
    { pos: 'canh', x: [-20, 55], y: [60, 160] },
  ],
};

/** The position for a drop point, or null. */
export function zoneAt(object, x, y) {
  const zone = (DROP_ZONES[object] || []).find((z) => x >= z.x[0] && x <= z.x[1] && y >= z.y[0] && y <= z.y[1]);
  return zone ? zone.pos : null;
}

export function makeRound(level, rand = Math.random) {
  if (level <= 1) {
    const objects = sample(rand, Object.keys(OBJECTS), 3);
    const hidden = Math.floor(rand() * 3);
    const object = objects[hidden];
    return { level: 1, objects, hidden, object, pos: pick(rand, OBJECTS[object]) };
  }
  if (level === 2) {
    const object = pick(rand, Object.keys(OBJECTS));
    const choices = sample(rand, OBJECTS[object], 3);
    return { level: 2, object, pos: pick(rand, choices), choices: shuffle(rand, choices) };
  }
  const object = pick(rand, Object.keys(DROP_ZONES));
  const options = [...new Set(DROP_ZONES[object].map((z) => z.pos))];
  return { level: 3, object, pos: pick(rand, options) };
}
