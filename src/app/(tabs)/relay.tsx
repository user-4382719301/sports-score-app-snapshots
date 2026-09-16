import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { LiveDot } from '@/components/shared/LiveDot';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Screen } from '@/components/shared/Screen';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { BatonPassOverlay } from '@/components/relay/BatonPassOverlay';
import { RelayChainRail } from '@/components/relay/RelayChainRail';
import { RelayLegRow } from '@/components/relay/RelayLegRow';
import { SimControls } from '@/components/relay/SimControls';
import { STAT_COLUMNS, formatStatValue } from '@/constants/statCatalog';
import { TEAMS_BY_ID } from '@/data';
import { activeLeg, completedLegCount } from '@/domain/relayEngine';
import { computeRelayReward } from '@/domain/rewards';
import { teamOf } from '@/hooks/useEntities';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useRelayStore } from '@/stores/relayStore';
import type { Game, Relay } from '@/types';
import { colors, radii, spacing } from '@/theme';
import { initialsFor } from '@/utils/format';
import { formatCountdown } from '@/utils/time';

function RelayHeader({ relay }: { relay: Relay | null }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <AppText variant="title">Today’s Relay</AppText>
      {relay ? (
        <View style={styles.headerChips}>
          <Badge
            label={`${relay.riskTier.toUpperCase()} RISK`}
            color={
              relay.riskTier === 'high'
                ? colors.danger
                : relay.riskTier === 'medium'
                  ? colors.gold
                  : colors.success
            }
            small
          />
          <Badge label={`×${relay.rewardMultiplier.toFixed(2)}`} color={colors.primaryBright} small />
          {relay.shieldAvailable ? (
            <Badge
              label={relay.shieldUsed ? 'SHIELD USED' : 'SHIELD READY'}
              color={relay.shieldUsed ? colors.textMuted : colors.success}
              icon="shield-half-outline"
              small
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Broadcast-style score bug for the active leg's game. */
function ScoreBug({ game }: { game: Game }) {
  const away = TEAMS_BY_ID[game.away.teamId];
  const home = TEAMS_BY_ID[game.home.teamId];
  return (
    <View style={styles.scoreBug}>
      <View style={styles.scoreTeam}>
        <AppText variant="label" color={colors.textSecondary}>
          {away?.abbreviation ?? '—'}
        </AppText>
        <AppText variant="title">{game.away.score}</AppText>
      </View>
      <View style={styles.scoreCenter}>
        {game.status === 'live' ? (
          <>
            <LiveDot />
            <AppText variant="micro" color={colors.live}>
              {game.periodLabel}
              {game.clock ? ` · ${game.clock}` : ''}
            </AppText>
          </>
        ) : (
          <AppText variant="micro" color={colors.textMuted}>
            {game.status === 'final' ? game.periodLabel : 'Upcoming'}
          </AppText>
        )}
      </View>
      <View style={styles.scoreTeam}>
        <AppText variant="label" color={colors.textSecondary}>
          {home?.abbreviation ?? '—'}
        </AppText>
        <AppText variant="title">{game.home.score}</AppText>
      </View>
    </View>
  );
}

function LiveLegPanel({ relay }: { relay: Relay }) {
  const router = useRouter();
  const players = useGamesStore((state) => state.players);
  const games = useGamesStore((state) => state.games);
  const current = activeLeg(relay);
  if (!current) {
    return null;
  }
  const player = players.find((p) => p.id === current.playerId);
  const game = games.find((g) => g.id === current.gameId);
  const team = teamOf(player);
  const statLine = game?.playerStats.find((line) => line.playerId === current.playerId);
  const columns = player ? STAT_COLUMNS[player.sport].slice(0, 5) : [];

  return (
    <Panel glowColor={colors.live}>
      {game ? <ScoreBug game={game} /> : null}

      <View style={styles.heroRow}>
        <InitialsAvatar
          initials={player ? initialsFor(player.firstName, player.lastName) : '??'}
          color={team?.color ?? colors.textMuted}
          size={64}
        />
        <View style={styles.heroMain}>
          <AppText variant="micro" color={colors.live}>
            ON THE RUN · LEG {current.slot + 1}
          </AppText>
          <AppText variant="heading">
            {player ? `${player.firstName} ${player.lastName}` : 'Unknown player'}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {team ? `${team.abbreviation} · ${player?.position}` : ''}
          </AppText>
        </View>
      </View>

      <View style={styles.objectiveBlock}>
        <View style={styles.objectiveRow}>
          <AppText variant="bodyBold">{current.objective.label}</AppText>
          <AppText variant="bodyBold" color={colors.live}>
            {current.progress}/{current.objective.target}
          </AppText>
        </View>
        <ProgressBar
          ratio={current.objective.target === 0 ? 0 : current.progress / current.objective.target}
          color={colors.live}
          height={8}
          accessibilityLabel={`Objective progress ${current.progress} of ${current.objective.target}`}
        />
      </View>

      {statLine && player ? (
        <View style={styles.statChips}>
          {columns.map((column) => (
            <View key={column.key} style={styles.statChip}>
              <AppText variant="micro" color={colors.textMuted}>
                {column.label}
              </AppText>
              <AppText variant="bodyBold">{formatStatValue(column, statLine.stats)}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      {game ? (
        <PressableScale
          onPress={() => router.push({ pathname: '/game/[gameId]', params: { gameId: game.id } })}
          accessibilityLabel="Open this game's detail"
          style={styles.gameLink}
        >
          <AppText variant="caption" color={colors.primaryBright}>
            Watch this game
          </AppText>
          <Ionicons name="chevron-forward" size={13} color={colors.primaryBright} />
        </PressableScale>
      ) : null}
    </Panel>
  );
}

function RecentPlays({ relay }: { relay: Relay }) {
  const games = useGamesStore((state) => state.games);
  const current = activeLeg(relay);
  const game = games.find((g) => g.id === current?.gameId);
  if (!game || game.plays.length === 0) {
    return null;
  }
  return (
    <>
      <SectionHeader title="Recent plays" />
      <Panel style={styles.playsPanel}>
        {game.plays.slice(0, 4).map((play) => (
          <View key={play.id} style={styles.playRow}>
            <AppText variant="micro" color={colors.textMuted} style={styles.playClock}>
              {play.clockLabel}
            </AppText>
            <AppText
              variant="caption"
              color={play.playerId === current?.playerId ? colors.primaryBright : colors.textSecondary}
              style={styles.playText}
            >
              {play.description}
            </AppText>
          </View>
        ))}
      </Panel>
    </>
  );
}

function OutcomePanel({ relay }: { relay: Relay }) {
  const router = useRouter();
  const completed = relay.status === 'completed';
  const reward = computeRelayReward(relay);
  return (
    <Panel glowColor={completed ? colors.success : colors.danger}>
      <View style={styles.outcomeIcon}>
        <Ionicons
          name={completed ? 'trophy-outline' : 'flag-outline'}
          size={30}
          color={completed ? colors.gold : colors.danger}
        />
      </View>
      <AppText variant="title" align="center">
        {completed ? (relay.shieldUsed ? 'Relay complete' : 'Perfect relay!') : 'The chain broke'}
      </AppText>
      <AppText variant="body" color={colors.textSecondary} align="center">
        {completedLegCount(relay)} of {relay.legs.length} legs · +{reward.coins} coins · rating{' '}
        {reward.ratingDelta >= 0 ? `+${reward.ratingDelta}` : reward.ratingDelta}
      </AppText>
      <PressableScale
        onPress={() => router.push('/relay/history')}
        accessibilityLabel="View relay history"
        style={styles.outcomeButton}
      >
        <AppText variant="bodyBold" color={colors.textOnAccent}>
          View relay history
        </AppText>
      </PressableScale>
    </Panel>
  );
}

export default function RelayScreen() {
  const router = useRouter();
  const relay = useRelayStore((state) => state.activeRelay);
  const players = useGamesStore((state) => state.players);
  const cards = useCollectionStore((state) => state.cards);

  // Baton pass celebration: subscribe to the store so a slot advance —
  // wherever it is triggered from — fires the overlay exactly once.
  const [batonTarget, setBatonTarget] = useState<string | null>(null);
  useEffect(() => {
    const slotOf = (state: ReturnType<typeof useRelayStore.getState>): number =>
      state.activeRelay ? (activeLeg(state.activeRelay)?.slot ?? -1) : -1;
    let prevSlot = slotOf(useRelayStore.getState());
    return useRelayStore.subscribe((state) => {
      const slot = slotOf(state);
      const advanced = state.activeRelay?.status === 'live' && prevSlot >= 0 && slot > prevSlot;
      if (advanced) {
        const leg = state.activeRelay?.legs.find((l) => l.slot === slot);
        const player = useGamesStore
          .getState()
          .players.find((p) => p.id === leg?.playerId);
        if (player) {
          setBatonTarget(`${player.firstName} ${player.lastName}`);
        }
      }
      prevSlot = slot;
    });
  }, []);

  if (!relay) {
    return (
      <Screen header={<RelayHeader relay={null} />}>
        <Panel>
          <EmptyState
            icon="flash-outline"
            title="Build today’s relay"
            message="Five athletes, five objectives, one chain. Save it before their games start."
            actionLabel="Start building"
            onAction={() => router.push('/relay/build')}
          />
        </Panel>
        <SimControls />
      </Screen>
    );
  }

  const locked = relay.status === 'locked';

  return (
    <View style={styles.root}>
      <Screen header={<RelayHeader relay={relay} />}>
        {relay.status === 'live' ? <LiveLegPanel relay={relay} /> : null}
        {relay.status === 'completed' || relay.status === 'failed' ? (
          <OutcomePanel relay={relay} />
        ) : null}

        {locked ? (
          <Panel>
            <View style={styles.lockedRow}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <AppText variant="bodyBold">Locks in {formatCountdown(relay.lockAt)}</AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary}>
              Your relay goes live when the first game starts. You can still edit the order or swap
              runners.
            </AppText>
            <PressableScale
              onPress={() => router.push('/relay/build')}
              accessibilityLabel="Edit relay"
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={15} color={colors.textOnAccent} />
              <AppText variant="bodyBold" color={colors.textOnAccent}>
                Edit relay
              </AppText>
            </PressableScale>
          </Panel>
        ) : null}

        <Panel>
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

        {relay.chemistry.length > 0 ? (
          <Panel style={styles.chemPanel}>
            <AppText variant="micro" color={colors.textMuted}>
              CONNECTION BONUSES
            </AppText>
            {relay.chemistry.map((bonus) => (
              <View key={bonus.id} style={styles.chemRow}>
                <Ionicons name="link-outline" size={13} color={colors.success} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.chemLabel}>
                  {bonus.label}
                </AppText>
                <AppText variant="caption" color={colors.success}>
                  +{Math.round(bonus.bonus * 100)}%
                </AppText>
              </View>
            ))}
          </Panel>
        ) : null}

        {relay.status === 'live' ? <RecentPlays relay={relay} /> : null}

        <SimControls />
      </Screen>

      {batonTarget ? (
        <BatonPassOverlay toName={batonTarget} onDone={() => setBatonTarget(null)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  headerChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  scoreBug: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  scoreTeam: {
    alignItems: 'center',
    gap: 2,
  },
  scoreCenter: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroMain: {
    flex: 1,
    gap: 2,
  },
  objectiveBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  gameLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.lg,
    minHeight: 32,
    alignSelf: 'flex-start',
  },
  railWrap: {
    marginBottom: spacing.lg,
  },
  legList: {
    gap: spacing.xs,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minHeight: 44,
    marginTop: spacing.lg,
  },
  chemPanel: {
    gap: spacing.sm,
  },
  chemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chemLabel: {
    flex: 1,
  },
  playsPanel: {
    gap: spacing.md,
  },
  playRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  playClock: {
    width: 52,
  },
  playText: {
    flex: 1,
  },
  outcomeIcon: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  outcomeButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
