// Shared parts of the user interface.

import { t, getLang } from './i18n.js';
import { speak, speakAll, speakBoth, stopSpeech } from './speech.js';
import { sfx } from './sound.js';
import { icons } from './icons.js';
import { mascot } from './mascot.js';
import { record, changeLevel, gameLevel } from './state.js';

/**
 * Make an element.
 * @param {string} tag
 * @param {object} [props] class, attrs, html, dataset, style
 * @param {Array<Node|null>} [children]
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.html != null) node.innerHTML = props.html;
  if (props.text != null) node.textContent = props.text;
  for (const [k, v] of Object.entries(props.style || {})) {
    if (k.startsWith('--')) node.style.setProperty(k, v);
    else node.style[k] = v;
  }
  if (props.dataset) Object.assign(node.dataset, props.dataset);
  for (const [k, v] of Object.entries(props.attrs || {})) if (v != null) node.setAttribute(k, v);
  for (const c of children) if (c) node.append(c);
  return node;
}

export const SVG_NS = 'http://www.w3.org/2000/svg';

export function svgEl(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) node.setAttribute(k, v);
  for (const c of children) if (c) node.append(c);
  return node;
}

/**
 * Call fn when the user taps the element. It uses Pointer Events.
 * The Enter key and the Space key also work.
 */
export function onTap(node, fn) {
  let start = null;
  node.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    node.classList.add('is-pressed');
  });
  const end = () => { start = null; node.classList.remove('is-pressed'); };
  node.addEventListener('pointerup', (e) => {
    const s = start;
    end();
    if (!s || s.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 30) return;
    fn(e);
  });
  node.addEventListener('pointercancel', end);
  node.addEventListener('pointerleave', end);
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn(e);
    }
  });
  return node;
}

/** A round button with an icon and a label for screen readers. */
export function iconButton(icon, labelKey, fn, className = '') {
  const b = el('button', {
    class: `icon-btn ${className}`,
    html: icons[icon] || icon,
    attrs: { type: 'button', 'aria-label': t(labelKey) },
  });
  if (fn) onTap(b, fn);
  return b;
}

/**
 * The small "EN" button (or "VI" button in English mode).
 * A tap speaks the word in the current language and then in the other language.
 */
export function langBadge(key, params) {
  const b = el('button', {
    class: 'lang-badge',
    text: t('ui.otherLangBadge'),
    attrs: { type: 'button', 'aria-label': t('ui.otherLangLabel') },
  });
  b.addEventListener('pointerdown', (e) => e.stopPropagation());
  onTap(b, (e) => {
    e.stopPropagation();
    sfx.tap();
    speakBoth(key, params);
  });
  return b;
}

/** Wait for a time in milliseconds. */
export function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Make the screen of a game: a Home button, a speaker button, and a stage.
 * @returns {{root: HTMLElement, stage: HTMLElement, bar: HTMLElement, setInstruction: Function, say: Function}}
 */
export function gameScreen(container, game) {
  let instruction = [];
  const home = iconButton('home', 'ui.home', () => {
    stopSpeech();
    location.hash = '#/';
  }, 'home-btn');
  const speaker = iconButton('speaker', 'ui.repeat', () => {
    if (instruction.length) speakAll(instruction);
  }, 'speaker-btn');
  const tools = el('div', { class: 'bar-tools' });
  const bar = el('div', { class: 'game-bar' }, [home, tools, speaker]);
  const stage = el('main', { class: 'stage', attrs: { 'aria-label': t(`game.${game}.name`) } });
  const root = el('div', { class: `screen game-screen game-${game}` }, [bar, stage]);
  container.replaceChildren(root);
  return {
    root,
    stage,
    bar,
    tools,
    /** Set the instruction that the speaker button speaks again. */
    setInstruction(items) {
      instruction = Array.isArray(items) ? items : [items];
    },
    /** Set the instruction and speak it now. */
    say(items) {
      this.setInstruction(items);
      return speakAll(instruction);
    },
  };
}

function overlay(className = '') {
  const layer = el('div', { class: `overlay ${className}` });
  document.body.append(layer);
  requestAnimationFrame(() => layer.classList.add('is-open'));
  return layer;
}

function closeOverlay(layer) {
  layer.classList.remove('is-open');
  setTimeout(() => layer.remove(), 250);
}

/** Show small stars and hearts that float up. */
export function burst(anchor) {
  const r = anchor?.getBoundingClientRect?.() || { left: innerWidth / 2 - 40, top: innerHeight / 2 - 40, width: 80, height: 80 };
  const layer = el('div', { class: 'burst', attrs: { 'aria-hidden': 'true' } });
  layer.style.left = `${r.left + r.width / 2}px`;
  layer.style.top = `${r.top + r.height / 2}px`;
  const bits = [
    'M12 1 L15 9 L23 9 L17 14 L19 22 L12 17 L5 22 L7 14 L1 9 L9 9 Z',
    'M12 21 C4 15 2 11 2 8 C2 4 5 2 8 2 C10 2 11 3 12 5 C13 3 14 2 16 2 C19 2 22 4 22 8 C22 11 20 15 12 21 Z',
    'M12 3 A9 9 0 1 1 11.9 3 Z',
  ];
  const colors = ['#ffd166', '#f7a8c4', '#7cb87a', '#8fd3f4', '#e0463c', '#ffd166', '#f7a8c4'];
  colors.forEach((color, i) => {
    const angle = (i / colors.length) * Math.PI * 2;
    const p = el('span', {
      class: 'burst-bit',
      html: `<svg viewBox="0 0 24 24"><path d="${bits[i % bits.length]}" fill="${color}"/></svg>`,
    });
    p.style.setProperty('--dx', `${Math.cos(angle) * 90}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * 90 - 40}px`);
    layer.append(p);
  });
  document.body.append(layer);
  setTimeout(() => layer.remove(), 1200);
}

