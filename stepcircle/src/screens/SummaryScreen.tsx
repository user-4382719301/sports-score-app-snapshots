import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ActivityRings } from '../components/ActivityRings';
import { StatCard } from '../components/StatCard';
import { WeekBars } from '../components/WeekBars';
import { useAppStore } from '../store/useAppStore';
import { computeRings, activeHours } from '../lib/rings';
import { formatDistance, formatInt, formatPercent } from '../lib/format';
import { fullDayLabel, todayKey } from '../lib/dates';
import { colors, spacing, type as t } from '../theme';

function MetricRow({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: string;
  goal: string;
  color: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={[t.headline, { color }]}>{label}</Text>
      <Text style={t.stat}>
        {value}
        <Text style={t.caption}>/{goal}</Text>
      </Text>
    </View>
  );
}

export function SummaryScreen() {
  const navigation = useNavigation<any>();
  const { today, history, goals, streak, useMetric, refresh, healthSource } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);

  if (!today) return <View style={styles.container} />;

  const rings = computeRings(today, goals);
  const hours = activeHours(today.hourlySteps);
  const week = history.slice(-7);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={t.caption}>{fullDayLabel(todayKey()).toUpperCase()}</Text>
          <Text style={t.largeTitle}>Summary</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12}>
          <Text style={styles.gear}>⚙️</Text>
        </Pressable>
      </View>

      <View style={styles.ringsCard}>
        <ActivityRings rings={rings} size={180} />
        <View style={styles.metrics}>
          <MetricRow
            label="Move"
            value={formatInt(today.steps)}
            goal={`${formatInt(goals.steps)} steps`}
            color={colors.move}
          />
          <MetricRow
            label="Exercise"
            value={`${today.activeMinutes}`}
            goal={`${goals.activeMinutes} min`}
            color={colors.exercise}
          />
          <MetricRow
            label="Active hours"
            value={`${hours}`}
            goal={`${goals.activeHours} hrs`}
            color={colors.stand}
          />
        </View>
      </View>

      <View style={styles.statRow}>
        <StatCard
          label="Distance"
          value={formatDistance(today.distanceMeters, useMetric)}
          accentColor={colors.stand}
        />
        <StatCard label="Floors" value={formatInt(today.floorsClimbed)} accentColor={colors.exercise} />
        <StatCard label="Streak" value={`${streak} 🔥`} sublabel="days at goal" accentColor={colors.gold} />
      </View>

      <View style={styles.card}>
        <Text style={t.headline}>This week</Text>
        <Text style={t.caption}>
          {formatPercent(rings.move)} of today's step goal · data from{' '}
          {healthSource === 'demo' ? 'demo mode' : healthSource === 'healthkit' ? 'Apple Health' : 'Health Connect'}
        </Text>
        <View style={{ height: spacing.md }} />
        <WeekBars week={week} goalSteps={goals.steps} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.xl,
  },
  gear: { fontSize: 24 },
  ringsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  metrics: { flex: 1, gap: spacing.md },
  metricRow: { gap: 2 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: spacing.lg },
});
