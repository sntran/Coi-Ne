// The parent gate and the settings for parents.
// The settings button opens only after a parent holds it for 3 seconds.

import { t, loadedTexts } from './i18n.js';
import {
  speak, speakAll, findVoice, listVoices, testVoice, setSpeechOptions, stopSpeech, noteClip, hasClip,
} from './speech.js';
import { putClip, deleteClip } from './clips.js';
import { canRecord, startRecording, releaseMicrophone } from './recorder.js';
import { recordableGroups, clipId } from '../logic/recordings.js';
import { el, onTap, iconButton, holdButton, dedication } from './ui.js';
import { icons } from './icons.js';
import { getSettings, updateSettings, gameLevel, changeLevel, gameStars } from './state.js';
import { MAX_LEVELS } from '../logic/progress.js';
import { REST_OPTIONS } from '../logic/rest.js';
import { ALL_GAMES } from './game-icons.js';

export const HOLD_MS = 3000;
let changeHandler = () => {};

/** The app calls this function to know when the language changes. */
export function onSettingsChange(fn) {
  changeHandler = fn;
}

/** The settings button. Hold it for 3 seconds to open the settings. */
export function settingsButton() {
  return holdButton('gear', 'settings.holdHint', openSettings, 'settings-btn', HOLD_MS);
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
  for (const [v, labelKey, n] of options) {
    const b = el('button', {
      class: `set-pill ${v === value ? 'is-on' : ''}`,
      text: t(labelKey, n == null ? undefined : { n }),
      attrs: { type: 'button', 'aria-pressed': String(v === value) },
    });
    onTap(b, () => onPick(v));
    wrap.append(b);
  }
  return wrap;
}

/** The voices of the device for each language. A tap on a voice plays a sample and chooses the voice. */
function voiceStatus() {
  const box = el('div', { class: 'set-voices' });
  for (const lang of ['vi', 'en']) {
    const voice = findVoice(lang);
    const langName = { key: `settings.lang.${lang}` };
    const text = voice
      ? t('settings.voiceFound', { lang: langName, name: voice.name })
      : t('settings.voiceMissing', { lang: langName });
    box.append(el('p', { class: voice ? 'voice-ok' : 'voice-warn', text }));
    const list = listVoices(lang);
    if (!list.length) continue;
    const chosen = getSettings().voices[lang];
    const pills = el('div', { class: 'set-choice set-voice-list' });
    const pick = (value, sample) => {
      updateSettings({ voices: { ...getSettings().voices, [lang]: value } });
      setSpeechOptions({ voices: getSettings().voices });
      if (sample) testVoice('settings.rateSample', lang, sample);
      else speakAll([{ key: 'settings.rateSample', lang }]);
      renderSettings();
    };
    const auto = el('button', { class: `set-pill ${!chosen ? 'is-on' : ''}`, text: t('settings.voiceAuto'), attrs: { type: 'button' } });
    onTap(auto, () => pick(null, null));
    pills.append(auto);
    for (const v of list) {
      const id = v.voiceURI || v.name;
      const b = el('button', { class: `set-pill ${chosen === id ? 'is-on' : ''}`, text: `${v.name} (${v.lang})`, attrs: { type: 'button' } });
      onTap(b, () => pick(id, v));
      pills.append(b);
    }
    box.append(el('div', { class: 'set-row set-voice-row' }, [
      el('div', { class: 'set-label' }, [
        el('div', { text: t('settings.voiceChoose', { lang: langName }) }),
        el('div', { class: 'set-hint', text: t('settings.voiceChooseHint') }),
      ]),
      pills,
    ]));
  }
  return box;
}

