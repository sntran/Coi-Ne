// Game: Festivals (Lễ hội). Tết and Trung Thu, with short activities.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame, langBadge, burst, tryAgain } from '../core/ui.js';
import { picture } from '../core/images.js';
import { playStory } from '../core/story.js';
import {
  FESTIVALS, makeTray, placeFruit, makeLixi, takeLixi, makeLanterns, lightLantern,
} from '../logic/festival.js';

const COVERS = { tet: 'hoamai', trungthu: 'longdencachep' };
const ACT_PICTURES = { mam: 'mamnguqua', lixi: 'lixi', color: null, lanterns: 'denongsao' };
const STORIES = {
  tet: [{ scene: 'tet', key: 'fest.story.tet.1' }, { scene: 'tet', key: 'fest.story.tet.2' }],
  trungthu: [{ scene: 'trungthu', key: 'fest.story.trungthu.1' }, { scene: 'trungthu', key: 'fest.story.trungthu.2' }],
};

function go(path) {
  location.hash = `#/play/festival${path ? `/${path}` : ''}`;
}

function bigChoice(pic, labelKey, onPick) {
  const b = el('button', { class: 'choice fest-choice', attrs: { type: 'button', 'aria-label': t(labelKey) } }, [picture(pic), langBadge(labelKey)]);
  onTap(b, () => onPick(b));
  return b;
}

export function mount(screen, { path }) {
  const [fest, act] = path.split('/');
  let alive = true;
  let busy = false;

  async function done(anchor, extra) {
    busy = true;
    const r = await answer('festival', true, anchor, extra);
    if (!alive) return;
    if (r.levelUp) return reloadGame();
    await wait(600);
    if (alive) reloadGame();
  }

  function chooseFestival() {
    const grid = el('div', { class: 'choice-grid fest-grid' }, Object.keys(FESTIVALS).map((f) => bigChoice(COVERS[f], `fest.${f}`, async () => {
      sfx.tap();
      await speak(`fest.${f}`);
      go(f);
    })));
    screen.stage.replaceChildren(el('div', { class: 'scroll-area' }, [grid]));
    screen.say(['fest.choose']);
  }

  function chooseActivity(f) {
    const grid = el('div', { class: 'choice-grid fest-grid' }, FESTIVALS[f].map((a) => bigChoice(ACT_PICTURES[a] || COVERS[f], `fest.act.${a}`, async () => {
      sfx.tap();
      await speak(`fest.act.${a}`);
      if (a === 'color') location.hash = `#/play/coloring/group/${f}`;
      else go(`${f}/${a}`);
    })));
    screen.stage.replaceChildren(el('div', { class: 'scroll-area' }, [grid]));
    playStory(screen, `festival-${f}`, STORIES[f]).then(() => {
      if (alive) screen.say(['fest.chooseActivity']);
    });
  }

  function tray() {
    let state = makeTray();
    const plate = el('div', { class: 'fest-plate' }, [picture('mamnguqua', 'fest-plate-pic'), el('div', { class: 'fest-plate-fruits' })]);
    const choices = el('div', { class: 'fest-fruits' }, state.choices.map((fruit) => {
      const b = el('button', { class: 'choice fest-fruit', attrs: { type: 'button', 'aria-label': t(`pic.${fruit}`) } }, [picture(fruit), langBadge(`pic.${fruit}`)]);
      onTap(b, () => {
        if (busy) return;
        const r = placeFruit(state, fruit);
        if (r.event === 'wrong') {
          tryAgain(b);
          speakAll(['fest.mam.wrong']);
          return;
        }
        if (r.event === 'old') return;
        state = r.state;
        sfx.pop();
        b.classList.add('is-used');
        plate.querySelector('.fest-plate-fruits').append(picture(fruit, 'fest-on-plate'));
        speak(`pic.${fruit}`);
        if (r.done) done(plate, ['fest.mam.done']);
      });
      return b;
    }));
    screen.stage.replaceChildren(el('div', { class: 'fest-layout' }, [plate, choices]));
    screen.say(['fest.mam.intro']);
  }

  function lixi() {
    let state = makeLixi();
    const count = el('div', { class: 'big-digit fest-count', text: '0' });
    const tree = el('div', { class: 'fest-tree' }, [picture('hoamai', 'fest-tree-pic')]);
    const envelopes = el('div', { class: 'fest-envelopes' }, Array.from({ length: state.envelopes }, () => {
      const b = el('button', { class: 'choice fest-envelope', attrs: { type: 'button', 'aria-label': t('pic.lixi') } }, [picture('lixi')]);
      onTap(b, () => {
        if (busy || b.classList.contains('is-used')) return;
        const r = takeLixi(state);
        if (r.event === 'enough') {
          speak('fest.lixi.enough');
          return;
        }
        state = r.state;
        b.classList.add('is-used');
        sfx.pop();
        count.textContent = String(state.taken);
        speak(`num.${state.taken}`);
        if (r.done) done(count, ['fest.lixi.wish']);
      });
      return b;
    }));
    screen.stage.replaceChildren(el('div', { class: 'fest-layout' }, [tree, envelopes, count]));
    screen.say([{ key: 'fest.lixi.intro', params: { n: state.n } }]);
  }

  function lanterns() {
    let state = makeLanterns();
    const row = el('div', { class: 'fest-lanterns' }, state.lanterns.map((pic, i) => {
      const b = el('button', { class: 'fest-lantern', attrs: { type: 'button', 'aria-label': t(`pic.${pic}`) } }, [picture(pic)]);
      onTap(b, async () => {
        if (busy) return;
        const r = lightLantern(state, i);
        if (r.event === 'old') return;
        state = r.state;
        b.classList.add('is-lit');
        sfx.happy();
        burst(b);
        speak(`num.${state.lit.length}`);
        if (!r.done) return;
        busy = true;
        await wait(700);
        row.classList.add('is-parade');
        await speakAll(['fest.lanterns.done', { key: 'dongdao.onggiang', lang: 'vi' }]);
        if (alive) done(row, []);
      });
      return b;
    }));
    const moon = picture('fullmoon', 'fest-moon');
    screen.stage.replaceChildren(el('div', { class: 'fest-layout fest-night' }, [moon, row]));
    screen.say(['fest.lanterns.intro']);
  }

  if (!FESTIVALS[fest]) chooseFestival();
  else if (act === 'mam') tray();
  else if (act === 'lixi') lixi();
  else if (act === 'lanterns') lanterns();
  else chooseActivity(fest);
  return () => {
    alive = false;
  };
}
