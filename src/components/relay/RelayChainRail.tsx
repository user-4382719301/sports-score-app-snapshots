import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Relay, RelayLegStatus } from '@/types';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/shared/AppText';
import { LiveDot } from '@/components/shared/LiveDot';

const STATUS_COLOR: Record<RelayLegStatus, string> = {
  completed: colors.success,
  active: colors.live,
  waiting: colors.textMuted,
  failed: colors.danger,
  locked: colors.textMuted,
};

const STATUS_ICON: Record<RelayLegStatus, keyof typeof Ionicons.glyphMap> = {
  completed: 'checkmark',
  active: 'flash',
  waiting: 'time-outline',
  failed: 'close',
  locked: 'lock-closed',
};

/**
 * The five-node relay chain. Never communicates state by color alone —
 * every node carries a status glyph too.
 */
export function RelayChainRail({ relay }: { relay: Relay }) {
  return (
    <View
      style={styles.rail}
      accessible
      accessibilityLabel={`Relay chain: ${relay.legs
        .map((leg) => `leg ${leg.slot + 1} ${leg.status}`)
        .join(', ')}`}
    >
      {relay.legs.map((leg, index) => {
        const color = STATUS_COLOR[leg.status];
        const connectorDone = index > 0 && relay.legs[index - 1]?.status === 'completed';
        return (
          <View key={leg.slot} style={styles.segment}>
            {index > 0 ? (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: connectorDone ? colors.success : colors.border },
                ]}
              />
            ) : null}
            <View style={styles.nodeWrap}>
              <View
                style={[
                  styles.node,
                  { borderColor: color, backgroundColor: leg.status === 'active' ? colors.liveSoft : `${color}1A` },
                ]}
              >
                {leg.status === 'active' ? (
                  <LiveDot color={colors.live} size={7} />
                ) : (
                  <Ionicons name={STATUS_ICON[leg.status]} size={13} color={color} />
                )}
              </View>
              <AppText variant="micro" color={leg.status === 'active' ? colors.live : colors.textMuted}>
                {leg.slot + 1}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connector: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    marginHorizontal: spacing.xs,
    marginBottom: 14,
  },
  nodeWrap: {
    alignItems: 'center',
    gap: 2,
  },
  node: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
