import AppleHealthKit, {
  type HealthKitPermissions,
  type HealthValue,
} from 'react-native-health';
import type { DailyActivity, DayKey } from '../types';
import { dayRange, fromDayKey, todayKey } from '../lib/dates';
import { emptyDay, type HealthAdapter } from './HealthAdapter';

const PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.AppleExerciseTime,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
    ],
    write: [],
  },
};

function dayBounds(date: DayKey): { startDate: string; endDate: string } {
  const start = fromDayKey(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function sumSamples(samples: HealthValue[]): number {
  return samples.reduce((sum, s) => sum + (s.value ?? 0), 0);
}

/**
 * iOS adapter backed by HealthKit via react-native-health. Apple Watch steps,
 * exercise minutes and flights land here automatically and HealthKit already
 * de-duplicates overlapping phone + watch samples.
 */
export class HealthKitAdapter implements HealthAdapter {
  readonly source = 'healthkit' as const;

  isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((err, available) => resolve(!err && !!available));
    });
  }

  requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(PERMISSIONS, (err) => resolve(!err));
    });
  }

  async getDay(date: DayKey): Promise<DailyActivity> {
    const bounds = dayBounds(date);
    const day = emptyDay(date, this.source);

    const [hourly, distance, exercise, flights] = await Promise.all([
      this.hourlySteps(bounds),
      this.sum((opts, cb) => AppleHealthKit.getDailyDistanceWalkingRunningSamples(opts, cb), bounds),
      this.sum((opts, cb) => AppleHealthKit.getAppleExerciseTime(opts, cb), bounds),
      this.sum((opts, cb) => AppleHealthKit.getDailyFlightsClimbedSamples(opts, cb), bounds),
    ]);

    day.hourlySteps = hourly;
    day.steps = hourly.reduce((a, b) => a + b, 0);
    day.distanceMeters = distance;
    day.activeMinutes = Math.round(exercise);
    day.floorsClimbed = Math.round(flights);
    return day;
  }

  async getHistory(days: number): Promise<DailyActivity[]> {
    const keys = dayRange(todayKey(), days);
    const result: DailyActivity[] = [];
    for (const key of keys) {
      result.push(await this.getDay(key));
    }
    return result;
  }

  /** Steps bucketed into 24 clock hours via 60-minute sample periods. */
  private hourlySteps(bounds: { startDate: string; endDate: string }): Promise<number[]> {
    return new Promise((resolve) => {
      AppleHealthKit.getDailyStepCountSamples(
        { ...bounds, period: 60 },
        (err, samples: Array<{ startDate: string; value: number }>) => {
          const buckets = new Array(24).fill(0);
          if (!err && Array.isArray(samples)) {
            for (const s of samples) {
              const hour = new Date(s.startDate).getHours();
              buckets[hour] += s.value ?? 0;
            }
          }
          resolve(buckets.map(Math.round));
        }
      );
    });
  }

  private sum(
    query: (opts: object, cb: (err: unknown, results: HealthValue[]) => void) => void,
    bounds: { startDate: string; endDate: string }
  ): Promise<number> {
    return new Promise((resolve) => {
      query(bounds, (err, results) => {
        resolve(!err && Array.isArray(results) ? sumSamples(results) : 0);
      });
    });
  }
}
