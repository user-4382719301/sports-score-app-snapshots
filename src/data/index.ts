import type {
  AppNotification,
  Game,
  Player,
  PlayerCard,
  Quest,
  Relay,
  RelayHistoryEntry,
  Reward,
  User,
} from '@/types';
import { dateKeyOf } from '@/utils/time';
import { buildSeedCards } from './cards';
import { buildSeedGames } from './games';
import { SEED_COINS, SEED_QUESTS, SEED_REWARDS, SEED_USER, buildSeedNotifications } from './meta';
import { TRACKED_PLAYERS } from './players';
import { buildActiveRelay, buildRelayHistory } from './relays';

export { LEAGUES, TEAMS, TEAMS_BY_ID, SEASON, teamDisplayName } from './teams';
export { TRACKED_PLAYERS } from './players';

export interface SeedData {
  seedDateKey: string;
  user: User;
  coins: number;
  players: Player[];
  cards: PlayerCard[];
  games: Game[];
  activeRelay: Relay;
  history: RelayHistoryEntry[];
  notifications: AppNotification[];
  quests: Quest[];
  rewards: Reward[];
}

/**
 * Build the entire demo world for "today". Games are timed relative to
 * `now`, and the seeded relay's progress is written back into box scores so
 * every screen agrees.
 */
export function buildSeed(now: Date = new Date()): SeedData {
  const cards = buildSeedCards();
  const firstPass = buildSeedGames(now);
  const { relay, statOverrides } = buildActiveRelay(
    now,
    cards,
    [...TRACKED_PLAYERS, ...firstPass.boxScorePlayers],
    firstPass.games,
  );
  const { games, boxScorePlayers } = buildSeedGames(now, statOverrides);
  const players = [...TRACKED_PLAYERS, ...boxScorePlayers];

  return {
    seedDateKey: dateKeyOf(now),
    user: SEED_USER,
    coins: SEED_COINS,
    players,
    cards,
    games,
    activeRelay: relay,
    history: buildRelayHistory(now, cards, players),
    notifications: buildSeedNotifications(now),
    quests: SEED_QUESTS,
    rewards: SEED_REWARDS,
  };
}
