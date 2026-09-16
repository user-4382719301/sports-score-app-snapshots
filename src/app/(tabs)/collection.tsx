import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/shared/AppText';
import { EmptyState } from '@/components/shared/EmptyState';
import { Screen } from '@/components/shared/Screen';
import { SearchInput } from '@/components/shared/SearchInput';
import { SegmentedTabs } from '@/components/shared/SegmentedTabs';
import { PlayerCardTile } from '@/components/cards/PlayerCardTile';
import { SPORTS } from '@/constants/sportCatalog';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import type { PlayerCard, SportId } from '@/types';
import { colors, spacing } from '@/theme';

type SportFilter = 'all' | SportId;
type ViewFilter = 'all' | 'favorites' | 'evolved';
type SortMode = 'level' | 'usage' | 'success';

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cards = useCollectionStore((state) => state.cards);
  const toggleFavorite = useCollectionStore((state) => state.toggleFavorite);
  const players = useGamesStore((state) => state.players);

  const [query, setQuery] = useState('');
  const [sport, setSport] = useState<SportFilter>('all');
  const [view, setView] = useState<ViewFilter>('all');
  const [sort, setSort] = useState<SortMode>('level');

  const playersById = useMemo(
    () => Object.fromEntries(players.map((player) => [player.id, player])),
    [players],
  );

  const visible = useMemo(() => {
    const lower = query.toLowerCase();
    const filtered = cards.filter((card) => {
      const player = playersById[card.playerId];
      if (!player) {
        return false;
      }
      if (sport !== 'all' && player.sport !== sport) {
        return false;
      }
      if (view === 'favorites' && !card.favorite) {
        return false;
      }
      // "Evolved" = past the rookie stage, earned through play.
      if (view === 'evolved' && card.stage === 'rookie') {
        return false;
      }
      if (lower.length > 0) {
        const name = `${player.firstName} ${player.lastName}`.toLowerCase();
        if (!name.includes(lower)) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === 'level') {
        return b.level - a.level;
      }
      if (sort === 'usage') {
        return b.relayAppearances - a.relayAppearances;
      }
      return b.successRate - a.successRate;
    });
    return sorted;
  }, [cards, playersById, query, sport, view, sort]);

  const rows = useMemo(() => {
    const paired: PlayerCard[][] = [];
    for (let i = 0; i < visible.length; i += 2) {
      paired.push(visible.slice(i, i + 2));
    }
    return paired;
  }, [visible]);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <AppText variant="title">Collection</AppText>
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search players" />
      <SegmentedTabs<SportFilter>
        options={[
          { value: 'all', label: 'All' },
          ...SPORTS.map((s) => ({ value: s.id, label: s.shortName })),
        ]}
        value={sport}
        onChange={setSport}
        scrollable
      />
      <View style={styles.filterRow}>
        <SegmentedTabs<ViewFilter>
          options={[
            { value: 'all', label: 'Everyone' },
            { value: 'favorites', label: 'Favorites' },
            { value: 'evolved', label: 'Evolved' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>
      <View style={styles.sortRow}>
        <AppText variant="micro" color={colors.textMuted}>
          SORT BY
        </AppText>
        <SegmentedTabs<SortMode>
          options={[
            { value: 'level', label: 'Level' },
            { value: 'usage', label: 'Usage' },
            { value: 'success', label: 'Success rate' },
          ]}
          value={sort}
          onChange={setSort}
        />
      </View>
    </View>
  );

  return (
    <Screen header={header}>
      {visible.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="No cards match"
          message="Adjust the filters or clear your search to see your season collection."
        />
      ) : (
        <View style={styles.grid}>
          {rows.map((row) => (
            <View key={row.map((card) => card.id).join('_')} style={styles.gridRow}>
              {row.map((card) => {
                const player = playersById[card.playerId];
                if (!player) {
                  return null;
                }
                return (
                  <PlayerCardTile
                    key={card.id}
                    card={card}
                    player={player}
                    onPress={() =>
                      router.push({ pathname: '/card/[cardId]', params: { cardId: card.id } })
                    }
                    onToggleFavorite={() => toggleFavorite(card.id)}
                  />
                );
              })}
              {row.length === 1 ? <View style={styles.gridSpacer} /> : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
  },
  sortRow: {
    gap: spacing.sm,
  },
  grid: {
    gap: spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridSpacer: {
    flex: 1,
  },
});
