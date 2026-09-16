import { dailyObjectiveFor } from '@/domain/objectives';
import { assembleRelay, type RelayLegDraft } from '@/domain/relayEngine';
import { computeRelayReward } from '@/domain/rewards';
import type {
  Game,
  Player,
  PlayerCard,
  Relay,
  RelayHistoryEntry,
  RelayLegStatus,
  StatLine,
} from '@/types';
import { dateKeyOf } from '@/utils/time';

function indexBy<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function draftFor(
  card: PlayerCard,
  playersById: Record<string, Player>,
  gameId: string,
  dateKey: string,
): RelayLegDraft {
  const player = playersById[card.playerId];
  if (!player) {
    throw new Error(`Seed relay references unknown player ${card.playerId}`);
  }
  return {
    cardId: card.id,
    playerId: card.playerId,
    gameId,
    objective: dailyObjectiveFor(player, card.evolutionPath, dateKey),
  };
}

/**
 * Today's in-flight relay: leg 1 already banked from a live WNBA game, leg 2
 * live now, two legs waiting on tonight's tip-off. Stat overrides force the
 * box scores to agree with relay progress.
 */
export function buildActiveRelay(
  now: Date,
  cards: PlayerCard[],
  players: Player[],
  games: Game[],
): { relay: Relay; statOverrides: Record<string, StatLine> } {
  const dateKey = dateKeyOf(now);
  const cardsById = indexBy(cards);
  const playersById = indexBy(players);
  const gamesById = indexBy(games);

  const lineup: { cardId: string; gameId: string }[] = [
    { cardId: 'card_carter', gameId: 'gm_wnba_live' },
    { cardId: 'card_whitfield', gameId: 'gm_nba_live' },
    { cardId: 'card_vidal', gameId: 'gm_soc_live' },
    { cardId: 'card_marin', gameId: 'gm_wnba_up' },
    { cardId: 'card_lindqvist', gameId: 'gm_wnba_up' },
  ];

  const drafts = lineup.map(({ cardId, gameId }) => {
    const card = cardsById[cardId];
    if (!card) {
      throw new Error(`Seed relay references unknown card ${cardId}`);
    }
    return draftFor(card, playersById, gameId, dateKey);
  });

  const base = assembleRelay({
    id: `relay_${dateKey}`,
    dateKey,
    drafts,
    cardsById,
    playersById,
    gamesById,
  });

  const legs = base.legs.map((leg) => {
    if (leg.slot === 0) {
      return { ...leg, status: 'completed' as const, progress: leg.objective.target };
    }
    if (leg.slot === 1) {
      const progress = Math.max(0, Math.ceil(leg.objective.target * 0.6) - 1);
      return { ...leg, status: 'active' as const, progress };
    }
    return leg;
  });

  const relay: Relay = { ...base, status: 'live', legs };

  const statOverrides: Record<string, StatLine> = {};
  for (const leg of relay.legs) {
    const game = gamesById[leg.gameId];
    if (game && game.status !== 'scheduled') {
      statOverrides[leg.playerId] = { [leg.objective.statKey]: leg.progress };
    }
  }

  return { relay, statOverrides };
}

interface HistorySpec {
  daysAgo: number;
  lineup: { cardId: string }[];
  /** Final status per slot. */
  statuses: RelayLegStatus[];
  shieldUsed: boolean;
  outcome: 'completed' | 'failed';
}

const HISTORY_SPECS: HistorySpec[] = [
  {
    daysAgo: 1,
    lineup: [
      { cardId: 'card_delgado' },
      { cardId: 'card_watanabe' },
      { cardId: 'card_petrovic' },
      { cardId: 'card_okafor' },
      { cardId: 'card_girard' },
    ],
    statuses: ['completed', 'completed', 'completed', 'completed', 'completed'],
    shieldUsed: false,
    outcome: 'completed',
  },
  {
    daysAgo: 2,
    lineup: [
      { cardId: 'card_brooks' },
      { cardId: 'card_carter' },
      { cardId: 'card_mensah' },
      { cardId: 'card_volkov' },
      { cardId: 'card_whitfield' },
    ],
    statuses: ['completed', 'completed', 'completed', 'failed', 'locked'],
    shieldUsed: false,
    outcome: 'failed',
  },
  {
    daysAgo: 3,
    lineup: [
      { cardId: 'card_lindgren' },
      { cardId: 'card_marin' },
      { cardId: 'card_whitaker' },
      { cardId: 'card_vidal' },
      { cardId: 'card_lindqvist' },
    ],
    statuses: ['completed', 'completed', 'completed', 'completed', 'completed'],
    shieldUsed: true,
    outcome: 'completed',
  },
  {
    daysAgo: 5,
    lineup: [
      { cardId: 'card_tanaka' },
      { cardId: 'card_salo' },
      { cardId: 'card_fuentes' },
      { cardId: 'card_ramos' },
      { cardId: 'card_obi' },
    ],
    statuses: ['completed', 'completed', 'failed', 'locked', 'locked'],
    shieldUsed: false,
    outcome: 'failed',
  },
];

export function buildRelayHistory(
  now: Date,
  cards: PlayerCard[],
  players: Player[],
): RelayHistoryEntry[] {
  const cardsById = indexBy(cards);
  const playersById = indexBy(players);

  return HISTORY_SPECS.map((spec, index) => {
    const date = new Date(now.getTime() - spec.daysAgo * 24 * 60 * 60 * 1000);
    const dateKey = dateKeyOf(date);
    const drafts = spec.lineup.map(({ cardId }, slot) => {
      const card = cardsById[cardId];
      if (!card) {
        throw new Error(`Seed history references unknown card ${cardId}`);
      }
      // Historical games are not kept in the store; legs use synthetic ids.
      return draftFor(card, playersById, `hist_gm_${index}_${slot}`, dateKey);
    });

    const base = assembleRelay({
      id: `relay_${dateKey}`,
      dateKey,
      drafts,
      cardsById,
      playersById,
      gamesById: {},
    });

    const legs = base.legs.map((leg) => {
      const status = spec.statuses[leg.slot] ?? 'locked';
      const savedByShield = spec.shieldUsed && status === 'completed' && leg.slot === 2;
      return {
        ...leg,
        status,
        savedByShield,
        progress:
          status === 'completed'
            ? leg.objective.target
            : status === 'failed'
              ? Math.max(0, leg.objective.target - 1)
              : 0,
      };
    });

    const relay: Relay = {
      ...base,
      legs,
      status: spec.outcome,
      shieldUsed: spec.shieldUsed,
      lockAt: date.toISOString(),
    };

    const completedLegs = legs.filter((leg) => leg.status === 'completed').length;
    return {
      id: relay.id,
      dateKey,
      relay,
      completedLegs,
      perfect: spec.outcome === 'completed' && !spec.shieldUsed,
      reward: computeRelayReward(relay),
    };
  });
}
