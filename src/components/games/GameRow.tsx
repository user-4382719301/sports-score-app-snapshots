import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TEAMS_BY_ID } from '@/data';
import { SPORT_BY_ID } from '@/constants/sportCatalog';
import type { Game } from '@/types';
import { colors, spacing } from '@/theme';
import { formatClockTime } from '@/utils/time';
import { AppText } from '@/components/shared/AppText';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { LiveDot } from '@/components/shared/LiveDot';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';

interface GameRowProps {
  game: Game;
  /** Game contains one of the user's relay athletes. */
  inRelay?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

function TeamLine({ teamId, score, showScore, winner }: { teamId: string; score: number; showScore: boolean; winner: boolean }) {
  const team = TEAMS_BY_ID[teamId];
  return (
    <View style={styles.teamLine}>
      <InitialsAvatar
        initials={team?.abbreviation.slice(0, 3) ?? '?'}
        color={team?.color ?? colors.textMuted}
        size={28}
        shape="square"
      />
      <AppText
        variant="bodyBold"
        color={winner ? colors.textPrimary : colors.textSecondary}
        style={styles.teamName}
        numberOfLines={1}
      >
        {team ? `${team.location} ${team.name}` : 'TBD'}
      </AppText>
      {showScore ? (
        <AppText variant="bodyBold" color={winner ? colors.textPrimary : colors.textSecondary}>
          {score}
        </AppText>
      ) : null}
    </View>
  );
}

/** Scoreboard row used across Games and Home. */
export function GameRow({ game, inRelay = false, onPress, onToggleFavorite }: GameRowProps) {
  const sport = SPORT_BY_ID[game.sport];
  const live = game.status === 'live';
  const final = game.status === 'final';
  const showScore = !((game.status === 'scheduled'));
  const awayWins = final && game.away.score > game.home.score;
  const homeWins = final && game.home.score > game.away.score;

  const teamNames = `${TEAMS_BY_ID[game.away.teamId]?.name ?? ''} at ${TEAMS_BY_ID[game.home.teamId]?.name ?? ''}`;
  const statusText = live
    ? `live, ${game.periodLabel}${game.clock ? ` ${game.clock}` : ''}`
    : final
      ? 'final'
      : `starts ${formatClockTime(game.startTime)}`;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${sport.shortName} game, ${teamNames}, ${statusText}${inRelay ? ', includes your relay player' : ''}`}
    >
      <Panel glowColor={inRelay ? colors.primary : undefined} style={styles.panel}>
        <View style={styles.body}>
          <View style={styles.teams}>
            <TeamLine teamId={game.away.teamId} score={game.away.score} showScore={showScore} winner={!final || awayWins} />
            <TeamLine teamId={game.home.teamId} score={game.home.score} showScore={showScore} winner={!final || homeWins} />
          </View>

          <View style={styles.statusCol}>
            {live ? (
              <View style={styles.liveRow}>
                <LiveDot />
                <AppText variant="micro" color={colors.live}>
                  {game.periodLabel}
                  {game.clock ? ` · ${game.clock}` : ''}
                </AppText>
              </View>
            ) : (
              <AppText variant="micro" color={final ? colors.textMuted : colors.textSecondary}>
                {final ? game.periodLabel : formatClockTime(game.startTime)}
              </AppText>
            )}
            <View style={styles.indicatorRow}>
              <AppText variant="micro" color={colors.textMuted}>
                {sport.shortName}
              </AppText>
              {inRelay ? (
                <View style={styles.relayChip}>
                  <Ionicons name="flash" size={10} color={colors.primaryBright} />
                  <AppText variant="micro" color={colors.primaryBright}>
                    RELAY
                  </AppText>
                </View>
              ) : null}
              {onToggleFavorite ? (
                <PressableScale
                  onPress={onToggleFavorite}
                  accessibilityLabel={game.favorite ? 'Remove favorite game' : 'Favorite this game'}
                  hitSlop={10}
                >
                  <Ionicons
                    name={game.favorite ? 'star' : 'star-outline'}
                    size={14}
                    color={game.favorite ? colors.gold : colors.textMuted}
                  />
                </PressableScale>
              ) : game.favorite ? (
                <Ionicons name="star" size={12} color={colors.gold} />
              ) : null}
            </View>
          </View>
        </View>
      </Panel>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.md,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teams: {
    flex: 1,
    gap: spacing.sm,
  },
  teamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamName: {
    flex: 1,
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    minWidth: 76,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  relayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
