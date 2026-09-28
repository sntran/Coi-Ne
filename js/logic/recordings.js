// The texts that a parent can record, in groups. These functions do not use the DOM.

// Keys that the app never speaks. They are labels for screen readers or texts for the parent.
const NOT_SPOKEN = new Set([
  'coloring.gallery', 'coloring.groups', 'coloring.palette', 'coloring.undo', 'coloring.clear', 'coloring.save',
  'coloring.delete', 'numbers.group', 'numbers.plusSign', 'oanquan.kid', 'sorting.item', 'memory.card',
  'letters.grid', 'taptamvong.hand', 'taptamvong.cup', 'soi.name', 'share.plate', 'share.hole', 'numbers.quickLook',
]);
const NOT_SPOKEN_PREFIXES = ['settings.', 'about.', 'app.', 'ui.', 'rec.'];

export const GROUPS = ['common', 'games', 'instructions', 'colors', 'numbers', 'letters', 'pictures', 'rhymes'];

/** The id of a recording in the store, for example "vi:praise.great". */
export function clipId(lang, key) {
  return `${lang}:${key}`;
}

export function hasParams(text) {
  return /\{\w+\}/.test(text);
}

/** True when the app can speak the key in this language from a recording. */
export function isRecordable(key, text, lang) {
  if (typeof text !== 'string' || !text.trim() || hasParams(text)) return false;
  if (NOT_SPOKEN.has(key) || NOT_SPOKEN_PREFIXES.some((p) => key.startsWith(p))) return false;
  // The sound of a letter is only spoken in the language of its alphabet.
  const m = key.match(/^abc\.(\w+)\.[\w]+\.sound$/);
  if (m && m[1] !== lang) return false;
  return true;
}

export function groupOf(key) {
  if (key.startsWith('soi.') || key.startsWith('praise.')) return 'common';
  if (key.startsWith('game.') || key.startsWith('home.')) return 'games';
  if (/^(color|shape|size)\./.test(key)) return 'colors';
  if (key.startsWith('num.')) return 'numbers';
  if (key.startsWith('abc.')) return 'letters';
  if (/^(pic|thing|share\.thing|coloring\.group|shapes\.design|oantuti\.hand)\./.test(key) || key === 'choichuyen.ball' || key === 'choichuyen.stick') return 'pictures';
  if (key.startsWith('dongdao.') || key.startsWith('story.')) return 'rhymes';
  return 'instructions';
}

/**
 * The texts to record for one language, in groups.
 * @param {Record<string, string>} texts the texts of the language file
 * @param {string} lang
 * @returns {Array<{id: string, keys: string[]}>}
 */
export function recordableGroups(texts, lang) {
  const groups = new Map(GROUPS.map((g) => [g, []]));
  for (const [key, text] of Object.entries(texts)) {
    if (isRecordable(key, text, lang)) groups.get(groupOf(key)).push(key);
  }
  groups.get('numbers').sort((a, b) => Number(a.split('.')[1]) - Number(b.split('.')[1]));
  return GROUPS.map((id) => ({ id, keys: groups.get(id) })).filter((g) => g.keys.length);
}
