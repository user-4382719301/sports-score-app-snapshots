import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Quest, Reward } from '@/types';
import { getInitialSeed, zustandStorage } from './storage';

interface RewardsState {
  coins: number;
  quests: Quest[];
  rewards: Reward[];
  hasHydrated: boolean;
  setHydrated: () => void;
  addCoins: (amount: number) => void;
  /** Advance quests by id; progress caps at target. */
  advanceQuests: (questIds: string[], amount: number) => void;
  /** Claim a completed quest; pays out coins and returns them (0 if not claimable). */
  claimQuest: (questId: string) => number;
  /** New day: daily quests reset to unclaimed zero progress. */
  resetDailyQuests: () => void;
  unlockReward: (rewardId: string) => void;
  reset: (input: { coins: number; quests: Quest[]; rewards: Reward[] }) => void;
}

export const useRewardsStore = create<RewardsState>()(
  persist(
    (set, get) => ({
      coins: getInitialSeed().coins,
      quests: getInitialSeed().quests,
      rewards: getInitialSeed().rewards,
      hasHydrated: false,
      setHydrated: () => set({ hasHydrated: true }),

      addCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins + amount) })),

      advanceQuests: (questIds, amount) =>
        set((state) => ({
          quests: state.quests.map((quest) =>
            questIds.includes(quest.id) && !quest.claimed
              ? { ...quest, progress: Math.min(quest.target, quest.progress + amount) }
              : quest,
          ),
        })),

      claimQuest: (questId) => {
        const quest = get().quests.find((q) => q.id === questId);
        if (!quest || quest.claimed || quest.progress < quest.target) {
          return 0;
        }
        set((state) => ({
          coins: state.coins + quest.rewardCoins,
          quests: state.quests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
        }));
        return quest.rewardCoins;
      },

      resetDailyQuests: () =>
        set((state) => ({
          quests: state.quests.map((quest) =>
            quest.kind === 'daily' ? { ...quest, progress: 0, claimed: false } : quest,
          ),
        })),

      unlockReward: (rewardId) =>
        set((state) => ({
          rewards: state.rewards.map((reward) =>
            reward.id === rewardId ? { ...reward, unlocked: true } : reward,
          ),
        })),

      reset: ({ coins, quests, rewards }) => set({ coins, quests, rewards }),
    }),
    {
      name: 'relay/rewards',
      storage: zustandStorage,
      partialize: (state) => ({
        coins: state.coins,
        quests: state.quests,
        rewards: state.rewards,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
