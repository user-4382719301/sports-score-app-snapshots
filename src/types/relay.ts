import type { SportId, StatKey } from './sports';

export type RelayLegStatus =
  | 'locked'
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed';

export type RelayStatus = 'draft' | 'locked' | 'live' | 'completed' | 'failed';

export type RiskTier = 'low' | 'medium' | 'high';

export type ObjectiveDifficulty = 1 | 2 | 3;

export interface RelayObjective {
  id: string;
  sport: SportId;
  statKey: StatKey;
  target: number;
  /** Full sentence label, e.g. "Record two total bases". */
  label: string;
  /** Compact label for chips, e.g. "2 TB". */
  shortLabel: string;
  difficulty: ObjectiveDifficulty;
}

export interface RelayLeg {
  /** 0-based slot in the chain. */
  slot: number;
  cardId: string;
  playerId: string;
  gameId: string;
  objective: RelayObjective;
  status: RelayLegStatus;
  /** Current stat value toward objective.target. */
  progress: number;
  /** True when a Shield teammate revived this leg after a failure. */
  savedByShield: boolean;
}

export interface ChemistryBonus {
  id: string;
  label: string;
  /** Additive reward multiplier contribution, e.g. 0.05 for +5%. */
  bonus: number;
}

export interface Relay {
  id: string;
  /** Local calendar day the relay belongs to, YYYY-MM-DD. */
  dateKey: string;
  status: RelayStatus;
  legs: RelayLeg[];
  /** Relay locks when its first game starts. */
  lockAt: string;
  riskTier: RiskTier;
  /** Total payout multiplier: 1 + difficulty + path + chemistry bonuses. */
  rewardMultiplier: number;
  chemistry: ChemistryBonus[];
  shieldAvailable: boolean;
  shieldUsed: boolean;
}

export interface RelayReward {
  coins: number;
  cardXpPerLeg: number;
  accountXp: number;
  ratingDelta: number;
}

export interface RelayHistoryEntry {
  id: string;
  dateKey: string;
  relay: Relay;
  completedLegs: number;
  perfect: boolean;
  reward: RelayReward;
}
