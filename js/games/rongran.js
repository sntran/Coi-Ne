// Folk game: Rồng rắn lên mây. Sỏi is the head of the dragon.
// 1. The song: each tap on a friend adds the friend to the tail, and sings one line.
// 2. The talk with the doctor: "Con lên mấy?" The child answers 1, 2, 3, … 10.
// 3. The chase: the head follows the finger, and the doctor runs to the tail.

import { t } from '../core/i18n.js';
import { speak, speakAll } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, answer, wait, reloadGame, langBadge } from '../core/ui.js';
import { playStory } from '../core/story.js';
import { mascotMarkup } from '../core/mascot.js';
import { gameLevel } from '../core/state.js';
import { SONG_LINES, AGES, ageChoices, follow, stepToward, doctorMove, isCaught, chaseTime, doctorSpeed } from '../logic/rongran.js';

const INK = '#3b2a2a';
const SKIN = '#f2c7a5';
const STORY = [
  { scene: 'village', key: 'story.rongran.1' },
  { scene: 'rongran', key: 'story.rongran.2' },
  { scene: 'soi', key: 'story.rongran.3' },
];
const FRIENDS = [
  { shirt: '#e0463c', hair: 'buns' },
  { shirt: '#3fa35b', hair: 'short' },
  { shirt: '#f58fb8', hair: 'bob' },
  { shirt: '#9b6bd6', hair: 'short' },
];
// Where the friends wait before they join, in parts of the yard.
const WAIT_AT = [[0.18, 0.22], [0.5, 0.18], [0.2, 0.8], [0.5, 0.84]];

