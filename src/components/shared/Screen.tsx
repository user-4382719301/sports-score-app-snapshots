import type { PropsWithChildren, ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenProps extends PropsWithChildren {
  /** Scrollable content (default) or a fixed container for custom lists. */
  scroll?: boolean;
  /** Extra bottom padding beyond the safe area (tab bar clearance). */
  bottomPadding?: number;
  header?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function Screen({
  children,
  scroll = true,
  bottomPadding = spacing.xxl,
  header,
  onRefresh,
  refreshing = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingTop: header ? 0 : insets.top }]}>
        {header}
        <View style={styles.fill}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: header ? 0 : insets.top }]}>
      {header}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + bottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
});
