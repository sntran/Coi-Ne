// Pictures for the game buttons on the home screen. The pictures have no text.

const INK = '#3b2a2a';
const w = (body) => `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">${body}</svg>`;
const st = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

const pebble = (x, y, r = 6, c = '#aab8cc') => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="${c}" stroke="${INK}" stroke-width="2"/>`;

export const gameIcons = {
  coloring: w(`
    <path d="M20 70 C18 40 44 22 70 26 C96 30 104 52 96 64 C90 74 76 66 70 76 C64 88 80 96 66 100 C44 106 22 94 20 70Z" fill="#fff8ec" ${st}/>
    <circle cx="42" cy="48" r="8" fill="#e0463c" ${st}/><circle cx="64" cy="42" r="8" fill="#ffd166" ${st}/>
    <circle cx="84" cy="52" r="8" fill="#7cb87a" ${st}/><circle cx="40" cy="74" r="8" fill="#8fd3f4" ${st}/>
    <path d="M78 102 L104 30 L114 34 L90 106 Z" fill="#f7a8c4" ${st}/><path d="M104 30 L108 16 L114 34" fill="#fff" ${st}/>`),
  numbers: w(`
    <rect x="12" y="20" width="96" height="80" rx="16" fill="#fff8ec" ${st}/>
    ${pebble(34, 42, 9, '#e0463c')}${pebble(60, 42, 9, '#ffd166')}${pebble(86, 42, 9, '#7cb87a')}
    ${pebble(47, 72, 9, '#8fd3f4')}${pebble(73, 72, 9, '#f7a8c4')}`),
  patterns: w(`
    <circle cx="20" cy="60" r="12" fill="#e0463c" ${st}/><circle cx="48" cy="60" r="12" fill="#8fd3f4" ${st}/>
    <circle cx="76" cy="60" r="12" fill="#e0463c" ${st}/>
    <circle cx="104" cy="60" r="12" fill="#fff" stroke="${INK}" stroke-width="4" stroke-dasharray="6 6"/>`),
  shapes: w(`
    <path d="M22 58 L60 22 L98 58 Z" fill="#e0463c" ${st}/><rect x="30" y="58" width="60" height="44" fill="#ffd166" ${st}/>
    <rect x="52" y="74" width="16" height="28" fill="#8fd3f4" ${st}/><circle cx="96" cy="26" r="12" fill="#f7a8c4" ${st}/>`),
  sorting: w(`
    <path d="M10 70 H52 L48 106 H14 Z" fill="#e0463c" ${st}/><path d="M68 70 H110 L106 106 H72 Z" fill="#8fd3f4" ${st}/>
    <circle cx="31" cy="54" r="11" fill="#e0463c" ${st}/><rect x="78" y="42" width="22" height="22" fill="#8fd3f4" ${st}/>
    <path d="M52 34 L60 18 L68 34 Z" fill="#ffd166" ${st}/>`),
  letters: w(`
    <rect x="12" y="44" width="46" height="46" rx="8" fill="#e0463c" ${st}/><rect x="62" y="30" width="46" height="46" rx="8" fill="#7cb87a" ${st}/>
    <path d="M24 80 L35 54 L46 80 M28 71 H42" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M76 38 Q85 46 94 38" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <path d="M73 68 L85 44 L97 68 M77 60 H93" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
  memory: w(`
    <rect x="14" y="22" width="42" height="60" rx="8" fill="#f7a8c4" ${st} transform="rotate(-8 35 52)"/>
    <rect x="62" y="34" width="42" height="60" rx="8" fill="#fff8ec" ${st} transform="rotate(8 83 64)"/>
    <path d="M83 52 L88 62 L99 63 L91 70 L93 81 L83 76 L73 81 L75 70 L67 63 L78 62 Z" fill="#ffd166" stroke="${INK}" stroke-width="3" stroke-linejoin="round" transform="rotate(8 83 64)"/>
    <circle cx="35" cy="52" r="8" fill="#fff" stroke="${INK}" stroke-width="3" transform="rotate(-8 35 52)"/>`),
  oanquan: w(`
    <path d="M26 36 H94 V84 H26 Z M26 36 A24 24 0 0 0 26 84 M94 36 A24 24 0 0 1 94 84 M26 60 H94 M49 36 V84 M71 36 V84" fill="#e8c38f" ${st}/>
    <path d="M26 36 A24 24 0 0 0 26 84 Z" fill="#d9a86a" ${st}/><path d="M94 36 A24 24 0 0 1 94 84 Z" fill="#d9a86a" ${st}/>
    ${pebble(16, 60, 7, '#7d8ca3')}${pebble(104, 60, 7, '#7d8ca3')}
    ${pebble(37, 47, 4)}${pebble(60, 47, 4)}${pebble(82, 47, 4)}${pebble(37, 73, 4)}${pebble(60, 73, 4)}${pebble(82, 73, 4)}`),
  taptamvong: w(`
    <path d="M14 64 C14 44 26 36 40 36 C56 36 62 48 62 62 C62 80 50 88 38 88 C24 88 14 80 14 64Z" fill="#f2c7a5" ${st}/>
    <path d="M58 64 C58 44 70 36 84 36 C100 36 106 48 106 62 C106 80 94 88 82 88 C68 88 58 80 58 64Z" fill="#f2c7a5" ${st}/>
    <path d="M26 50 q7 -5 14 0 M70 50 q7 -5 14 0" fill="none" ${st}/>
    <path d="M60 14 l5 10 l11 1 l-8 8 l2 11 l-10 -6 l-10 6 l2 -11 l-8 -8 l11 -1z" fill="#ffd166" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`),
  oantuti: w(`
    <ellipse cx="30" cy="84" rx="22" ry="16" fill="#aab8cc" ${st}/>
    <path d="M18 80 q6 -6 12 -2" fill="none" stroke="#dfe6f0" stroke-width="4" stroke-linecap="round"/>
    <path d="M62 60 L104 52 L108 92 L66 100 Z" fill="#fff8ec" ${st}/>
    <path d="M72 70 L98 65 M74 80 L100 75 M76 90 L94 86" fill="none" stroke="#c9b9a6" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 14 L66 44 M70 14 L44 44" fill="none" stroke="#9aa6b4" stroke-width="7" stroke-linecap="round"/>
    <circle cx="36" cy="50" r="9" fill="#fff" stroke="#e0463c" stroke-width="6"/>
    <circle cx="74" cy="50" r="9" fill="#fff" stroke="#e0463c" stroke-width="6"/>`),
  tones: w(`
    <path d="M14 70 H40" stroke="#7cb87a" stroke-width="10" stroke-linecap="round"/>
    <path d="M50 84 L76 40" stroke="#e0463c" stroke-width="10" stroke-linecap="round"/>
    <path d="M84 40 L106 76" stroke="#3f6fd8" stroke-width="10" stroke-linecap="round"/>
    <circle cx="60" cy="100" r="8" fill="#9c6b43"/>
    <path d="M40 40 Q52 18 66 28 Q74 36 62 42" fill="none" stroke="#9b6bd6" stroke-width="8" stroke-linecap="round"/>`),
  choichuyen: w(`
    <circle cx="60" cy="26" r="14" fill="#e0463c" ${st}/><path d="M52 18 q4 -4 9 -3" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 96 L50 80 M30 104 L72 92 M56 102 L96 84 M78 106 L104 96 M40 90 L82 100" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <path d="M18 96 L50 80 M30 104 L72 92 M56 102 L96 84 M78 106 L104 96 M40 90 L82 100" fill="none" stroke="#d9b36a" stroke-width="4" stroke-linecap="round"/>
    <path d="M60 44 V62 M52 54 L60 62 L68 54" fill="none" ${st}/>`),
};

export const LEARNING_GAMES = ['coloring', 'numbers', 'patterns', 'shapes', 'sorting', 'letters', 'tones', 'memory'];
export const FOLK_GAMES = ['oanquan', 'taptamvong', 'oantuti', 'choichuyen'];
