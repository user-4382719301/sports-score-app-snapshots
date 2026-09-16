import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  resetDemoData,
  simAdvanceActiveStat,
  simCompleteActiveLeg,
  simCompleteRelay,
  simFailActiveLeg,
  simStartRelay,
} from '@/services/simulation';
import { useRelayStore } from '@/stores/relayStore';
import { colors, radii, spacing } from '@/theme';
import { AppText } from '@/components/shared/AppText';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';

function SimButton({
  label,
  icon,
  onPress,
  tone = colors.textSecondary,
  disabled = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: string;
  disabled?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Ionicons name={icon} size={15} color={disabled ? colors.textMuted : tone} />
      <AppText variant="caption" color={disabled ? colors.textMuted : tone}>
        {label}
      </AppText>
    </PressableScale>
  );
}

/**
 * Demo control room. In a shipping build this stays behind __DEV__; for the
 * V1 prototype it is discoverable so anyone reviewing the app can drive the
 * simulation. It stands in for the live data feed.
 */
export function SimControls() {
  const [open, setOpen] = useState(false);
  const relay = useRelayStore((state) => state.activeRelay);
  const live = relay?.status === 'live';
  const locked = relay?.status === 'locked';

  return (
    <Panel style={styles.panel}>
      <PressableScale
        onPress={() => setOpen((value) => !value)}
        accessibilityLabel={open ? 'Hide demo controls' : 'Show demo controls'}
        accessibilityHint="Simulates live game updates for the prototype"
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="flask-outline" size={15} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted}>
            Demo controls · simulates the live feed
          </AppText>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={colors.textMuted} />
      </PressableScale>

      {open ? (
        <View style={styles.grid}>
          {locked ? (
            <SimButton label="Start relay" icon="play-outline" tone={colors.live} onPress={simStartRelay} />
          ) : null}
          <SimButton label="Advance stat" icon="stats-chart-outline" tone={colors.live} disabled={!live} onPress={simAdvanceActiveStat} />
          <SimButton label="Complete leg" icon="checkmark-circle-outline" tone={colors.success} disabled={!live} onPress={simCompleteActiveLeg} />
          <SimButton label="Fail leg" icon="close-circle-outline" tone={colors.danger} disabled={!live} onPress={simFailActiveLeg} />
          <SimButton label="Finish relay" icon="flag-outline" tone={colors.primaryBright} disabled={!live && !locked} onPress={simCompleteRelay} />
          <SimButton
            label="Reset demo"
            icon="refresh-outline"
            onPress={() => {
              Alert.alert('Reset demo data?', 'Restores the seeded games, relay, cards, and profile.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => void resetDemoData() },
              ]);
            }}
          />
        </View>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
