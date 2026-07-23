import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/theme';
import { AppText } from './AppText';

interface BadgeProps {
  label: string;
  color?: string;
  /** Solid badges use the color as background; soft use a tinted background. */
  solid?: boolean;
  icon?: ReactNode | string;
  small?: boolean;
}

/** Pill badge for statuses, sports, paths, and counts. */
export function Badge({ label, color = colors.textSecondary, solid = false, icon, small = false }: BadgeProps) {
  const textColor = solid ? colors.textOnAccent : color;
  return (
    <View
      style={[
        styles.badge,
        small && styles.small,
        { backgroundColor: solid ? color : `${color}22` },
      ]}
    >
      {typeof icon === 'string' ? (
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={small ? 10 : 12} color={textColor} />
      ) : (
        icon
      )}
      <AppText variant={small ? 'micro' : 'label'} color={textColor}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
});
