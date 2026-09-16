import type { Sport, SportId } from '@/types';

export const SPORTS: Sport[] = [
  { id: 'mlb', name: 'Baseball', shortName: 'MLB', icon: 'baseball-outline' },
  { id: 'wnba', name: 'Basketball', shortName: 'WNBA', icon: 'basketball-outline' },
  { id: 'nba', name: 'Basketball', shortName: 'NBA', icon: 'basketball-outline' },
  { id: 'nhl', name: 'Hockey', shortName: 'NHL', icon: 'snow-outline' },
  { id: 'soccer', name: 'Soccer', shortName: 'Soccer', icon: 'football-outline' },
];

export const SPORT_BY_ID: Record<SportId, Sport> = Object.fromEntries(
  SPORTS.map((sport) => [sport.id, sport]),
) as Record<SportId, Sport>;

export function sportLabel(id: SportId): string {
  return SPORT_BY_ID[id].shortName;
}
