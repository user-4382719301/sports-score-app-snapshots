import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardEvolutionPath, PlayerCard } from '@/types';
import { grantCardXp, recordLegResult, type XpGrantResult } from '@/domain/progression';
import { getInitialSeed, zustandStorage } from './storage';

interface CollectionState {
  cards: PlayerCard[];
  hasHydrated: boolean;
  setHydrated: () => void;
  toggleFavorite: (cardId: string) => void;
  /** Grant XP; returns what changed so callers can raise notifications. */
  grantXp: (cardId: string, amount: number) => XpGrantResult | undefined;
  recordLeg: (cardId: string, success: boolean) => void;
  bumpRelayFinishes: (cardIds: string[]) => void;
  choosePath: (cardId: string, path: CardEvolutionPath) => void;
  reset: (cards: PlayerCard[]) => void;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      cards: getInitialSeed().cards,
      hasHydrated: false,
      setHydrated: () => set({ hasHydrated: true }),

      toggleFavorite: (cardId) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId ? { ...card, favorite: !card.favorite } : card,
          ),
        })),

      grantXp: (cardId, amount) => {
        const card = get().cards.find((c) => c.id === cardId);
        if (!card) {
          return undefined;
        }
        const result = grantCardXp(card, amount, 'today');
        set((state) => ({
          cards: state.cards.map((c) => (c.id === cardId ? result.card : c)),
        }));
        return result;
      },

      recordLeg: (cardId, success) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId ? recordLegResult(card, success, false, 'today') : card,
          ),
        })),

      bumpRelayFinishes: (cardIds) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            cardIds.includes(card.id) ? { ...card, relayFinishes: card.relayFinishes + 1 } : card,
          ),
        })),

      choosePath: (cardId, path) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  evolutionPath: path,
                  evolutionChoiceAvailable: false,
                  history: [
                    {
                      id: `evt_path_${cardId}_${card.history.length}`,
                      date: 'today',
                      type: 'evolution_choice' as const,
                      label: `Chose the ${path} path`,
                    },
                    ...card.history,
                  ].slice(0, 40),
                }
              : card,
          ),
        })),

      reset: (cards) => set({ cards }),
    }),
    {
      name: 'relay/collection',
      storage: zustandStorage,
      partialize: (state) => ({ cards: state.cards }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export function selectCardById(state: CollectionState, cardId: string): PlayerCard | undefined {
  return state.cards.find((card) => card.id === cardId);
}
