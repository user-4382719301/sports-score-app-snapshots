import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/theme';
import { AppText } from '@/components/shared/AppText';

interface BatonPassOverlayProps {
  /** Runner receiving the baton. */
  toName: string;
  onDone: () => void;
}

const TRACK_PADDING = 56;

/**
 * Celebration banner when a leg succeeds: the baton sweeps across the
 * track into the next runner's name. Under reduced motion it simply
 * appears and fades.
 */
export function BatonPassOverlay({ toName, onDone }: BatonPassOverlayProps) {
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trackWidth > 0 && !reducedMotion) {
      translateX.value = withTiming(trackWidth - TRACK_PADDING, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      });
    }
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone, reducedMotion, trackWidth, translateX]);

  const batonStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: '-30deg' }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={styles.banner}
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={`Baton passed to ${toName}`}
    >
      <View
        style={styles.track}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.baton, reducedMotion ? styles.batonStatic : batonStyle]}>
          <Ionicons name="remove-outline" size={26} color={colors.gold} style={styles.batonIcon} />
        </Animated.View>
      </View>
      <AppText variant="bodyBold" color={colors.success}>
        Baton passed!
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {toName} is on the run
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '30%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: `${colors.success}66`,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: colors.success,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    zIndex: 10,
  },
  track: {
    alignSelf: 'stretch',
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  baton: {
    width: 40,
    alignItems: 'center',
  },
  batonStatic: {
    alignSelf: 'center',
    transform: [{ rotate: '-30deg' }],
  },
  batonIcon: {
    transform: [{ scaleX: 1.6 }],
  },
});
