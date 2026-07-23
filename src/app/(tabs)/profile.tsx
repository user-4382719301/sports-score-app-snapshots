import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Screen } from '@/components/shared/Screen';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { StatBlock } from '@/components/shared/StatBlock';
import { PATHS, STAGES } from '@/constants/pathCatalog';
import { SPORT_BY_ID } from '@/constants/sportCatalog';
import { teamOf } from '@/hooks/useEntities';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useUserStore } from '@/stores/userStore';
import { colors, radii, spacing } from '@/theme';
import { formatPercent, initialsFor } from '@/utils/format';

interface Achievement {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  unlocked: boolean;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const cards = useCollectionStore((state) => state.cards);
  const players = useGamesStore((state) => state.players);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((player) => [player.id, player])),
    [players],
  );

  const mostUsed = useMemo(
    () => [...cards].sort((a, b) => b.relayAppearances - a.relayAppearances).slice(0, 3),
    [cards],
  );
  const recentlyEvolved = useMemo(
    () =>
      cards
        .filter((card) => card.stage !== 'rookie')
        .sort((a, b) => b.level - a.level)
        .slice(0, 3),
    [cards],
  );

  const achievements: Achievement[] = [
    { id: 'ach_first', label: 'First relay finished', icon: 'flag-outline', unlocked: user.completedRelays > 0 },
    { id: 'ach_perfect', label: 'Perfect relay', icon: 'sparkles-outline', unlocked: user.perfectRelays > 0 },
    { id: 'ach_streak5', label: '5-day streak', icon: 'flame-outline', unlocked: user.longestStreak >= 5 },
    { id: 'ach_ten', label: '10 relays finished', icon: 'ribbon-outline', unlocked: user.completedRelays >= 10 },
    { id: 'ach_legend', label: 'Own a Legend card', icon: 'star-outline', unlocked: cards.some((card) => card.stage === 'legend') },
    { id: 'ach_twenty', label: '20 relays finished', icon: 'trophy-outline', unlocked: user.completedRelays >= 20 },
  ];

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <AppText variant="title">Profile</AppText>
    </View>
  );

  return (
    <Screen header={header}>
      <Panel>
        <View style={styles.identityRow}>
          <InitialsAvatar
            initials={initialsFor(user.name.split(' ')[0] ?? 'R', user.name.split(' ')[1] ?? 'A')}
            color={colors.primaryBright}
            size={60}
          />
          <View style={styles.identityMain}>
            <AppText variant="heading">{user.name}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {user.handle} · Season 2026
            </AppText>
            <View style={styles.ratingRow}>
              <Ionicons name="trophy-outline" size={13} color={colors.primaryBright} />
              <AppText variant="caption" color={colors.primaryBright}>
                Relay Rating {user.relayRating}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.levelBlock}>
          <View style={styles.levelRow}>
            <AppText variant="caption" color={colors.textSecondary}>
              Account level {user.accountLevel}
            </AppText>
            <AppText variant="micro" color={colors.textMuted}>
              {user.accountXp}/{user.accountXpToNext} XP
            </AppText>
          </View>
          <ProgressBar
            ratio={user.accountXp / user.accountXpToNext}
            color={colors.primary}
            accessibilityLabel={`Account level ${user.accountLevel}, ${user.accountXp} of ${user.accountXpToNext} XP`}
          />
        </View>
      </Panel>

      <Panel style={styles.statsPanel}>
        <View style={styles.statsRow}>
          <StatBlock label="Relays" value={`${user.completedRelays}/${user.totalRelays}`} />
          <StatBlock label="Success" value={formatPercent(user.successRate)} color={colors.success} />
          <StatBlock label="Streak" value={String(user.longestStreak)} color={colors.live} />
          <StatBlock label="Perfect" value={String(user.perfectRelays)} color={colors.gold} />
        </View>
      </Panel>

      <SectionHeader title="Favorite sports" />
      <View style={styles.sportChips}>
        {user.favoriteSports.map((sportId) => (
          <Badge
            key={sportId}
            label={SPORT_BY_ID[sportId].shortName}
            color={colors.live}
            icon={SPORT_BY_ID[sportId].icon}
          />
        ))}
      </View>

      <SectionHeader title="Most-used players" />
      <Panel style={styles.listPanel}>
        {mostUsed.map((card) => {
          const player = playersById[card.playerId];
          if (!player) {
            return null;
          }
          const team = teamOf(player);
          return (
            <PressableScale
              key={card.id}
              onPress={() => router.push({ pathname: '/card/[cardId]', params: { cardId: card.id } })}
              accessibilityLabel={`Open ${player.firstName} ${player.lastName}'s card`}
              style={styles.cardRow}
            >
              <InitialsAvatar
                initials={initialsFor(player.firstName, player.lastName)}
                color={team?.color ?? colors.textMuted}
                size={38}
              />
              <View style={styles.cardRowMain}>
                <AppText variant="bodyBold">
                  {player.firstName} {player.lastName}
                </AppText>
                <AppText variant="micro" color={colors.textSecondary}>
                  {card.relayAppearances} legs · {formatPercent(card.successRate)} success
                </AppText>
              </View>
              <Badge label={`LV ${card.level}`} color={PATHS[card.evolutionPath].color} small />
            </PressableScale>
          );
        })}
      </Panel>

      <SectionHeader title="Recently evolved" />
      <Panel style={styles.listPanel}>
        {recentlyEvolved.map((card) => {
          const player = playersById[card.playerId];
          if (!player) {
            return null;
          }
          const stage = STAGES[card.stage];
          return (
            <PressableScale
              key={card.id}
              onPress={() => router.push({ pathname: '/card/[cardId]', params: { cardId: card.id } })}
              accessibilityLabel={`Open ${player.firstName} ${player.lastName}'s ${stage.name} card`}
              style={styles.cardRow}
            >
              <Ionicons name="sparkles-outline" size={18} color={stage.color} />
              <View style={styles.cardRowMain}>
                <AppText variant="bodyBold">
                  {player.firstName} {player.lastName}
                </AppText>
                <AppText variant="micro" color={colors.textSecondary}>
                  Reached {stage.name} stage
                </AppText>
              </View>
              <Badge label={stage.name.toUpperCase()} color={stage.color} small />
            </PressableScale>
          );
        })}
      </Panel>

      <SectionHeader title="Achievements" />
      <View style={styles.achievements}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[styles.achievement, !achievement.unlocked && styles.achievementLocked]}
            accessible
            accessibilityLabel={`${achievement.label}, ${achievement.unlocked ? 'unlocked' : 'locked'}`}
          >
            <Ionicons
              name={achievement.unlocked ? achievement.icon : 'lock-closed-outline'}
              size={18}
              color={achievement.unlocked ? colors.gold : colors.textMuted}
            />
            <AppText
              variant="micro"
              color={achievement.unlocked ? colors.textPrimary : colors.textMuted}
              align="center"
            >
              {achievement.label}
            </AppText>
          </View>
        ))}
      </View>

      <SectionHeader
        title="Relay history"
        actionLabel="View all"
        onAction={() => router.push('/relay/history')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identityMain: {
    flex: 1,
    gap: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  levelBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsPanel: {
    paddingVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
  },
  sportChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  listPanel: {
    gap: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  cardRowMain: {
    flex: 1,
    gap: 1,
  },
  achievements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achievement: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  achievementLocked: {
    opacity: 0.6,
  },
});
