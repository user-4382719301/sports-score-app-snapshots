import type { DayKey } from '../types';

export function toDayKey(d: Date): DayKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): DayKey {
  return toDayKey(new Date());
}

export function addDays(key: DayKey, delta: number): DayKey {
  const d = fromDayKey(key);
  d.setDate(d.getDate() + delta);
  return toDayKey(d);
}

/** Keys for the `count` days ending at `end`, oldest first. */
export function dayRange(end: DayKey, count: number): DayKey[] {
  const keys: DayKey[] = [];
  for (let i = count - 1; i >= 0; i--) keys.push(addDays(end, -i));
  return keys;
}

export function dayLabel(key: DayKey): string {
  return fromDayKey(key).toLocaleDateString(undefined, { weekday: 'short' });
}

export function fullDayLabel(key: DayKey): string {
  return fromDayKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
