import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Relay } from '@/types';
import type { RelayLegDraft } from '@/domain/relayEngine';
import { getInitialSeed, zustandStorage } from './storage';

interface RelayState {
  /** Today's saved relay (locked, live, or finished). Null before saving. */
  activeRelay: Relay | null;
  /** In-progress builder selection, ordered. */
  draft: RelayLegDraft[];
  hasHydrated: boolean;
  setHydrated: () => void;
  setActiveRelay: (relay: Relay | null) => void;
  setDraft: (draft: RelayLegDraft[]) => void;
  addDraftLeg: (leg: RelayLegDraft) => void;
  removeDraftLeg: (cardId: string) => void;
  moveDraftLeg: (fromIndex: number, toIndex: number) => void;
  clearDraft: () => void;
  reset: (relay: Relay | null) => void;
}

export const useRelayStore = create<RelayState>()(
  persist(
    (set) => ({
      activeRelay: getInitialSeed().activeRelay,
      draft: [],
      hasHydrated: false,
      setHydrated: () => set({ hasHydrated: true }),

      setActiveRelay: (relay) => set({ activeRelay: relay }),
      setDraft: (draft) => set({ draft }),

      addDraftLeg: (leg) => set((state) => ({ draft: [...state.draft, leg] })),

      removeDraftLeg: (cardId) =>
        set((state) => ({ draft: state.draft.filter((leg) => leg.cardId !== cardId) })),

      moveDraftLeg: (fromIndex, toIndex) =>
        set((state) => {
          const draft = [...state.draft];
          const moved = draft.splice(fromIndex, 1)[0];
          if (!moved) {
            return state;
          }
          draft.splice(Math.max(0, Math.min(draft.length, toIndex)), 0, moved);
          return { draft };
        }),

      clearDraft: () => set({ draft: [] }),
      reset: (relay) => set({ activeRelay: relay, draft: [] }),
    }),
    {
      name: 'relay/relay',
      storage: zustandStorage,
      partialize: (state) => ({ activeRelay: state.activeRelay, draft: state.draft }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
