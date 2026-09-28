// Save and load. These functions do not use the DOM.
// The storage object has the same API as localStorage: getItem and setItem.

export const PREFIX = 'coine.';

export const DEFAULT_SETTINGS = Object.freeze({
  lang: 'vi',
  voice: true,
  rate: 0.9,
  voices: Object.freeze({ vi: null, en: null }),
});

export function createStore(storage, prefix = PREFIX) {
  return {
    read(name, fallback) {
      try {
        const raw = storage.getItem(prefix + name);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    write(name, value) {
      try {
        storage.setItem(prefix + name, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** Make a storage object that keeps data in memory. */
export function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

export function loadSettings(store) {
  const saved = store.read('settings', {});
  const s = { ...DEFAULT_SETTINGS, ...(saved && typeof saved === 'object' ? saved : {}) };
  if (s.lang !== 'vi' && s.lang !== 'en') s.lang = DEFAULT_SETTINGS.lang;
  s.voice = s.voice !== false;
  const rate = Number(s.rate);
  s.rate = Number.isFinite(rate) ? Math.min(1.3, Math.max(0.5, rate)) : DEFAULT_SETTINGS.rate;
  // The voice that the parent chose for each language, or null for the best voice of the device.
  const v = s.voices && typeof s.voices === 'object' ? s.voices : {};
  s.voices = {
    vi: typeof v.vi === 'string' && v.vi ? v.vi : null,
    en: typeof v.en === 'string' && v.en ? v.en : null,
  };
  return s;
}

export function saveSettings(store, settings) {
  return store.write('settings', settings);
}

// Gallery of colored pictures. Each item: { id, picture, fills, time }.
// fills maps the index of a tap area to a color.

export function loadGallery(store) {
  const list = store.read('gallery', []);
  return Array.isArray(list) ? list.filter((g) => g && typeof g.id === 'string' && typeof g.picture === 'string') : [];
}

export function saveToGallery(list, item, now = Date.now()) {
  const entry = {
    id: item.id || `g${now.toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    picture: item.picture,
    fills: { ...(item.fills || {}) },
    time: now,
  };
  const rest = list.filter((g) => g.id !== entry.id);
  return { list: [entry, ...rest], entry };
}

export function removeFromGallery(list, id) {
  return list.filter((g) => g.id !== id);
}
