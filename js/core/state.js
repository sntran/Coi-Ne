// The state of the app in the browser: settings, level progress, and the gallery.
// The rules are in js/logic/save.js and js/logic/progress.js.

import {
  createStore, loadSettings, saveSettings, loadGallery, saveToGallery, removeFromGallery,
} from '../logic/save.js';
import {
  normalizeProgress, getLevel, setLevel, recordAnswer,
} from '../logic/progress.js';
import { normalizeBook } from '../logic/stickers.js';

function browserStorage() {
  try {
    const k = 'coine.test';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    const map = new Map();
    return { getItem: (x) => map.get(x) ?? null, setItem: (x, v) => map.set(x, String(v)), removeItem: (x) => map.delete(x) };
  }
}

const store = createStore(browserStorage());
let settings = loadSettings(store);
let progress = normalizeProgress(store.read('progress', null));
let gallery = loadGallery(store);
let stickerBook = normalizeBook(store.read('stickers', null));

export function getSettings() {
  return settings;
}

export function updateSettings(patch) {
  settings = { ...settings, ...patch };
  saveSettings(store, settings);
  return settings;
}

export function gameLevel(game) {
  return getLevel(progress, game);
}

export function changeLevel(game, level) {
  progress = setLevel(progress, game, level);
  store.write('progress', progress);
  return getLevel(progress, game);
}

export function gameStars(game) {
  return progress.games[game]?.stars || 0;
}

export function record(game, correct) {
  const result = recordAnswer(progress, game, correct);
  progress = result.progress;
  store.write('progress', progress);
  return result;
}

export function getGallery() {
  return gallery;
}

export function putInGallery(item) {
  const result = saveToGallery(gallery, item);
  gallery = result.list;
  store.write('gallery', gallery);
  return result.entry;
}

export function deleteFromGallery(id) {
  gallery = removeFromGallery(gallery, id);
  store.write('gallery', gallery);
}

/** All the stars of the child, in all games. */
export function totalStars() {
  return Object.values(progress.games).reduce((n, g) => n + (g.stars || 0), 0);
}

export function getStickerBook() {
  return stickerBook;
}

export function saveStickerBook(book) {
  stickerBook = book;
  store.write('stickers', book);
}
