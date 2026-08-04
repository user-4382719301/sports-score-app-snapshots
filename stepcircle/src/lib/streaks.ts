import type { DailyActivity, Goals } from '../types';
import { computeRings, ringsClosed } from './rings';

function metStepGoal(day: DailyActivity, goals: Goals): boolean {
  return day.steps >= goals.steps;
}

/**
 * Consecutive days (ending with the most recent entry) on which the step goal
 * was met. An unfinished "today" doesn't break the streak — it just doesn't
 * extend it yet, matching how Apple Fitness treats the current day.
 *
 * @param history oldest-first daily activity, last entry = today
 */
export function currentStreak(history: DailyActivity[], goals: Goals): number {
  if (history.length === 0) return 0;
  let streak = 0;
  let i = history.length - 1;
  if (metStepGoal(history[i], goals)) {
    streak++;
  }
  i--; // today handled above (counted only if already met)
  for (; i >= 0; i--) {
    if (metStepGoal(history[i], goals)) streak++;
    else break;
  }
  return streak;
}

/** Longest step-goal streak anywhere in history. */
export function longestStreak(history: DailyActivity[], goals: Goals): number {
  let best = 0;
  let run = 0;
  for (const day of history) {
    run = metStepGoal(day, goals) ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/**
 * Number of complete 7-day windows (aligned to the end of history) in which
 * every day closed all three rings — the "Perfect Week" analog.
 */
export function perfectWeeks(history: DailyActivity[], goals: Goals): number {
  let weeks = 0;
  for (let end = history.length; end >= 7; end -= 7) {
    const window = history.slice(end - 7, end);
    if (window.every((d) => ringsClosed(computeRings(d, goals)))) weeks++;
  }
  return weeks;
}
