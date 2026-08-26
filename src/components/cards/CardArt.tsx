import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PATHS, STAGES } from '@/constants/pathCatalog';
import { SPORT_BY_ID } from '@/constants/sportCatalog';
import type { Player, PlayerCard, Team } from '@/types';
import { colors, radii, spacing } from '@/theme';
import { initialsFor } from '@/utils/format';
import { AppText } from '@/components/shared/AppText';
import { ProgressBar } from '@/components/shared/ProgressBar';

interface CardArtProps {
  card: PlayerCard;
  player: Player;
  team: Team | undefined;
  size?: 'grid' | 'hero';
}

/**
 * The collectible card face. Generated locally: path-tinted gradient frame,
 * player initials as art, level/stage chrome. Legend-stage cards get the
 * gold treatment.
 */
export function CardArt({ card, player, team, size = 'grid' }: CardArtProps) {
  const path = PATHS[card.evolutionPath];
  const stage = STAGES[card.stage];
  const sport = SPORT_BY_ID[player.sport];
  const hero = size === 'hero';
  const frameColor = card.stage === 'legend' ? colors.gold : path.color;

  return (
    <View
      style={[
        styles.frame,
        hero ? styles.frameHero : styles.frameGrid,
        { borderColor: `${frameColor}88` },
        card.stage === 'legend' && styles.legendGlow,
      ]}
    >
      <LinearGradient
        colors={[`${frameColor}30`, colors.surfaceSunken]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.topRow}>
          <View style={[styles.levelChip, { backgroundColor: `${frameColor}33` }]}>
            <AppText variant={hero ? 'caption' : 'micro'} color={frameColor}>
              LV {card.level}
            </AppText>
          </View>
          <Ionicons
            name={sport.icon as keyof typeof Ionicons.glyphMap}
            size={hero ? 18 : 14}
            color={colors.textSecondary}
          />
        </View>

        <View style={styles.artWrap}>
          <View
            style={[
              styles.initialsCircle,
              hero && styles.initialsCircleHero,
              { borderColor: `${team?.color ?? frameColor}77`, backgroundColor: `${team?.color ?? frameColor}1F` },
            ]}
          >
            <AppText variant={hero ? 'display' : 'title'} color={team?.color ?? colors.textPrimary}>
              {initialsFor(player.firstName, player.lastName)}
            </AppText>
          </View>
        </View>

        <View style={styles.nameBlock}>
          <AppText variant={hero ? 'heading' : 'bodyBold'} numberOfLines={1}>
            {player.firstName} {player.lastName}
          </AppText>
          <AppText variant="micro" color={colors.textSecondary} numberOfLines={1}>
            {team?.abbreviation ?? '—'} · {player.position} · {stage.name.toUpperCase()}
          </AppText>
        </View>

        <View style={styles.footer}>
          <View style={styles.pathRow}>
            <Ionicons
              name={path.icon as keyof typeof Ionicons.glyphMap}
              size={hero ? 14 : 12}
              color={path.color}
            />
            <AppText variant="micro" color={path.color}>
              {path.name.toUpperCase()}
            </AppText>
          </View>
          <ProgressBar
            ratio={card.xp / card.xpToNextLevel}
            color={frameColor}
            height={hero ? 6 : 4}
            accessibilityLabel={`${card.xp} of ${card.xpToNextLevel} XP to next level`}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSunken,
  },
  frameGrid: {
    flex: 1,
  },
  frameHero: {
    alignSelf: 'stretch',
  },
  legendGlow: {
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  gradient: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  artWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  initialsCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsCircleHero: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  nameBlock: {
    alignItems: 'center',
    gap: 2,
  },
  footer: {
    gap: spacing.xs,
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
});
