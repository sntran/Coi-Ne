// Colors for the games. The name of each color is in the language files: color.<id>.

export const PALETTE = Object.freeze([
  { id: 'red', hex: '#e84a3f' },
  { id: 'orange', hex: '#f7923a' },
  { id: 'yellow', hex: '#ffd23f' },
  { id: 'lightgreen', hex: '#a3d65c' },
  { id: 'green', hex: '#3fa35b' },
  { id: 'sky', hex: '#6cc6f0' },
  { id: 'blue', hex: '#3f6fd8' },
  { id: 'purple', hex: '#9b6bd6' },
  { id: 'pink', hex: '#f58fb8' },
  { id: 'brown', hex: '#9c6b43' },
  { id: 'gray', hex: '#9aa3ad' },
  { id: 'black', hex: '#3b3434' },
  { id: 'white', hex: '#ffffff' },
]);

export const WHITE = '#ffffff';

export function colorById(id) {
  return PALETTE.find((c) => c.id === id) || null;
}

export function colorByHex(hex) {
  return PALETTE.find((c) => c.hex === hex) || null;
}
