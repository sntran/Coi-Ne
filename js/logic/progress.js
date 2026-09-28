// Level progress for each game. These functions do not use the DOM.

export const STREAK_FOR_STAR = 5;

export const MAX_LEVELS = Object.freeze({
  coloring: 1,
  numbers: 4,
  patterns: 9,
  shapes: 3,
  sorting: 2,
  letters: 3,
  memory: 4,
  oanquan: 3,
  taptamvong: 3,
  oantuti: 1,
  choichuyen: 3,
  tones: 3,
  trace: 2,
  dots: 2,
});

export function emptyProgress() {
  return { games: {} };
}

export function normalizeProgress(raw) {
  const progress = emptyProgress();
  const games = raw && typeof raw === 'object' && raw.games && typeof raw.games === 'object' ? raw.games : {};
  for (const id of Object.keys(MAX_LEVELS)) {
    const g = games[id] || {};
    progress.games[id] = {
      level: clampLevel(id, g.level),
      streak: Math.max(0, Math.floor(Number(g.streak) || 0)),
      stars: Math.max(0, Math.floor(Number(g.stars) || 0)),
    };
  }
  return progress;
}

export function clampLevel(game, level) {
  const max = MAX_LEVELS[game] || 1;
  const n = Math.floor(Number(level) || 1);
  return Math.min(max, Math.max(1, n));
}

function gameState(progress, game) {
  return progress.games[game] || { level: 1, streak: 0, stars: 0 };
}

export function getLevel(progress, game) {
  return clampLevel(game, gameState(progress, game).level);
}

export function setLevel(progress, game, level) {
  const g = gameState(progress, game);
  return {
    ...progress,
    games: { ...progress.games, [game]: { ...g, level: clampLevel(game, level), streak: 0 } },
  };
}

/**
 * Record one answer.
 * A wrong answer sets the streak to 0. It does not take away stars.
 * After STREAK_FOR_STAR correct answers in a row, the child gets a star.
 * @returns {{progress: object, star: boolean, suggestNext: boolean}}
 */
export function recordAnswer(progress, game, correct) {
  const g = gameState(progress, game);
  let streak = correct ? g.streak + 1 : 0;
  let stars = g.stars;
  let star = false;
  if (streak >= STREAK_FOR_STAR) {
    star = true;
    stars += 1;
    streak = 0;
  }
  const level = clampLevel(game, g.level);
  const suggestNext = star && level < (MAX_LEVELS[game] || 1);
  return {
    progress: { ...progress, games: { ...progress.games, [game]: { level, streak, stars } } },
    star,
    suggestNext,
  };
}
