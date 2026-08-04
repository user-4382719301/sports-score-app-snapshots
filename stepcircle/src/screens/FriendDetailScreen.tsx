import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Avatar } from '../components/Avatar';
import { ActivityRings } from '../components/ActivityRings';
import { WeekBars } from '../components/WeekBars';
import { StatCard } from '../components/StatCard';
import { useAppStore } from '../store/useAppStore';
import { computeRings } from '../lib/rings';
import { formatInt } from '../lib/format';
import { colors, spacing, type as t } from '../theme';

const CHEERS = ['Nice work! 🎉', 'Keep it up! 🔥', 'You got this! 💪'];

export function FriendDetailScreen() {
  const route = useRoute<any>();
  const { friends, sendCheer, inviteToCompetition } = useAppStore();
  const friend = friends.find((f) => f.id === route.params?.friendId);

  if (!friend) return <View style={styles.container} />;

  const rings = computeRings(friend.today, friend.goals);

  const onCheer = async () => {
    const message = `You cheered ${friend.displayName} on: "${CHEERS[Math.floor(Math.random() * CHEERS.length)]}"`;
    await sendCheer(friend.id, message);
    Alert.alert('Sent!', `${friend.displayName} will get your cheer.`);
  };

  const onChallenge = async () => {
    await inviteToCompetition(friend.id);
    Alert.alert(
      'Challenge sent',
      `A 7-day competition with ${friend.displayName} starts tomorrow if they accept.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar initials={friend.initials} color={friend.avatarColor} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={t.title}>{friend.displayName}</Text>
          <Text style={t.caption}>{formatInt(friend.lifetimeSteps)} lifetime steps</Text>
        </View>
        <ActivityRings rings={rings} size={72} strokeWidth={7} />
      </View>

      <View style={styles.statRow}>
        <StatCard label="Today" value={formatInt(friend.today.steps)} sublabel="steps" accentColor={colors.move} />
        <StatCard label="Exercise" value={`${friend.today.activeMinutes} min`} accentColor={colors.exercise} />
        <StatCard label="Streak" value={`${friend.streakDays} 🔥`} accentColor={colors.gold} />
      </View>

      <View style={styles.card}>
        <Text style={t.headline}>Their week</Text>
        <View style={{ height: spacing.md }} />
        <WeekBars week={friend.week} goalSteps={friend.goals.steps} />
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, { backgroundColor: colors.cardElevated }]} onPress={onCheer}>
          <Text style={t.headline}>Cheer 🎉</Text>
        </Pressable>
        <Pressable style={[styles.button, { backgroundColor: colors.tint }]} onPress={onChallenge}>
          <Text style={t.headline}>Challenge to a competition</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: spacing.lg },
  actions: { gap: spacing.sm },
  button: {
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
  },
});
