// Game: Feelings (Cảm xúc). Sỏi shows six feelings.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame, langBadge } from '../core/ui.js';
import { mascot, mascotMarkup, setExpression } from '../core/mascot.js';
import { picture } from '../core/images.js';
import { gameLevel } from '../core/state.js';
import { FEELINGS, FACES, makeQuestion, checkFeeling } from '../logic/feelings.js';

function faceButton(feeling, onPick) {
  const b = el('button', { class: 'choice feel-face', html: mascotMarkup(FACES[feeling]), attrs: { type: 'button', 'aria-label': t(`feel.${feeling}`) } });
  b.append(langBadge(`feel.${feeling}`));
  onTap(b, () => onPick(feeling, b));
  return b;
}

export function mount(screen) {
  const level = gameLevel('feelings');
  let alive = true;
  let busy = false;

  function meet() {
    const big = mascot('happy', 'feel-big');
    const met = new Set();
    const faces = FEELINGS.map((f) => faceButton(f, async (feeling, b) => {
      sfx.tap();
      setExpression(big, FACES[feeling]);
      big.classList.remove('bounce');
      void big.offsetWidth;
      big.classList.add('bounce');
      await speakAll([{ key: `feel.${feeling}` }, { pause: 200 }, { key: `feel.about.${feeling}` }]);
      met.add(feeling);
      if (met.size === FEELINGS.length && !busy && alive) {
        busy = true;
        const r = await answer('feelings', true, b, ['feel.okay']);
        if (!alive) return;
        if (r.levelUp) return reloadGame();
        met.clear();
        busy = false;
      }
    }));
    screen.stage.replaceChildren(el('div', { class: 'feel-layout' }, [big, el('div', { class: 'feel-faces' }, faces)]));
    screen.say(['feel.meet']);
  }

  function story() {
    busy = false;
    const q = makeQuestion(2);
    const big = mascot('curious', 'feel-big is-small');
    const scene = el('div', { class: 'feel-story' }, [picture(q.story.pic, 'feel-story-pic'), big]);
    onTap(scene, () => speakAll([{ key: `feel.story.${q.story.id}` }, 'feel.ask']));
    const faces = q.choices.map((f) => faceButton(f, async (feeling, b) => {
      if (busy) return;
      busy = true;
      sfx.tap();
      const correct = checkFeeling(q, feeling);
      if (correct) setExpression(big, FACES[feeling]);
      const r = await answer('feelings', correct, b, correct ? [{ key: `feel.about.${feeling}` }] : []);
      if (!alive) return;
      if (r.levelUp) return reloadGame();
      if (correct) {
        await wait(600);
        if (alive) story();
      } else busy = false;
    }));
    screen.stage.replaceChildren(el('div', { class: 'feel-layout' }, [scene, el('div', { class: 'feel-faces is-three' }, faces)]));
    screen.say([{ key: `feel.story.${q.story.id}` }, 'feel.ask']);
  }

  function breathe() {
    const q = makeQuestion(3);
    const balloon = el('button', { class: 'feel-balloon', attrs: { type: 'button', 'aria-label': t('feel.in') } });
    const big = mascot('happy', 'feel-big is-small');
    const layout = el('div', { class: 'feel-layout is-breathe' }, [balloon, big]);
    screen.stage.replaceChildren(layout);
    let running = false;
    onTap(balloon, async () => {
      if (running) return;
      running = true;
      setExpression(big, 'happy');
      for (let i = 0; i < q.breaths && alive; i++) {
        balloon.classList.remove('is-out');
        balloon.classList.add('is-in');
        speak('feel.in');
        await wait(4000);
        if (!alive) return;
        balloon.classList.remove('is-in');
        balloon.classList.add('is-out');
        speak('feel.out');
        await wait(4500);
      }
      if (!alive) return;
      balloon.classList.remove('is-out');
      setExpression(big, 'happy');
      const r = await answer('feelings', true, balloon, ['feel.calm']);
      if (!alive) return;
      if (r.levelUp) return reloadGame();
      running = false;
      screen.say(['feel.breatheIntro']);
    });
    screen.say(['feel.breatheIntro']);
  }

  if (level <= 1) meet();
  else if (level === 2) story();
  else breathe();
  return () => {
    alive = false;
  };
}
