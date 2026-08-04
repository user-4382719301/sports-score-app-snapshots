import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { totalPoints } from '../lib/rings';
import { formatInt } from '../lib/format';
import { colors, spacing, type as t } from '../theme';
import { MAX_DAILY_POINTS, type Competition } from '../types';

function participantName(profileId: string, friends: { id: string; displayName: string }[]): string {
  if (profileId === 'me') return 'You';
  return friends.find((f) => f.id === profileId)?.displayName ?? 'Friend';
}

function CompetitionCard({ competition }: { competition: Competition }) {
  const friends = useAppStore((s) => s.friends);
  const scores = competition.participants
    .map((p) => ({
      name: participantName(p.profileId, friends),
      total: totalPoints(p.dailyPoints),
      dailyPoints: p.dailyPoints,
      isMe: p.profileId === 'me',
    }))
    .sort((a, b) => b.total - a.total);
  const leaderTotal = scores[0]?.total || 1;
  const daysElapsed = competition.participants[0]?.dailyPoints.length ?? 0;

  return (
    <View style={styles.card}>
      <Text style={t.headline}>{competition.name}</Text>
      <Text style={t.caption}>
        {competition.status === 'invited'
          ? `Invitation sent · starts ${competition.startDate}`
          : `Day ${daysElapsed} of 7 · ${competition.startDate} → ${competition.endDate}`}
      </Text>
      {competition.status !== 'invited' && (
        <View style={styles.scores}>
          {scores.map((s) => (
            <View key={s.name} style={styles.scoreRow}>
              <Text style={[t.body, s.isMe && { fontWeight: '700' }]}>{s.name}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(4, (s.total / leaderTotal) * 100)}%`,
                      backgroundColor: s.isMe ? colors.tint : colors.move,
                    },
                  ]}
                />
              </View>
              <Text style={t.headline}>{formatInt(s.total)}</Text>
            </View>
          ))}
          <Text style={t.caption}>
            Earn a point for every ring percentage you fill — up to {MAX_DAILY_POINTS} a day.
          </Text>
        </View>
      )}
    </View>
  );
}

export function CompetitionsScreen() {
  const competitions = useAppStore((s) => s.competitions);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[t.largeTitle, styles.title]}>Compete</Text>
      {competitions.length === 0 ? (
        <View style={styles.card}>
          <Text style={t.body}>No competitions yet.</Text>
          <Text style={t.caption}>
            Open a friend from the Sharing tab and challenge them to a 7-day competition.
          </Text>
        </View>
      ) : (
        competitions.map((c) => <CompetitionCard key={c.id} competition={c} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: spacing.lg, gap: spacing.xs },
  scores: { marginTop: spacing.md, gap: spacing.sm },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cardElevated,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },
});
