// Rest time. After some minutes of play, Sỏi gets sleepy, and the app asks the child to rest.
// A parent holds the button for 3 seconds to play again.

import { speak, stopSpeech } from './speech.js';
import { el, onTap, holdButton } from './ui.js';
import { mascot } from './mascot.js';
import { getSettings } from './state.js';
import { createRestClock, tick, resume } from '../logic/rest.js';

let clock = createRestClock();
let timer = 0;

function showRest() {
  stopSpeech();
  document.querySelectorAll('.rest-layer').forEach((n) => n.remove());
  const soi = mascot('sleepy', 'rest-soi');
  const sky = `<svg viewBox="0 0 400 200" class="rest-sky" aria-hidden="true">
    <circle cx="320" cy="60" r="34" fill="#fff4c2"/><circle cx="336" cy="50" r="30" fill="#34406b"/>
    ${[[40, 40], [90, 90], [150, 30], [210, 70], [260, 20], [370, 130], [60, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff4c2"/>`).join('')}
  </svg>`;
  const layer = el('div', { class: 'overlay rest-layer is-open', attrs: { role: 'dialog', 'aria-modal': 'true' } });
  const go = holdButton('play', 'rest.continue', () => {
    clock = resume(clock, Date.now());
    layer.remove();
  }, 'rest-continue');
  onTap(soi, () => speak('rest.sleepy'));
  layer.append(el('div', { class: 'rest-card' }, [el('div', { class: 'rest-sky-wrap', html: sky }), soi, go]));
  document.body.append(layer);
  speak('rest.sleepy');
}

/** Start to count the play time. */
export function startRestClock() {
  clearInterval(timer);
  clock = createRestClock();
  timer = setInterval(() => {
    const r = tick(clock, { now: Date.now(), visible: document.visibilityState === 'visible', minutes: getSettings().rest });
    clock = r.state;
    if (r.due) showRest();
  }, 1000);
}
