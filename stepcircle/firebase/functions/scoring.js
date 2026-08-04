// Direct port of stepcircle/src/lib/rings.ts so the server scores
// competitions with exactly the client's rules. Keep the two in sync — this
// file is the one that counts, since clients are never trusted with points.

const ACTIVE_HOUR_STEP_THRESHOLD = 250;
const MAX_DAILY_POINTS = 600;
const DEFAULT_GOALS = { steps: 10000, activeMinutes: 30, activeHours: 12 };

function activeHours(hourlySteps, threshold = ACTIVE_HOUR_STEP_THRESHOLD) {
  return (hourlySteps || []).reduce((n, steps) => (steps >= threshold ? n + 1 : n), 0);
}

function computeRings(day, goals) {
  const g = goals || DEFAULT_GOALS;
  return {
    move: g.steps > 0 ? (day.steps || 0) / g.steps : 0,
    exercise: g.activeMinutes > 0 ? (day.activeMinutes || 0) / g.activeMinutes : 0,
    stand: g.activeHours > 0 ? activeHours(day.hourlySteps) / g.activeHours : 0,
  };
}

function ringsClosed(rings) {
  return rings.move >= 1 && rings.exercise >= 1 && rings.stand >= 1;
}

function competitionPointsForDay(rings) {
  const raw = Math.round((rings.move + rings.exercise + rings.stand) * 100);
  return Math.min(MAX_DAILY_POINTS, Math.max(0, raw));
}

function totalPoints(dailyPoints) {
  return (dailyPoints || []).reduce((a, b) => a + b, 0);
}

module.exports = {
  ACTIVE_HOUR_STEP_THRESHOLD,
  MAX_DAILY_POINTS,
  DEFAULT_GOALS,
  activeHours,
  computeRings,
  ringsClosed,
  competitionPointsForDay,
  totalPoints,
};
