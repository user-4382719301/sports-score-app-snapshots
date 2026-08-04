import { computeEarnedAwards } from '../src/lib/awards';
import { DEFAULT_GOALS, type AwardContext, type DailyActivity } from '../src/types';

function activeDay(date: string, steps: number): DailyActivity {
  const hourly = new Array(24).fill(0);
  for (let h = 7; h < 19; h++) hourly[h] = Math.round(steps / 12); // 12 active hours
  return {
    date,
    steps,
    distanceMeters: steps * 0.76,
    activeMinutes: 40,
    floorsClimbed: 5,
    hourlySteps: hourly,
    source: 'demo',
  };
}

function ctx(overrides: Partial<AwardContext> = {}): AwardContext {
  return {
    history: [],
    goals: DEFAULT_GOALS,
    lifetimeSteps: 0,
    currentStreak: 0,
    longestStreak: 0,
    competitionsWon: 0,
    ...overrides,
  };
}

describe('computeEarnedAwards', () => {
  it('grants nothing on an empty history', () => {
    expect(computeEarnedAwards(ctx(), '2026-08-04')).toHaveLength(0);
  });

  it('grants streak and milestone awards when thresholds are met', () => {
    const earned = computeEarnedAwards(
      ctx({ longestStreak: 7, lifetimeSteps: 1_200_000, competitionsWon: 1 }),
      '2026-08-04'
    );
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('streak-7');
    expect(ids).toContain('lifetime-1m');
    expect(ids).toContain('competition-win');
    expect(ids).not.toContain('streak-30');
  });

  it('grants the perfect week for 7 fully closed days', () => {
    const history = Array.from({ length: 7 }, (_, i) =>
      activeDay(`2026-08-0${i + 1}`, 12000)
    );
    const ids = computeEarnedAwards(ctx({ history }), '2026-08-07').map((a) => a.id);
    expect(ids).toContain('perfect-week');
    expect(ids).toContain('first-close');
  });
});
