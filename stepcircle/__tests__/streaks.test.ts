import { currentStreak, longestStreak } from '../src/lib/streaks';
import { DEFAULT_GOALS, type DailyActivity } from '../src/types';

function days(steps: number[]): DailyActivity[] {
  return steps.map((s, i) => ({
    date: `2026-08-${String(i + 1).padStart(2, '0')}`,
    steps: s,
    distanceMeters: 0,
    activeMinutes: 0,
    floorsClimbed: 0,
    hourlySteps: new Array(24).fill(0),
    source: 'demo' as const,
  }));
}

const G = DEFAULT_GOALS; // 10,000 step goal

describe('currentStreak', () => {
  it('counts consecutive goal days ending at the most recent entry', () => {
    expect(currentStreak(days([12000, 3000, 11000, 10500, 10000]), G)).toBe(3);
  });

  it('does not break the streak for an unfinished today', () => {
    // Today (last entry) is below goal but yesterday's run should still count.
    expect(currentStreak(days([11000, 12000, 4000]), G)).toBe(2);
  });

  it('extends the streak once today meets the goal', () => {
    expect(currentStreak(days([11000, 12000, 10001]), G)).toBe(3);
  });

  it('is zero when no recent day met the goal', () => {
    expect(currentStreak(days([3000, 2000]), G)).toBe(0);
  });
});

describe('longestStreak', () => {
  it('finds the best run anywhere in history', () => {
    expect(longestStreak(days([11000, 11000, 11000, 2000, 11000]), G)).toBe(3);
  });
});
