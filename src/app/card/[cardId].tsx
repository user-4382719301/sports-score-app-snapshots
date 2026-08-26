import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/shared/AppText';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Panel } from '@/components/shared/Panel';
import { PressableScale } from '@/components/shared/PressableScale';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Screen } from '@/components/shared/Screen';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SegmentedTabs } from '@/components/shared/SegmentedTabs';
import { StatBlock } from '@/components/shared/StatBlock';
import { CardArt } from '@/components/cards/CardArt';
import { PATHS, STAGES, STAGE_ORDER } from '@/constants/pathCatalog';
import { SPORT_BY_ID } from '@/constants/sportCatalog';
import { STAT_COLUMNS, formatStatValue } from '@/constants/statCatalog';
import { abilitiesForPath, signatureAbility } from '@/domain/abilities';
import { dailyObjectiveFor } from '@/domain/objectives';
import { teamOf, useCard, usePlayer } from '@/hooks/useEntities';
import { useCollectionStore } from '@/stores/collectionStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useRelayStore } from '@/stores/relayStore';
import type { CardEvolutionPath } from '@/types';
import { colors, radii, spacing } from '@/theme';
import { formatPercent } from '@/utils/format';
import { formatClockTime, todayKey } from '@/utils/time';

type CardTab = 'overview' | 'stats' | 'progression' | 'history' | 'abilities';

const HISTORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  relay_leg: 'flash-outline',
  level_up: 'trending-up-outline',
  stage_up: 'sparkles-outline',
  ability_unlocked: 'key-outline',
  evolution_choice: 'git-branch-outline',
};

