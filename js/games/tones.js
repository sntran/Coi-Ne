// Game: Tones (Thanh điệu). The syllables are always in Vietnamese.

import { t } from '../core/i18n.js';
import { speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame, langBadge, iconButton } from '../core/ui.js';
import { icons } from '../core/icons.js';
import { picture } from '../core/images.js';
import { gameLevel } from '../core/state.js';
import { TONES, makeQuestion, checkTone, wordKey } from '../logic/tones.js';

const INK = '#3b2a2a';
// A picture of the movement of the voice for each tone. The hand follows the arrow.
const GESTURE = {
  ngang: 'M14 32 H86',
  sac: 'M18 52 L82 10',
  huyen: 'M18 10 L82 52',
  hoi: 'M26 22 Q44 2 62 16 Q74 28 54 36 Q48 40 50 52',
  nga: 'M12 36 Q26 12 42 32 T72 26 L86 14',
  nang: 'M22 18 L48 44',
};
const COLORS = { ngang: '#7cb87a', sac: '#e0463c', huyen: '#3f6fd8', hoi: '#9b6bd6', nga: '#f7923a', nang: '#9c6b43' };

function gesture(tone) {
  const end = tone === 'nang' ? `<circle cx="56" cy="52" r="9" fill="${COLORS[tone]}"/>` : '';
  return `<svg viewBox="0 0 100 64" class="tone-gesture" aria-hidden="true">
    <path d="${GESTURE[tone]}" pathLength="100" fill="none" stroke="#e7d7c3" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${GESTURE[tone]}" pathLength="100" class="tone-path" fill="none" stroke="${COLORS[tone]}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    ${end}<circle r="6" fill="${INK}" class="tone-dot"><animateMotion dur="0.9s" fill="freeze" begin="indefinite" path="${GESTURE[tone]}"/></circle></svg>`;
}

function play(node) {
  node.classList.remove('is-playing');
  void node.offsetWidth;
  node.classList.add('is-playing');
  node.querySelector('animateMotion')?.beginElement?.();
}

export function mount(screen) {
  const level = gameLevel('tones');
  let alive = true;
  let busy = false;

  const say = (key, extra = []) => speakAll([{ key, lang: 'vi' }, ...extra]);

  function explore(family) {
    const heard = new Set();
    const grid = el('div', { class: 'tone-grid' });
    for (const tone of TONES) {
      const key = wordKey(family.id, tone);
      const pic = family.pics[tone];
      const card = el('button', { class: 'choice tone-card', attrs: { type: 'button', 'aria-label': t(`tones.name.${tone}`) } }, [
        el('div', { class: 'tone-gesture-wrap', html: gesture(tone) }),
        el('span', { class: 'tone-word', text: t(key, undefined, 'vi'), attrs: { lang: 'vi' } }),
        pic ? picture(pic, 'tone-pic') : null,
        pic ? langBadge(key) : null,
      ]);
      onTap(card, async () => {
        sfx.tap();
        play(card);
        await say(key, [{ pause: 300 }, { key: `tones.name.${tone}` }]);
        heard.add(tone);
        if (heard.size === TONES.length && !busy && alive) {
          busy = true;
          const r = await answer('tones', true, grid);
          if (!alive) return;
          if (r.levelUp) return reloadGame();
          busy = false;
          heard.clear();
        }
      });
      grid.append(card);
    }
    screen.stage.replaceChildren(el('div', { class: 'tone-layout' }, [grid]));
    screen.tools.replaceChildren(iconButton('next', 'tones.nextFamily', () => explore(makeQuestion(1).family), 'tool-btn'));
    screen.say(['tones.intro']);
  }

  function ask() {
    busy = false;
    const q = makeQuestion(level);
    const prompt = q.level === 2
      ? [{ key: 'tones.pickWord' }, { key: q.answer.key, lang: 'vi' }]
      : [{ key: 'tones.pickTone' }, { key: wordKey(q.family.id, q.answer), lang: 'vi' }];
    const ear = el('button', { class: 'letter-listen', html: `<div class="icon-big">${icons.speaker}</div>`, attrs: { type: 'button', 'aria-label': t('ui.repeat') } });
    onTap(ear, () => speakAll(prompt));
    const choices = q.choices.map((choice) => {
      const isWord = q.level === 2;
      const tone = isWord ? choice.tone : choice;
      const b = el('button', { class: `choice ${isWord ? 'tone-pic-choice' : 'tone-card is-plain'}`, attrs: { type: 'button', 'aria-label': t(`tones.name.${tone}`) } }, isWord
        ? [picture(choice.pic), langBadge(choice.key)]
        : [el('div', { class: 'tone-gesture-wrap', html: gesture(tone) })]);
      onTap(b, async () => {
        if (busy) return;
        busy = true;
        sfx.tap();
        play(b);
        const correct = checkTone(q, choice);
        const extra = correct
          ? (isWord ? [{ key: q.answer.key, lang: 'vi' }] : [{ key: wordKey(q.family.id, q.answer), lang: 'vi' }, { key: `tones.name.${q.answer}` }])
          : [];
        const r = await answer('tones', correct, b, extra);
        if (!alive) return;
        if (r.levelUp) return reloadGame();
        if (correct) {
          await wait(500);
          if (alive) ask();
        } else busy = false;
      });
      return b;
    });
    screen.stage.replaceChildren(el('div', { class: 'tone-layout is-quiz' }, [ear, el('div', { class: 'tone-choices' }, choices)]));
    screen.say(prompt);
  }

  if (level <= 1) explore(makeQuestion(1).family);
  else ask();
  return () => {
    alive = false;
  };
}
