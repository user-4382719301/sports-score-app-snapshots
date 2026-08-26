import { useEffect, useRef } from 'react';
import { computeRelayReward } from '@/domain/rewards';
import type { Relay, RelayHistoryEntry } from '@/types';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useRelayStore } from '@/stores/relayStore';
import { useRewardsStore } from '@/stores/rewardsStore';
import { useUserStore } from '@/stores/userStore';
import { rebuildSeed } from '@/stores/storage';
import { todayKey } from '@/utils/time';

export function useStoresHydrated(): boolean {
  const user = useUserStore((state) => state.hasHydrated);
  const games = useGamesStore((state) => state.hasHydrated);
  const collection = useCollectionStore((state) => state.hasHydrated);
  const relay = useRelayStore((state) => state.hasHydrated);
  const history = useHistoryStore((state) => state.hasHydrated);
  const notifications = useNotificationsStore((state) => state.hasHydrated);
  const rewards = useRewardsStore((state) => state.hasHydrated);
  return user && games && collection && relay && history && notifications && rewards;
}

/** Archive an unfinished relay from a previous day as a final history entry. */
function archiveStaleRelay(relay: Relay): void {
  const completedLegs = relay.legs.filter((leg) => leg.status === 'completed').length;
  const finished: Relay = {
    ...relay,
    status: completedLegs === relay.legs.length ? 'completed' : 'failed',
    legs: relay.legs.map((leg) =>
      leg.status === 'waiting' || leg.status === 'active' ? { ...leg, status: 'locked' } : leg,
    ),
  };
  const entry: RelayHistoryEntry = {
    id: finished.id,
    dateKey: finished.dateKey,
    relay: finished,
    completedLegs,
    perfect: finished.status === 'completed' && !finished.shieldUsed,
    reward: computeRelayReward(finished),
  };
  useHistoryStore.getState().addEntry(entry);
}

/**
 * Day rollover: when the persisted slate is from a previous day, rebuild
 * today's games, archive the stale relay, and reset daily quests. Cards and
 * profile persist — they are the season-long layer.
 */
export function useDayRollover(hydrated: boolean): void {
  const applied = useRef(false);

  useEffect(() => {
    if (!hydrated || applied.current) {
      return;
    }
    applied.current = true;

    const { seedDateKey } = useGamesStore.getState();
    if (seedDateKey === todayKey()) {
      return;
    }

    const staleRelay = useRelayStore.getState().activeRelay;
    if (staleRelay && staleRelay.dateKey !== todayKey()) {
      if (staleRelay.status === 'live' || staleRelay.status === 'locked') {
        archiveStaleRelay(staleRelay);
      }
      useRelayStore.getState().reset(null);
    }

    const seed = rebuildSeed();
    useGamesStore.getState().reset({
      seedDateKey: seed.seedDateKey,
      games: seed.games,
      players: seed.players,
    });
    useRewardsStore.getState().resetDailyQuests();
    useNotificationsStore.getState().push({
      type: 'game_starting',
      title: 'New slate',
      body: 'Today’s games are in. Build a fresh relay before first tip.',
    });
  }, [hydrated]);
}
