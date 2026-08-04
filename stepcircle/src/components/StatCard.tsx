import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, type as t } from '../theme';

interface Props {
  label: string;
  value: string;
  sublabel?: string;
  accentColor?: string;
}

export function StatCard({ label, value, sublabel, accentColor = colors.text }: Props) {
  return (
    <View style={styles.card}>
      <Text style={t.caption}>{label}</Text>
      <Text style={[t.stat, { color: accentColor }]}>{value}</Text>
      {sublabel ? <Text style={t.caption}>{sublabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    gap: 2,
  },
});
