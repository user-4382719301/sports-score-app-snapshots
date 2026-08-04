import type { DailyActivity, DayKey } from '../types';
import { dayRange, todayKey } from '../lib/dates';
import { hashSeed, seededRandom } from '../lib/seededRandom';
import { emptyDay, type HealthAdapter } from './HealthAdapter';

/**
 * Deterministic fake data so the app is fully explorable in a simulator,
 * in Expo Go, or before health permissions are granted.
 */
export class DemoHealthAdapter implements HealthAdapter {
  readonly source = 'demo' as const;

  constructor(private readonly seedSalt: string = 'me') {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async requestPermissions(): Promise<boolean> {
    return true;
  }

  async getDay(date: DayKey): Promise<DailyActivity> {
    return generateDay(date, this.seedSalt, date === todayKey());
  }

  async getHistory(days: number): Promise<DailyActivity[]> {
    return Promise.all(dayRange(todayKey(), days).map((key) => this.getDay(key)));
  }
}

/** Rough shape of a real day: quiet nights, commute bumps, evening walk. */
const HOUR_WEIGHTS = [
  0, 0, 0, 0, 0, 0.2, 0.6, 1.2, 1.4, 0.8, 0.7, 0.9, 1.3, 0.8, 0.7, 0.7, 0.9, 1.3, 1.6, 1.2, 0.8,
  0.5, 0.2, 0,
];

export function generateDay(date: DayKey, seedSalt: string, isToday: boolean): DailyActivity {
  const rand = seededRandom(hashSeed(`${seedSalt}:${date}`));
  const day = emptyDay(date, 'demo');

  // Base fitness varies by person (salt), day-to-day noise by date.
  const base = 6000 + rand() * 7000;
  const weightTotal = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);
  // Today is partial: only count hours that have already happened.
  const currentHour = isToday ? new Date().getHours() : 24;

  for (let h = 0; h < 24; h++) {
    if (h > currentHour) break;
    const jitter = 0.5 + rand();
    day.hourlySteps[h] = Math.round((base * HOUR_WEIGHTS[h] * jitter) / weightTotal);
  }

  day.steps = day.hourlySteps.reduce((a, b) => a + b, 0);
  day.distanceMeters = Math.round(day.steps * 0.762); // ~average stride
  day.activeMinutes = Math.round((day.steps / 1000) * (2.5 + rand() * 2.5));
  day.floorsClimbed = Math.round(rand() * 14);
  return day;
}
