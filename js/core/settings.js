// The parent gate and the settings for parents.
// The settings button opens only after a parent holds it for 3 seconds.

import { t } from './i18n.js';
import { speak, findVoice, setSpeechOptions, stopSpeech } from './speech.js';
import { el, onTap, iconButton } from './ui.js';
import { icons } from './icons.js';
import { getSettings, updateSettings, gameLevel, changeLevel, gameStars } from './state.js';
import { MAX_LEVELS } from '../logic/progress.js';
import { LEARNING_GAMES, FOLK_GAMES } from './game-icons.js';

export const HOLD_MS = 3000;
let changeHandler = () => {};

/** The app calls this function to know when the language changes. */
export function onSettingsChange(fn) {
  changeHandler = fn;
}

/** The settings button. Hold it for 3 seconds to open the settings. */
export function settingsButton() {
  const ring = `<svg viewBox="0 0 100 100" class="hold-ring" aria-hidden="true">
    <circle cx="50" cy="50" r="46" pathLength="100" class="hold-ring-bar"/></svg>`;
  const b = el('button', {
    class: 'icon-btn settings-btn',
    html: icons.gear + ring,
    attrs: { type: 'button', 'aria-label': t('settings.holdHint') },
  });
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
      openSettings();
    }, HOLD_MS);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, cancel));
  return b;
}

function row(labelKey, control, hintKey) {
  return el('div', { class: 'set-row' }, [
    el('div', { class: 'set-label' }, [
      el('div', { text: t(labelKey) }),
      hintKey ? el('div', { class: 'set-hint', text: t(hintKey) }) : null,
    ]),
    control,
  ]);
}

function choice(options, value, onPick) {
  const wrap = el('div', { class: 'set-choice' });
  for (const [v, labelKey] of options) {
    const b = el('button', {
      class: `set-pill ${v === value ? 'is-on' : ''}`,
      text: t(labelKey),
      attrs: { type: 'button', 'aria-pressed': String(v === value) },
    });
    onTap(b, () => onPick(v));
    wrap.append(b);
  }
  return wrap;
}

function voiceStatus() {
  const box = el('div', { class: 'set-voices' });
  for (const lang of ['vi', 'en']) {
    const voice = findVoice(lang);
    const text = voice
      ? t('settings.voiceFound', { lang: { key: `settings.lang.${lang}` }, name: voice.name })
      : t('settings.voiceMissing', { lang: { key: `settings.lang.${lang}` } });
    box.append(el('p', { class: voice ? 'voice-ok' : 'voice-warn', text }));
  }
  return box;
}

function levelRows() {
  const box = el('div', { class: 'set-levels' });
  for (const id of [...LEARNING_GAMES, ...FOLK_GAMES]) {
    const max = MAX_LEVELS[id];
    const value = el('span', { class: 'level-value' });
    const show = () => {
      value.textContent = t('settings.levelOf', { n: gameLevel(id), max });
    };
    show();
    const minus = el('button', { class: 'set-step', text: t('settings.minus'), attrs: { type: 'button', 'aria-label': t('settings.levelDown') } });
    const plus = el('button', { class: 'set-step', text: t('settings.plus'), attrs: { type: 'button', 'aria-label': t('settings.levelUp') } });
    onTap(minus, () => { changeLevel(id, gameLevel(id) - 1); show(); });
    onTap(plus, () => { changeLevel(id, gameLevel(id) + 1); show(); });
    const stars = el('span', { class: 'level-stars', html: `${icons.star}<span>${gameStars(id)}</span>` });
    const control = max > 1 ? el('div', { class: 'set-stepper' }, [minus, value, plus]) : el('div', { class: 'set-stepper' }, [value]);
    box.append(el('div', { class: 'set-level' }, [
      el('div', { class: 'set-level-name' }, [el('span', { text: t(`game.${id}.name`) }), stars]),
      el('div', { class: 'set-hint', text: t(`settings.levels.${id}`) }),
      control,
    ]));
  }
  return box;
}

let panel = null;

export function openSettings() {
  stopSpeech();
  closeSettings();
  panel = el('div', { class: 'overlay settings-layer is-open', attrs: { role: 'dialog', 'aria-modal': 'true' } });
  document.body.append(panel);
  renderSettings();
}

