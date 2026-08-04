import type { ActivitySource, DailyActivity, DayKey } from '../types';

/**
 * Uniform surface over the platform health store.
 *
 * Smartwatch data needs no special handling here: Apple Watch writes into
 * HealthKit and Wear OS / Galaxy Watch / Fitbit write into Health Connect,
 * and both stores hand us the merged, de-duplicated totals.
 */
export interface HealthAdapter {
  readonly source: ActivitySource;
  /** Whether the underlying store exists on this device. */
  isAvailable(): Promise<boolean>;
  /** Ask the OS for read permissions. Resolves false if the user declines. */
  requestPermissions(): Promise<boolean>;
  /** Activity for one local calendar day. */
  getDay(date: DayKey): Promise<DailyActivity>;
  /** The last `days` days ending today, oldest first. */
  getHistory(days: number): Promise<DailyActivity[]>;
  /**
   * Start listening for new samples arriving in the health store (e.g. a
   * watch syncing). Returns an unsubscribe function. Optional — platforms
   * without change notifications rely on the app's periodic refresh.
   */
  observeChanges?(onChange: () => void): () => void;
}

export function emptyDay(date: DayKey, source: ActivitySource): DailyActivity {
  return {
    date,
    steps: 0,
    distanceMeters: 0,
    activeMinutes: 0,
    floorsClimbed: 0,
    hourlySteps: new Array(24).fill(0),
    source,
  };
}
