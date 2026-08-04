import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../components/Avatar';
import { ActivityRings } from '../components/ActivityRings';
import { useAppStore } from '../store/useAppStore';
import { computeRings } from '../lib/rings';
import { formatInt, formatRelativeTime } from '../lib/format';
import { colors, spacing, type as t } from '../theme';

const FEED_ICONS: Record<string, string> = {
  'closed-rings': '💪',
  'goal-met': '🎯',
  workout: '🏃',
  award: '🏅',
  cheer: '🎉',
};

export function SharingScreen() {
  const navigation = useNavigation<any>();
  const { friends, feed } = useAppStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[t.largeTitle, styles.title]}>Sharing</Text>

      <Text style={t.headline}>Friends</Text>
      <View style={styles.card}>
        {friends.map((friend, i) => {
          const rings = computeRings(friend.today, friend.goals);
          return (
            <Pressable
              key={friend.id}
              style={[styles.friendRow, i > 0 && styles.rowBorder]}
              onPress={() => navigation.navigate('FriendDetail', { friendId: friend.id })}
            >
              <Avatar initials={friend.initials} color={friend.avatarColor} />
              <View style={styles.friendInfo}>
                <Text style={t.headline}>{friend.displayName}</Text>
                <Text style={t.caption}>
                  {formatInt(friend.today.steps)} steps · {friend.streakDays} day streak
                </Text>
              </View>
              <ActivityRings rings={rings} size={44} strokeWidth={5} />
            </Pressable>
          );
        })}
      </View>

      <Text style={[t.headline, { marginTop: spacing.md }]}>Activity</Text>
      <View style={styles.card}>
        {feed.length === 0 ? (
          <Text style={[t.caption, { padding: spacing.md }]}>
            Nothing yet today — cheer a friend to get things going.
          </Text>
        ) : (
          feed.map((event, i) => (
            <View key={event.id} style={[styles.feedRow, i > 0 && styles.rowBorder]}>
              <Text style={styles.feedIcon}>{FEED_ICONS[event.kind] ?? '👣'}</Text>
              <View style={styles.friendInfo}>
                <Text style={t.body}>{event.message}</Text>
                <Text style={t.caption}>{formatRelativeTime(event.at)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { marginTop: spacing.xl, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden' },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  feedIcon: { fontSize: 24 },
  friendInfo: { flex: 1, gap: 2 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
});
