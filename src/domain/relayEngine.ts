import type {
  Game,
  Player,
  PlayerCard,
  Relay,
  RelayLeg,
  RelayObjective,
} from '@/types';
import { computeChemistry } from './chemistry';
import { computePathBonuses, computeRewardMultiplier, computeRiskTier } from './rewards';

export interface RelayLegDraft {
  cardId: string;
  playerId: string;
  gameId: string;
  objective: RelayObjective;
}

export type RelayEvent =
  | { type: 'leg_completed'; slot: number; savedByShield: boolean }
  | { type: 'baton_passed'; fromSlot: number; toSlot: number }
  | { type: 'connector_boost'; slot: number }
  | { type: 'shield_used'; slot: number }
  | { type: 'leg_failed'; slot: number }
  | { type: 'relay_completed' }
  | { type: 'relay_failed' };

export interface EngineResult {
  relay: Relay;
  events: RelayEvent[];
}

export const RELAY_SIZE = 5;

/** Assemble a saved (locked) relay from five drafted legs. */
export function assembleRelay(input: {
  id: string;
  dateKey: string;
  drafts: RelayLegDraft[];
  cardsById: Record<string, PlayerCard>;
  playersById: Record<string, Player>;
  gamesById: Record<string, Game>;
}): Relay {
  const { id, dateKey, drafts, cardsById, playersById, gamesById } = input;
  if (drafts.length !== RELAY_SIZE) {
    throw new Error(`A relay needs exactly ${RELAY_SIZE} legs`);
  }

  const legs: RelayLeg[] = drafts.map((draft, slot) => ({
    slot,
    cardId: draft.cardId,
    playerId: draft.playerId,
    gameId: draft.gameId,
    objective: draft.objective,
    status: 'waiting',
    progress: 0,
    savedByShield: false,
  }));

  const chemistry = computeChemistry(legs, playersById);
  const pathBonuses = computePathBonuses(legs, cardsById);
  const startTimes = legs
    .map((leg) => gamesById[leg.gameId]?.startTime)
    .filter((time): time is string => Boolean(time))
    .sort();

  return {
    id,
    dateKey,
    status: 'locked',
    legs,
    lockAt: startTimes[0] ?? new Date().toISOString(),
    riskTier: computeRiskTier(legs.map((leg) => leg.objective.difficulty)),
    rewardMultiplier: computeRewardMultiplier(pathBonuses, chemistry),
    chemistry,
    shieldAvailable: legs.some((leg) => cardsById[leg.cardId]?.evolutionPath === 'shield'),
    shieldUsed: false,
  };
}

export function activeLeg(relay: Relay): RelayLeg | undefined {
  return relay.legs.find((leg) => leg.status === 'active');
}

export function completedLegCount(relay: Relay): number {
  return relay.legs.filter((leg) => leg.status === 'completed').length;
}

export function isFinished(relay: Relay): boolean {
  return relay.status === 'completed' || relay.status === 'failed';
}

/** Move a locked relay live: the first leg takes the baton. */
export function activateRelay(relay: Relay): Relay {
  if (relay.status !== 'locked') {
    return relay;
  }
  return {
    ...relay,
    status: 'live',
    legs: relay.legs.map((leg) => (leg.slot === 0 ? { ...leg, status: 'active' } : leg)),
  };
}

function replaceLeg(legs: RelayLeg[], slot: number, patch: Partial<RelayLeg>): RelayLeg[] {
  return legs.map((leg) => (leg.slot === slot ? { ...leg, ...patch } : leg));
}

/**
 * Add stat progress to the active leg; completes the leg when the target is
 * reached. Only the active player can advance the relay.
 */
export function applyStatToActiveLeg(
  relay: Relay,
  amount: number,
  cardsById: Record<string, PlayerCard>,
): EngineResult {
  const current = activeLeg(relay);
  if (!current || relay.status !== 'live') {
    return { relay, events: [] };
  }
  const progress = Math.max(0, current.progress + amount);
  if (progress >= current.objective.target) {
    return completeActiveLeg(relay, cardsById, false);
  }
  return {
    relay: { ...relay, legs: replaceLeg(relay.legs, current.slot, { progress }) },
    events: [],
  };
}

/**
 * Complete the active leg and pass the baton. A completing Connector eases
 * the next leg's objective by one (min 1) — its "improves the next leg"
 * rule made concrete.
 */
export function completeActiveLeg(
  relay: Relay,
  cardsById: Record<string, PlayerCard>,
  savedByShield: boolean,
): EngineResult {
  const current = activeLeg(relay);
  if (!current || relay.status !== 'live') {
    return { relay, events: [] };
  }

  const events: RelayEvent[] = [{ type: 'leg_completed', slot: current.slot, savedByShield }];
  let legs = replaceLeg(relay.legs, current.slot, {
    status: 'completed',
    progress: Math.max(current.progress, current.objective.target),
    savedByShield,
  });

  const nextSlot = current.slot + 1;
  const isLastLeg = nextSlot >= relay.legs.length;

  if (isLastLeg) {
    events.push({ type: 'relay_completed' });
    return { relay: { ...relay, legs, status: 'completed' }, events };
  }

  const card = cardsById[current.cardId];
  if (card?.evolutionPath === 'connector' && !savedByShield) {
    const next = legs.find((leg) => leg.slot === nextSlot);
    if (next && next.objective.target > 1) {
      legs = replaceLeg(legs, nextSlot, {
        objective: {
          ...next.objective,
          target: next.objective.target - 1,
          shortLabel: `${next.objective.shortLabel} −1`,
        },
      });
      events.push({ type: 'connector_boost', slot: nextSlot });
    }
  }

  legs = replaceLeg(legs, nextSlot, { status: 'active' });
  events.push({ type: 'baton_passed', fromSlot: current.slot, toSlot: nextSlot });
  return { relay: { ...relay, legs }, events };
}

/**
 * Fail the active leg. If a Shield card is in the relay and unused, the leg
 * is revived (counts as completed, flagged) and the baton still passes.
 * Otherwise the relay ends and later legs lock.
 */
export function failActiveLeg(
  relay: Relay,
  cardsById: Record<string, PlayerCard>,
): EngineResult {
  const current = activeLeg(relay);
  if (!current || relay.status !== 'live') {
    return { relay, events: [] };
  }

  if (relay.shieldAvailable && !relay.shieldUsed) {
    const shielded = { ...relay, shieldUsed: true };
    const result = completeActiveLeg(shielded, cardsById, true);
    return {
      relay: result.relay,
      events: [{ type: 'shield_used', slot: current.slot }, ...result.events],
    };
  }

  const legs = relay.legs.map((leg): RelayLeg => {
    if (leg.slot === current.slot) {
      return { ...leg, status: 'failed' };
    }
    if (leg.slot > current.slot) {
      return { ...leg, status: 'locked' };
    }
    return leg;
  });

  return {
    relay: { ...relay, legs, status: 'failed' },
    events: [
      { type: 'leg_failed', slot: current.slot },
      { type: 'relay_failed' },
    ],
  };
}
