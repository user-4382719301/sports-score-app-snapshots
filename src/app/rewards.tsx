import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Screen } from '@/components/shared/Screen';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useRewardsStore } from '@/stores/rewardsStore';
import { useUserStore } from '@/stores/userStore';
import type { Quest } from '@/types';
import { colors, radii, spacing } from '@/theme';

function QuestCard({ quest }: { quest: Quest }) {
  const claimQuest = useRewardsStore((state) => state.claimQuest);
  const pushNotification = useNotificationsStore((state) => state.push);
  const complete = quest.progress >= quest.target;
  const claimable = complete && !quest.claimed;

  return (
    <Panel style={[styles.questPanel, quest.claimed && styles.questClaimed]}>
      <View style={styles.questTop}>
        <View style={styles.questTitleWrap}>
          <AppText variant="bodyBold">{quest.title}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {quest.description}
          </AppText>
        </View>
        {quest.claimed ? (
          <Badge label="CLAIMED" color={colors.textMuted} small />
        ) : complete ? (
          <Badge label="COMPLETE" color={colors.success} small />
        ) : (
          <AppText variant="micro" color={colors.textMuted}>
            {quest.progress}/{quest.target}
          </AppText>
        )}
      </View>
      <ProgressBar
        ratio={quest.target === 0 ? 0 : quest.progress / quest.target}
        color={complete ? colors.success : colors.primary}
        accessibilityLabel={`${quest.title}: ${quest.progress} of ${quest.target}`}
      />
      <View style={styles.questBottom}>
        <AppText variant="micro" color={colors.gold}>
          +{quest.rewardCoins} coins · +{quest.rewardXp} XP
        </AppText>
        {claimable ? (
          <PressableScale
            onPress={() => {
              const coins = claimQuest(quest.id);
              if (coins > 0) {
                pushNotification({
                  type: 'relay_completed',
                  title: 'Quest claimed',
                  body: `“${quest.title}” paid out ${coins} coins.`,
                });
              }
            }}
            accessibilityLabel={`Claim ${quest.title} reward`}
            style={styles.claimButton}
          >
            <AppText variant="caption" color={colors.textOnAccent}>
              Claim
            </AppText>
          </PressableScale>
        ) : null}
      </View>
    </Panel>
  );
}

export default function RewardsScreen() {
  const coins = useRewardsStore((state) => state.coins);
  const quests = useRewardsStore((state) => state.quests);
  const rewards = useRewardsStore((state) => state.rewards);
  const user = useUserStore((state) => state.user);

  const daily = quests.filter((quest) => quest.kind === 'daily');
  const season = quests.filter((quest) => quest.kind === 'season');

  return (
    <Screen
      header={
        <ScreenHeader
          title="Rewards"
          right={
            <View style={styles.coinPill}>
              <Ionicons name="server-outline" size={13} color={colors.gold} />
              <AppText variant="caption" color={colors.gold}>
                {coins}
              </AppText>
            </View>
          }
        />
      }
    >
      <Panel style={styles.seasonPanel}>
        <View style={styles.seasonTop}>
          <AppText variant="bodyBold">Season progression</AppText>
          <AppText variant="micro" color={colors.textMuted}>
            LEVEL {user.accountLevel}
          </AppText>
        </View>
        <ProgressBar
          ratio={user.accountXp / user.accountXpToNext}
          color={colors.primary}
          height={8}
          accessibilityLabel={`Season level ${user.accountLevel}, ${user.accountXp} of ${user.accountXpToNext} XP`}
        />
        <AppText variant="micro" color={colors.textSecondary}>
          {user.accountXpToNext - user.accountXp} XP to level {user.accountLevel + 1} — finish relays
          and claim quests to climb the track.
        </AppText>
      </Panel>

      <SectionHeader title="Daily quests" />
      <View style={styles.questList}>
        {daily.map((quest) => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </View>

      <SectionHeader title="Season quests" />
      <View style={styles.questList}>
        {season.map((quest) => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </View>

      <SectionHeader title="Reward track" />
      <View style={styles.rewardGrid}>
        {rewards.map((reward) => (
          <View
            key={reward.id}
            style={[styles.rewardTile, !reward.unlocked && styles.rewardLocked]}
            accessible
            accessibilityLabel={`${reward.label}, ${reward.unlocked ? 'unlocked' : 'locked'}. ${reward.description}`}
          >
            <Ionicons
              name={
                reward.unlocked
                  ? (reward.icon as keyof typeof Ionicons.glyphMap)
                  : 'lock-closed-outline'
              }
              size={20}
              color={reward.unlocked ? colors.gold : colors.textMuted}
            />
            <AppText
              variant="micro"
              align="center"
              color={reward.unlocked ? colors.textPrimary : colors.textMuted}
            >
              {reward.label}
            </AppText>
            <AppText variant="micro" align="center" color={colors.textMuted}>
              {reward.description}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    minHeight: 32,
  },
  seasonPanel: {
    gap: spacing.md,
  },
  seasonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questList: {
    gap: spacing.sm,
  },
  questPanel: {
    gap: spacing.md,
  },
  questClaimed: {
    opacity: 0.65,
  },
  questTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  questTitleWrap: {
    flex: 1,
    gap: 2,
  },
  questBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  claimButton: {
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rewardTile: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rewardLocked: {
    opacity: 0.6,
  },
});
