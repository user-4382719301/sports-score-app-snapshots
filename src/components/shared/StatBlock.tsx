import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

interface StatBlockProps {
  label: string;
  value: string;
  color?: string;
}

/** Compact label-over-value block for profile and card stat rows. */
export function StatBlock({ label, value, color = colors.textPrimary }: StatBlockProps) {
  return (
    <View style={styles.block}>
      <AppText variant="title" color={color}>
        {value}
      </AppText>
      <AppText variant="micro" color={colors.textMuted}>
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    gap: spacing.xxs,
    flex: 1,
  },
});
