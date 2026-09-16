import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { LiveDot } from '@/components/shared/LiveDot';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Screen } from '@/components/shared/Screen';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SegmentedTabs } from '@/components/shared/SegmentedTabs';
import { BoxScoreTable } from '@/components/games/BoxScoreTable';
import { SPORT_BY_ID } from '@/constants/sportCatalog';
import { TEAMS_BY_ID, teamDisplayName } from '@/data';
import { useGame } from '@/hooks/useEntities';
import { useGamesStore } from '@/stores/gamesStore';
import { useRelayStore } from '@/stores/relayStore';
import type { Team } from '@/types';
import { colors, radii, spacing } from '@/theme';
import { formatClockTime } from '@/utils/time';

type GameTab = 'live' | 'box' | 'plays' | 'stats';

function TeamScoreColumn({ team, score, muted }: { team: Team | undefined; score: number; muted: boolean }) {
  return (
    <View style={styles.scoreCol}>
      <InitialsAvatar
        initials={team?.abbreviation.slice(0, 3) ?? '?'}
        color={team?.color ?? colors.textMuted}
        size={44}
        shape="square"
      />
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {team?.name ?? 'TBD'}
      </AppText>
      <AppText variant="display" color={muted ? colors.textMuted : colors.textPrimary}>
        {score}
      </AppText>
    </View>
  );
}

