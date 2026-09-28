// Language texts. All text for the child and the parent is in lang/vi.json and lang/en.json.

export const LANGS = ['vi', 'en'];
const texts = { vi: {}, en: {} };
let current = 'vi';

export async function loadLanguages() {
  await Promise.all(LANGS.map(async (lang) => {
    const res = await fetch(`lang/${lang}.json`);
    texts[lang] = await res.json();
  }));
}

export function getLang() {
  return current;
}

export function otherLang(lang = current) {
  return lang === 'vi' ? 'en' : 'vi';
}

export function setLang(lang) {
  current = LANGS.includes(lang) ? lang : 'vi';
  document.documentElement.lang = current;
  document.title = t('app.name');
}

export function hasText(key, lang = current) {
  return Object.hasOwn(texts[lang], key);
}

/**
 * Get the text for a key. Put each {name} in the text in place of params[name].
 * @param {string} key
 * @param {Record<string, string|number>} [params]
 * @param {string} [lang]
 */
export function t(key, params, lang = current) {
  const text = texts[lang][key] ?? texts.vi[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name) => {
    if (!(name in params)) return m;
    const value = params[name];
    // A param can be a text key. Then use the text in the same language.
    return typeof value === 'object' && value ? t(value.key, value.params, lang) : String(value);
  });
}
