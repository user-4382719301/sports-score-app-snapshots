import { ScrollView, StyleSheet, View } from 'react-native';
import { STAT_COLUMNS, formatStatValue } from '@/constants/statCatalog';
import type { Player, PlayerGameStats, SportId } from '@/types';
import { colors, radii, spacing } from '@/theme';
import { AppText } from '@/components/shared/AppText';

interface BoxScoreTableProps {
  sport: SportId;
  lines: PlayerGameStats[];
  playersById: Record<string, Player>;
  /** PlayerIds to highlight (the user's relay athletes). */
  highlightPlayerIds?: Set<string>;
}

const NAME_COL_WIDTH = 132;
const STAT_COL_WIDTH = 44;

/**
 * Sport-aware box score. The stat grid scrolls horizontally inside the
 * table so wide sports never break the screen layout.
 */
export function BoxScoreTable({ sport, lines, playersById, highlightPlayerIds }: BoxScoreTableProps) {
  const columns = STAT_COLUMNS[sport];

  return (
    <View style={styles.table}>
      <View>
        <View style={[styles.row, styles.headerRow]}>
          <View style={styles.nameCell}>
            <AppText variant="micro" color={colors.textMuted}>
              PLAYER
            </AppText>
          </View>
        </View>
        {lines.map((line) => {
          const player = playersById[line.playerId];
          const highlighted = highlightPlayerIds?.has(line.playerId) ?? false;
          return (
            <View key={line.playerId} style={[styles.row, highlighted && styles.highlightRow]}>
              <View style={styles.nameCell}>
                <AppText
                  variant="caption"
                  color={highlighted ? colors.primaryBright : colors.textPrimary}
                  numberOfLines={1}
                >
                  {player ? `${player.firstName.charAt(0)}. ${player.lastName}` : '—'}
                </AppText>
                <AppText variant="micro" color={colors.textMuted}>
                  {player?.position ?? ''}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.row, styles.headerRow]}>
            {columns.map((column) => (
              <View key={column.key} style={styles.statCell}>
                <AppText variant="micro" color={colors.textMuted}>
                  {column.label}
                </AppText>
              </View>
            ))}
          </View>
          {lines.map((line) => {
            const highlighted = highlightPlayerIds?.has(line.playerId) ?? false;
            return (
              <View key={line.playerId} style={[styles.row, highlighted && styles.highlightRow]}>
                {columns.map((column) => (
                  <View key={column.key} style={styles.statCell}>
                    <AppText
                      variant="caption"
                      color={highlighted ? colors.primaryBright : colors.textSecondary}
                    >
                      {formatStatValue(column, line.stats)}
                    </AppText>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    flexDirection: 'row',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: {
    minHeight: 28,
    borderBottomColor: colors.borderStrong,
  },
  highlightRow: {
    backgroundColor: colors.primarySoft,
  },
  nameCell: {
    width: NAME_COL_WIDTH,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  statCell: {
    width: STAT_COL_WIDTH,
    alignItems: 'center',
  },
});
