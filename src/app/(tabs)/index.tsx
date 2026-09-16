import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LiveDot } from '@/components/shared/LiveDot';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { GameRow } from '@/components/games/GameRow';
import { RelayChainRail } from '@/components/relay/RelayChainRail';
import { activeLeg, completedLegCount } from '@/domain/relayEngine';
import { useRelayGameIds } from '@/hooks/useEntities';
import { Screen } from '@/components/shared/Screen';
import { useGamesStore } from '@/stores/gamesStore';
import { useNotificationsStore, selectUnreadCount } from '@/stores/notificationsStore';
import { useRelayStore } from '@/stores/relayStore';
import { useRewardsStore } from '@/stores/rewardsStore';
import { useUserStore } from '@/stores/userStore';
import { colors, radii, spacing } from '@/theme';
import { formatCountdown } from '@/utils/time';

function HomeHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rating = useUserStore((state) => state.user.relayRating);
  const unread = useNotificationsStore(selectUnreadCount);

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <AppText variant="display" color={colors.textPrimary}>
        Relay
      </AppText>
      <View style={styles.headerRight}>
        <View style={styles.ratingPill}>
          <Ionicons name="trophy-outline" size={13} color={colors.primaryBright} />
          <AppText variant="caption" color={colors.primaryBright}>
            {rating}
          </AppText>
        </View>
        <PressableScale
          onPress={() => router.push('/notifications')}
          accessibilityLabel={
            unread > 0 ? `Notifications, ${unread} unread` : 'Notifications, all read'
          }
          style={styles.bellButton}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          {unread > 0 ? <View style={styles.bellDot} /> : null}
        </PressableScale>
      </View>
    </View>
  );
}

function ActiveRelayPanel() {
  const router = useRouter();
  const relay = useRelayStore((state) => state.activeRelay);
  const players = useGamesStore((state) => state.players);

  if (!relay) {
    return (
      <Panel>
        <EmptyState
          icon="flash-outline"
          title="No relay yet today"
          message="Pick five athletes from tonight’s games and chain their objectives together."
          actionLabel="Build today’s relay"
          onAction={() => router.push('/relay/build')}
        />
      </Panel>
    );
  }

  const done = completedLegCount(relay);
  const current = activeLeg(relay);
  const currentPlayer = players.find((p) => p.id === current?.playerId);
  const nextLeg = current
    ? relay.legs.find((leg) => leg.slot === current.slot + 1 && leg.status === 'waiting')
    : undefined;
  const nextPlayer = players.find((p) => p.id === nextLeg?.playerId);

  const statusLine =
    relay.status === 'live' ? (
      <View style={styles.statusRow}>
        <LiveDot />
        <AppText variant="label" color={colors.live}>
          LIVE · LEG {current ? current.slot + 1 : done} OF 5
        </AppText>
      </View>
    ) : relay.status === 'locked' ? (
      <View style={styles.statusRow}>
        <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
        <AppText variant="label" color={colors.textSecondary}>
          LOCKS IN {formatCountdown(relay.lockAt).toUpperCase()}
        </AppText>
      </View>
    ) : (
      <Badge
        label={relay.status === 'completed' ? 'RELAY COMPLETE' : 'RELAY OVER'}
        color={relay.status === 'completed' ? colors.success : colors.danger}
      />
    );

  return (
    <PressableScale
      onPress={() => router.push('/relay')}
      accessibilityLabel={`Open today's relay, ${done} of 5 legs complete`}
    >
      <Panel glowColor={relay.status === 'live' ? colors.live : undefined}>
        <View style={styles.panelTop}>
          {statusLine}
          <AppText variant="caption" color={colors.textSecondary}>
            {done}/5 legs
          </AppText>
        </View>

        <View style={styles.railWrap}>
          <RelayChainRail relay={relay} />
        </View>
        <ProgressBar
          ratio={done / relay.legs.length}
          color={relay.status === 'failed' ? colors.danger : colors.success}
          accessibilityLabel={`${done} of ${relay.legs.length} legs complete`}
        />

        {current && currentPlayer ? (
          <View style={styles.currentBlock}>
            <AppText variant="micro" color={colors.textMuted}>
              NOW RUNNING
            </AppText>
            <AppText variant="heading">
              {currentPlayer.firstName} {currentPlayer.lastName}
            </AppText>
            <AppText variant="caption" color={colors.live}>
              {current.objective.label} · {current.progress}/{current.objective.target}
            </AppText>
            {nextPlayer ? (
              <AppText variant="micro" color={colors.textSecondary}>
                Next up: {nextPlayer.firstName} {nextPlayer.lastName}
              </AppText>
            ) : (
              <AppText variant="micro" color={colors.textSecondary}>
                Anchor leg — this finishes the relay
              </AppText>
            )}
          </View>
        ) : null}

        {relay.status === 'locked' ? (
          <PressableScale
            onPress={() => router.push('/relay/build')}
            accessibilityLabel="Edit relay before lock"
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={15} color={colors.primaryBright} />
            <AppText variant="caption" color={colors.primaryBright}>
              Edit before lock
            </AppText>
          </PressableScale>
        ) : null}
      </Panel>
    </PressableScale>
  );
}

