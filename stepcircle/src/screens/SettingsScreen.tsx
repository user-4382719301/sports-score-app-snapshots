import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { formatInt } from '../lib/format';
import { colors, spacing, type as t } from '../theme';

function GoalStepper({
  label,
  value,
  step,
  min,
  unit,
  color,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  unit: string;
  color: string;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[t.headline, { color }]}>{label}</Text>
        <Text style={t.caption}>
          {formatInt(value)} {unit}
        </Text>
      </View>
      <Pressable style={styles.stepper} onPress={() => onChange(Math.max(min, value - step))} hitSlop={8}>
        <Text style={styles.stepperText}>−</Text>
      </Pressable>
      <Pressable style={styles.stepper} onPress={() => onChange(value + step)} hitSlop={8}>
        <Text style={styles.stepperText}>＋</Text>
      </Pressable>
    </View>
  );
}

export function SettingsScreen() {
  const { goals, setGoals, useMetric, setUseMetric, healthSource, permissionsGranted } =
    useAppStore();

  const sourceLabel =
    healthSource === 'healthkit'
      ? 'Apple Health (includes Apple Watch)'
      : healthSource === 'health-connect'
        ? 'Health Connect (includes Wear OS / Galaxy Watch / Fitbit)'
        : 'Demo data — build with a dev client to read real steps';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={t.headline}>Daily goals</Text>
      <View style={styles.card}>
        <GoalStepper
          label="Move"
          value={goals.steps}
          step={500}
          min={1000}
          unit="steps"
          color={colors.move}
          onChange={(steps) => setGoals({ ...goals, steps })}
        />
        <GoalStepper
          label="Exercise"
          value={goals.activeMinutes}
          step={5}
          min={5}
          unit="minutes"
          color={colors.exercise}
          onChange={(activeMinutes) => setGoals({ ...goals, activeMinutes })}
        />
        <GoalStepper
          label="Active hours"
          value={goals.activeHours}
          step={1}
          min={4}
          unit="hours with 250+ steps"
          color={colors.stand}
          onChange={(activeHours) => setGoals({ ...goals, activeHours })}
        />
      </View>

      <Text style={[t.headline, { marginTop: spacing.md }]}>Units</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={[t.body, { flex: 1 }]}>Use kilometers</Text>
          <Switch value={useMetric} onValueChange={setUseMetric} />
        </View>
      </View>

      <Text style={[t.headline, { marginTop: spacing.md }]}>Data source</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={[t.body, { flex: 1 }]}>{sourceLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[t.caption, { flex: 1 }]}>
            {permissionsGranted
              ? 'Health permissions granted.'
              : 'Health permissions not granted — grant them in system settings to see real data.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  stepper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { color: colors.text, fontSize: 20, fontWeight: '600' },
});
