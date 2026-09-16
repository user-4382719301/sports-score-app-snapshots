import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { getInitialSeed, zustandStorage } from './storage';

interface UserState {
  user: User;
  hasHydrated: boolean;
  setHydrated: () => void;
  /** Fold a finished relay into profile aggregates. */
  applyRelayOutcome: (input: {
    completedLegs: number;
    totalLegs: number;
    perfect: boolean;
    completed: boolean;
    ratingDelta: number;
    accountXp: number;
  }) => void;
  reset: (user: User) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: getInitialSeed().user,
      hasHydrated: false,
      setHydrated: () => set({ hasHydrated: true }),

      applyRelayOutcome: ({ completedLegs, totalLegs, perfect, completed, ratingDelta, accountXp }) =>
        set((state) => {
          const user = state.user;
          const totalRelays = user.totalRelays + 1;
          const completedRelays = user.completedRelays + (completed ? 1 : 0);
          const currentStreak = completed ? user.currentStreak + 1 : 0;

          // Blend the day's leg completion into the lifetime rate, weighting
          // history by prior relay count. Approximate but stable.
          const priorLegs = user.totalRelays * 5;
          const successRate =
            priorLegs + totalLegs === 0
              ? 0
              : (user.successRate * priorLegs + completedLegs) / (priorLegs + totalLegs);

          let accountLevel = user.accountLevel;
          let xp = user.accountXp + accountXp;
          let xpToNext = user.accountXpToNext;
          while (xp >= xpToNext) {
            xp -= xpToNext;
            accountLevel += 1;
            xpToNext = 400 + accountLevel * 60;
          }

          return {
            user: {
              ...user,
              totalRelays,
              completedRelays,
              perfectRelays: user.perfectRelays + (perfect ? 1 : 0),
              currentStreak,
              longestStreak: Math.max(user.longestStreak, currentStreak),
              successRate,
              relayRating: Math.max(0, user.relayRating + ratingDelta),
              accountLevel,
              accountXp: xp,
              accountXpToNext: xpToNext,
            },
          };
        }),

      reset: (user) => set({ user }),
    }),
    {
      name: 'relay/user',
      storage: zustandStorage,
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
