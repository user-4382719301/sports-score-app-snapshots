import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { PATHS } from '@/constants/pathCatalog';
import type { RelayLegDraft } from '@/domain/relayEngine';
import { teamOf } from '@/hooks/useEntities';
import type { Player, PlayerCard } from '@/types';
import { colors, radii, spacing } from '@/theme';
import { clamp, initialsFor } from '@/utils/format';
import { formatClockTime } from '@/utils/time';
import { AppText } from '@/components/shared/AppText';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { PressableScale } from '@/components/shared/PressableScale';

const ROW_HEIGHT = 72;

interface RelayDraftListProps {
  drafts: RelayLegDraft[];
  playersById: Record<string, Player>;
  cardsById: Record<string, PlayerCard>;
  gameStartById: Record<string, string>;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (cardId: string) => void;
}

interface DraftRowProps {
  draft: RelayLegDraft;
  index: number;
  count: number;
  player: Player | undefined;
  card: PlayerCard | undefined;
  startTime: string | undefined;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (cardId: string) => void;
}

function DraftRow({ draft, index, count, player, card, startTime, onMove, onRemove }: DraftRowProps) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(false);

  const pan = Gesture.Pan()
    .activateAfterLongPress(160)
    .onStart(() => {
      dragging.value = true;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const delta = Math.round(event.translationY / ROW_HEIGHT);
      const target = Math.max(0, Math.min(count - 1, index + delta));
      translateY.value = withTiming(0, { duration: 120 });
      dragging.value = false;
      if (target !== index) {
        runOnJS(onMove)(index, target);
      }
    })
    .onFinalize(() => {
      dragging.value = false;
      translateY.value = withTiming(0, { duration: 120 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: withTiming(dragging.value ? 1.03 : 1, { duration: 120 }) },
    ],
    zIndex: dragging.value ? 10 : 0,
    shadowOpacity: dragging.value ? 0.4 : 0,
  }));

  const path = card ? PATHS[card.evolutionPath] : undefined;
  const team = teamOf(player);
  const name = player ? `${player.firstName} ${player.lastName}` : 'Unknown';

  return (
    <Animated.View
      layout={reducedMotion ? undefined : LinearTransition.duration(180)}
      style={[styles.row, animatedStyle]}
      accessible
      accessibilityLabel={`Slot ${index + 1}: ${name}, ${draft.objective.label}`}
      accessibilityActions={[
        ...(index > 0 ? [{ name: 'moveUp' as const, label: 'Move up' }] : []),
        ...(index < count - 1 ? [{ name: 'moveDown' as const, label: 'Move down' }] : []),
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'moveUp') {
          onMove(index, clamp(index - 1, 0, count - 1));
        } else if (event.nativeEvent.actionName === 'moveDown') {
          onMove(index, clamp(index + 1, 0, count - 1));
        }
      }}
    >
      <View style={styles.slotBadge}>
        <AppText variant="caption" color={colors.primaryBright}>
          {index + 1}
        </AppText>
      </View>
      <InitialsAvatar
        initials={player ? initialsFor(player.firstName, player.lastName) : '??'}
        color={team?.color ?? colors.textMuted}
        size={38}
      />
      <View style={styles.main}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="micro" color={colors.textSecondary} numberOfLines={1}>
          {draft.objective.shortLabel} · {path?.name ?? ''}
          {startTime ? ` · ${formatClockTime(startTime)}` : ''}
        </AppText>
      </View>
      <PressableScale
        onPress={() => onRemove(draft.cardId)}
        accessibilityLabel={`Remove ${name} from relay`}
        hitSlop={8}
        style={styles.removeButton}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </PressableScale>
      <GestureDetector gesture={pan}>
        <View
          style={styles.handle}
          accessible
          accessibilityLabel={`Reorder ${name}`}
          accessibilityHint="Long press and drag to move this runner to a new slot"
        >
          <Ionicons name="reorder-three-outline" size={22} color={colors.textMuted} />
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

/** Drag-to-reorder list for the five drafted relay legs. */
export function RelayDraftList({
  drafts,
  playersById,
  cardsById,
  gameStartById,
  onMove,
  onRemove,
}: RelayDraftListProps) {
  return (
    <View style={styles.list}>
      {drafts.map((draft, index) => (
        <DraftRow
          key={draft.cardId}
          draft={draft}
          index={index}
          count={drafts.length}
          player={playersById[draft.playerId]}
          card={cardsById[draft.cardId]}
          startTime={gameStartById[draft.gameId]}
          onMove={onMove}
          onRemove={onRemove}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: ROW_HEIGHT - spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  slotBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    gap: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
