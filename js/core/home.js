// The home screen: Sỏi and one large picture button for each game.

import { t } from './i18n.js';
import { speak, stopSpeech } from './speech.js';
import { sfx } from './sound.js';
import { el, onTap, wait } from './ui.js';
import { mascot, setExpression } from './mascot.js';
import { gameIcons, LEARNING_GAMES, FOLK_GAMES, EXPLORE_GAMES } from './game-icons.js';
import { settingsButton } from './settings.js';

let opening = false;

function gameButton(id) {
  const b = el('button', {
    class: `game-btn game-btn-${id}`,
    html: gameIcons[id],
    attrs: { type: 'button', 'aria-label': t(`game.${id}.name`) },
  });
  onTap(b, async () => {
    if (opening) return;
    opening = true;
    sfx.tap();
    b.classList.add('is-chosen');
    // Speak the name of the game, then open it. Do not wait too long.
    await Promise.race([speak(`game.${id}.name`), wait(2500)]);
    opening = false;
    location.hash = `#/play/${id}`;
  });
  return b;
}

function group(titleKey, ids, className) {
  const title = el('h2', { class: 'group-title', text: t(titleKey) });
  onTap(title, () => speak(titleKey));
  return el('section', { class: `game-group ${className}` }, [
    title,
    el('div', { class: 'game-grid' }, ids.map(gameButton)),
  ]);
}

export function renderHome(container) {
  opening = false;
  const soi = mascot('happy', 'home-soi');
  soi.setAttribute('role', 'button');
  soi.setAttribute('aria-label', t('soi.name'));
  soi.tabIndex = 0;
  onTap(soi, async () => {
    stopSpeech();
    setExpression(soi, 'curious');
    soi.classList.remove('bounce');
    void soi.offsetWidth;
    soi.classList.add('bounce');
    await speak('soi.look');
    setExpression(soi, 'happy');
  });
  const header = el('header', { class: 'home-header' }, [soi, settingsButton()]);
  const root = el('div', { class: 'screen home-screen' }, [
    header,
    el('div', { class: 'home-groups' }, [
      group('home.learning', LEARNING_GAMES, 'group-learning'),
      group('home.folk', FOLK_GAMES, 'group-folk'),
      group('home.explore', EXPLORE_GAMES, 'group-explore'),
    ]),
  ]);
  container.replaceChildren(root);
  return () => {};
}
