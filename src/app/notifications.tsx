import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/shared/AppText';
import { EmptyState } from '@/components/shared/EmptyState';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';
import { Screen } from '@/components/shared/Screen';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { useNotificationsStore, selectUnreadCount } from '@/stores/notificationsStore';
import type { NotificationType } from '@/types';
import { colors, spacing } from '@/theme';
import { formatRelativeTime } from '@/utils/time';

const TYPE_META: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  leg_completed: { icon: 'checkmark-circle-outline', color: colors.success },
  baton_passed: { icon: 'swap-horizontal-outline', color: colors.live },
  card_level_up: { icon: 'trending-up-outline', color: colors.primaryBright },
  game_starting: { icon: 'time-outline', color: colors.live },
  relay_failed: { icon: 'close-circle-outline', color: colors.danger },
  relay_completed: { icon: 'trophy-outline', color: colors.gold },
  evolution_choice: { icon: 'git-branch-outline', color: colors.gold },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotificationsStore((state) => state.notifications);
  const unread = useNotificationsStore(selectUnreadCount);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);

  return (
    <Screen
      header={
        <ScreenHeader
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
          right={
            unread > 0 ? (
              <PressableScale
                onPress={markAllRead}
                accessibilityLabel="Mark all notifications as read"
                hitSlop={8}
              >
                <AppText variant="caption" color={colors.primaryBright}>
                  Mark all
                </AppText>
              </PressableScale>
            ) : null
          }
        />
      }
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="Nothing yet"
          message="Relay progress, baton passes, and card level-ups land here."
        />
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => {
            const meta = TYPE_META[notification.type];
            return (
              <PressableScale
                key={notification.id}
                onPress={() => {
                  markRead(notification.id);
                  if (notification.cardId) {
                    router.push({
                      pathname: '/card/[cardId]',
                      params: { cardId: notification.cardId },
                    });
                  } else if (notification.gameId) {
                    router.push({
                      pathname: '/game/[gameId]',
                      params: { gameId: notification.gameId },
                    });
                  }
                }}
                accessibilityLabel={`${notification.title}. ${notification.body}. ${notification.read ? 'Read' : 'Unread'}`}
              >
                <Panel style={[styles.row, !notification.read && styles.rowUnread]}>
                  <View style={[styles.iconWrap, { backgroundColor: `${meta.color}1E` }]}>
                    <Ionicons name={meta.icon} size={17} color={meta.color} />
                  </View>
                  <View style={styles.main}>
                    <View style={styles.titleRow}>
                      <AppText variant="bodyBold" style={styles.title} numberOfLines={1}>
                        {notification.title}
                      </AppText>
                      {!notification.read ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {notification.body}
                    </AppText>
                    <AppText variant="micro" color={colors.textMuted}>
                      {formatRelativeTime(notification.createdAt)}
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
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowUnread: {
    borderColor: `${colors.primary}55`,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryBright,
  },
});
