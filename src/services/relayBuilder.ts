import { assembleRelay } from '@/domain/relayEngine';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useRelayStore } from '@/stores/relayStore';
import { todayKey } from '@/utils/time';

/**
 * Turn the current five-leg draft into today's locked relay. Assumes the
 * caller already ran validateDraft — this only assembles and stores.
 */
export function saveDraftAsRelay(): void {
  const { draft } = useRelayStore.getState();
  const cards = useCollectionStore.getState().cards;
  const { games, players } = useGamesStore.getState();

  const relay = assembleRelay({
    id: `relay_${todayKey()}_${Date.now().toString(36)}`,
    dateKey: todayKey(),
    drafts: draft,
    cardsById: Object.fromEntries(cards.map((card) => [card.id, card])),
    playersById: Object.fromEntries(players.map((player) => [player.id, player])),
    gamesById: Object.fromEntries(games.map((game) => [game.id, game])),
  });

  useRelayStore.getState().setActiveRelay(relay);
  useRelayStore.getState().clearDraft();
  useNotificationsStore.getState().push({
    type: 'game_starting',
    title: 'Relay saved',
    body: `Your relay locks when the first game starts. Five runners are ready.`,
  });
}
