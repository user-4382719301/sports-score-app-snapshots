import type { CardHistoryEvent, CardStage, PlayerCard } from '@/types';
import { abilitiesForPath } from './abilities';

/** Level curve: intentionally flat so cards visibly grow week to week. */
export function xpToNext(level: number): number {
  return 80 + level * 40;
}

export function stageForLevel(level: number): CardStage {
  if (level >= 18) {
    return 'legend';
  }
  if (level >= 10) {
    return 'elite';
  }
  if (level >= 4) {
    return 'pro';
  }
  return 'rookie';
}

/** Cards earn the right to re-pick their path when they reach Elite. */
export const EVOLUTION_CHOICE_LEVEL = 10;

export interface XpGrantResult {
  card: PlayerCard;
  levelsGained: number;
  newStage?: CardStage;
  abilitiesUnlocked: string[];
  evolutionChoiceUnlocked: boolean;
}

let historyCounter = 0;
function historyEvent(type: CardHistoryEvent['type'], label: string, date: string): CardHistoryEvent {
  historyCounter += 1;
  return { id: `evt_${Date.now().toString(36)}_${historyCounter}`, date, type, label };
}

/**
 * Grant XP and roll forward levels, stage, abilities, and the evolution
 * choice flag. Pure — returns a new card plus everything that changed so the
 * caller can raise notifications.
 */
export function grantCardXp(card: PlayerCard, amount: number, date: string): XpGrantResult {
  let xp = card.xp + Math.max(0, Math.round(amount));
  let level = card.level;
  let xpNeeded = card.xpToNextLevel;
  let levelsGained = 0;

  while (xp >= xpNeeded) {
    xp -= xpNeeded;
    level += 1;
    levelsGained += 1;
    xpNeeded = xpToNext(level);
  }

  const previousStage = card.stage;
  const stage = stageForLevel(level);
  const newStage = stage !== previousStage ? stage : undefined;

  const abilitiesUnlocked = abilitiesForPath(card.evolutionPath)
    .filter((ability) => ability.unlockLevel > card.level && ability.unlockLevel <= level)
    .map((ability) => ability.id);

  const evolutionChoiceUnlocked =
    !card.evolutionChoiceAvailable && card.level < EVOLUTION_CHOICE_LEVEL && level >= EVOLUTION_CHOICE_LEVEL;

  const history: CardHistoryEvent[] = [...card.history];
  for (let gained = 1; gained <= levelsGained; gained += 1) {
    history.unshift(historyEvent('level_up', `Reached level ${card.level + gained}`, date));
  }
  if (newStage) {
    history.unshift(historyEvent('stage_up', `Evolved to ${stage} stage`, date));
  }
  for (const abilityId of abilitiesUnlocked) {
    const ability = abilitiesForPath(card.evolutionPath).find((a) => a.id === abilityId);
    if (ability) {
      history.unshift(historyEvent('ability_unlocked', `Unlocked ${ability.name}`, date));
    }
  }
  if (evolutionChoiceUnlocked) {
    history.unshift(historyEvent('evolution_choice', 'Evolution choice unlocked', date));
  }

  return {
    card: {
      ...card,
      xp,
      level,
      xpToNextLevel: xpNeeded,
      stage,
      evolutionChoiceAvailable: card.evolutionChoiceAvailable || evolutionChoiceUnlocked,
      unlockedAbilities: [...card.unlockedAbilities, ...abilitiesUnlocked],
      history: history.slice(0, 40),
    },
    levelsGained,
    newStage,
    abilitiesUnlocked,
    evolutionChoiceUnlocked,
  };
}

/** Update usage counters after a relay leg resolves for this card. */
export function recordLegResult(
  card: PlayerCard,
  success: boolean,
  relayFinished: boolean,
  date: string,
): PlayerCard {
  const relayAppearances = card.relayAppearances + 1;
  const successfulLegs = card.successfulLegs + (success ? 1 : 0);
  const relayFinishes = card.relayFinishes + (relayFinished ? 1 : 0);
  const milestones = card.milestones.map((milestone) => {
    const progress =
      milestone.id.startsWith('legs') && success
        ? milestone.progress + 1
        : milestone.id.startsWith('runs')
          ? milestone.progress + 1
          : milestone.progress;
    const achieved = progress >= milestone.target && !milestone.achievedAt;
    return {
      ...milestone,
      progress: Math.min(progress, milestone.target),
      achievedAt: achieved ? date : milestone.achievedAt,
    };
  });
  return {
    ...card,
    relayAppearances,
    successfulLegs,
    relayFinishes,
    successRate: relayAppearances === 0 ? 0 : successfulLegs / relayAppearances,
    milestones,
    history: [
      {
        id: `evt_leg_${Date.now().toString(36)}_${relayAppearances}`,
        date,
        type: 'relay_leg' as const,
        label: success ? 'Completed a relay leg' : 'Missed a relay leg',
      },
      ...card.history,
    ].slice(0, 40),
  };
}
