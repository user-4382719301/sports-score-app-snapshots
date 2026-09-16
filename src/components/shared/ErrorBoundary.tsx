import { Component, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface ErrorBoundaryState {
  error: Error | null;
}

/** Last-resort fallback so a render crash never shows a white screen. */
export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }
    return (
      <View style={styles.container}>
        <AppText variant="title" align="center">
          Dropped the baton
        </AppText>
        <AppText variant="body" color={colors.textSecondary} align="center">
          Something went wrong rendering this screen.
        </AppText>
        <PressableScale
          onPress={() => this.setState({ error: null })}
          accessibilityLabel="Try again"
          style={styles.button}
        >
          <AppText variant="bodyBold" color={colors.textOnAccent}>
            Try again
          </AppText>
        </PressableScale>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
});
