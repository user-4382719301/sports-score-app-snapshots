import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '@/theme';

interface PanelProps extends PropsWithChildren {
  /** Accent-tinted border + faint glow (used sparingly: live/legend panels). */
  glowColor?: string;
  raised?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Rounded surface panel — the app's base building block. */
export function Panel({ children, glowColor, raised = false, padded = true, style }: PanelProps) {
  return (
    <View
      style={[
        styles.panel,
        raised && styles.raised,
        padded && styles.padded,
        glowColor
          ? {
              borderColor: `${glowColor}55`,
              shadowColor: glowColor,
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
              elevation: 4,
            }
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  raised: {
    backgroundColor: colors.surfaceRaised,
  },
  padded: {
    padding: spacing.lg,
  },
});
