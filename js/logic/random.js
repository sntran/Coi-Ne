// Random helpers. Each function takes a random function, so that tests can use a fixed seed.

/** Make a random function with a fixed seed (mulberry32). */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Get an integer from min to max. Both ends are included. */
export function randInt(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

export function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

export function shuffle(rand, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Get count different items from the list. */
export function sample(rand, list, count) {
  return shuffle(rand, list).slice(0, count);
}
