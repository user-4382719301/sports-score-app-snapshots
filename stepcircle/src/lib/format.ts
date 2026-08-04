export function formatInt(n: number): string {
  return Math.round(n).toLocaleString();
}

export function formatDistance(meters: number, metric: boolean): string {
  if (metric) return `${(meters / 1000).toFixed(2)} km`;
  return `${(meters / 1609.344).toFixed(2)} mi`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export function formatRelativeTime(atMillis: number, now: number = Date.now()): string {
  const mins = Math.max(0, Math.round((now - atMillis) / 60_000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