function QuestSummary() {
  const router = useRouter();
  const quests = useRewardsStore((state) => state.quests);
  const daily = quests.filter((quest) => quest.kind === 'daily').slice(0, 2);
  if (daily.length === 0) {
    return null;
  }
  return (
    <Panel style={styles.questPanel}>
      {daily.map((quest) => (
        <View key={quest.id} style={styles.questRow}>
          <Ionicons
            name={quest.progress >= quest.target ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={quest.progress >= quest.target ? colors.success : colors.textMuted}
          />
          <View style={styles.questMain}>
            <AppText variant="caption">{quest.title}</AppText>
            <ProgressBar ratio={quest.progress / quest.target} color={colors.primary} height={4} />
          </View>
          <AppText variant="micro" color={colors.textMuted}>
            {quest.progress}/{quest.target}
          </AppText>
        </View>
      ))}
      <PressableScale
        onPress={() => router.push('/rewards')}
        accessibilityLabel="Open rewards and quests"
        style={styles.questLink}
      >
        <AppText variant="caption" color={colors.primaryBright}>
          All quests & rewards
        </AppText>
        <Ionicons name="chevron-forward" size={13} color={colors.primaryBright} />
      </PressableScale>
    </Panel>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const relayGameIds = useRelayGameIds();
  const games = useGamesStore((state) => state.games);

  const relayGames = useMemo(
    () =>
      games
        .filter((game) => relayGameIds.has(game.id))
        .sort((a, b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0)),
    [games, relayGameIds],
  );

  return (
    <Screen header={<HomeHeader />}>
      <ActiveRelayPanel />

      {relayGames.length > 0 ? (
        <>
          <SectionHeader
            title="Games that matter"
            actionLabel="All games"
            onAction={() => router.push('/games')}
          />
          <View style={styles.gamesList}>
            {relayGames.map((game) => (
              <GameRow
                key={game.id}
                game={game}
                inRelay
                onPress={() => router.push({ pathname: '/game/[gameId]', params: { gameId: game.id } })}
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="Today’s quests" />
      <QuestSummary />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    minHeight: 32,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  panelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  railWrap: {
    marginBottom: spacing.md,
  },
  currentBlock: {
    marginTop: spacing.lg,
    gap: 3,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    minHeight: 36,
  },
  gamesList: {
    gap: spacing.sm,
  },
  questPanel: {
    gap: spacing.md,
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  questMain: {
    flex: 1,
    gap: spacing.xs,
  },
  questLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    alignSelf: 'flex-start',
    minHeight: 32,
  },
});
