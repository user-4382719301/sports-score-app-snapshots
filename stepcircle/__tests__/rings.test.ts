import { activeHours, competitionPointsForDay, computeRings, ringsClosed } from '../src/lib/rings';
import { DEFAULT_GOALS, MAX_DAILY_POINTS, type DailyActivity } from '../src/types';

function day(overrides: Partial<DailyActivity> = {}): DailyActivity {
  return {
    date: '2026-08-04',
    steps: 0,
    distanceMeters: 0,
    activeMinutes: 0,
    floorsClimbed: 0,
    hourlySteps: new Array(24).fill(0),
    source: 'demo',
    ...overrides,
  };
}

describe('activeHours', () => {
  it('counts only hours at or above the threshold', () => {
    const hourly = new Array(24).fill(0);
    hourly[8] = 250;
    hourly[9] = 249;
    hourly[10] = 1000;
    expect(activeHours(hourly)).toBe(2);
  });
});

describe('computeRings', () => {
  it('maps activity onto ring fractions', () => {
    const hourly = new Array(24).fill(0);
    for (let h = 8; h < 14; h++) hourly[h] = 300; // 6 active hours
    const rings = computeRings(
      day({ steps: 5000, activeMinutes: 15, hourlySteps: hourly }),
      DEFAULT_GOALS
    );
    expect(rings.move).toBeCloseTo(0.5);
    expect(rings.exercise).toBeCloseTo(0.5);
    expect(rings.stand).toBeCloseTo(0.5);
  });

  it('exceeds 1 when goals are beaten', () => {
    const rings = computeRings(day({ steps: 15000 }), DEFAULT_GOALS);
    expect(rings.move).toBeCloseTo(1.5);
  });
});

describe('ringsClosed', () => {
  it('requires all three rings', () => {
    expect(ringsClosed({ move: 1, exercise: 1, stand: 1 })).toBe(true);
    expect(ringsClosed({ move: 2, exercise: 1, stand: 0.99 })).toBe(false);
  });
});

describe('competitionPointsForDay', () => {
  it('awards a point per ring percentage point', () => {
    expect(competitionPointsForDay({ move: 0.5, exercise: 0.25, stand: 0.25 })).toBe(100);
  });

  it('caps at the Apple-style daily maximum', () => {
    expect(competitionPointsForDay({ move: 4, exercise: 4, stand: 4 })).toBe(MAX_DAILY_POINTS);
  });
});
