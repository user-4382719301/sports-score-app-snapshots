import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii } from '@/theme';

interface ProgressBarProps {
  /** 0..1 */
  ratio: number;
  color?: string;
  height?: number;
  trackColor?: string;
  accessibilityLabel?: string;
}

/** Animated progress bar; jumps instantly under reduced motion. */
export function ProgressBar({
  ratio,
  color = colors.primary,
  height = 6,
  trackColor = colors.surfaceSunken,
  accessibilityLabel,
}: ProgressBarProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const clamped = Math.max(0, Math.min(1, ratio));

  useEffect(() => {
    progress.value = reducedMotion ? clamped : withTiming(clamped, { duration: 450 });
  }, [clamped, progress, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor }]}
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radii.pill,
    overflow: 'hidden',
    flexGrow: 1,
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
