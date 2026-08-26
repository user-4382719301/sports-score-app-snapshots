import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Panel } from '@/components/shared/Panel';
import { Screen } from '@/components/shared/Screen';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { StatBlock } from '@/components/shared/StatBlock';
import { RelayChainRail } from '@/components/relay/RelayChainRail';
import { RelayLegRow } from '@/components/relay/RelayLegRow';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useHistoryStore } from '@/stores/historyStore';
import { colors, spacing } from '@/theme';
import { formatPercent, formatSigned } from '@/utils/format';
import { formatShortDate } from '@/utils/time';

export default function HistoryEntryScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const router = useRouter();
  const entry = useHistoryStore((state) => state.entries.find((e) => e.id === entryId));
  const players = useGamesStore((state) => state.players);
  const cards = useCollectionStore((state) => state.cards);

  if (!entry) {
    return (
      <Screen header={<ScreenHeader title="Relay" />}>
        <EmptyState
          icon="calendar-outline"
          title="Relay not found"
          message="This relay isn’t in your history."
        />
      </Screen>
    );
  }

  const { relay } = entry;

  return (
    <Screen
      header={
        <ScreenHeader
          title={formatShortDate(entry.dateKey)}
          subtitle={`${entry.completedLegs} of ${relay.legs.length} legs · ${formatPercent(entry.completedLegs / relay.legs.length)}`}
        />
      }
    >
      <Panel>
        <View style={styles.badgeRow}>
          <Badge
            label={relay.status === 'completed' ? 'COMPLETED' : 'BROKE'}
            color={relay.status === 'completed' ? colors.success : colors.danger}
          />
          {entry.perfect ? <Badge label="PERFECT" color={colors.gold} icon="sparkles-outline" /> : null}
          {relay.shieldUsed ? <Badge label="SHIELD SAVE" color={colors.success} /> : null}
          <Badge label={`×${relay.rewardMultiplier.toFixed(2)}`} color={colors.primaryBright} />
        </View>
        <View style={styles.railWrap}>
          <RelayChainRail relay={relay} />
        </View>
        <View style={styles.legList}>
          {relay.legs.map((leg) => (
            <RelayLegRow
              key={leg.slot}
              leg={leg}
              player={players.find((p) => p.id === leg.playerId)}
              card={cards.find((c) => c.id === leg.cardId)}
              onPress={() =>
                router.push({ pathname: '/card/[cardId]', params: { cardId: leg.cardId } })
              }
            />
          ))}
        </View>
      </Panel>

      <Panel style={styles.rewardPanel}>
        <AppText variant="micro" color={colors.textMuted}>
          FINAL REWARD
        </AppText>
        <View style={styles.statsRow}>
          <StatBlock label="Coins" value={`+${entry.reward.coins}`} color={colors.gold} />
          <StatBlock label="Account XP" value={`+${entry.reward.accountXp}`} color={colors.primaryBright} />
          <StatBlock
            label="Rating"
            value={formatSigned(entry.reward.ratingDelta)}
            color={entry.reward.ratingDelta >= 0 ? colors.success : colors.danger}
          />
        </View>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  railWrap: {
    marginBottom: spacing.lg,
  },
  legList: {
    gap: spacing.xs,
  },
  rewardPanel: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
  },
});
