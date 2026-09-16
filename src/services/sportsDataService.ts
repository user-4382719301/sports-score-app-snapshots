import type { Game } from '@/types';
import { useGamesStore } from '@/stores/gamesStore';

/**
 * Seam for real sports data. V1 ships MockSportsDataProvider, which serves
 * the seeded store; a production build swaps in an HTTP provider with the
 * same shape and nothing above this file changes. See docs/ARCHITECTURE.md
 * ("Replacing mock data with a real API").
 */
export interface SportsDataProvider {
  fetchTodaysGames(): Promise<Game[]>;
  fetchGame(gameId: string): Promise<Game | undefined>;
  /** Poll or stream live updates; returns an unsubscribe function. */
  subscribeToGame(gameId: string, onUpdate: (game: Game) => void): () => void;
}

class MockSportsDataProvider implements SportsDataProvider {
  async fetchTodaysGames(): Promise<Game[]> {
    return useGamesStore.getState().games;
  }

  async fetchGame(gameId: string): Promise<Game | undefined> {
    return useGamesStore.getState().games.find((game) => game.id === gameId);
  }

  subscribeToGame(gameId: string, onUpdate: (game: Game) => void): () => void {
    return useGamesStore.subscribe((state) => {
      const game = state.games.find((g) => g.id === gameId);
      if (game) {
        onUpdate(game);
      }
    });
  }
}

export const sportsData: SportsDataProvider = new MockSportsDataProvider();
