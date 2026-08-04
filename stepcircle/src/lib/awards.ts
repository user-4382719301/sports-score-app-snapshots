import type { AwardContext, AwardDefinition, DailyActivity, EarnedAward, Goals } from '../types';
import { computeRings, ringsClosed } from './rings';
import { perfectWeeks } from './streaks';

interface AwardRule extends AwardDefinition {
  earned: (ctx: AwardContext) => boolean;
}

function lastWeekSteps(history: DailyActivity[]): number {
  return history.slice(-7).reduce((sum, d) => sum + d.steps, 0);
}

function daysWithClosedRings(history: DailyActivity[], goals: Goals): number {
  return history.filter((d) => ringsClosed(computeRings(d, goals))).length;
}

export const AWARD_RULES: AwardRule[] = [
  {
    id: 'first-close',
    name: 'First Close',
    description: 'Close all three rings in a single day.',
    icon: '🎯',
    category: 'milestone',
    earned: (ctx) => daysWithClosedRings(ctx.history, ctx.goals) >= 1,
  },
  {
    id: 'streak-7',
    name: 'On a Roll',
    description: 'Meet your step goal 7 days in a row.',
    icon: '🔥',
    category: 'streak',
    earned: (ctx) => ctx.longestStreak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Unstoppable',
    description: 'Meet your step goal 30 days in a row.',
    icon: '⚡️',
    category: 'streak',
    earned: (ctx) => ctx.longestStreak >= 30,
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Close every ring, every day, for a full week.',
    icon: '🏅',
    category: 'week',
    earned: (ctx) => perfectWeeks(ctx.history, ctx.goals) >= 1,
  },
  {
    id: 'week-100k',
    name: 'Century Week',
    description: 'Walk 100,000 steps in a single week.',
    icon: '💯',
    category: 'week',
    earned: (ctx) => lastWeekSteps(ctx.history) >= 100_000,
  },
  {
    id: 'lifetime-1m',
    name: 'Millionaire',
    description: 'Reach 1,000,000 lifetime steps.',
    icon: '🚀',
    category: 'milestone',
    earned: (ctx) => ctx.lifetimeSteps >= 1_000_000,
  },
  {
    id: 'competition-win',
    name: 'Top of the Podium',
    description: 'Win a 7-day competition against a friend.',
    icon: '🏆',
    category: 'competition',
    earned: (ctx) => ctx.competitionsWon >= 1,
  },
  {
    id: 'competition-win-5',
    name: 'Serial Winner',
    description: 'Win five competitions.',
    icon: '👑',
    category: 'competition',
    earned: (ctx) => ctx.competitionsWon >= 5,
  },
];

export function computeEarnedAwards(ctx: AwardContext, earnedOn: string): EarnedAward[] {
  return AWARD_RULES.filter((rule) => rule.earned(ctx)).map(
    ({ earned: _earned, ...def }) => ({ ...def, earnedOn })
  );
}
