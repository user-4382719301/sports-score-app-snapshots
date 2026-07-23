import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { teamOf } from '@/hooks/useEntities';
import type { Player, PlayerCard } from '@/types';
import { colors, spacing } from '@/theme';
import { formatPercent } from '@/utils/format';
import { AppText } from '@/components/shared/AppText';
import { PressableScale } from '@/components/shared/PressableScale';
import { CardArt } from './CardArt';

interface PlayerCardTileProps {
  card: PlayerCard;
  player: Player;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

/** Collection grid tile: card art + usage line + favorite toggle. */
export function PlayerCardTile({ card, player, onPress, onToggleFavorite }: PlayerCardTileProps) {
  return (
    <View style={styles.tile}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={`Open ${player.firstName} ${player.lastName}, level ${card.level} ${card.evolutionPath} card`}
      >
        <CardArt card={card} player={player} team={teamOf(player)} />
      </PressableScale>
      <View style={styles.metaRow}>
        <AppText variant="micro" color={colors.textMuted}>
          {card.relayAppearances} legs · {formatPercent(card.successRate)}
        </AppText>
        {onToggleFavorite ? (
          <PressableScale
            onPress={onToggleFavorite}
            accessibilityLabel={
              card.favorite
                ? `Remove ${player.lastName} from favorites`
                : `Add ${player.lastName} to favorites`
            }
            hitSlop={10}
          >
            <Ionicons
              name={card.favorite ? 'star' : 'star-outline'}
              size={16}
              color={card.favorite ? colors.gold : colors.textMuted}
            />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
});
