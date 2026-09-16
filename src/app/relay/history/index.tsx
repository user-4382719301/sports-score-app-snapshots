import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';
import { Screen } from '@/components/shared/Screen';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { StatBlock } from '@/components/shared/StatBlock';
import { teamOf } from '@/hooks/useEntities';
import { useGamesStore } from '@/stores/gamesStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useUserStore } from '@/stores/userStore';
import { colors, spacing } from '@/theme';
import { formatPercent, initialsFor } from '@/utils/format';
import { formatShortDate } from '@/utils/time';

export default function RelayHistoryScreen() {
  const router = useRouter();
  const entries = useHistoryStore((state) => state.entries);
  const user = useUserStore((state) => state.user);
  const players = useGamesStore((state) => state.players);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((player) => [player.id, player])),
    [players],
  );

  const best = useMemo(
    () =>
      entries.reduce<(typeof entries)[number] | undefined>(
        (top, entry) =>
          !top || entry.reward.coins > top.reward.coins ? entry : top,
        undefined,
      ),
    [entries],
  );

  return (
    <Screen header={<ScreenHeader title="Relay History" subtitle={`${entries.length} relays recorded`} />}>
      <Panel style={styles.summaryPanel}>
        <View style={styles.statsRow}>
          <StatBlock label="Completion" value={formatPercent(user.successRate)} color={colors.success} />
          <StatBlock label="Longest streak" value={String(user.longestStreak)} color={colors.live} />
          <StatBlock
            label="Best relay"
            value={best ? `${best.reward.coins}c` : '—'}
            color={colors.gold}
          />
        </View>
      </Panel>

      {entries.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No relays yet"
          message="Finish your first relay and its story lands here."
        />
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => {
            const failedLeg = entry.relay.legs.find((leg) => leg.status === 'failed');
            const failedPlayer = failedLeg ? playersById[failedLeg.playerId] : undefined;
            return (
              <PressableScale
                key={entry.id}
                onPress={() =>
                  router.push({
                    pathname: '/relay/history/[entryId]',
                    params: { entryId: entry.id },
                  })
                }
                accessibilityLabel={`Relay from ${formatShortDate(entry.dateKey)}, ${entry.completedLegs} of 5 legs${entry.perfect ? ', perfect relay' : ''}`}
              >
                <Panel style={styles.entryPanel}>
                  <View style={styles.entryTop}>
                    <AppText variant="bodyBold">{formatShortDate(entry.dateKey)}</AppText>
                    <View style={styles.entryBadges}>
                      {entry.perfect ? (
                        <Badge label="PERFECT" color={colors.gold} icon="sparkles-outline" small />
                      ) : null}
                      {entry.relay.shieldUsed ? (
                        <Badge label="SHIELD SAVE" color={colors.success} small />
                      ) : null}
                      <Badge
                        label={`${entry.completedLegs}/5`}
                        color={entry.relay.status === 'completed' ? colors.success : colors.danger}
                        small
                      />
                    </View>
                  </View>

                  <View style={styles.avatarRow}>
                    {entry.relay.legs.map((leg) => {
                      const player = playersById[leg.playerId];
                      const team = teamOf(player);
                      return (
                        <View
                          key={leg.slot}
                          style={[
                            styles.avatarWrap,
                            leg.status === 'failed' && styles.avatarFailed,
                            leg.status === 'locked' && styles.avatarLocked,
                          ]}
                        >
                          <InitialsAvatar
                            initials={
                              player ? initialsFor(player.firstName, player.lastName) : '??'
                            }
                            color={team?.color ?? colors.textMuted}
                            size={34}
                          />
                          {leg.status === 'completed' ? (
                            <View style={styles.legMark}>
                              <Ionicons name="checkmark" size={9} color={colors.textOnAccent} />
                            </View>
                          ) : leg.status === 'failed' ? (
                            <View style={[styles.legMark, styles.legMarkFailed]}>
                              <Ionicons name="close" size={9} color={colors.textOnAccent} />
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.entryBottom}>
                    <AppText variant="micro" color={colors.textSecondary}>
                      {formatPercent(entry.completedLegs / 5)} success
                      {failedPlayer ? ` · broke at ${failedPlayer.lastName}` : ''}
                    </AppText>
                    <AppText variant="micro" color={colors.gold}>
                      +{entry.reward.coins} coins
                    </AppText>
                  </View>
                </Panel>
              </PressableScale>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryPanel: {
    paddingVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
  },
  list: {
    gap: spacing.md,
  },
  entryPanel: {
    gap: spacing.md,
  },
  entryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarFailed: {
    opacity: 0.9,
  },
  avatarLocked: {
    opacity: 0.4,
  },
  legMark: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  legMarkFailed: {
    backgroundColor: colors.danger,
  },
  entryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