function kidMarkup({ shirt, hair }) {
  const hairShape = {
    buns: `<path d="M-19 -6 Q-18 -32 0 -31 Q19 -32 19 -6 Q9 -20 0 -19 Q-9 -20 -19 -6 Z" fill="${INK}"/><circle cx="-17" cy="-27" r="8" fill="${INK}"/><circle cx="17" cy="-27" r="8" fill="${INK}"/>`,
    short: `<path d="M-19 -8 Q-18 -32 0 -31 Q19 -32 19 -8 Q9 -22 -2 -20 Q-11 -20 -19 -8 Z" fill="${INK}"/>`,
    bob: `<path d="M-21 2 Q-22 -32 0 -32 Q22 -32 21 2 L15 4 Q14 -18 0 -18 Q-14 -18 -15 4 Z" fill="${INK}"/>`,
  }[hair];
  return `<svg viewBox="-34 -40 68 104" aria-hidden="true">
    <path d="M-9 44 L-10 60 M9 44 L10 60" stroke="#3f6fd8" stroke-width="9" stroke-linecap="round"/>
    <path d="M-16 18 L-28 30 M16 18 L28 30" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>
    <rect x="-17" y="12" width="34" height="36" rx="11" fill="${shirt}" stroke="${INK}" stroke-width="3"/>
    <circle cx="0" cy="-6" r="19" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>${hairShape}
    <circle cx="-7" cy="-5" r="2.6" fill="${INK}"/><circle cx="7" cy="-5" r="2.6" fill="${INK}"/>
    <path d="M-6 4 Q0 9 6 4" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
}

function doctorMarkup() {
  return `<svg viewBox="-40 -52 80 118" aria-hidden="true">
    <path d="M-10 46 L-11 62 M10 46 L11 62" stroke="#9c6b43" stroke-width="10" stroke-linecap="round"/>
    <path d="M-18 18 L-32 34 M18 18 L32 34" stroke="${SKIN}" stroke-width="8" stroke-linecap="round"/>
    <rect x="-20" y="10" width="40" height="40" rx="12" fill="#f4ecd8" stroke="${INK}" stroke-width="3"/>
    <circle cx="0" cy="-8" r="20" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
    <path d="M-12 2 Q0 26 12 2 Q0 8 -12 2 Z" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
    <path d="M-30 -22 L0 -44 L30 -22 Z" fill="#ecc98f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="-7" cy="-10" r="2.6" fill="${INK}"/><circle cx="7" cy="-10" r="2.6" fill="${INK}"/>
    <path d="M-12 -17 h7 M5 -17 h7" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

export function mount(screen) {
  const level = gameLevel('rongran');
  let alive = true;
  let frame = 0;
  let phase = 'song';
  let joined = 0;
  let age = 1;
  let busy = false;

  const yard = el('div', { class: 'rr-yard' });
  const head = el('div', { class: 'rr-member rr-head', html: mascotMarkup('happy') });
  const doctor = el('div', { class: 'rr-member rr-doctor', html: doctorMarkup(), attrs: { 'aria-label': t('rongran.doctor'), role: 'img' } });
  const bubble = el('div', { class: 'rr-bubble', attrs: { lang: 'vi' } });
  const panel = el('div', { class: 'rr-panel' });
  const timeBar = el('div', { class: 'rr-time' }, [el('span')]);
  const friends = FRIENDS.map((f) => el('button', { class: 'rr-member rr-friend', html: kidMarkup(f), attrs: { type: 'button', 'aria-label': t('rongran.friend') } }));
  yard.append(timeBar, doctor, head, ...friends, bubble, panel);
  screen.stage.replaceChildren(el('div', { class: 'rr-layout' }, [yard]));

  // The places of the members, in pixels. The head is first.
  let chain = [];
  let doc = { x: 0, y: 0 };

  function size() {
    const r = yard.getBoundingClientRect();
    return { w: r.width, h: r.height, gap: Math.min(64, r.width * 0.12) };
  }

  function put(node, p) {
    node.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
  }

  function line() {
    return [head, ...friends.slice(0, joined)];
  }

  function lineUp() {
    const { w, h, gap } = size();
    chain = line().map((_, i) => ({ x: w * 0.62 - i * gap, y: h * 0.5 }));
    line().forEach((node, i) => put(node, chain[i]));
    doc = { x: w * 0.88, y: h * 0.5 };
    put(doctor, doc);
  }

  function say(node, key, params) {
    bubble.textContent = t(key, params, 'vi');
    const r = node.getBoundingClientRect();
    const y = yard.getBoundingClientRect();
    bubble.style.left = `${Math.min(Math.max(r.left - y.left + r.width / 2, 90), y.width - 90)}px`;
    bubble.style.top = `${Math.max(r.top - y.top - 8, 40)}px`;
    bubble.classList.add('is-on');
    return speakAll([{ key, params, lang: 'vi' }]);
  }

  function start() {
    phase = 'song';
    joined = 0;
    age = 1;
    busy = false;
    const { w, h } = size();
    friends.forEach((f, i) => {
      f.classList.remove('is-joined');
      f.disabled = false;
      put(f, { x: w * WAIT_AT[i][0], y: h * WAIT_AT[i][1] });
    });
    panel.replaceChildren();
    bubble.classList.remove('is-on');
    timeBar.classList.remove('is-on');
    yard.classList.remove('is-chase');
    lineUp();
    screen.say(['rongran.join']);
  }

  friends.forEach((f) => onTap(f, async () => {
    if (phase !== 'song' || busy || f.classList.contains('is-joined')) return;
    busy = true;
    // The friend moves to the end of the line. The order of the friends does not matter.
    const i = friends.indexOf(f);
    const j = joined;
    [friends[i], friends[j]] = [friends[j], friends[i]];
    joined += 1;
    f.classList.add('is-joined');
    f.disabled = true;
    sfx.pop();
    lineUp();
    await say(head, `dongdao.rongran.${joined}`);
    if (!alive) return;
    busy = false;
    if (joined === SONG_LINES) talk();
  }));

  async function talk() {
    phase = 'talk';
    busy = true;
    await say(doctor, 'dongdao.rongran.home');
    if (!alive) return;
    await say(doctor, 'dongdao.rongran.where');
    if (!alive) return;
    await say(head, 'dongdao.rongran.medicine');
    if (!alive) return;
    askAge();
  }

  async function askAge() {
    await say(doctor, 'dongdao.rongran.howOld');
    if (!alive) return;
    busy = false;
    panel.replaceChildren(...ageChoices(level, age).map((n) => {
      const b = el('button', { class: `choice rr-number ${level < 2 && n === age ? 'is-next' : ''} ${n < age ? 'is-said' : ''}`, attrs: { type: 'button', 'aria-label': t(`num.${n}`) } }, [
        el('span', { class: 'big-digit', text: String(n) }),
        langBadge(`num.${n}`),
      ]);
      onTap(b, () => pickAge(n, b));
      return b;
    }));
    screen.setInstruction(['rongran.ask']);
  }

  async function pickAge(n, b) {
    if (busy || phase !== 'talk') return;
    if (n !== age) {
      b.classList.remove('wiggle');
      void b.offsetWidth;
      b.classList.add('wiggle');
      speak('rongran.ask');
      return;
    }
    busy = true;
    sfx.tap();
    panel.replaceChildren();
    await say(head, 'dongdao.rongran.age', { n: { key: `num.${n}` } });
    if (!alive) return;
    if (age < AGES) {
      await say(doctor, 'dongdao.rongran.notGood');
      if (!alive) return;
      age += 1;
      askAge();
      return;
    }
    await say(doctor, 'dongdao.rongran.good');
    for (const [who, key] of [[doctor, 'head'], [head, 'headAnswer'], [doctor, 'middle'], [head, 'middleAnswer'], [doctor, 'tail'], [head, 'tailAnswer']]) {
      if (!alive) return;
      await say(who, `dongdao.rongran.${key}`);
    }
    if (alive) chase();
  }

  // The chase. The finger moves the head. The doctor runs to the tail.
  let target = null;
  // After each catch, the doctor runs a little slower, so a small child can win.
  let slow = 1;
  function chase() {
    phase = 'chase';
    busy = false;
    yard.classList.add('is-chase');
    bubble.classList.remove('is-on');
    lineUp();
    target = { ...chain[0] };
    screen.say(['rongran.chase']);
    const total = chaseTime(level);
    timeBar.classList.add('is-on');
    let last = performance.now();
    const begin = last + 1200;
    const tick = (now) => {
      if (!alive || phase !== 'chase') return;
      // The time of the first frame can be a little before the start.
      const dt = Math.max(0, Math.min(50, now - last)) / 1000;
      last = now;
      const { w, h, gap } = size();
      const short = Math.min(w, h);
      chain = follow(chain, stepToward(chain[0], target, short * 1.1 * dt), gap);
      if (now > begin) {
        // The head and the body block the doctor. Only the tail can be caught.
        doc = doctorMove(doc, chain, short * doctorSpeed(level) * slow * dt, gap * 0.9);
      }
      line().forEach((node, i) => put(node, chain[i]));
      put(doctor, doc);
      const left = Math.max(0, total - Math.max(0, now - begin));
      timeBar.firstChild.style.width = `${(left / total) * 100}%`;
      if (isCaught(chain[chain.length - 1], doc, gap * 0.55)) return caughtTail();
      if (left <= 0) return safe();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  function pointAt(e) {
    const r = yard.getBoundingClientRect();
    target = { x: Math.min(r.width - 20, Math.max(20, e.clientX - r.left)), y: Math.min(r.height - 20, Math.max(20, e.clientY - r.top)) };
  }
  yard.addEventListener('pointerdown', (e) => {
    if (phase !== 'chase') return;
    e.preventDefault();
    yard.setPointerCapture?.(e.pointerId);
    pointAt(e);
  });
  yard.addEventListener('pointermove', (e) => {
    if (phase === 'chase' && e.buttons !== 0) pointAt(e);
  });

  async function caughtTail() {
    phase = 'caught';
    slow = Math.max(0.4, slow * 0.75);
    timeBar.classList.remove('is-on');
    sfx.down();
    await speak('rongran.caught');
    // Play the chase again. The child does not sing and count again.
    if (alive) chase();
  }

  async function safe() {
    phase = 'done';
    slow = 1;
    timeBar.classList.remove('is-on');
    const res = await answer('rongran', true, head, ['rongran.safe']);
    if (!alive) return;
    if (res.levelUp) return reloadGame();
    await wait(400);
    if (alive) start();
  }

  playStory(screen, 'rongran', STORY).then(() => {
    if (alive) start();
  });
  return () => {
    alive = false;
    cancelAnimationFrame(frame);
  };
}
