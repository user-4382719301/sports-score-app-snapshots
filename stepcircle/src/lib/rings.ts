import {
  ACTIVE_HOUR_STEP_THRESHOLD,
  MAX_DAILY_POINTS,
  type DailyActivity,
  type Goals,
  type RingProgress,
} from '../types';

/** Hours in which the wearer took at least the threshold number of steps. */
export function activeHours(
  hourlySteps: number[],
  threshold: number = ACTIVE_HOUR_STEP_THRESHOLD
): number {
  return hourlySteps.reduce((n, steps) => (steps >= threshold ? n + 1 : n), 0);
}

/**
 * Ring fill fractions for a day. Values exceed 1 when a goal is beaten,
 * mirroring how Apple Fitness lets rings "wrap".
 */
export function computeRings(activity: DailyActivity, goals: Goals): RingProgress {
  return {
    move: goals.steps > 0 ? activity.steps / goals.steps : 0,
    exercise: goals.activeMinutes > 0 ? activity.activeMinutes / goals.activeMinutes : 0,
    stand: goals.activeHours > 0 ? activeHours(activity.hourlySteps) / goals.activeHours : 0,
  };
}

export function ringsClosed(rings: RingProgress): boolean {
  return rings.move >= 1 && rings.exercise >= 1 && rings.stand >= 1;
}

/**
 * Competition scoring, borrowed from Apple Watch competitions: one point per
 * percentage point of ring fill (rings can overfill), capped per day.
 */
export function competitionPointsForDay(rings: RingProgress): number {
  const raw = Math.round((rings.move + rings.exercise + rings.stand) * 100);
  return Math.min(MAX_DAILY_POINTS, Math.max(0, raw));
}

export function totalPoints(dailyPoints: number[]): number {
  return dailyPoints.reduce((a, b) => a + b, 0);
}
