// Rules of the sticker book (Sổ nhãn dán). These functions do not use the DOM.
// The child gets a new sticker for each star. The first stickers are free.

export const FREE = 3;

// The stickers in the order that the child gets them. Each id is a picture in data/images.json.
export const STICKERS = [
  'nonla', 'hoasen', 'denongsao', 'aodai', 'contrau', 'caidieu', 'lantern', 'hoamai', 'banhtet', 'lixi',
  'longdencachep', 'mooncake', 'mango', 'coconut', 'mangcau', 'duck', 'goldfish', 'chick', 'butterfly', 'xichlo',
  'caytre', 'batpho', 'banhchung', 'mamnguqua', 'dudu', 'rabbit', 'cat', 'dog', 'canoe', 'bicycle',
  'fullmoon', 'star', 'sun', 'heart', 'lotus', 'hen',
];

export const SCENES = ['village', 'night', 'river'];

export function unlockedCount(stars) {
  return Math.min(STICKERS.length, FREE + Math.max(0, Math.floor(stars || 0)));
}

export function unlocked(stars) {
  return STICKERS.slice(0, unlockedCount(stars));
}

/** The sticker that a new star gives, or null. */
export function newSticker(before, after) {
  const a = unlockedCount(before);
  const b = unlockedCount(after);
  return b > a ? STICKERS[b - 1] : null;
}

export function emptyBook() {
  return { scenes: Object.fromEntries(SCENES.map((s) => [s, []])) };
}

export function normalizeBook(raw) {
  const book = emptyBook();
  const scenes = raw && typeof raw === 'object' && raw.scenes && typeof raw.scenes === 'object' ? raw.scenes : {};
  for (const s of SCENES) {
    const list = Array.isArray(scenes[s]) ? scenes[s] : [];
    book.scenes[s] = list
      .filter((p) => p && STICKERS.includes(p.id) && Number.isFinite(p.x) && Number.isFinite(p.y))
      .map((p, i) => ({ key: typeof p.key === 'string' ? p.key : `s${i}`, id: p.id, x: clamp(p.x), y: clamp(p.y) }))
      .slice(0, 60);
  }
  return book;
}

function clamp(v) {
  return Math.min(1, Math.max(0, v));
}

let counter = 0;
/** Put a sticker on a scene. x and y go from 0 to 1. */
export function placeSticker(book, scene, id, x, y) {
  counter += 1;
  const item = { key: `s${Date.now().toString(36)}${counter}`, id, x: clamp(x), y: clamp(y) };
  return { ...book, scenes: { ...book.scenes, [scene]: [...book.scenes[scene], item].slice(-60) } };
}

export function moveSticker(book, scene, key, x, y) {
  return { ...book, scenes: { ...book.scenes, [scene]: book.scenes[scene].map((p) => (p.key === key ? { ...p, x: clamp(x), y: clamp(y) } : p)) } };
}

export function removeSticker(book, scene, key) {
  return { ...book, scenes: { ...book.scenes, [scene]: book.scenes[scene].filter((p) => p.key !== key) } };
}
