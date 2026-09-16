import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RelayHistoryEntry } from '@/types';
import { getInitialSeed, zustandStorage } from './storage';

interface HistoryState {
  entries: RelayHistoryEntry[];
  hasHydrated: boolean;
  setHydrated: () => void;
  addEntry: (entry: RelayHistoryEntry) => void;
  reset: (entries: RelayHistoryEntry[]) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: getInitialSeed().history,
      hasHydrated: false,
      setHydrated: () => set({ hasHydrated: true }),

      addEntry: (entry) =>
        set((state) => ({
          entries: [entry, ...state.entries.filter((e) => e.id !== entry.id)],
        })),

      reset: (entries) => set({ entries }),
    }),
    {
      name: 'relay/history',
      storage: zustandStorage,
      partialize: (state) => ({ entries: state.entries }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
