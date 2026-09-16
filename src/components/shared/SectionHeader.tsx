import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="heading">{title}</AppText>
      {actionLabel && onAction ? (
        <PressableScale
          onPress={onAction}
          accessibilityLabel={actionLabel}
          style={styles.action}
          hitSlop={8}
        >
          <AppText variant="caption" color={colors.primaryBright}>
            {actionLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.primaryBright} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 32,
  },
});
