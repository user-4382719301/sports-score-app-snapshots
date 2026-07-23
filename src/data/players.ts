import type { Player, SportId } from '@/types';
import { createRng, pick } from './rng';

/**
 * The 24 tracked players — every one has a season-long collectible card.
 * All names are fictional.
 */
export const TRACKED_PLAYERS: Player[] = [
  // MLB
  { id: 'pl_delgado', sport: 'mlb', teamId: 'tm_hca', firstName: 'Marcus', lastName: 'Delgado', position: 'SS', jerseyNumber: 12 },
  { id: 'pl_watanabe', sport: 'mlb', teamId: 'tm_ssb', firstName: 'Kenji', lastName: 'Watanabe', position: 'CF', jerseyNumber: 8 },
  { id: 'pl_brooks', sport: 'mlb', teamId: 'tm_bay', firstName: 'Tyler', lastName: 'Brooks', position: '1B', jerseyNumber: 34 },
  { id: 'pl_fuentes', sport: 'mlb', teamId: 'tm_rgl', firstName: 'Andrés', lastName: 'Fuentes', position: '3B', jerseyNumber: 21 },
  { id: 'pl_whitaker', sport: 'mlb', teamId: 'tm_ccc', firstName: 'Sam', lastName: 'Whitaker', position: 'RF', jerseyNumber: 17 },
  { id: 'pl_ramos', sport: 'mlb', teamId: 'tm_lks', firstName: 'Diego', lastName: 'Ramos', position: 'DH', jerseyNumber: 29 },

  // WNBA
  { id: 'pl_carter', sport: 'wnba', teamId: 'tm_met', firstName: 'Aaliyah', lastName: 'Carter', position: 'G', jerseyNumber: 3 },
  { id: 'pl_okafor', sport: 'wnba', teamId: 'tm_aur', firstName: 'Nneka', lastName: 'Okafor', position: 'F', jerseyNumber: 22 },
  { id: 'pl_marin', sport: 'wnba', teamId: 'tm_cap', firstName: 'Sofia', lastName: 'Marin', position: 'G', jerseyNumber: 11 },
  { id: 'pl_lindqvist', sport: 'wnba', teamId: 'tm_sea', firstName: 'Maya', lastName: 'Lindqvist', position: 'C', jerseyNumber: 44 },

  // NBA
  { id: 'pl_whitfield', sport: 'nba', teamId: 'tm_mid', firstName: 'Jalen', lastName: 'Whitfield', position: 'G', jerseyNumber: 0 },
  { id: 'pl_bennett', sport: 'nba', teamId: 'tm_irn', firstName: 'Omar', lastName: 'Bennett', position: 'F', jerseyNumber: 24 },
  { id: 'pl_petrovic', sport: 'nba', teamId: 'tm_cre', firstName: 'Luka', lastName: 'Petrović', position: 'G', jerseyNumber: 7 },
  { id: 'pl_cole', sport: 'nba', teamId: 'tm_sum', firstName: 'DeShawn', lastName: 'Cole', position: 'C', jerseyNumber: 55 },
  { id: 'pl_donovan', sport: 'nba', teamId: 'tm_mid', firstName: 'Trey', lastName: 'Donovan', position: 'F', jerseyNumber: 30 },

  // NHL
  { id: 'pl_lindgren', sport: 'nhl', teamId: 'tm_gla', firstName: 'Erik', lastName: 'Lindgren', position: 'C', jerseyNumber: 19 },
  { id: 'pl_salo', sport: 'nhl', teamId: 'tm_nor', firstName: 'Mikko', lastName: 'Salo', position: 'RW', jerseyNumber: 27 },
  { id: 'pl_brandt', sport: 'nhl', teamId: 'tm_ste', firstName: 'Cole', lastName: 'Brandt', position: 'D', jerseyNumber: 4 },
  { id: 'pl_girard', sport: 'nhl', teamId: 'tm_fro', firstName: 'Antoine', lastName: 'Girard', position: 'LW', jerseyNumber: 91 },
  { id: 'pl_volkov', sport: 'nhl', teamId: 'tm_gla', firstName: 'Nikita', lastName: 'Volkov', position: 'C', jerseyNumber: 88 },

  // Soccer
  { id: 'pl_vidal', sport: 'soccer', teamId: 'tm_riv', firstName: 'Mateo', lastName: 'Vidal', position: 'FW', jerseyNumber: 9 },
  { id: 'pl_mensah', sport: 'soccer', teamId: 'tm_atl', firstName: 'Kwame', lastName: 'Mensah', position: 'MF', jerseyNumber: 10 },
  { id: 'pl_tanaka', sport: 'soccer', teamId: 'tm_por', firstName: 'Ryo', lastName: 'Tanaka', position: 'MF', jerseyNumber: 8 },
  { id: 'pl_obi', sport: 'soccer', teamId: 'tm_eve', firstName: 'Emeka', lastName: 'Obi', position: 'DF', jerseyNumber: 5 },
];

const FILLER_FIRST_NAMES = [
  'Alex', 'Jordan', 'Casey', 'Riley', 'Devon', 'Micah', 'Elias', 'Nico',
  'Owen', 'Felix', 'Isaiah', 'Andre', 'Victor', 'Leo', 'Dante', 'Ruben',
] as const;

const FILLER_LAST_NAMES = [
  'Hayes', 'Sandoval', 'Kim', 'Novak', 'Osei', 'Ferreira', 'Lang', 'Bishop',
  'Moreau', 'Castillo', 'Weber', 'Nash', 'Iversen', 'Duarte', 'Holt', 'Reyes',
] as const;

const POSITIONS: Record<SportId, readonly string[]> = {
  mlb: ['C', '1B', '2B', 'LF', 'CF'],
  wnba: ['G', 'F', 'C'],
  nba: ['G', 'F', 'C'],
  nhl: ['C', 'LW', 'RW', 'D'],
  soccer: ['GK', 'DF', 'MF', 'FW'],
};

/**
 * Non-collectible teammates that fill out realistic box scores. Generated
 * deterministically per team so names stay stable across launches.
 */
export function fillerPlayersForTeam(teamId: string, sport: SportId, count: number): Player[] {
  const rng = createRng(`filler:${teamId}`);
  const players: Player[] = [];
  const usedNames = new Set<string>();
  while (players.length < count) {
    const firstName = pick(rng, FILLER_FIRST_NAMES);
    const lastName = pick(rng, FILLER_LAST_NAMES);
    const nameKey = `${firstName} ${lastName}`;
    if (usedNames.has(nameKey)) {
      continue;
    }
    usedNames.add(nameKey);
    players.push({
      id: `plf_${teamId}_${players.length}`,
      sport,
      teamId,
      firstName,
      lastName,
      position: pick(rng, POSITIONS[sport]),
      jerseyNumber: Math.floor(rng() * 98) + 1,
    });
  }
  return players;
}
