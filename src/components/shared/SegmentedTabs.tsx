import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Scrolls horizontally when options overflow (sport filters). */
  scrollable?: boolean;
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
}: SegmentedTabsProps<T>) {
  const content = options.map((option) => {
    const selected = option.value === value;
    return (
      <PressableScale
        key={option.value}
        onPress={() => onChange(option.value)}
        accessibilityLabel={option.label}
        accessibilityRole="tab"
        style={[styles.tab, selected && styles.tabSelected]}
      >
        <AppText variant="caption" color={selected ? colors.textPrimary : colors.textSecondary}>
          {option.label}
        </AppText>
      </PressableScale>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
        accessibilityRole="tablist"
      >
        {content}
      </ScrollView>
    );
  }
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  scrollRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
});
