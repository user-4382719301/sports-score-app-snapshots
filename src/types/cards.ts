export type CardEvolutionPath =
  | 'spark'
  | 'connector'
  | 'power'
  | 'shield'
  | 'closer'
  | 'wildcard';

/**
 * Card stage is earned through use, not pulled from packs. Stage advances at
 * fixed levels (see domain/progression) so rarity is never the main source
 * of strength.
 */
export type CardStage = 'rookie' | 'pro' | 'elite' | 'legend';

export interface CardAbility {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
}

export interface CardMilestone {
  id: string;
  label: string;
  target: number;
  progress: number;
  achievedAt?: string;
}

export type CardHistoryEventType =
  | 'relay_leg'
  | 'level_up'
  | 'stage_up'
  | 'ability_unlocked'
  | 'evolution_choice';

export interface CardHistoryEvent {
  id: string;
  date: string;
  type: CardHistoryEventType;
  label: string;
}

/**
 * Season-long collectible. Shared player identity lives on Player; this type
 * holds the user-specific progression that makes the card feel owned.
 */
export interface PlayerCard {
  id: string;
  playerId: string;
  season: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  stage: CardStage;
  evolutionPath: CardEvolutionPath;
  /** True once the card has earned the right to pick a new evolution path. */
  evolutionChoiceAvailable: boolean;
  relayAppearances: number;
  successfulLegs: number;
  relayFinishes: number;
  /** 0..1 — successfulLegs / relayAppearances. */
  successRate: number;
  favorite: boolean;
  unlockedAbilities: string[];
  milestones: CardMilestone[];
  history: CardHistoryEvent[];
}
