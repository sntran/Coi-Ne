// Short sounds made with the Web Audio API. The site uses no sound files from other sources.

let ctx = null;

export function unlockSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq, start, dur, { type = 'sine', gain = 0.18, slide = 0 } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** A soft tap. */
  tap() { tone(660, 0, 0.08, { type: 'triangle', gain: 0.08 }); },
  /** A happy sound for a correct answer. */
  happy() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.28, { type: 'triangle', gain: 0.14 }));
  },
  /** A longer sound for a star. */
  star() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) => tone(f, i * 0.1, 0.4, { type: 'sine', gain: 0.14 }));
  },
  /** A small pop when a color fills an area. */
  pop() { tone(420, 0, 0.12, { type: 'sine', gain: 0.14, slide: 1.8 }); },
  /** A pebble falls into a square. */
  pebble() { tone(900, 0, 0.07, { type: 'triangle', gain: 0.1, slide: 0.6 }); },
  /** A card turns over. */
  flip() { tone(300, 0, 0.12, { type: 'sine', gain: 0.1, slide: 1.6 }); },
  /** A shape snaps into its place. */
  snap() { tone(700, 0, 0.06, { type: 'square', gain: 0.05 }); tone(1050, 0.06, 0.1, { type: 'triangle', gain: 0.1 }); },
  /** A ball goes up. */
  up() { tone(300, 0, 0.35, { type: 'sine', gain: 0.1, slide: 2.2 }); },
  /** A ball comes down. */
  down() { tone(660, 0, 0.3, { type: 'sine', gain: 0.1, slide: 0.45 }); },
};