export default function CardDetailScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const router = useRouter();
  const card = useCard(cardId);
  const player = usePlayer(card?.playerId);
  const relay = useRelayStore((state) => state.activeRelay);
  const games = useGamesStore((state) => state.games);
  const toggleFavorite = useCollectionStore((state) => state.toggleFavorite);
  const choosePath = useCollectionStore((state) => state.choosePath);
  const pushNotification = useNotificationsStore((state) => state.push);
  const [tab, setTab] = useState<CardTab>('overview');

  const relayLeg = relay?.legs.find((leg) => leg.cardId === card?.id);
  const todaysGame = useMemo(
    () =>
      player
        ? games.find(
            (game) =>
              game.away.teamId === player.teamId || game.home.teamId === player.teamId,
          )
        : undefined,
    [games, player],
  );

  if (!card || !player) {
    return (
      <Screen header={<ScreenHeader title="Card" />}>
        <EmptyState
          icon="albums-outline"
          title="Card not found"
          message="This card isn’t in your season collection."
        />
      </Screen>
    );
  }

  const team = teamOf(player);
  const path = PATHS[card.evolutionPath];
  const stage = STAGES[card.stage];
  const sport = SPORT_BY_ID[player.sport];
  const objective = relayLeg?.objective ?? dailyObjectiveFor(player, card.evolutionPath, todayKey());
  const signature = signatureAbility(card.evolutionPath);
  const statLine = todaysGame?.playerStats.find((line) => line.playerId === player.id);

  return (
    <Screen
      header={
        <ScreenHeader
          title={`${player.firstName} ${player.lastName}`}
          subtitle={`${team?.abbreviation ?? ''} · ${player.position} · ${sport.shortName} · Season ${card.season}`}
          right={
            <PressableScale
              onPress={() => toggleFavorite(card.id)}
              accessibilityLabel={card.favorite ? 'Remove from favorites' : 'Add to favorites'}
              style={styles.favButton}
            >
              <Ionicons
                name={card.favorite ? 'star' : 'star-outline'}
                size={19}
                color={card.favorite ? colors.gold : colors.textSecondary}
              />
            </PressableScale>
          }
        />
      }
    >
      <View style={styles.heroWrap}>
        <CardArt card={card} player={player} team={team} size="hero" />
      </View>

      <SegmentedTabs<CardTab>
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'stats', label: 'Stats' },
          { value: 'progression', label: 'Progression' },
          { value: 'history', label: 'History' },
          { value: 'abilities', label: 'Abilities' },
        ]}
        value={tab}
        onChange={setTab}
        scrollable
      />

      {tab === 'overview' ? (
        <>
          <Panel style={styles.blockPanel}>
            <AppText variant="micro" color={colors.textMuted}>
              TODAY’S OBJECTIVE
            </AppText>
            <View style={styles.objectiveRow}>
              <AppText variant="bodyBold" style={styles.objectiveLabel}>
                {objective.label}
              </AppText>
              <Badge
                label={`TIER ${objective.difficulty}`}
                color={
                  objective.difficulty === 3
                    ? colors.danger
                    : objective.difficulty === 2
                      ? colors.gold
                      : colors.success
                }
                small
              />
            </View>
            {relayLeg ? (
              <>
                <ProgressBar
                  ratio={
                    relayLeg.objective.target === 0
                      ? 0
                      : relayLeg.progress / relayLeg.objective.target
                  }
                  color={colors.live}
                  accessibilityLabel={`Objective progress ${relayLeg.progress} of ${relayLeg.objective.target}`}
                />
                <AppText variant="micro" color={colors.live}>
                  In today’s relay · leg {relayLeg.slot + 1} · {relayLeg.progress}/
                  {relayLeg.objective.target}
                </AppText>
              </>
            ) : todaysGame ? (
              <AppText variant="micro" color={colors.textSecondary}>
                {todaysGame.status === 'scheduled'
                  ? `Game starts ${formatClockTime(todaysGame.startTime)}`
                  : todaysGame.status === 'live'
                    ? 'Game is live now'
                    : 'Today’s game is final'}
              </AppText>
            ) : (
              <AppText variant="micro" color={colors.textSecondary}>
                No game today
              </AppText>
            )}
          </Panel>

          <Panel style={styles.blockPanel}>
            <AppText variant="micro" color={colors.textMuted}>
              SIGNATURE ABILITY
            </AppText>
            <View style={styles.abilityRow}>
              <View style={[styles.abilityIcon, { backgroundColor: `${path.color}22` }]}>
                <Ionicons
                  name={path.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={path.color}
                />
              </View>
              <View style={styles.abilityMain}>
                <AppText variant="bodyBold">{signature.name}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {path.ruleText}
                </AppText>
              </View>
            </View>
          </Panel>

          <Panel style={styles.statsPanel}>
            <View style={styles.statsRow}>
              <StatBlock label="Relays" value={String(card.relayAppearances)} />
              <StatBlock label="Legs won" value={String(card.successfulLegs)} color={colors.success} />
              <StatBlock label="Success" value={formatPercent(card.successRate)} color={colors.live} />
              <StatBlock label="Finishes" value={String(card.relayFinishes)} color={colors.gold} />
            </View>
          </Panel>
        </>
      ) : null}

      {tab === 'stats' ? (
        statLine && todaysGame ? (
          <Panel style={styles.blockPanel}>
            <AppText variant="micro" color={colors.textMuted}>
              TODAY’S LINE · {todaysGame.status === 'final' ? 'FINAL' : todaysGame.periodLabel}
            </AppText>
            <View style={styles.statChips}>
              {STAT_COLUMNS[player.sport].map((column) => (
                <View key={column.key} style={styles.statChip}>
                  <AppText variant="micro" color={colors.textMuted}>
                    {column.label}
                  </AppText>
                  <AppText variant="bodyBold">{formatStatValue(column, statLine.stats)}</AppText>
                </View>
              ))}
            </View>
            {todaysGame ? (
              <PressableScale
                onPress={() =>
                  router.push({ pathname: '/game/[gameId]', params: { gameId: todaysGame.id } })
                }
                accessibilityLabel="Open today's game"
                style={styles.linkRow}
              >
                <AppText variant="caption" color={colors.primaryBright}>
                  Open today’s game
                </AppText>
                <Ionicons name="chevron-forward" size={13} color={colors.primaryBright} />
              </PressableScale>
            ) : null}
          </Panel>
        ) : (
          <EmptyState
            icon="stats-chart-outline"
            title="No live line yet"
            message={
              todaysGame
                ? `Stats appear when the game starts at ${formatClockTime(todaysGame.startTime)}.`
                : 'This player has no game on today’s slate.'
            }
          />
        )
      ) : null}

      {tab === 'progression' ? (
        <>
          <Panel style={styles.blockPanel}>
            <View style={styles.levelRow}>
              <AppText variant="bodyBold">Level {card.level}</AppText>
              <AppText variant="micro" color={colors.textMuted}>
                {card.xp}/{card.xpToNextLevel} XP
              </AppText>
            </View>
            <ProgressBar
              ratio={card.xp / card.xpToNextLevel}
              color={stage.color}
              height={8}
              accessibilityLabel={`${card.xp} of ${card.xpToNextLevel} XP toward level ${card.level + 1}`}
            />
            <View style={styles.stageTrack}>
              {STAGE_ORDER.map((stageId) => {
                const info = STAGES[stageId];
                const reached = card.level >= info.minLevel;
                return (
                  <View key={stageId} style={styles.stageStep}>
                    <Ionicons
                      name={reached ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={reached ? info.color : colors.textMuted}
                    />
                    <AppText variant="micro" color={reached ? info.color : colors.textMuted}>
                      {info.name} · LV {info.minLevel}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </Panel>

          {card.evolutionChoiceAvailable ? (
            <Panel glowColor={colors.gold} style={styles.blockPanel}>
              <AppText variant="bodyBold" color={colors.gold}>
                Evolution choice unlocked
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                This card earned the right to change its path. Choose carefully — the choice is part
                of its season story.
              </AppText>
              <View style={styles.pathChoices}>
                {(Object.keys(PATHS) as CardEvolutionPath[])
                  .filter((pathId) => pathId !== card.evolutionPath)
                  .slice(0, 3)
                  .map((pathId) => (
                    <PressableScale
                      key={pathId}
                      onPress={() => {
                        choosePath(card.id, pathId);
                        pushNotification({
                          type: 'evolution_choice',
                          title: 'Path chosen',
                          body: `${player.firstName} ${player.lastName} now follows the ${PATHS[pathId].name} path.`,
                          cardId: card.id,
                        });
                      }}
                      accessibilityLabel={`Choose the ${PATHS[pathId].name} path`}
                      style={[styles.pathChoice, { borderColor: `${PATHS[pathId].color}66` }]}
                    >
                      <Ionicons
                        name={PATHS[pathId].icon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={PATHS[pathId].color}
                      />
                      <AppText variant="caption" color={PATHS[pathId].color}>
                        {PATHS[pathId].name}
                      </AppText>
                    </PressableScale>
                  ))}
              </View>
            </Panel>
          ) : null}

          <Panel style={styles.blockPanel}>
            <AppText variant="micro" color={colors.textMuted}>
              SEASON MILESTONES
            </AppText>
            {card.milestones.map((milestone) => (
              <View key={milestone.id} style={styles.milestoneRow}>
                <Ionicons
                  name={milestone.achievedAt ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={milestone.achievedAt ? colors.success : colors.textMuted}
                />
                <View style={styles.milestoneMain}>
                  <AppText variant="caption">{milestone.label}</AppText>
                  <ProgressBar
                    ratio={milestone.target === 0 ? 0 : milestone.progress / milestone.target}
                    color={milestone.achievedAt ? colors.success : colors.primary}
                    height={4}
                  />
                </View>
                <AppText variant="micro" color={colors.textMuted}>
                  {milestone.progress}/{milestone.target}
                </AppText>
              </View>
            ))}
          </Panel>
        </>
      ) : null}

      {tab === 'history' ? (
        <Panel style={styles.blockPanel}>
          {card.history.length === 0 ? (
            <AppText variant="caption" color={colors.textSecondary}>
              This card’s story starts with its first relay.
            </AppText>
          ) : (
            card.history.map((event) => (
              <View key={event.id} style={styles.historyRow}>
                <Ionicons
                  name={HISTORY_ICON[event.type] ?? 'ellipse-outline'}
                  size={15}
                  color={colors.textSecondary}
                />
                <View style={styles.historyMain}>
                  <AppText variant="caption">{event.label}</AppText>
                  <AppText variant="micro" color={colors.textMuted}>
                    {event.date}
                  </AppText>
                </View>
              </View>
            ))
          )}
        </Panel>
      ) : null}

      {tab === 'abilities' ? (
        <Panel style={styles.blockPanel}>
          {abilitiesForPath(card.evolutionPath).map((ability) => {
            const unlocked = card.unlockedAbilities.includes(ability.id);
            return (
              <View
                key={ability.id}
                style={[styles.abilityRow, !unlocked && styles.abilityLocked]}
                accessible
                accessibilityLabel={`${ability.name}, ${unlocked ? 'unlocked' : `unlocks at level ${ability.unlockLevel}`}`}
              >
                <View style={[styles.abilityIcon, { backgroundColor: `${path.color}22` }]}>
                  <Ionicons
                    name={unlocked ? (path.icon as keyof typeof Ionicons.glyphMap) : 'lock-closed-outline'}
                    size={17}
                    color={unlocked ? path.color : colors.textMuted}
                  />
                </View>
                <View style={styles.abilityMain}>
                  <AppText variant="bodyBold" color={unlocked ? colors.textPrimary : colors.textMuted}>
                    {ability.name}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {ability.description}
                  </AppText>
                </View>
                <Badge
                  label={unlocked ? 'OWNED' : `LV ${ability.unlockLevel}`}
                  color={unlocked ? colors.success : colors.textMuted}
                  small
                />
              </View>
            );
          })}
        </Panel>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  favButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    paddingHorizontal: spacing.xxl,
  },
  blockPanel: {
    gap: spacing.md,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  objectiveLabel: {
    flex: 1,
  },
  abilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  abilityLocked: {
    opacity: 0.6,
  },
  abilityIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abilityMain: {
    flex: 1,
    gap: 2,
  },
  statsPanel: {
    paddingVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statChip: {
    minWidth: 64,
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 32,
    alignSelf: 'flex-start',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageTrack: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stageStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pathChoices: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pathChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  milestoneMain: {
    flex: 1,
    gap: spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 36,
  },
  historyMain: {
    flex: 1,
    gap: 1,
  },
});
