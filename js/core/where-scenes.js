// Original SVG pictures for the game "Sỏi trốn đâu?". Each thing has a back part and a front part,
// so that Sỏi can be between them (in or behind the thing). The picture is 220 x 160.

import { mascotMarkup } from './mascot.js';

const INK = '#3b2a2a';
const st = `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;

const PARTS = {
  box: {
    back: `<path d="M64 70 L136 70 L140 80 L60 80 Z" fill="#b5835a" ${st}/>`,
    front: `<rect x="60" y="80" width="80" height="60" rx="4" fill="#d9a86a" ${st}/>
      <path d="M60 80 L44 64 M140 80 L156 64" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M44 64 L60 80 L60 90 Z M156 64 L140 80 L140 90 Z" fill="#e8c38f" ${st}/>`,
  },
  table: {
    back: '',
    front: `<rect x="50" y="80" width="8" height="60" fill="#9c6b43" ${st}/><rect x="142" y="80" width="8" height="60" fill="#9c6b43" ${st}/>
      <rect x="36" y="68" width="128" height="12" rx="4" fill="#c28b5c" ${st}/>`,
  },
  basket: {
    back: `<path d="M70 92 Q100 30 130 92" fill="none" stroke="#9c6b43" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="100" cy="92" rx="36" ry="8" fill="#9c6b43" ${st}/>`,
    front: `<path d="M64 92 H136 L126 140 H74 Z" fill="#e8c38f" ${st}/>
      <path d="M68 108 H132 M72 124 H128" stroke="#c9a262" stroke-width="3"/>`,
  },
  tree: {
    back: `<rect x="90" y="80" width="20" height="60" rx="4" fill="#9c6b43" ${st}/>`,
    front: `<circle cx="100" cy="58" r="42" fill="#7cb87a" ${st}/><circle cx="72" cy="72" r="20" fill="#9fcf7a" ${st}/><circle cx="128" cy="72" r="20" fill="#9fcf7a" ${st}/>`,
  },
};

// Where Sỏi is: center x, bottom y, size, and if Sỏi is between the back and the front.
const POSES = {
  box: { tren: [100, 82, 1, 'top'], trong: [100, 106, 1, 'mid'], sau: [138, 86, 0.9, 'under'], truoc: [74, 158, 0.95, 'top'], canh: [184, 140, 0.9, 'top'] },
  table: { tren: [100, 70, 0.9, 'top'], duoi: [100, 140, 0.85, 'top'], canh: [190, 140, 0.85, 'top'] },
  basket: { trong: [100, 122, 0.95, 'mid'], sau: [128, 98, 0.9, 'under'], canh: [184, 140, 0.9, 'top'] },
  tree: { tren: [104, 50, 0.7, 'top'], sau: [100, 140, 0.85, 'under'], canh: [184, 140, 0.9, 'top'] },
};

function soi(x, bottom, size, expression) {
  const w = 60 * size;
  const h = 55 * size;
  // Use the content of the picture of Sỏi in a group, not a second <svg> element.
  const markup = mascotMarkup(expression);
  const inner = markup.slice(markup.indexOf('>') + 1, markup.lastIndexOf('</svg>'));
  return `<g class="where-soi" transform="translate(${x - w / 2} ${bottom - h}) scale(${w / 122})">${inner}</g>`;
}

/**
 * The SVG content of a scene: a thing and, if pos is given, Sỏi at the position.
 * The ground and a shadow are under the thing.
 */
export function sceneMarkup(object, pos = null, expression = 'happy') {
  const p = PARTS[object];
  const pose = pos ? POSES[object][pos] : null;
  const s = pose ? soi(pose[0], pose[1], pose[2], expression) : '';
  const ground = '<ellipse cx="110" cy="142" rx="100" ry="8" fill="#e8d3a3" opacity="0.6"/>';
  if (!pose) return ground + p.back + p.front;
  if (pose[3] === 'under') return ground + s + p.back + p.front;
  if (pose[3] === 'mid') return ground + p.back + s + p.front;
  return ground + p.back + p.front + s;
}

export function hasPose(object, pos) {
  return Boolean(POSES[object]?.[pos]);
}
