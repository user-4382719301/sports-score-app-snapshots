import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/shared/AppText';
import { EmptyState } from '@/components/shared/EmptyState';
import { Screen } from '@/components/shared/Screen';
import { SearchInput } from '@/components/shared/SearchInput';
import { SegmentedTabs } from '@/components/shared/SegmentedTabs';
import { GameRow } from '@/components/games/GameRow';
import { SPORTS } from '@/constants/sportCatalog';
import { TEAMS_BY_ID } from '@/data';
import { useRelayGameIds } from '@/hooks/useEntities';
import { useGamesStore } from '@/stores/gamesStore';
import type { Game, SportId } from '@/types';
import { colors, spacing } from '@/theme';

type DayOption = 'yesterday' | 'today' | 'tomorrow';
type SportFilter = 'all' | SportId;

function matchesSearch(game: Game, query: string): boolean {
  if (query.length === 0) {
    return true;
  }
  const lower = query.toLowerCase();
  const teams = [TEAMS_BY_ID[game.away.teamId], TEAMS_BY_ID[game.home.teamId]];
  return teams.some(
    (team) =>
      team &&
      (`${team.location} ${team.name}`.toLowerCase().includes(lower) ||
        team.abbreviation.toLowerCase().includes(lower)),
  );
}

function GamesSection({
  title,
  games,
  accent,
}: {
  title: string;
  games: Game[];
  accent?: string;
}) {
  const router = useRouter();
  const relayGameIds = useRelayGameIds();
  const toggleFavorite = useGamesStore((state) => state.toggleGameFavorite);

  if (games.length === 0) {
    return null;
  }
  return (
    <View style={styles.section}>
      <AppText variant="label" color={accent ?? colors.textMuted}>
        {title.toUpperCase()}
      </AppText>
      <View style={styles.sectionList}>
        {games.map((game) => (
          <GameRow
            key={game.id}
            game={game}
            inRelay={relayGameIds.has(game.id)}
            onPress={() => router.push({ pathname: '/game/[gameId]', params: { gameId: game.id } })}
            onToggleFavorite={() => toggleFavorite(game.id)}
          />
        ))}
      </View>
    </View>
  );
}

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const games = useGamesStore((state) => state.games);
  const [day, setDay] = useState<DayOption>('today');
  const [sport, setSport] = useState<SportFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      games.filter(
        (game) =>
          (sport === 'all' || game.sport === sport) &&
          matchesSearch(game, query) &&
          // The demo slate is today's; "yesterday" shows its finals so the
          // date control stays meaningful without a second day of data.
          (day === 'today' || (day === 'yesterday' && game.status === 'final')),
      ),
    [games, sport, query, day],
  );

  const live = filtered.filter((game) => game.status === 'live');
  const upcoming = filtered
    .filter((game) => game.status === 'scheduled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const final = filtered.filter((game) => game.status === 'final');

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <AppText variant="title">Games</AppText>
      <SegmentedTabs<DayOption>
        options={[
          { value: 'yesterday', label: 'Yesterday' },
          { value: 'today', label: 'Today' },
          { value: 'tomorrow', label: 'Tomorrow' },
        ]}
        value={day}
        onChange={setDay}
      />
      <SegmentedTabs<SportFilter>
        options={[
          { value: 'all', label: 'All' },
          ...SPORTS.map((s) => ({ value: s.id, label: s.shortName })),
        ]}
        value={sport}
        onChange={setSport}
        scrollable
      />
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search teams" />
    </View>
  );

  const empty = day === 'tomorrow' || filtered.length === 0;

  return (
    <Screen header={header}>
      {empty ? (
        <EmptyState
          icon="calendar-outline"
          title={day === 'tomorrow' ? 'Schedule drops in the morning' : 'No games found'}
          message={
            day === 'tomorrow'
              ? 'Tomorrow’s slate isn’t posted yet. Check back after the morning refresh.'
              : 'Try a different sport or clear your search.'
          }
        />
      ) : (
        <>
          <GamesSection title="Live now" games={live} accent={colors.live} />
          <GamesSection title="Upcoming" games={upcoming} />
          <GamesSection title="Final" games={final} />
        </>
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
  section: {
    gap: spacing.sm,
  },
  sectionList: {
    gap: spacing.sm,
  },
});
