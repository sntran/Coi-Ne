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

// Sounds of the musical instruments. The notes use the Vietnamese five-note scale
// (hò, xự, xang, xê, cống), close to C, D, F, G, and A.

export const SCALE = [261.63, 293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 784.0, 880.0, 1046.5];

function noiseBuffer(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function envelope(g, t0, attack, peak, decay) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

export const instruments = {
  /** Đàn t'rưng: a bamboo tube. A short and woody sound. */
  trung(freq) {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    for (const [mult, gain] of [[1, 0.3], [2.76, 0.06], [5.4, 0.02]]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      envelope(g, t0, 0.005, gain, mult === 1 ? 0.7 : 0.2);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.9);
    }
  },
  /** Trống: the skin of the drum. */
  drum() {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(130, t0);
    osc.frequency.exponentialRampToValueAtTime(48, t0 + 0.45);
    envelope(g, t0, 0.005, 0.6, 0.5);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.6);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.1);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const ng = ctx.createGain();
    envelope(ng, t0, 0.002, 0.2, 0.08);
    src.connect(f).connect(ng).connect(ctx.destination);
    src.start(t0);
  },
  /** Trống: the wooden rim of the drum. A short "cắc" sound. */
  rim() {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.06);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2200;
    f.Q.value = 3;
    const g = ctx.createGain();
    envelope(g, t0, 0.001, 0.5, 0.05);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t0);
    tone(1500, 0, 0.05, { type: 'square', gain: 0.03 });
  },
  /** Sáo trúc: the flute. The sound lasts until stop() is called. */
  flute(freq) {
    if (!ctx) return { stop() {} };
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.5;
    const vibGain = ctx.createGain();
    vibGain.gain.value = freq * 0.012;
    vib.connect(vibGain).connect(osc.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.08);
    const breath = ctx.createBufferSource();
    breath.buffer = noiseBuffer(2);
    breath.loop = true;
    const bf = ctx.createBiquadFilter();
    bf.type = 'bandpass';
    bf.frequency.value = freq * 2;
    const bg = ctx.createGain();
    bg.gain.value = 0.015;
    breath.connect(bf).connect(bg).connect(ctx.destination);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    vib.start(t0);
    breath.start(t0);
    return {
      stop() {
        const t1 = ctx.currentTime;
        g.gain.cancelScheduledValues(t1);
        g.gain.setValueAtTime(g.gain.value, t1);
        g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.12);
        bg.gain.setValueAtTime(0.0001, t1 + 0.1);
        osc.stop(t1 + 0.15);
        vib.stop(t1 + 0.15);
        breath.stop(t1 + 0.15);
      },
    };
  },
  /** Đàn bầu: pluck the string. bend(ratio) changes the pitch while the string sounds. */
  bau(freq) {
    if (!ctx) return { bend() {} };
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2400, t0);
    f.frequency.exponentialRampToValueAtTime(500, t0 + 1.5);
    const g = ctx.createGain();
    envelope(g, t0, 0.01, 0.2, 2.2);
    osc.connect(f).connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 2.4);
    return {
      bend(ratio) {
        osc.frequency.setTargetAtTime(freq * ratio, ctx.currentTime, 0.05);
      },
    };
  },
};

/** True when the device can play the sounds of the games. */
export function hasSound() {
  return Boolean(ctx);
}

/**
 * The call of a goat: "beee". A buzzy tone that shakes fast, like the voice of a goat.
 * @param {number} gain the loudness, from 0 to 1
 * @param {number} pan from -1 (left) to 1 (right)
 */
export function bleat(gain = 0.5, pan = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const dur = 0.55;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(470, t0);
  osc.frequency.linearRampToValueAtTime(420, t0 + dur);
  // The fast shake of the voice.
  const shake = ctx.createOscillator();
  shake.frequency.value = 11;
  const shakeDepth = ctx.createGain();
  shakeDepth.gain.value = 0.5;
  const amp = ctx.createGain();
  amp.gain.value = 0.5;
  shake.connect(shakeDepth).connect(amp.gain);
  const nose = ctx.createBiquadFilter();
  nose.type = 'bandpass';
  nose.frequency.value = 1300;
  nose.Q.value = 1.4;
  const soft = ctx.createBiquadFilter();
  soft.type = 'lowpass';
  soft.frequency.value = 3200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.9 * gain), t0 + 0.06);
  g.gain.setValueAtTime(0.9 * gain, t0 + dur - 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let out = g;
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    out = p;
  }
  osc.connect(amp).connect(nose).connect(soft).connect(g);
  out.connect(ctx.destination);
  osc.start(t0);
  shake.start(t0);
  osc.stop(t0 + dur + 0.05);
  shake.stop(t0 + dur + 0.05);
}
