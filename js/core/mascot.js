// Sỏi, the pebble. An original SVG drawing with a few expressions.

const BODY = '#aab8cc';
const BODY_DARK = '#7d8ca3';
const INK = '#3b2a2a';

const FACES = {
  happy: `
    <path d="M40 58 q6 -8 12 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M68 58 q6 -8 12 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M47 70 q13 16 26 0 z" fill="${INK}"/>
    <path d="M53 76 q7 5 14 0 q-7 -4 -14 0z" fill="#f28ba0"/>`,
  curious: `
    <path d="M37 44 q7 -6 14 -2" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M70 40 q7 -5 14 1" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="45" cy="57" rx="7.5" ry="9" fill="${INK}"/>
    <ellipse cx="77" cy="56" rx="7.5" ry="9" fill="${INK}"/>
    <circle cx="47.5" cy="53.5" r="2.8" fill="#fff"/>
    <circle cx="79.5" cy="52.5" r="2.8" fill="#fff"/>
    <ellipse cx="61" cy="75" rx="5" ry="6" fill="${INK}"/>`,
  thinking: `
    <ellipse cx="46" cy="57" rx="6.5" ry="7.5" fill="${INK}"/>
    <ellipse cx="76" cy="57" rx="6.5" ry="7.5" fill="${INK}"/>
    <circle cx="49" cy="53" r="2.5" fill="#fff"/>
    <circle cx="79" cy="53" r="2.5" fill="#fff"/>
    <path d="M50 76 q5 -4 10 0 t10 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="104" cy="22" r="4" fill="#fff" stroke="${BODY_DARK}" stroke-width="2"/>
    <circle cx="113" cy="10" r="6" fill="#fff" stroke="${BODY_DARK}" stroke-width="2"/>`,
};

export const EXPRESSIONS = Object.keys(FACES);

export function mascotMarkup(expression = 'happy') {
  const face = FACES[expression] || FACES.happy;
  return `<svg viewBox="0 0 122 112" class="soi soi-${expression}" aria-hidden="true" focusable="false">
    <ellipse cx="61" cy="106" rx="42" ry="5" fill="#000" opacity="0.08"/>
    <ellipse cx="40" cy="101" rx="11" ry="6" fill="${BODY_DARK}"/>
    <ellipse cx="82" cy="101" rx="11" ry="6" fill="${BODY_DARK}"/>
    <path d="M62 14 C95 13 114 36 113 64 C112 90 92 102 61 102 C29 102 9 91 9 66 C9 36 30 15 62 14 Z"
      fill="${BODY}" stroke="${BODY_DARK}" stroke-width="3"/>
    <path d="M30 34 C38 24 52 20 62 21" stroke="#dfe6f0" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="92" cy="80" r="2.2" fill="${BODY_DARK}"/>
    <circle cx="86" cy="88" r="1.6" fill="${BODY_DARK}"/>
    <circle cx="25" cy="80" r="1.8" fill="${BODY_DARK}"/>
    <ellipse cx="33" cy="70" rx="7" ry="4.5" fill="#f5a3b5" opacity="0.8"/>
    <ellipse cx="89" cy="70" rx="7" ry="4.5" fill="#f5a3b5" opacity="0.8"/>
    ${face}
  </svg>`;
}

/** Make an element that shows Sỏi. */
export function mascot(expression = 'happy', className = '') {
  const wrap = document.createElement('div');
  wrap.className = `soi-wrap ${className}`;
  wrap.innerHTML = mascotMarkup(expression);
  return wrap;
}

export function setExpression(wrap, expression) {
  wrap.innerHTML = mascotMarkup(expression);
}

/** A hand of Sỏi. A closed hand is a fist. */
export function handMarkup(open = false) {
  if (open) {
    return `<svg viewBox="0 0 80 80" aria-hidden="true">
      <path d="M16 44 C10 30 22 24 28 36 L30 16 C30 8 40 8 40 16 L41 12 C42 4 52 5 51 13 L52 16 C54 9 63 10 62 18 L60 48 C60 64 50 72 38 72 C26 72 20 60 16 44Z"
        fill="${BODY}" stroke="${BODY_DARK}" stroke-width="3" stroke-linejoin="round"/></svg>`;
  }
  return `<svg viewBox="0 0 80 80" aria-hidden="true">
    <path d="M14 40 C14 22 26 14 42 14 C58 14 68 24 68 40 C68 58 56 68 40 68 C24 68 14 58 14 40Z"
      fill="${BODY}" stroke="${BODY_DARK}" stroke-width="3"/>
    <path d="M26 30 q8 -6 16 0 M42 30 q8 -6 16 0" stroke="${BODY_DARK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M22 44 q6 4 12 2" stroke="${BODY_DARK}" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
}
