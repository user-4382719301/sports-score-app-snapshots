import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PATHS } from '@/constants/pathCatalog';
import { teamOf } from '@/hooks/useEntities';
import type { Player, PlayerCard, RelayLeg, RelayLegStatus } from '@/types';
import { colors, radii, spacing } from '@/theme';
import { initialsFor } from '@/utils/format';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { PressableScale } from '@/components/shared/PressableScale';
import { ProgressBar } from '@/components/shared/ProgressBar';

const STATUS_LABEL: Record<RelayLegStatus, string> = {
  completed: 'Done',
  active: 'Live',
  waiting: 'Waiting',
  failed: 'Failed',
  locked: 'Locked',
};

const STATUS_COLOR: Record<RelayLegStatus, string> = {
  completed: colors.success,
  active: colors.live,
  waiting: colors.textSecondary,
  failed: colors.danger,
  locked: colors.textMuted,
};

interface RelayLegRowProps {
  leg: RelayLeg;
  player: Player | undefined;
  card: PlayerCard | undefined;
  onPress?: () => void;
  /** Compact rows for history detail; full rows on the live screen. */
  compact?: boolean;
}

/** One leg of the chain: runner, objective, status, and live progress. */
export function RelayLegRow({ leg, player, card, onPress, compact = false }: RelayLegRowProps) {
  const team = teamOf(player);
  const statusColor = STATUS_COLOR[leg.status];
  const path = card ? PATHS[card.evolutionPath] : undefined;
  const showProgress = !compact && (leg.status === 'active' || leg.status === 'completed' || leg.status === 'failed');

  const content = (
    <View
      style={[
        styles.row,
        leg.status === 'active' && styles.activeRow,
        leg.status === 'locked' && styles.lockedRow,
      ]}
    >
      <View style={styles.slotCol}>
        <AppText variant="micro" color={colors.textMuted}>
          {leg.slot + 1}
        </AppText>
      </View>
      <InitialsAvatar
        initials={player ? initialsFor(player.firstName, player.lastName) : '??'}
        color={team?.color ?? colors.textMuted}
        size={compact ? 32 : 40}
      />
      <View style={styles.main}>
        <View style={styles.nameRow}>
          <AppText variant={compact ? 'caption' : 'bodyBold'} numberOfLines={1} style={styles.name}>
            {player ? `${player.firstName} ${player.lastName}` : 'Unknown player'}
          </AppText>
          {leg.savedByShield ? (
            <Ionicons name="shield-half-outline" size={12} color={colors.success} />
          ) : null}
        </View>
        <AppText variant="micro" color={colors.textSecondary} numberOfLines={1}>
          {leg.objective.label}
          {path ? ` · ${path.name}` : ''}
        </AppText>
        {showProgress ? (
          <View style={styles.progressRow}>
            <ProgressBar
              ratio={leg.objective.target === 0 ? 0 : leg.progress / leg.objective.target}
              color={statusColor}
              height={4}
            />
            <AppText variant="micro" color={statusColor}>
              {leg.progress}/{leg.objective.target}
            </AppText>
          </View>
        ) : null}
      </View>
      <Badge label={STATUS_LABEL[leg.status]} color={statusColor} small />
    </View>
  );

  if (!onPress) {
    return content;
  }
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`Leg ${leg.slot + 1}: ${player ? `${player.firstName} ${player.lastName}` : 'unknown'}, ${leg.objective.label}, ${STATUS_LABEL[leg.status]}`}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  activeRow: {
    backgroundColor: colors.liveSoft,
  },
  lockedRow: {
    opacity: 0.55,
  },
  slotCol: {
    width: 14,
    alignItems: 'center',
  },
  main: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    flexShrink: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
});