let soiPop = null;
/** Sỏi comes up from the bottom corner for a short time. */
export function soiCheers() {
  soiPop?.remove();
  soiPop = mascot('happy', 'soi-pop');
  document.body.append(soiPop);
  const me = soiPop;
  setTimeout(() => me.remove(), 1800);
}

/** Praise for a correct answer: "Giỏi quá!", a happy sound, and a small animation. */
export function celebrate(anchor, extra = []) {
  sfx.happy();
  burst(anchor);
  soiCheers();
  return speakAll(['praise.great', ...extra]);
}

/** A soft and kind answer for a wrong answer. */
export function tryAgain(target) {
  if (target) {
    target.classList.remove('wiggle');
    void target.offsetWidth;
    target.classList.add('wiggle');
  }
  return speak('praise.tryAgain');
}

/**
 * Record an answer, praise the child, and show a star after 5 correct answers in a row.
 * @returns {Promise<{levelUp: boolean, level: number}>}
 */
export async function answer(game, correct, anchor, extra = []) {
  const result = record(game, correct);
  if (!correct) {
    await tryAgain(anchor);
    return { levelUp: false, level: gameLevel(game) };
  }
  await celebrate(anchor, extra);
  if (!result.star) return { levelUp: false, level: gameLevel(game) };
  const yes = await starPrompt(result.suggestNext);
  if (yes) {
    const level = changeLevel(game, gameLevel(game) + 1);
    return { levelUp: true, level };
  }
  return { levelUp: false, level: gameLevel(game) };
}

/** Show a star. If there is a next level, ask the child to play it. */
export function starPrompt(suggestNext) {
  return new Promise((resolve) => {
    const layer = overlay('star-layer');
    const star = el('div', { class: 'big-star', html: icons.star });
    const soi = mascot('happy', 'star-soi');
    const card = el('div', { class: 'dialog-card' }, [star, soi]);
    layer.append(card);
    sfx.star();
    const finish = (value) => {
      closeOverlay(layer);
      resolve(value);
    };
    if (!suggestNext) {
      speakAll(['praise.star']).then(() => wait(400)).then(() => finish(false));
      onTap(layer, () => finish(false));
      return;
    }
    const yes = iconButton('check', 'ui.yes', () => { stopSpeech(); finish(true); }, 'answer-yes');
    const no = iconButton('again', 'ui.no', () => { stopSpeech(); finish(false); }, 'answer-no');
    card.append(el('div', { class: 'dialog-actions' }, [yes, no]));
    speakAll(['praise.star', 'praise.nextLevel']);
  });
}

/** Ask yes or no with two large buttons. */
export function confirmDialog(questionKey, iconName = 'clear') {
  return new Promise((resolve) => {
    const layer = overlay('confirm-layer');
    const pic = el('div', { class: 'dialog-icon', html: icons[iconName] || '' });
    const finish = (value) => {
      stopSpeech();
      closeOverlay(layer);
      resolve(value);
    };
    const yes = iconButton('check', 'ui.yes', () => finish(true), 'answer-yes');
    const no = iconButton('cross', 'ui.no', () => finish(false), 'answer-no');
    layer.append(el('div', { class: 'dialog-card' }, [pic, el('div', { class: 'dialog-actions' }, [yes, no])]));
    speak(questionKey);
  });
}

let captionTimer = 0;
/** Show a text with a speaker icon when the device cannot speak. */
export function showCaption(text, lang) {
  let box = document.getElementById('caption');
  if (!box) {
    box = el('div', { class: 'caption', attrs: { id: 'caption', role: 'status' } });
    document.body.append(box);
  }
  box.replaceChildren(el('span', { class: 'caption-icon', html: icons.speaker }), el('span', { text, attrs: { lang } }));
  box.classList.add('is-open');
  clearTimeout(captionTimer);
  captionTimer = setTimeout(() => box.classList.remove('is-open'), Math.min(6000, 1500 + text.length * 60));
}

/** The name of the language, for example to show in the settings. */
export function langName(lang) {
  return t(`settings.lang.${lang}`, undefined, getLang());
}

/** Open the current game again, for example after the level changes. */
export function reloadGame() {
  window.dispatchEvent(new Event('coine:reload'));
}

/**
 * A button that works only after a hold of some seconds. It is a gate for parents.
 * A ring around the button fills while the parent holds it.
 */
export function holdButton(iconName, labelKey, onDone, className = '', ms = 3000) {
  const ring = `<svg viewBox="0 0 100 100" class="hold-ring" aria-hidden="true">
    <circle cx="50" cy="50" r="46" pathLength="100" class="hold-ring-bar"/></svg>`;
  const b = el('button', {
    class: `icon-btn hold-btn ${className}`,
    html: (icons[iconName] || '') + ring,
    attrs: { type: 'button', 'aria-label': t(labelKey) },
  });
  b.style.setProperty('--hold', `${ms}ms`);
  let timer = 0;
  const cancel = () => {
    clearTimeout(timer);
    b.classList.remove('is-holding');
  };
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    cancel();
    b.classList.add('is-holding');
    timer = setTimeout(() => {
      b.classList.remove('is-holding');
      onDone();
    }, ms);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, cancel));
  return b;
}
