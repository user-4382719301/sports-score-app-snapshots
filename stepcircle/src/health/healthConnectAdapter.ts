import {
  aggregateGroupByDuration,
  aggregateRecord,
  initialize,
  requestPermission,
} from 'react-native-health-connect';
import type { DailyActivity, DayKey } from '../types';
import { dayRange, fromDayKey, todayKey } from '../lib/dates';
import { emptyDay, type HealthAdapter } from './HealthAdapter';

function dayBounds(date: DayKey): { startTime: string; endTime: string } {
  const start = fromDayKey(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

/**
 * Android adapter backed by Health Connect. Wear OS, Galaxy Watch and Fitbit
 * all sync into Health Connect, so watch steps show up here with no extra
 * integration; Health Connect prioritizes sources to avoid double counting.
 */
export class HealthConnectAdapter implements HealthAdapter {
  readonly source = 'health-connect' as const;
  private initialized = false;

  async isAvailable(): Promise<boolean> {
    try {
      this.initialized = await initialize();
      return this.initialized;
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.initialized && !(await this.isAvailable())) return false;
    try {
      const granted = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'ExerciseSession' },
        { accessType: 'read', recordType: 'FloorsClimbed' },
      ]);
      return granted.some((p) => p.recordType === 'Steps');
    } catch {
      return false;
    }
  }

  async getDay(date: DayKey): Promise<DailyActivity> {
    const timeRangeFilter = { operator: 'between' as const, ...dayBounds(date) };
    const day = emptyDay(date, this.source);

    try {
      const hourly = await aggregateGroupByDuration({
        recordType: 'Steps',
        timeRangeFilter,
        timeRangeSlicer: { duration: 'HOURS', length: 1 },
      });
      for (const bucket of hourly) {
        const hour = new Date(bucket.startTime).getHours();
        day.hourlySteps[hour] += bucket.result?.COUNT_TOTAL ?? 0;
      }
      day.steps = day.hourlySteps.reduce((a, b) => a + b, 0);
    } catch {
      // leave zeros — permission may cover fewer types than requested
    }

    day.distanceMeters = await this.aggregateNumber(
      { recordType: 'Distance', timeRangeFilter },
      (r) => r.DISTANCE?.inMeters
    );
    day.activeMinutes = Math.round(
      (await this.aggregateNumber(
        { recordType: 'ExerciseSession', timeRangeFilter },
        (r) => r.EXERCISE_DURATION_TOTAL?.inSeconds
      )) / 60
    );
    day.floorsClimbed = await this.aggregateNumber(
      { recordType: 'FloorsClimbed', timeRangeFilter },
      (r) => r.FLOORS_CLIMBED_TOTAL
    );
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

  private async aggregateNumber(
    request: { recordType: string; timeRangeFilter: object },
    pick: (result: Record<string, any>) => number | undefined
  ): Promise<number> {
    try {
      const result = await aggregateRecord(request as never);
      return pick(result as Record<string, any>) ?? 0;
    } catch {
      return 0;
    }
  }
}
