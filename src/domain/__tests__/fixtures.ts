import type {
  CardEvolutionPath,
  Game,
  Player,
  PlayerCard,
  RelayObjective,
} from '@/types';
import { xpToNext } from '../progression';
import type { RelayLegDraft } from '../relayEngine';

export function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    sport: 'nba',
    teamId: `tm_${id}`,
    firstName: 'Test',
    lastName: id,
    position: 'G',
    jerseyNumber: 1,
    ...overrides,
  };
}

export function makeCard(
  id: string,
  path: CardEvolutionPath,
  overrides: Partial<PlayerCard> = {},
): PlayerCard {
  return {
    id,
    playerId: `pl_${id}`,
    season: '2026',
    level: 1,
    xp: 0,
    xpToNextLevel: xpToNext(1),
    stage: 'rookie',
    evolutionPath: path,
    evolutionChoiceAvailable: false,
    relayAppearances: 0,
    successfulLegs: 0,
    relayFinishes: 0,
    successRate: 0,
    favorite: false,
    unlockedAbilities: [],
    milestones: [],
    history: [],
    ...overrides,
  };
}

export function makeObjective(target: number, overrides: Partial<RelayObjective> = {}): RelayObjective {
  return {
    id: `obj_${target}`,
    sport: 'nba',
    statKey: 'pts',
    target,
    label: `Score ${target} points`,
    shortLabel: `${target} PTS`,
    difficulty: 2,
    ...overrides,
  };
}

export function makeGame(id: string, overrides: Partial<Game> = {}): Game {
  return {
    id,
    sport: 'nba',
    leagueId: 'lg_nba',
    status: 'scheduled',
    startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    home: { teamId: 'tm_home', score: 0 },
    away: { teamId: 'tm_away', score: 0 },
    periodLabel: '',
    favorite: false,
    playerStats: [],
    teamStats: [],
    plays: [],
    ...overrides,
  };
}

export function makeDraft(card: PlayerCard, target = 2): RelayLegDraft {
  return {
    cardId: card.id,
    playerId: card.playerId,
    gameId: `gm_${card.id}`,
    objective: makeObjective(target),
  };
}
