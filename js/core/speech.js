// Voice. speak(key) plays a recorded file when one exists.
// If not, it uses the voice of the device (speechSynthesis).
// If the device has no voice for the language, it shows the text.

import { t, getLang, otherLang } from './i18n.js';
import { listClips, getClip } from './clips.js';
import { clipId } from '../logic/recordings.js';

const recorded = { vi: new Map(), en: new Map() };
// The recordings of the parent, in IndexedDB. They come before the files and the device voice.
const clips = new Set();
const clipUrls = new Map();
const options = { voice: true, rate: 0.9, voices: { vi: null, en: null } };
let voices = [];
let token = 0;
let player = null;
let captionHandler = () => {};

const synth = typeof speechSynthesis === 'undefined' ? null : speechSynthesis;

function refreshVoices() {
  if (synth) voices = synth.getVoices();
}

/** Load the list of recorded files and start to look for voices. */
export async function initSpeech() {
  await Promise.all(Object.keys(recorded).map(async (lang) => {
    try {
      const res = await fetch(`audio/${lang}/index.json`);
      const files = res.ok ? await res.json() : [];
      for (const file of files) recorded[lang].set(file.replace(/\.[a-z0-9]+$/i, ''), file);
    } catch {
      // No list of recorded files. Use the voice of the device.
    }
  }));
  for (const id of await listClips()) clips.add(id);
  if (synth) {
    refreshVoices();
    synth.addEventListener?.('voiceschanged', refreshVoices);
  }
  player = new Audio();
  player.preload = 'auto';
}

/** Wait a short time for the voices, because some browsers load them late. */
export function waitForVoices(ms = 1500) {
  if (!synth || voices.length) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => { refreshVoices(); resolve(); };
    synth.addEventListener?.('voiceschanged', done, { once: true });
    setTimeout(done, ms);
  });
}

export function setSpeechOptions(next) {
  Object.assign(options, next);
}

/** Speak a text in one language with one voice, to test the voice. */
export function testVoice(key, lang, voice) {
  stopSpeech();
  if (!synth || !voice) return;
  const u = new SpeechSynthesisUtterance(t(key, undefined, lang));
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = options.rate;
  synth.speak(u);
}

/** All the voices of the device for a language. */
export function listVoices(lang) {
  refreshVoices();
  return voices.filter((v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(lang));
}

/** The voice for a language: the voice that the parent chose, or else the best voice of the device. */
export function findVoice(lang) {
  const list = listVoices(lang);
  const chosen = options.voices?.[lang];
  if (chosen) {
    const match = list.find((v) => v.voiceURI === chosen || v.name === chosen);
    if (match) return match;
  }
  return list.find((v) => v.localService && v.default) || list.find((v) => v.localService) || list[0] || null;
}

/** Tell the voice that a recording of the parent was added or removed. */
export function noteClip(lang, key, present) {
  const id = clipId(lang, key);
  if (present) clips.add(id);
  else clips.delete(id);
  const url = clipUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  clipUrls.delete(id);
}

export function hasClip(lang, key) {
  return clips.has(clipId(lang, key));
}

async function clipUrl(id) {
  if (!clipUrls.has(id)) {
    const blob = await getClip(id);
    if (!blob) return null;
    clipUrls.set(id, URL.createObjectURL(blob));
  }
  return clipUrls.get(id);
}

export function hasVoice(lang) {
  return Boolean(findVoice(lang));
}

export function hasRecording(key, lang) {
  return recorded[lang].has(key);
}

/** Show the text when the device cannot speak it. */
export function onCaption(fn) {
  captionHandler = fn;
}

/** Call this in the handler of the first tap. iPad browsers speak only after a tap. */
export function unlockSpeech() {
  if (synth) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  }
  if (player) {
    // A short silent sound lets the audio element play later without a tap.
    player.src = silentWav();
    player.play().catch(() => {});
  }
}

function silentWav() {
  const samples = 800;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + samples, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true);
  v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

export function stopSpeech() {
  token += 1;
  if (synth) synth.cancel();
  if (player && !player.paused) player.pause();
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function playFile(url, my) {
  return new Promise((resolve) => {
    if (my !== token) return resolve(false);
    const done = (ok) => { player.onended = player.onerror = null; resolve(ok); };
    player.onended = () => done(true);
    player.onerror = () => done(false);
    player.src = url;
    player.play().catch(() => done(false));
  });
}

function speakText(text, lang, my) {
  return new Promise((resolve) => {
    if (my !== token) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    const voice = findVoice(lang);
    u.voice = voice;
    u.lang = voice ? voice.lang : lang;
    u.rate = options.rate;
    let finished = false;
    const done = () => { if (!finished) { finished = true; resolve(); } };
    u.onend = done;
    u.onerror = done;
    // Some browsers do not send the end event. Stop to wait after a time.
    setTimeout(done, 1500 + (text.length * 110) / options.rate);
    synth.speak(u);
  });
}

async function speakOne(item, my) {
  const lang = item.lang || getLang();
  // An item with a text and no key is one word of a text, for example one word of a đồng dao.
  const text = item.text ?? t(item.key, item.params, lang);
  if (my !== token) return;
  if (options.voice && !item.params && item.key && clips.has(clipId(lang, item.key))) {
    const url = await clipUrl(clipId(lang, item.key));
    if (url && (await playFile(url, my))) return;
  }
  if (my !== token) return;
  if (options.voice && !item.params && item.key && recorded[lang].has(item.key)) {
    const ok = await playFile(`audio/${lang}/${recorded[lang].get(item.key)}`, my);
    if (ok) return;
  }
  if (my !== token) return;
  if (options.voice && synth && hasVoice(lang)) {
    await speakText(text, lang, my);
    return;
  }
  captionHandler(text, lang);
  await wait(Math.min(4000, 700 + text.length * 45));
}

/**
 * Speak a list of items one after the other. A new call stops the old one.
 * @param {Array<string|{key?: string, text?: string, lang?: string, params?: object, pause?: number}>} items
 */
export async function speakAll(items) {
  stopSpeech();
  const my = token;
  for (const raw of items) {
    if (my !== token) return false;
    const item = typeof raw === 'string' ? { key: raw } : raw;
    if (item.pause) {
      await wait(item.pause);
      continue;
    }
    await speakOne(item, my);
  }
  return my === token;
}

/** Speak the text of one key. */
export function speak(key, params, lang) {
  return speakAll([{ key, params, lang }]);
}

/** Speak the key in the current language and then in the other language. */
export function speakBoth(key, params) {
  const lang = getLang();
  return speakAll([{ key, params, lang }, { pause: 250 }, { key, params, lang: otherLang(lang) }]);
}
