// Game: Trace a letter (Tập viết). The child traces a letter or a digit with a finger.

import { t, getLang } from '../core/i18n.js';
import { speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, svgEl, answer, wait, reloadGame, iconButton } from '../core/ui.js';
import { picture } from '../core/images.js';
import { gameLevel } from '../core/state.js';
import { samplePath, advance, isDone, glyphsFor } from '../logic/trace.js';
import { soundKey, wordKey } from '../logic/letters.js';

const COLORS = ['#e0463c', '#3f6fd8', '#3fa35b', '#9b6bd6'];

export function mount(screen) {
  const level = gameLevel('trace');
  const lang = getLang();
  let alive = true;
  let glyphs = [];
  let pos = 0;
  let strokes = [];
  let current = 0;

  const svg = svgEl('svg', { viewBox: '0 0 100 120', class: 'trace-svg' });
  const board = el('div', { class: 'trace-board' }, [svg]);
  const reward = el('div', { class: 'trace-reward' });
  screen.stage.replaceChildren(el('div', { class: 'trace-layout' }, [board, reward]));
  screen.tools.replaceChildren(iconButton('next', 'ui.next', () => show(pos + 1), 'tool-btn'));

  function speech(item) {
    if (item.digit) return [{ key: `num.${item.glyph}` }];
    return [{ key: soundKey(lang, item.letter) }, { pause: 300 }, { key: wordKey(lang, item.letter) }];
  }

  function show(i) {
    pos = (i + glyphs.length) % glyphs.length;
    const item = glyphs[pos];
    reward.replaceChildren();
    svg.replaceChildren(
      svgEl('line', { x1: 4, y1: 45, x2: 96, y2: 45, class: 'trace-rule' }),
      svgEl('line', { x1: 4, y1: 95, x2: 96, y2: 95, class: 'trace-rule is-base' }),
    );
    strokes = (window.coineStrokes[item.glyph] || []).map((d, k) => {
      const guide = svgEl('path', { d, class: 'trace-guide' });
      const center = svgEl('path', { d, class: 'trace-center' });
      const done = svgEl('path', { d, class: 'trace-done', stroke: COLORS[k % COLORS.length] });
      svg.append(guide, center);
      return { d, guide, done, index: 0, points: [] };
    });
    strokes.forEach((s) => svg.append(s.done));
    const start = svgEl('g', { class: 'trace-start' });
    start.append(svgEl('circle', { r: 7, fill: '#7cb87a', stroke: '#fff', 'stroke-width': 2.5 }));
    svg.append(start);
    // The points need the paths in the document.
    for (const s of strokes) {
      const len = s.guide.getTotalLength();
      s.length = len;
      s.points = samplePath(len, (d) => s.guide.getPointAtLength(d), 4);
      s.done.setAttribute('stroke-dasharray', `0 ${len + 1}`);
    }
    current = 0;
    markStart();
    screen.say([...speech(item), { pause: 300 }, 'trace.instruction']);
  }

  function markStart() {
    const start = svg.querySelector('.trace-start');
    const s = strokes[current];
    if (!s) {
      start.style.display = 'none';
      return;
    }
    start.style.display = '';
    const p = s.points[Math.min(s.index, s.points.length - 1)];
    start.setAttribute('transform', `translate(${p.x} ${p.y})`);
  }

  function toSvg(e) {
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  let drawing = false;
  svg.addEventListener('pointerdown', (e) => {
    drawing = true;
    svg.setPointerCapture?.(e.pointerId);
    move(e);
  });
  svg.addEventListener('pointermove', (e) => { if (drawing) move(e); });
  const end = () => { drawing = false; };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  async function move(e) {
    const s = strokes[current];
    if (!s) return;
    const p = toSvg(e);
    if (!p) return;
    const next = advance(s.index, p, s.points, 15, 6);
    if (next === s.index) return;
    s.index = next;
    const part = (Math.min(s.index, s.points.length - 1) / (s.points.length - 1)) * s.length;
    s.done.setAttribute('stroke-dasharray', `${part} ${s.length + 1}`);
    markStart();
    if (!isDone(s.index, s.points)) return;
    s.done.setAttribute('stroke-dasharray', `${s.length + 1} 0`);
    sfx.snap();
    current += 1;
    markStart();
    if (current < strokes.length) return;
    // The whole glyph is done.
    drawing = false;
    const item = glyphs[pos];
    if (item.letter) reward.replaceChildren(picture(item.letter.pic, 'trace-pic'));
    const r = await answer('trace', true, board, speech(item));
    if (!alive) return;
    if (r.levelUp) return reloadGame();
    await wait(500);
    if (alive) show(pos + 1);
  }

  Promise.all([
    fetch('data/strokes.json').then((r) => r.json()),
    fetch('data/letters.json').then((r) => r.json()),
  ]).then(([strokeData, letters]) => {
    if (!alive) return;
    window.coineStrokes = strokeData;
    glyphs = glyphsFor(level, letters[lang] || letters.vi).filter((g) => strokeData[g.glyph]);
    show(0);
  });
  return () => {
    alive = false;
  };
}
