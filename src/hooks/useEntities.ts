import { useMemo } from 'react';
import { TEAMS_BY_ID } from '@/data';
import type { Game, Player, PlayerCard, Team } from '@/types';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useRelayStore } from '@/stores/relayStore';

export function usePlayer(playerId: string | undefined): Player | undefined {
  return useGamesStore((state) =>
    playerId ? state.players.find((p) => p.id === playerId) : undefined,
  );
}

export function useGame(gameId: string | undefined): Game | undefined {
  return useGamesStore((state) => (gameId ? state.games.find((g) => g.id === gameId) : undefined));
}

export function useCard(cardId: string | undefined): PlayerCard | undefined {
  return useCollectionStore((state) =>
    cardId ? state.cards.find((c) => c.id === cardId) : undefined,
  );
}

export function teamOf(player: Player | undefined): Team | undefined {
  return player ? TEAMS_BY_ID[player.teamId] : undefined;
}

/** Set of playerIds in today's active relay — drives "matters to you" chrome. */
export function useRelayPlayerIds(): Set<string> {
  const relay = useRelayStore((state) => state.activeRelay);
  return useMemo(() => new Set(relay?.legs.map((leg) => leg.playerId) ?? []), [relay]);
}

/** Games containing one of the user's relay athletes. */
export function useRelayGameIds(): Set<string> {
  const relay = useRelayStore((state) => state.activeRelay);
  return useMemo(() => new Set(relay?.legs.map((leg) => leg.gameId) ?? []), [relay]);
}