export default function GameDetailScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const game = useGame(gameId);
  const players = useGamesStore((state) => state.players);
  const relay = useRelayStore((state) => state.activeRelay);
  const [tab, setTab] = useState<GameTab>('live');

  const playersById = useMemo(
    () => Object.fromEntries(players.map((player) => [player.id, player])),
    [players],
  );

  if (!game) {
    return (
      <Screen header={<ScreenHeader title="Game" />}>
        <EmptyState
          icon="podium-outline"
          title="Game not found"
          message="This game is no longer on today's slate."
        />
      </Screen>
    );
  }

  const away = TEAMS_BY_ID[game.away.teamId];
  const home = TEAMS_BY_ID[game.home.teamId];
  const sport = SPORT_BY_ID[game.sport];
  const relayLegs = relay?.legs.filter((leg) => leg.gameId === game.id) ?? [];
  const relayPlayerIds = new Set(relayLegs.map((leg) => leg.playerId));
  const scheduled = game.status === 'scheduled';
  const finalGame = game.status === 'final';

  const awayLines = game.playerStats.filter(
    (line) => playersById[line.playerId]?.teamId === game.away.teamId,
  );
  const homeLines = game.playerStats.filter(
    (line) => playersById[line.playerId]?.teamId === game.home.teamId,
  );

  return (
    <Screen
      header={
        <ScreenHeader
          title={`${away?.abbreviation ?? '?'} @ ${home?.abbreviation ?? '?'}`}
          subtitle={sport.shortName}
        />
      }
    >
      <Panel glowColor={game.status === 'live' ? colors.live : undefined}>
        <View style={styles.scoreRow}>
          <TeamScoreColumn
            team={away}
            score={game.away.score}
            muted={finalGame && game.away.score < game.home.score}
          />
          <View style={styles.scoreCenter}>
            {game.status === 'live' ? (
              <>
                <LiveDot />
                <AppText variant="caption" color={colors.live}>
                  {game.periodLabel}
                </AppText>
                {game.clock ? (
                  <AppText variant="micro" color={colors.live}>
                    {game.clock}
                  </AppText>
                ) : null}
              </>
            ) : scheduled ? (
              <>
                <AppText variant="caption" color={colors.textSecondary}>
                  Today
                </AppText>
                <AppText variant="bodyBold">{formatClockTime(game.startTime)}</AppText>
              </>
            ) : (
              <Badge label={game.periodLabel.toUpperCase()} color={colors.textMuted} />
            )}
          </View>
          <TeamScoreColumn
            team={home}
            score={game.home.score}
            muted={finalGame && game.home.score < game.away.score}
          />
        </View>
      </Panel>

      {relayLegs.length > 0 ? (
        <Panel glowColor={colors.primary} style={styles.relayPanel}>
          <AppText variant="micro" color={colors.primaryBright}>
            YOUR RELAY IN THIS GAME
          </AppText>
          {relayLegs.map((leg) => {
            const player = playersById[leg.playerId];
            return (
              <View key={leg.slot} style={styles.relayLegRow}>
                <View style={styles.relayLegMain}>
                  <AppText variant="bodyBold">
                    {player ? `${player.firstName} ${player.lastName}` : 'Unknown'} · Leg{' '}
                    {leg.slot + 1}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {leg.objective.label} · {leg.progress}/{leg.objective.target}
                  </AppText>
                  <ProgressBar
                    ratio={leg.objective.target === 0 ? 0 : leg.progress / leg.objective.target}
                    color={
                      leg.status === 'completed'
                        ? colors.success
                        : leg.status === 'failed'
                          ? colors.danger
                          : colors.live
                    }
                    height={5}
                  />
                </View>
                <PressableScale
                  onPress={() =>
                    router.push({ pathname: '/card/[cardId]', params: { cardId: leg.cardId } })
                  }
                  accessibilityLabel={`Open ${player ? `${player.firstName} ${player.lastName}` : 'player'}'s card`}
                  style={styles.cardLink}
                >
                  <Ionicons name="albums-outline" size={17} color={colors.primaryBright} />
                </PressableScale>
              </View>
            );
          })}
        </Panel>
      ) : null}

      <SegmentedTabs<GameTab>
        options={[
          { value: 'live', label: 'Live' },
          { value: 'box', label: 'Box Score' },
          { value: 'plays', label: 'Plays' },
          { value: 'stats', label: 'Stats' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'live' ? (
        scheduled ? (
          <EmptyState
            icon="time-outline"
            title={`First ${game.sport === 'mlb' ? 'pitch' : game.sport === 'nhl' ? 'puck drop' : game.sport === 'soccer' ? 'kickoff' : 'tip'} at ${formatClockTime(game.startTime)}`}
            message="Live updates, box score, and plays appear once the game starts."
          />
        ) : (
          <>
            {game.plays.length > 0 ? (
              <Panel style={styles.playsPanel}>
                <AppText variant="micro" color={colors.textMuted}>
                  LATEST
                </AppText>
                {game.plays.slice(0, 3).map((play) => (
                  <View key={play.id} style={styles.playRow}>
                    <AppText variant="micro" color={colors.textMuted} style={styles.playClock}>
                      {play.clockLabel}
                    </AppText>
                    <AppText
                      variant="caption"
                      color={
                        play.playerId && relayPlayerIds.has(play.playerId)
                          ? colors.primaryBright
                          : colors.textSecondary
                      }
                      style={styles.playText}
                    >
                      {play.description}
                    </AppText>
                  </View>
                ))}
              </Panel>
            ) : null}
            <Panel style={styles.playsPanel}>
              <AppText variant="micro" color={colors.textMuted}>
                TOP PERFORMERS
              </AppText>
              <BoxScoreTable
                sport={game.sport}
                lines={[...game.playerStats]
                  .sort((a, b) => Object.keys(b.stats).length - Object.keys(a.stats).length)
                  .slice(0, 4)}
                playersById={playersById}
                highlightPlayerIds={relayPlayerIds}
              />
            </Panel>
          </>
        )
      ) : null}

      {tab === 'box' ? (
        scheduled ? (
          <EmptyState
            icon="grid-outline"
            title="No box score yet"
            message="The box score fills in live once the game begins."
          />
        ) : (
          <>
            <Panel style={styles.playsPanel}>
              <AppText variant="micro" color={colors.textMuted}>
                {away ? teamDisplayName(away).toUpperCase() : 'AWAY'}
              </AppText>
              <BoxScoreTable
                sport={game.sport}
                lines={awayLines}
                playersById={playersById}
                highlightPlayerIds={relayPlayerIds}
              />
            </Panel>
            <Panel style={styles.playsPanel}>
              <AppText variant="micro" color={colors.textMuted}>
                {home ? teamDisplayName(home).toUpperCase() : 'HOME'}
              </AppText>
              <BoxScoreTable
                sport={game.sport}
                lines={homeLines}
                playersById={playersById}
                highlightPlayerIds={relayPlayerIds}
              />
            </Panel>
          </>
        )
      ) : null}

      {tab === 'plays' ? (
        game.plays.length === 0 ? (
          <EmptyState
            icon="list-outline"
            title="No plays yet"
            message="Play-by-play starts rolling in at game time."
          />
        ) : (
          <Panel style={styles.playsPanel}>
            {game.plays.map((play) => (
              <View key={play.id} style={styles.playRow}>
                <AppText variant="micro" color={colors.textMuted} style={styles.playClock}>
                  {play.clockLabel}
                </AppText>
                <View style={styles.playText}>
                  <AppText
                    variant="caption"
                    color={
                      play.playerId && relayPlayerIds.has(play.playerId)
                        ? colors.primaryBright
                        : colors.textSecondary
                    }
                  >
                    {play.description}
                  </AppText>
                  {play.isScoringPlay ? (
                    <Badge label="SCORING PLAY" color={colors.live} small />
                  ) : null}
                </View>
              </View>
            ))}
          </Panel>
        )
      ) : null}

      {tab === 'stats' ? (
        game.teamStats.length === 0 ? (
          <EmptyState
            icon="stats-chart-outline"
            title="No team stats yet"
            message="Team statistics appear once the game starts."
          />
        ) : (
          <Panel style={styles.playsPanel}>
            <View style={styles.teamStatHeader}>
              <AppText variant="micro" color={colors.textMuted}>
                {away?.abbreviation ?? 'AWAY'}
              </AppText>
              <AppText variant="micro" color={colors.textMuted}>
                TEAM
              </AppText>
              <AppText variant="micro" color={colors.textMuted}>
                {home?.abbreviation ?? 'HOME'}
              </AppText>
            </View>
            {(game.teamStats[0]?.rows ?? []).map((row, index) => (
              <View key={row.label} style={styles.teamStatRow}>
                <AppText variant="bodyBold" style={styles.teamStatValue}>
                  {row.value}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={styles.teamStatLabel}>
                  {row.label}
                </AppText>
                <AppText variant="bodyBold" style={[styles.teamStatValue, styles.teamStatRight]}>
                  {game.teamStats[1]?.rows[index]?.value ?? '—'}
                </AppText>
              </View>
            ))}
          </Panel>
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreCol: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  scoreCenter: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  relayPanel: {
    gap: spacing.md,
  },
  relayLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  relayLegMain: {
    flex: 1,
    gap: spacing.xs,
  },
  cardLink: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playsPanel: {
    gap: spacing.md,
  },
  playRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  playClock: {
    width: 52,
    marginTop: 2,
  },
  playText: {
    flex: 1,
    gap: spacing.xs,
  },
  teamStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },
  teamStatValue: {
    width: 70,
  },
  teamStatRight: {
    textAlign: 'right',
  },
  teamStatLabel: {
    flex: 1,
    textAlign: 'center',
  },
});
