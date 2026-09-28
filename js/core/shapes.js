// SVG pictures of simple shapes: circle, square, triangle, rectangle, star, and heart.

import { colorById } from '../logic/colors.js';

const INK = '#3b2a2a';
const SCALE = { small: 0.5, medium: 0.74, big: 1 };

export function shapePath(shape) {
  switch (shape) {
    case 'circle': return '<circle cx="50" cy="50" r="42"/>';
    case 'square': return '<rect x="10" y="10" width="80" height="80" rx="8"/>';
    case 'triangle': return '<path d="M50 8 L94 88 H6 Z"/>';
    case 'rectangle': return '<rect x="6" y="26" width="88" height="48" rx="8"/>';
    case 'star': return '<path d="M50 6 L61.8 36.2 L94 38.2 L69 58.8 L77.2 90 L50 72.6 L22.8 90 L31 58.8 L6 38.2 L38.2 36.2 Z"/>';
    case 'heart': return '<path d="M50 88 C18 66 6 50 6 32 C6 18 17 8 30 8 C39 8 46 13 50 21 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 50 82 66 50 88 Z"/>';
    case 'blob': return '<path d="M50 8 C60 8 62 20 70 18 C80 14 90 24 84 34 C80 42 92 46 90 56 C88 66 76 64 74 74 C72 86 58 92 50 84 C42 92 28 86 28 76 C28 66 12 68 10 56 C8 46 20 42 16 34 C10 24 20 14 30 18 C38 20 40 8 50 8 Z"/>';
    default: return '<circle cx="50" cy="50" r="42"/>';
  }
}

/** An SVG string for a shape item: { shape, color, size }. */
export function shapeSvg({ shape = 'circle', color = 'red', size = 'big' } = {}) {
  const hex = color === 'none' ? '#d9e0e8' : colorById(color)?.hex || color;
  const k = SCALE[size] ?? 1;
  const t = 50 - 50 * k;
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <g transform="translate(${t} ${t}) scale(${k})" fill="${hex}" stroke="${INK}" stroke-width="${5 / k}" stroke-linejoin="round">${shapePath(shape)}</g></svg>`;
}
