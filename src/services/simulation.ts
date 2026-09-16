import {
  activateRelay,
  applyStatToActiveLeg,
  completeActiveLeg,
  activeLeg as engineActiveLeg,
  failActiveLeg,
  isFinished,
  type EngineResult,
  type RelayEvent,
} from '@/domain/relayEngine';
import { computeRelayReward, FAILED_LEG_CARD_XP, LEG_CARD_XP } from '@/domain/rewards';
import type { NotificationType, PlayerCard, Relay, RelayHistoryEntry, StatKey } from '@/types';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useRelayStore } from '@/stores/relayStore';
import { useRewardsStore } from '@/stores/rewardsStore';
import { useUserStore } from '@/stores/userStore';
import { clearPersistedState, rebuildSeed } from '@/stores/storage';

/**
 * Demo simulation controls. Everything here mutates the same stores the
 * real screens read, so a simulated leg completion ripples through Home,
 * Live Relay, Games, Collection, Notifications, and Rewards — exactly the
 * plumbing a real ingest service would use (see docs/ARCHITECTURE.md).
 */

/** How much one "advance stat" tap moves each stat — big stats move in chunks. */
const STAT_CHUNK: Partial<Record<StatKey, number>> = {
  pts: 4,
  reb: 2,
  ast: 2,
  min: 8,
  toi: 4,
  passPct: 5,
};

function cardsById(): Record<string, PlayerCard> {
  return Object.fromEntries(useCollectionStore.getState().cards.map((card) => [card.id, card]));
}

function playerName(playerId: string): string {
  const player = useGamesStore.getState().players.find((p) => p.id === playerId);
  return player ? `${player.firstName} ${player.lastName}` : 'Your runner';
}

function pushNotification(input: {
  type: NotificationType;
  title: string;
  body: string;
  cardId?: string;
  gameId?: string;
}): void {
  useNotificationsStore.getState().push(input);
}

function grantXpWithNotifications(cardId: string, amount: number): void {
  const result = useCollectionStore.getState().grantXp(cardId, amount);
  if (!result) {
    return;
  }
  const name = playerName(result.card.playerId);
  if (result.levelsGained > 0) {
    pushNotification({
      type: 'card_level_up',
      title: 'Card leveled up',
      body: `${name} reached level ${result.card.level}.`,
      cardId,
    });
  }
  if (result.newStage) {
    pushNotification({
      type: 'card_level_up',
      title: 'Card evolved',
      body: `${name} advanced to ${result.newStage} stage.`,
      cardId,
    });
  }
  if (result.evolutionChoiceUnlocked) {
    pushNotification({
      type: 'evolution_choice',
      title: 'Evolution unlocked',
      body: `${name} can now choose a new evolution path.`,
      cardId,
    });
  }
}

function archiveFinishedRelay(relay: Relay): void {
  const completedLegs = relay.legs.filter((leg) => leg.status === 'completed').length;
  const reward = computeRelayReward(relay);
  const perfect = relay.status === 'completed' && !relay.shieldUsed;

  const entry: RelayHistoryEntry = {
    id: relay.id,
    dateKey: relay.dateKey,
    relay,
    completedLegs,
    perfect,
    reward,
  };
  useHistoryStore.getState().addEntry(entry);
  useRewardsStore.getState().addCoins(reward.coins);
  useCollectionStore
    .getState()
    .bumpRelayFinishes(relay.status === 'completed' ? relay.legs.map((leg) => leg.cardId) : []);
  useUserStore.getState().applyRelayOutcome({
    completedLegs,
    totalLegs: relay.legs.length,
    perfect,
    completed: relay.status === 'completed',
    ratingDelta: reward.ratingDelta,
    accountXp: reward.accountXp,
  });
  useRewardsStore.getState().advanceQuests(['q_season_relays'], relay.status === 'completed' ? 1 : 0);
}

function handleEvents(relay: Relay, events: RelayEvent[]): void {
  const rewards = useRewardsStore.getState();
  const collection = useCollectionStore.getState();

  for (const event of events) {
    switch (event.type) {
      case 'leg_completed': {
        const leg = relay.legs.find((l) => l.slot === event.slot);
        if (!leg) {
          break;
        }
        const name = playerName(leg.playerId);
        collection.recordLeg(leg.cardId, true);
        grantXpWithNotifications(leg.cardId, LEG_CARD_XP[leg.objective.difficulty]);
        rewards.advanceQuests(['q_daily_legs', 'q_season_legs'], 1);
        const game = useGamesStore.getState().games.find((g) => g.id === leg.gameId);
        if (game?.status === 'live') {
          rewards.advanceQuests(['q_daily_live'], 1);
        }
        pushNotification({
          type: 'leg_completed',
          title: event.savedByShield ? 'Shield save!' : `Leg ${event.slot + 1} complete`,
          body: event.savedByShield
            ? `${name} missed the objective, but your Shield revived the leg.`
            : `${name} completed “${leg.objective.label}”.`,
          cardId: leg.cardId,
          gameId: leg.gameId,
        });
        break;
      }
      case 'baton_passed': {
        const nextLeg = relay.legs.find((l) => l.slot === event.toSlot);
        if (!nextLeg) {
          break;
        }
        rewards.advanceQuests(['q_daily_baton'], 1);
        pushNotification({
          type: 'baton_passed',
          title: 'Baton passed',
          body: `${playerName(nextLeg.playerId)} is live — objective: ${nextLeg.objective.label.toLowerCase()}.`,
          cardId: nextLeg.cardId,
          gameId: nextLeg.gameId,
        });
        break;
      }
      case 'connector_boost': {
        const boosted = relay.legs.find((l) => l.slot === event.slot);
        if (boosted) {
          pushNotification({
            type: 'baton_passed',
            title: 'Connector boost',
            body: `${playerName(boosted.playerId)}’s objective eased to ${boosted.objective.target}.`,
            cardId: boosted.cardId,
          });
        }
        break;
      }
      case 'leg_failed': {
        const leg = relay.legs.find((l) => l.slot === event.slot);
        if (leg) {
          collection.recordLeg(leg.cardId, false);
          grantXpWithNotifications(leg.cardId, FAILED_LEG_CARD_XP);
        }
        break;
      }
      case 'relay_completed': {
        pushNotification({
          type: 'relay_completed',
          title: 'Relay complete!',
          body: 'All five legs finished. Rewards are in — see today’s payout in History.',
        });
        break;
      }
      case 'relay_failed': {
        pushNotification({
          type: 'relay_failed',
          title: 'Relay over',
          body: 'The chain broke. Your completed legs still earned coins and XP.',
        });
        break;
      }
      case 'shield_used':
        // Covered by the savedByShield leg_completed notification.
        break;
    }
  }
}

