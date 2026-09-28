// Start the app: load the texts, show the Play button, and open the screens.

import { loadLanguages, setLang, t } from './core/i18n.js';
import { initSpeech, setSpeechOptions, unlockSpeech, speak, stopSpeech, onCaption, waitForVoices } from './core/speech.js';
import { unlockSound, sfx } from './core/sound.js';
import { el, onTap, gameScreen, showCaption } from './core/ui.js';
import { icons } from './core/icons.js';
import { mascot } from './core/mascot.js';
import { renderHome } from './core/home.js';
import { onSettingsChange, closeSettings } from './core/settings.js';
import { getSettings } from './core/state.js';
import { LEARNING_GAMES, FOLK_GAMES } from './core/game-icons.js';
import { loadImages } from './core/images.js';

const GAMES = new Set([...LEARNING_GAMES, ...FOLK_GAMES]);
const app = document.getElementById('app');
let cleanup = () => {};
let started = false;
let routeId = 0;

async function route(keepSettings = false) {
  const my = ++routeId;
  stopSpeech();
  if (!keepSettings) closeSettings();
  cleanup();
  cleanup = () => {};
  document.querySelectorAll('.overlay:not(.settings-layer)').forEach((o) => o.remove());
  const match = location.hash.match(/^#\/play\/([a-z]+)(?:\/(.*))?$/);
  const id = match && GAMES.has(match[1]) ? match[1] : null;
  if (!id) {
    cleanup = renderHome(app) || (() => {});
    return;
  }
  const screen = gameScreen(app, id);
  const mod = await import(`./games/${id}.js`);
  if (my !== routeId) return;
  cleanup = mod.mount(screen, { game: id, path: match[2] || '' }) || (() => {});
}

function showStart() {
  const play = el('button', {
    class: 'play-btn',
    html: icons.play,
    attrs: { type: 'button', 'aria-label': t('ui.play') },
  });
  const start = el('div', { class: 'screen start-screen' }, [
    mascot('curious', 'start-soi'),
    play,
  ]);
  app.replaceChildren(start);
  const begin = () => {
    if (started) return;
    started = true;
    // iPad browsers speak and play sounds only after a tap.
    unlockSpeech();
    unlockSound();
    sfx.happy();
    route().then(() => speak('soi.look'));
  };
  onTap(play, begin);
  play.addEventListener('click', begin);
}

async function boot() {
  const settings = getSettings();
  await Promise.all([loadLanguages(), loadImages()]);
  setLang(settings.lang);
  await initSpeech();
  setSpeechOptions({ voice: settings.voice, rate: settings.rate });
  onCaption(showCaption);
  onSettingsChange(({ lang }) => {
    if (lang) {
      setLang(lang);
      route(true);
    }
  });
  window.addEventListener('hashchange', () => {
    if (started) route();
  });
  showStart();
  waitForVoices();
}

boot();
