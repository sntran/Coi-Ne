// Folk game 10: Oẳn tù tì (rock, paper, scissors). The child plays against Sỏi.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, wait, langBadge, celebrate } from '../core/ui.js';
import { mascot, setExpression } from '../core/mascot.js';
import { picture } from '../core/images.js';
import { playStory } from '../core/story.js';
import { HANDS, outcome, reasonKey, soiHand } from '../logic/oantuti.js';

const PICTURE = { bua: 'rock', bao: 'paper', keo: 'scissors' };
const STORY = [
  { scene: 'village', key: 'story.oantuti.1' },
  { scene: 'oantuti', key: 'story.oantuti.2' },
  { scene: 'soi', key: 'story.oantuti.3' },
];

export function mount(screen) {
  let alive = true;
  let accepting = false;

  const soi = mascot('happy', 'ott-soi');
  const soiHandBox = el('div', { class: 'ott-hand is-soi' }, [picture('rock')]);
  const kidHandBox = el('div', { class: 'ott-hand is-kid' }, [picture('rock')]);
  const chant = el('div', { class: 'rhyme-text', attrs: { lang: 'vi' } });
  const reason = el('div', { class: 'ott-reason' });
  const arena = el('div', { class: 'ott-arena' }, [
    el('div', { class: 'ott-side' }, [soi, soiHandBox]),
    reason,
    el('div', { class: 'ott-side' }, [kidHandBox]),
  ]);
  const choices = el('div', { class: 'ott-choices' }, HANDS.map((h) => {
    const b = el('button', { class: 'choice ott-choice', attrs: { type: 'button', 'aria-label': t(`oantuti.hand.${h}`) } }, [
      picture(PICTURE[h]),
      langBadge(`oantuti.hand.${h}`),
    ]);
    onTap(b, () => choose(h, b));
    return b;
  }));
  const layout = el('div', { class: 'ott-layout' }, [arena, chant, choices]);

  function showHand(box, hand) {
    box.replaceChildren(picture(PICTURE[hand]));
  }

  async function round() {
    accepting = false;
    arena.classList.remove('is-shown', 'kid-wins', 'soi-wins');
    reason.replaceChildren();
    showHand(soiHandBox, 'bua');
    showHand(kidHandBox, 'bua');
    setExpression(soi, 'curious');
    arena.classList.add('is-shaking');
    chant.textContent = t('dongdao.oantuti', undefined, 'vi');
    chant.classList.add('is-on');
    await speakAll([{ key: 'dongdao.oantuti', lang: 'vi' }]);
    chant.classList.remove('is-on');
    arena.classList.remove('is-shaking');
    if (!alive) return;
    accepting = true;
    screen.say('oantuti.choose');
  }

  async function choose(hand, button) {
    if (!accepting) return;
    accepting = false;
    sfx.tap();
    button.classList.add('bounce');
    setTimeout(() => button.classList.remove('bounce'), 500);
    const other = soiHand();
    showHand(kidHandBox, hand);
    showHand(soiHandBox, other);
    arena.classList.add('is-shown');
    sfx.flip();
    const result = outcome(hand, other);
    // Show which hand wins and why.
    const why = reasonKey(hand, other);
    reason.replaceChildren(el('div', { class: 'ott-why', text: t(why) }));
    if (result === 'win') arena.classList.add('kid-wins');
    if (result === 'lose') arena.classList.add('soi-wins');
    await speakAll([{ key: 'oantuti.soiShows', params: { h: { key: `oantuti.hand.${other}` } } }, { key: why }]);
    if (!alive) return;
    if (result === 'win') {
      setExpression(soi, 'happy');
      await celebrate(kidHandBox, ['oantuti.kidWins']);
    } else if (result === 'lose') {
      setExpression(soi, 'happy');
      await speak('oantuti.soiWins');
    } else {
      setExpression(soi, 'thinking');
      await speak('oantuti.tie');
    }
    await wait(900);
    if (alive) round();
  }

  screen.stage.replaceChildren(layout);
  playStory(screen, 'oantuti', STORY).then(() => {
    if (alive) round();
  });
  return () => {
    alive = false;
  };
}
