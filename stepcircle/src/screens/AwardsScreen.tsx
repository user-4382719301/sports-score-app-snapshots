import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { AWARD_RULES } from '../lib/awards';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, type as t } from '../theme';

export function AwardsScreen() {
  const awards = useAppStore((s) => s.awards);
  const earnedIds = new Set(awards.map((a) => a.id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[t.largeTitle, styles.title]}>Awards</Text>
      <Text style={t.caption}>
        {awards.length} of {AWARD_RULES.length} earned
      </Text>
      <View style={styles.grid}>
        {AWARD_RULES.map((award) => {
          const earned = earnedIds.has(award.id);
          return (
            <View key={award.id} style={[styles.medal, !earned && styles.locked]}>
              <Text style={[styles.icon, !earned && styles.iconLocked]}>{award.icon}</Text>
              <Text style={[t.headline, styles.center]}>{award.name}</Text>
              <Text style={[t.caption, styles.center]}>{award.description}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  medal: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  locked: { opacity: 0.45 },
  icon: { fontSize: 44 },
  iconLocked: { opacity: 0.6 },
  center: { textAlign: 'center' },
});
