import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';
import { Screen } from '@/components/shared/Screen';
import { SearchInput } from '@/components/shared/SearchInput';
import { SegmentedTabs } from '@/components/shared/SegmentedTabs';
import { RelayDraftList } from '@/components/relay/RelayDraftList';
import { PATHS } from '@/constants/pathCatalog';
import { SPORTS } from '@/constants/sportCatalog';
import { computeChemistry } from '@/domain/chemistry';
import { dailyObjectiveFor } from '@/domain/objectives';
import { RELAY_SIZE } from '@/domain/relayEngine';
import {
  computePathBonuses,
  computeRewardMultiplier,
  computeRiskTier,
} from '@/domain/rewards';
import { canAddCard, isCardEligible, validateDraft } from '@/domain/validation';
import { teamOf } from '@/hooks/useEntities';
import { saveDraftAsRelay } from '@/services/relayBuilder';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useRelayStore } from '@/stores/relayStore';
import type { SportId } from '@/types';
import { colors, radii, spacing } from '@/theme';
import { initialsFor } from '@/utils/format';
import { formatClockTime, todayKey } from '@/utils/time';

type SportFilter = 'all' | SportId;

export default function BuildRelayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const relay = useRelayStore((state) => state.activeRelay);
  const draft = useRelayStore((state) => state.draft);
  const setDraft = useRelayStore((state) => state.setDraft);
  const addDraftLeg = useRelayStore((state) => state.addDraftLeg);
  const removeDraftLeg = useRelayStore((state) => state.removeDraftLeg);
  const moveDraftLeg = useRelayStore((state) => state.moveDraftLeg);
  const cards = useCollectionStore((state) => state.cards);
  const games = useGamesStore((state) => state.games);
  const players = useGamesStore((state) => state.players);

  const [query, setQuery] = useState('');
  const [sport, setSport] = useState<SportFilter>('all');
  const [issueMessage, setIssueMessage] = useState<string | null>(null);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((player) => [player.id, player])),
    [players],
  );
  const cardsById = useMemo(() => Object.fromEntries(cards.map((card) => [card.id, card])), [cards]);
  const gameForTeam = useMemo(() => {
    const map: Record<string, (typeof games)[number]> = {};
    for (const game of games) {
      map[game.away.teamId] = game;
      map[game.home.teamId] = game;
    }
    return map;
  }, [games]);

  // Editing a locked relay starts from its current lineup.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!prefilled.current && draft.length === 0 && relay?.status === 'locked') {
      prefilled.current = true;
      setDraft(
        relay.legs.map((leg) => ({
          cardId: leg.cardId,
          playerId: leg.playerId,
          gameId: leg.gameId,
          objective: leg.objective,
        })),
      );
    }
  }, [draft.length, relay, setDraft]);

  const relayInFlight = relay !== null && relay.status !== 'locked';

  const pathBonuses = computePathBonuses(
    draft.map((leg, slot) => ({ cardId: leg.cardId, slot })),
    cardsById,
  );
  const chemistry = computeChemistry(draft, playersById);
  const multiplier = computeRewardMultiplier(pathBonuses, chemistry);
  const riskTier = computeRiskTier(draft.map((leg) => leg.objective.difficulty));

  const gamesByCardId = useMemo(
    () =>
      Object.fromEntries(
        draft.map((leg) => [leg.cardId, games.find((game) => game.id === leg.gameId)]),
      ),
    [draft, games],
  );
  const validation = validateDraft(
    draft.map((leg) => leg.cardId),
    gamesByCardId,
  );

  const browseCards = useMemo(() => {
    const lower = query.toLowerCase();
    return cards
      .filter((card) => {
        const player = playersById[card.playerId];
        if (!player) {
          return false;
        }
        if (sport !== 'all' && player.sport !== sport) {
          return false;
        }
        if (lower.length > 0) {
          const name = `${player.firstName} ${player.lastName}`.toLowerCase();
          if (!name.includes(lower)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const gameA = gameForTeam[playersById[a.playerId]?.teamId ?? ''];
        const gameB = gameForTeam[playersById[b.playerId]?.teamId ?? ''];
        return Number(isCardEligible(gameB)) - Number(isCardEligible(gameA));
      });
  }, [cards, playersById, sport, query, gameForTeam]);

  const showIssue = (message: string) => {
    setIssueMessage(message);
    setTimeout(() => setIssueMessage(null), 3200);
  };

  const handleAdd = (cardId: string) => {
    const card = cardsById[cardId];
    const player = card ? playersById[card.playerId] : undefined;
    if (!card || !player) {
      return;
    }
    const game = gameForTeam[player.teamId];
    const check = canAddCard(
      draft.map((leg) => leg.cardId),
      card,
      game,
    );
    if (!check.ok) {
      showIssue(check.message ?? 'That player can’t join this relay.');
      return;
    }
    addDraftLeg({
      cardId: card.id,
      playerId: player.id,
      gameId: game?.id ?? '',
      objective: dailyObjectiveFor(player, card.evolutionPath, todayKey()),
    });
  };

  const handleSave = () => {
    if (!validation.complete) {
      showIssue(validation.messages[0] ?? 'Fill all five slots to save.');
      return;
    }
    saveDraftAsRelay();
    router.back();
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerRow}>
        <PressableScale
          onPress={() => router.back()}
          accessibilityLabel="Close relay builder"
          style={styles.closeButton}
        >
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </PressableScale>
        <AppText variant="heading">
          {relay?.status === 'locked' ? 'Edit Relay' : 'Build Relay'}
        </AppText>
        <PressableScale
          onPress={handleSave}
          disabled={!validation.complete || relayInFlight}
          accessibilityLabel="Save and lock relay"
          style={[styles.saveButton, (!validation.complete || relayInFlight) && styles.saveDisabled]}
        >
          <AppText
            variant="bodyBold"
            color={validation.complete && !relayInFlight ? colors.textOnAccent : colors.textMuted}
          >
            Save
          </AppText>
        </PressableScale>
      </View>
    </View>
  );

  if (relayInFlight) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="lock-closed-outline"
          title="Today’s relay is locked in"
          message="Your relay is already running. Come back tomorrow to build a new chain."
          actionLabel="Watch it live"
          onAction={() => {
            router.back();
            router.push('/relay');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      {issueMessage ? (
        <View style={styles.issueBanner} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <AppText variant="caption" color={colors.danger} style={styles.issueText}>
            {issueMessage}
          </AppText>
        </View>
      ) : null}

      <Panel style={styles.draftPanel}>
        <View style={styles.draftHeader}>
          <AppText variant="subheading">
            Your chain · {draft.length}/{RELAY_SIZE}
          </AppText>
          <View style={styles.draftBadges}>
            <Badge
              label={`${riskTier.toUpperCase()} RISK`}
              color={
                riskTier === 'high'
                  ? colors.danger
                  : riskTier === 'medium'
                    ? colors.gold
                    : colors.success
              }
              small
            />
            <Badge label={`×${multiplier.toFixed(2)}`} color={colors.primaryBright} small />
          </View>
        </View>

        {draft.length === 0 ? (
          <AppText variant="caption" color={colors.textSecondary}>
            Add five athletes from today’s upcoming games. Order matters — the baton passes from
            slot 1 to slot 5.
          </AppText>
        ) : (
          <RelayDraftList
            drafts={draft}
            playersById={playersById}
            cardsById={cardsById}
            gameStartById={Object.fromEntries(games.map((game) => [game.id, game.startTime]))}
            onMove={moveDraftLeg}
            onRemove={removeDraftLeg}
          />
        )}

        {chemistry.length > 0 ? (
          <View style={styles.chemList}>
            {chemistry.map((bonus) => (
              <View key={bonus.id} style={styles.chemRow}>
                <Ionicons name="link-outline" size={12} color={colors.success} />
                <AppText variant="micro" color={colors.textSecondary}>
                  {bonus.label} · +{Math.round(bonus.bonus * 100)}%
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        {validation.messages.length > 0 ? (
          <AppText variant="micro" color={colors.textMuted}>
            {validation.messages[0]}
          </AppText>
        ) : (
          <AppText variant="micro" color={colors.success}>
            Ready to save — the relay locks when the first game starts.
          </AppText>
        )}
      </Panel>

      <View style={styles.browseHeader}>
        <AppText variant="subheading">Available players</AppText>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search players" />
        <SegmentedTabs<SportFilter>
          options={[
            { value: 'all', label: 'All' },
            ...SPORTS.map((s) => ({ value: s.id, label: s.shortName })),
          ]}
          value={sport}
          onChange={setSport}
          scrollable
        />
      </View>

      <View style={styles.cardList}>
        {browseCards.map((card) => {
          const player = playersById[card.playerId];
          if (!player) {
            return null;
          }
          const team = teamOf(player);
          const game = gameForTeam[player.teamId];
          const path = PATHS[card.evolutionPath];
          const eligible = isCardEligible(game);
          const inDraft = draft.some((leg) => leg.cardId === card.id);
          const objective = dailyObjectiveFor(player, card.evolutionPath, todayKey());

          return (
            <Panel key={card.id} style={[styles.browseRow, !eligible && styles.browseRowLocked]}>
              <InitialsAvatar
                initials={initialsFor(player.firstName, player.lastName)}
                color={team?.color ?? colors.textMuted}
                size={42}
              />
              <View style={styles.browseMain}>
                <View style={styles.browseNameRow}>
                  <AppText variant="bodyBold" numberOfLines={1} style={styles.browseName}>
                    {player.firstName} {player.lastName}
                  </AppText>
                  <Badge label={`LV ${card.level}`} color={path.color} small />
                </View>
                <AppText variant="micro" color={colors.textSecondary} numberOfLines={1}>
                  {team?.abbreviation} · {player.position} · {path.name}
                </AppText>
                <AppText variant="micro" color={eligible ? colors.textSecondary : colors.textMuted}>
                  {objective.shortLabel} · {objective.label}
                </AppText>
                <AppText variant="micro" color={eligible ? colors.live : colors.textMuted}>
                  {game
                    ? game.status === 'scheduled'
                      ? `Starts ${formatClockTime(game.startTime)}`
                      : game.status === 'live'
                        ? 'Game underway — locked'
                        : 'Game final — locked'
                    : 'No game today'}
                </AppText>
              </View>
              {inDraft ? (
                <PressableScale
                  onPress={() => removeDraftLeg(card.id)}
                  accessibilityLabel={`Remove ${player.firstName} ${player.lastName} from relay`}
                  style={[styles.addButton, styles.removeButton]}
                >
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                </PressableScale>
              ) : (
                <PressableScale
                  onPress={() => handleAdd(card.id)}
                  disabled={!eligible}
                  accessibilityLabel={
                    eligible
                      ? `Add ${player.firstName} ${player.lastName} to relay`
                      : `${player.firstName} ${player.lastName} is not eligible`
                  }
                  style={[styles.addButton, !eligible && styles.addButtonDisabled]}
                >
                  <Ionicons
                    name={eligible ? 'add' : 'lock-closed-outline'}
                    size={18}
                    color={eligible ? colors.textOnAccent : colors.textMuted}
                  />
                </PressableScale>
              )}
            </Panel>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: {
    backgroundColor: colors.surface,
  },
  issueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: `${colors.danger}55`,
    padding: spacing.md,
  },
  issueText: {
    flex: 1,
  },
  draftPanel: {
    gap: spacing.md,
  },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  draftBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chemList: {
    gap: spacing.xs,
  },
  chemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  browseHeader: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cardList: {
    gap: spacing.sm,
  },
  browseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  browseRowLocked: {
    opacity: 0.65,
  },
  browseMain: {
    flex: 1,
    gap: 2,
  },
  browseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  browseName: {
    flexShrink: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.surfaceSunken,
  },
  removeButton: {
    backgroundColor: colors.successSoft,
  },
});
