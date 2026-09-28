// Small SVG icons for buttons. The icons have no text.

const INK = '#3b2a2a';
const s = (body, vb = '0 0 64 64') =>
  `<svg viewBox="${vb}" aria-hidden="true" focusable="false" class="icon">${body}</svg>`;

export const icons = {
  home: s(`<path d="M10 30 L32 11 L54 30" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 28 V52 H48 V28" fill="#ffd166" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M27 52 V39 H37 V52" fill="#e0463c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`),
  speaker: s(`<path d="M10 25 H20 L33 13 V51 L20 39 H10 Z" fill="#8fd3f4" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M41 24 Q47 32 41 40 M47 17 Q58 32 47 47" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`),
  gear: s(`<g transform="translate(32 32)"><g fill="#c9d3df" stroke="${INK}" stroke-width="3">
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-5" y="-26" width="10" height="12" rx="3" transform="rotate(${a})"/>`).join('')}
    <circle r="17"/></g><circle r="7" fill="#fff8ec" stroke="${INK}" stroke-width="3"/></g>`),
  play: s(`<path d="M22 14 L50 32 L22 50 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>`),
  check: s(`<path d="M14 34 L27 47 L51 18" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`),
  cross: s(`<path d="M19 19 L45 45 M45 19 L19 45" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`),
  undo: s(`<path d="M24 14 L12 26 L24 38" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13 26 H38 C47 26 53 32 53 40 C53 48 47 53 38 53 H26" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`),
  clear: s(`<path d="M16 20 H48 L44 54 H20 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M12 20 H52 M26 20 V13 H38 V20 M27 29 V46 M37 29 V46" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`),
  save: s(`<path d="M32 52 C14 40 8 31 8 23 C8 15 14 10 21 10 C26 10 30 13 32 17 C34 13 38 10 43 10 C50 10 56 15 56 23 C56 31 50 40 32 52Z" fill="#f7a8c4" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`),
  eraser: s(`<g transform="rotate(-35 32 32)"><rect x="12" y="22" width="40" height="22" rx="5" fill="#f7a8c4" stroke="${INK}" stroke-width="4"/>
    <path d="M28 22 V44" stroke="${INK}" stroke-width="4"/><rect x="12" y="22" width="16" height="22" rx="5" fill="#fff" stroke="${INK}" stroke-width="4"/></g>`),
  listen: s(`<path d="M22 14 L50 32 L22 50 Z" fill="#7cb87a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`),
  record: s(`<circle cx="32" cy="32" r="18" fill="#e0463c" stroke="${INK}" stroke-width="4"/>`),
  stop: s(`<rect x="16" y="16" width="32" height="32" rx="5" fill="#e0463c" stroke="${INK}" stroke-width="4"/>`),
  mic: s(`<rect x="24" y="8" width="16" height="30" rx="8" fill="#f7a8c4" stroke="${INK}" stroke-width="4"/>
    <path d="M16 30 Q16 46 32 46 Q48 46 48 30 M32 46 V56 M22 56 H42" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`),
  gallery: s(`<rect x="8" y="14" width="34" height="30" rx="4" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <rect x="22" y="22" width="34" height="30" rx="4" fill="#ffd166" stroke="${INK}" stroke-width="4"/>
    <circle cx="33" cy="32" r="4" fill="#e0463c"/><path d="M26 48 L36 39 L42 44 L47 38 L53 48Z" fill="#7cb87a"/>`),
  pictures: s(`<rect x="10" y="10" width="44" height="44" rx="6" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <circle cx="24" cy="24" r="6" fill="#ffd166" stroke="${INK}" stroke-width="3"/>
    <path d="M14 50 L28 34 L38 44 L44 38 L52 50" fill="#7cb87a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`),
  left: s(`<path d="M40 12 L20 32 L40 52" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`),
  right: s(`<path d="M24 12 L44 32 L24 52" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`),
  star: s(`<path d="M32 6 L39.6 22.6 L57.7 24.6 L44.2 36.8 L47.9 54.6 L32 45.6 L16.1 54.6 L19.8 36.8 L6.3 24.6 L24.4 22.6 Z" fill="#ffd166" stroke="#c98a12" stroke-width="3" stroke-linejoin="round"/>`),
  again: s(`<path d="M48 22 A20 20 0 1 0 52 36" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M50 10 V24 H36" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`),
  next: s(`<path d="M14 32 H48 M36 18 L50 32 L36 46" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
  close: s(`<path d="M19 19 L45 45 M45 19 L19 45" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`),
  turn: s(`<path d="M48 26 A18 18 0 1 0 50 38" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M52 14 L49 27 L37 23" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`),
};
