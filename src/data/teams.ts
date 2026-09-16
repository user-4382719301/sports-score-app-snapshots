import type { League, Team } from '@/types';

export const SEASON = '2026';

export const LEAGUES: League[] = [
  { id: 'lg_mlb', sport: 'mlb', name: 'National Baseball Circuit', season: SEASON },
  { id: 'lg_wnba', sport: 'wnba', name: 'Premier Women’s Basketball', season: SEASON },
  { id: 'lg_nba', sport: 'nba', name: 'National Basketball Circuit', season: SEASON },
  { id: 'lg_nhl', sport: 'nhl', name: 'Continental Hockey Circuit', season: SEASON },
  { id: 'lg_soccer', sport: 'soccer', name: 'Union Football League', season: SEASON },
];

/** Fictional franchises — no licensed league or team marks anywhere. */
export const TEAMS: Team[] = [
  // MLB
  { id: 'tm_hca', sport: 'mlb', leagueId: 'lg_mlb', location: 'Harbor City', name: 'Admirals', abbreviation: 'HCA', color: '#3B82F6' },
  { id: 'tm_ssb', sport: 'mlb', leagueId: 'lg_mlb', location: 'Sierra', name: 'Sunbirds', abbreviation: 'SSB', color: '#F59E0B' },
  { id: 'tm_bay', sport: 'mlb', leagueId: 'lg_mlb', location: 'Bayside', name: 'Breakers', abbreviation: 'BAY', color: '#14B8A6' },
  { id: 'tm_rgl', sport: 'mlb', leagueId: 'lg_mlb', location: 'Ridgeline', name: 'Rattlers', abbreviation: 'RGL', color: '#84CC16' },
  { id: 'tm_ccc', sport: 'mlb', leagueId: 'lg_mlb', location: 'Copper Canyon', name: 'Coyotes', abbreviation: 'CCC', color: '#EA580C' },
  { id: 'tm_lks', sport: 'mlb', leagueId: 'lg_mlb', location: 'Lakeshore', name: 'Larks', abbreviation: 'LKS', color: '#8B5CF6' },

  // WNBA
  { id: 'tm_met', sport: 'wnba', leagueId: 'lg_wnba', location: 'Metropolis', name: 'Meteors', abbreviation: 'MET', color: '#EC4899' },
  { id: 'tm_aur', sport: 'wnba', leagueId: 'lg_wnba', location: 'Aurora', name: 'Flames', abbreviation: 'AUR', color: '#EF4444' },
  { id: 'tm_cap', sport: 'wnba', leagueId: 'lg_wnba', location: 'Capital', name: 'Cyclones', abbreviation: 'CAP', color: '#0EA5E9' },
  { id: 'tm_sea', sport: 'wnba', leagueId: 'lg_wnba', location: 'Seaside', name: 'Swifts', abbreviation: 'SEA', color: '#10B981' },

  // NBA
  { id: 'tm_mid', sport: 'nba', leagueId: 'lg_nba', location: 'Midtown', name: 'Mustangs', abbreviation: 'MID', color: '#A855F7' },
  { id: 'tm_irn', sport: 'nba', leagueId: 'lg_nba', location: 'Ironworks', name: 'Forge', abbreviation: 'IRN', color: '#F97316' },
  { id: 'tm_cre', sport: 'nba', leagueId: 'lg_nba', location: 'Crescent City', name: 'Comets', abbreviation: 'CRE', color: '#22D3EE' },
  { id: 'tm_sum', sport: 'nba', leagueId: 'lg_nba', location: 'Summit', name: 'Stags', abbreviation: 'SUM', color: '#65A30D' },

  // NHL
  { id: 'tm_gla', sport: 'nhl', leagueId: 'lg_nhl', location: 'Glacier Bay', name: 'Guardians', abbreviation: 'GLA', color: '#38BDF8' },
  { id: 'tm_nor', sport: 'nhl', leagueId: 'lg_nhl', location: 'North Shore', name: 'Norsemen', abbreviation: 'NOR', color: '#6366F1' },
  { id: 'tm_ste', sport: 'nhl', leagueId: 'lg_nhl', location: 'Steel City', name: 'Spartans', abbreviation: 'STE', color: '#94A3B8' },
  { id: 'tm_fro', sport: 'nhl', leagueId: 'lg_nhl', location: 'Frostline', name: 'Foxes', abbreviation: 'FRO', color: '#F43F5E' },

  // Soccer
  { id: 'tm_riv', sport: 'soccer', leagueId: 'lg_soccer', location: 'Riverton', name: 'FC', abbreviation: 'RIV', color: '#2DD4BF' },
  { id: 'tm_atl', sport: 'soccer', leagueId: 'lg_soccer', location: 'Atlas', name: 'United', abbreviation: 'ATU', color: '#FACC15' },
  { id: 'tm_por', sport: 'soccer', leagueId: 'lg_soccer', location: 'Portside', name: 'SC', abbreviation: 'POR', color: '#FB7185' },
  { id: 'tm_eve', sport: 'soccer', leagueId: 'lg_soccer', location: 'Everfield', name: 'Rovers', abbreviation: 'EVR', color: '#4ADE80' },
  { id: 'tm_nrb', sport: 'soccer', leagueId: 'lg_soccer', location: 'Northbank', name: 'FC', abbreviation: 'NRB', color: '#C084FC' },
  { id: 'tm_mer', sport: 'soccer', leagueId: 'lg_soccer', location: 'Meridian', name: 'SC', abbreviation: 'MER', color: '#60A5FA' },
];

export const TEAMS_BY_ID: Record<string, Team> = Object.fromEntries(
  TEAMS.map((team) => [team.id, team]),
);

export function teamDisplayName(team: Team): string {
  return `${team.location} ${team.name}`;
}