function commitResult(result: EngineResult): void {
  useRelayStore.getState().setActiveRelay(result.relay);
  handleEvents(result.relay, result.events);
  if (isFinished(result.relay) && result.events.length > 0) {
    archiveFinishedRelay(result.relay);
  }
}

/** Start a locked relay (first leg takes the baton). */
export function simStartRelay(): void {
  const relay = useRelayStore.getState().activeRelay;
  if (!relay || relay.status !== 'locked') {
    return;
  }
  useRelayStore.getState().setActiveRelay(activateRelay(relay));
}

/** +1 chunk of the active player's objective stat, mirrored into the box score. */
export function simAdvanceActiveStat(): void {
  const relay = useRelayStore.getState().activeRelay;
  if (!relay || relay.status !== 'live') {
    return;
  }
  const leg = engineActiveLeg(relay);
  if (!leg) {
    return;
  }
  const chunk = STAT_CHUNK[leg.objective.statKey] ?? 1;
  const remaining = leg.objective.target - leg.progress;
  const amount = Math.min(chunk, Math.max(1, remaining));

  useGamesStore.getState().applyStatDelta(leg.gameId, leg.playerId, leg.objective.statKey, amount);
  const game = useGamesStore.getState().games.find((g) => g.id === leg.gameId);
  if (game) {
    const player = useGamesStore.getState().players.find((p) => p.id === leg.playerId);
    if (player) {
      // Scoring stats also move the scoreboard so screens stay coherent.
      if (leg.objective.statKey === 'pts') {
        useGamesStore.getState().bumpScore(leg.gameId, player.teamId, amount);
      } else if (leg.objective.statKey === 'g' || leg.objective.statKey === 'hr' || leg.objective.statKey === 'r') {
        useGamesStore.getState().bumpScore(leg.gameId, player.teamId, 1);
      }
      useGamesStore.getState().addPlay(leg.gameId, {
        id: `sim_play_${Date.now().toString(36)}`,
        clockLabel: game.clock ?? game.periodLabel ?? 'LIVE',
        description: `${playerName(leg.playerId)} moves the objective — ${leg.objective.shortLabel} progress.`,
        playerId: leg.playerId,
        isScoringPlay: leg.objective.statKey === 'pts' || leg.objective.statKey === 'g',
      });
    }
  }

  commitResult(applyStatToActiveLeg(relay, amount, cardsById()));
}

/** Instantly complete the active leg (baton passes). */
export function simCompleteActiveLeg(): void {
  const relay = useRelayStore.getState().activeRelay;
  if (!relay || relay.status !== 'live') {
    return;
  }
  const leg = engineActiveLeg(relay);
  if (leg) {
    const remaining = Math.max(0, leg.objective.target - leg.progress);
    if (remaining > 0) {
      useGamesStore
        .getState()
        .applyStatDelta(leg.gameId, leg.playerId, leg.objective.statKey, remaining);
    }
  }
  commitResult(completeActiveLeg(relay, cardsById(), false));
}

/** Fail the active leg (Shield may still revive it). */
export function simFailActiveLeg(): void {
  const relay = useRelayStore.getState().activeRelay;
  if (!relay || relay.status !== 'live') {
    return;
  }
  commitResult(failActiveLeg(relay, cardsById()));
}

/** Run the rest of the relay to completion. */
export function simCompleteRelay(): void {
  let guard = 0;
  while (guard < 6) {
    guard += 1;
    const relay = useRelayStore.getState().activeRelay;
    if (!relay) {
      return;
    }
    if (relay.status === 'locked') {
      simStartRelay();
      continue;
    }
    if (relay.status !== 'live') {
      return;
    }
    simCompleteActiveLeg();
  }
}

/** Wipe persisted state and rebuild the demo world for today. */
export async function resetDemoData(): Promise<void> {
  await clearPersistedState();
  const seed = rebuildSeed();
  useUserStore.getState().reset(seed.user);
  useGamesStore.getState().reset({
    seedDateKey: seed.seedDateKey,
    games: seed.games,
    players: seed.players,
  });
  useCollectionStore.getState().reset(seed.cards);
  useRelayStore.getState().reset(seed.activeRelay);
  useHistoryStore.getState().reset(seed.history);
  useNotificationsStore.getState().reset(seed.notifications);
  useRewardsStore.getState().reset({
    coins: seed.coins,
    quests: seed.quests,
    rewards: seed.rewards,
  });
}
