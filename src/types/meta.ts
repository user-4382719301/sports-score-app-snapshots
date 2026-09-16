import type { SportId } from './sports';

export interface User {
  id: string;
  name: string;
  handle: string;
  accountLevel: number;
  accountXp: number;
  accountXpToNext: number;
  relayRating: number;
  completedRelays: number;
  totalRelays: number;
  /** 0..1 across all historical legs. */
  successRate: number;
  currentStreak: number;
  longestStreak: number;
  perfectRelays: number;
  favoriteSports: SportId[];
}

export type NotificationType =
  | 'leg_completed'
  | 'baton_passed'
  | 'card_level_up'
  | 'game_starting'
  | 'relay_failed'
  | 'relay_completed'
  | 'evolution_choice';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  cardId?: string;
  gameId?: string;
}

export type QuestKind = 'daily' | 'season';

export interface Quest {
  id: string;
  kind: QuestKind;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardCoins: number;
  rewardXp: number;
  claimed: boolean;
}

export type RewardType = 'coins' | 'cardXp' | 'cosmetic';

export interface Reward {
  id: string;
  type: RewardType;
  label: string;
  description: string;
  /** Ionicons glyph. */
  icon: string;
  amount?: number;
  unlocked: boolean;
}