function levelRows() {
  const box = el('div', { class: 'set-levels' });
  for (const id of ALL_GAMES) {
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
  stopRecording();
  releaseMicrophone();
  panel?.remove();
  panel = null;
}

// The recorder page: the parent records each text with the own voice.

let recording = null;

function stopRecording() {
  if (!recording) return;
  const { row, ctrl } = recording;
  recording = null;
  row.classList.remove('is-recording');
  const btn = row.querySelector('.rec-record');
  if (btn) btn.innerHTML = icons.record;
  ctrl.stop().catch(() => {});
}

function recordRow(lang, key, counter) {
  const text = el('div', { class: 'rec-text', text: t(key, undefined, lang), attrs: { lang } });
  const mark = el('span', { class: 'rec-mark', attrs: { 'aria-label': t('rec.hasClip') } });
  const listen = iconButton('listen', 'rec.play', () => {
    stopRecording();
    speakAll([{ key, lang }]);
  }, 'rec-btn');
  const record = iconButton('record', 'rec.record', () => toggle(), 'rec-btn rec-record');
  const remove = iconButton('clear', 'rec.delete', async () => {
    if (!window.confirm(t('rec.deleteConfirm'))) return;
    await deleteClip(clipId(lang, key)).catch(() => {});
    noteClip(lang, key, false);
    show();
    counter();
  }, 'rec-btn');
  const row = el('div', { class: 'rec-row' }, [mark, text, el('div', { class: 'rec-actions' }, [listen, record, remove])]);
  function show() {
    const has = hasClip(lang, key);
    row.classList.toggle('has-clip', has);
    remove.hidden = !has;
  }
  async function toggle() {
    if (recording && recording.row === row) {
      // Stop and save.
      const r = recording;
      recording = null;
      row.classList.remove('is-recording');
      record.innerHTML = icons.record;
      try {
        const blob = await r.ctrl.stop();
        if (blob.size > 0) {
          await putClip(clipId(lang, key), blob);
          noteClip(lang, key, true);
          show();
          counter();
          speakAll([{ key, lang }]);
        }
      } catch {
        panel?.querySelector('.rec-error')?.replaceChildren(t('rec.saveError'));
      }
      return;
    }
    stopRecording();
    stopSpeech();
    try {
      const ctrl = await startRecording();
      recording = { row, ctrl };
      row.classList.add('is-recording');
      record.innerHTML = icons.stop;
      // The recorder stops by itself after a time. Then save the sound.
      ctrl.done.then(() => { if (recording && recording.ctrl === ctrl) toggle(); });
    } catch {
      panel?.querySelector('.rec-error')?.replaceChildren(t('rec.noMic'));
    }
  }
  show();
  return row;
}

function renderRecorder(lang) {
  stopRecording();
  stopSpeech();
  const back = iconButton('left', 'ui.back', () => {
    stopRecording();
    releaseMicrophone();
    renderSettings();
  }, 'set-close');
  const groups = recordableGroups(loadedTexts(lang), lang);
  const total = groups.reduce((n, g) => n + g.keys.length, 0);
  const count = el('p', { class: 'set-hint rec-count' });
  const counter = () => {
    const n = groups.reduce((sum, g) => sum + g.keys.filter((k) => hasClip(lang, k)).length, 0);
    count.textContent = t('rec.count', { n, total });
  };
  counter();
  const langChoice = choice([['vi', 'settings.lang.vi'], ['en', 'settings.lang.en']], lang, (v) => renderRecorder(v));
  const sections = groups.map((g) => {
    const list = el('div', { class: 'rec-list' });
    const summary = el('summary', { text: t(`rec.group.${g.id}`) });
    const details = el('details', { class: 'rec-group' }, [summary, list]);
    // Make the rows only when the parent opens the group, because there are many rows.
    details.addEventListener('toggle', () => {
      if (details.open && !list.childElementCount) list.append(...g.keys.map((k) => recordRow(lang, k, counter)));
    });
    return details;
  });
  const card = el('div', { class: 'settings-card rec-card' }, [
    el('div', { class: 'set-head' }, [back, el('h2', { text: t('rec.open') })]),
    el('p', { text: t('rec.intro') }),
    el('p', { class: 'voice-warn', text: t('rec.keepNote') }),
    canRecord() ? null : el('p', { class: 'voice-warn', text: t('rec.noSupport') }),
    el('p', { class: 'rec-error voice-warn-text', attrs: { role: 'status' } }),
    row('rec.language', langChoice),
    count,
    ...sections,
  ]);
  panel.replaceChildren(card);
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
    row('settings.rest', choice(REST_OPTIONS.map((m) => [m, m ? 'settings.restMinutes' : 'settings.off', m]), s.rest, (v) => {
      updateSettings({ rest: v });
      renderSettings();
    }), 'settings.restHint'),
    voiceStatus(),
    el('h3', { class: 'set-sub', text: t('settings.levels') }),
    levelRows(),
    el('div', { class: 'set-foot' }, [
      (() => {
        const rec = el('button', { class: 'set-pill is-on', text: t('rec.open'), attrs: { type: 'button' } });
        onTap(rec, () => renderRecorder(getSettings().lang));
        return rec;
      })(),
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
    dedication('about-dedication'),
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