export function closeSettings() {
  panel?.remove();
  panel = null;
}

function renderSettings() {
  const s = getSettings();
  const close = iconButton('close', 'ui.close', closeSettings, 'set-close');
  const rate = el('input', {
    class: 'set-range',
    attrs: { type: 'range', min: '0.5', max: '1.3', step: '0.1', value: String(s.rate), 'aria-label': t('settings.rate') },
  });
  const rateValue = el('span', { class: 'set-rate-value', text: t('settings.rateValue', { v: s.rate.toFixed(1) }) });
  rate.addEventListener('input', () => {
    const v = Number(rate.value);
    rateValue.textContent = t('settings.rateValue', { v: v.toFixed(1) });
    updateSettings({ rate: v });
    setSpeechOptions({ rate: v });
  });
  rate.addEventListener('change', () => speak('settings.rateSample'));

  const body = el('div', { class: 'settings-card' }, [
    el('div', { class: 'set-head' }, [el('h2', { text: t('settings.title') }), close]),
    row('settings.language', choice([['vi', 'settings.lang.vi'], ['en', 'settings.lang.en']], s.lang, (v) => {
      updateSettings({ lang: v });
      changeHandler({ lang: v });
      renderSettings();
    }), 'settings.languageHint'),
    row('settings.voice', choice([[true, 'settings.on'], [false, 'settings.off']], s.voice, (v) => {
      updateSettings({ voice: v });
      setSpeechOptions({ voice: v });
      renderSettings();
    }), 'settings.voiceHint'),
    row('settings.rate', el('div', { class: 'set-rate' }, [rate, rateValue])),
    voiceStatus(),
    el('h3', { class: 'set-sub', text: t('settings.levels') }),
    levelRows(),
    el('div', { class: 'set-foot' }, [
      (() => {
        const about = el('button', { class: 'set-pill is-on', text: t('about.title'), attrs: { type: 'button' } });
        onTap(about, renderAbout);
        return about;
      })(),
    ]),
  ]);
  panel.replaceChildren(body);
}

async function renderAbout() {
  const back = iconButton('left', 'ui.back', renderSettings, 'set-close');
  const list = el('div', { class: 'credits' }, [el('p', { text: t('about.loading') })]);
  const card = el('div', { class: 'settings-card about-card' }, [
    el('div', { class: 'set-head' }, [back, el('h2', { text: t('about.title') })]),
    el('p', { text: t('about.goal1') }),
    el('p', { text: t('about.goal2') }),
    el('p', { text: t('about.goal3') }),
    el('h3', { class: 'set-sub', text: t('about.pictures') }),
    el('p', { class: 'set-hint', text: t('about.picturesHint') }),
    list,
    el('h3', { class: 'set-sub', text: t('about.software') }),
    el('p', { class: 'set-hint', text: t('about.softwareText') }),
    el('h3', { class: 'set-sub', text: t('about.privacy') }),
    el('p', { class: 'set-hint', text: t('about.privacyText') }),
  ]);
  panel.replaceChildren(card);
  try {
    const credits = await (await fetch('credits.json')).json();
    const rows = Object.entries(credits).map(([file, c]) => {
      const source = c.source === 'original'
        ? el('span', { text: t('about.original') })
        : el('a', { text: t('about.source'), attrs: { href: c.source, target: '_blank', rel: 'noopener' } });
      const license = c.licenseUrl
        ? el('a', { text: c.license, attrs: { href: c.licenseUrl, target: '_blank', rel: 'noopener' } })
        : el('span', { text: c.license });
      return el('div', { class: 'credit' }, [
        el('img', { attrs: { src: file, alt: '', loading: 'lazy', width: '48', height: '48' } }),
        el('div', { class: 'credit-text' }, [
          el('div', { class: 'credit-title', text: c.title }),
          el('div', { class: 'set-hint' }, [el('span', { text: c.author }), el('span', { text: t('about.sep') }), license, el('span', { text: t('about.sep') }), source]),
        ]),
      ]);
    });
    list.replaceChildren(...rows);
  } catch {
    list.replaceChildren(el('p', { text: t('about.noCredits') }));
  }
}

