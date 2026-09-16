import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Game, GamePlay, Player, StatKey } from '@/types';
import { getInitialSeed, zustandStorage } from './storage';

interface GamesState {
  seedDateKey: string;
  games: Game[];
  /** Tracked players plus generated box-score fillers. */
  players: Player[];
  hasHydrated: boolean;
  setHydrated: () => void;
  toggleGameFavorite: (gameId: string) => void;
  /** Apply a stat delta to one player's line inside a game's box score. */
  applyStatDelta: (gameId: string, playerId: string, statKey: StatKey, delta: number) => void;
  addPlay: (gameId: string, play: GamePlay) => void;
  bumpScore: (gameId: string, teamId: string, points: number) => void;
  reset: (input: { seedDateKey: string; games: Game[]; players: Player[] }) => void;
}

const seed = getInitialSeed();

export const useGamesStore = create<GamesState>()(
  persist(
    (set) => ({
      seedDateKey: seed.seedDateKey,
      games: seed.games,
      players: seed.players,
      hasHydrated: false,
      setHydrated: () => set({ hasHydrated: true }),

      toggleGameFavorite: (gameId) =>
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId ? { ...game, favorite: !game.favorite } : game,
          ),
        })),

      applyStatDelta: (gameId, playerId, statKey, delta) =>
        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }
            const hasLine = game.playerStats.some((line) => line.playerId === playerId);
            const playerStats = hasLine
              ? game.playerStats.map((line) =>
                  line.playerId === playerId
                    ? {
                        ...line,
                        stats: {
                          ...line.stats,
                          [statKey]: Math.max(0, (line.stats[statKey] ?? 0) + delta),
                        },
                      }
                    : line,
                )
              : [...game.playerStats, { playerId, gameId, stats: { [statKey]: Math.max(0, delta) } }];
            return { ...game, playerStats };
          }),
        })),

      addPlay: (gameId, play) =>
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId ? { ...game, plays: [play, ...game.plays].slice(0, 20) } : game,
          ),
        })),

      bumpScore: (gameId, teamId, points) =>
        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }
            if (game.home.teamId === teamId) {
              return { ...game, home: { ...game.home, score: game.home.score + points } };
            }
            if (game.away.teamId === teamId) {
              return { ...game, away: { ...game.away, score: game.away.score + points } };
            }
            return game;
          }),
        })),

      reset: ({ seedDateKey, games, players }) => set({ seedDateKey, games, players }),
    }),
    {
      name: 'relay/games',
      storage: zustandStorage,
      partialize: (state) => ({
        seedDateKey: state.seedDateKey,
        games: state.games,
        players: state.players,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export function selectGameById(state: GamesState, gameId: string): Game | undefined {
  return state.games.find((game) => game.id === gameId);
}

export function selectPlayerById(state: GamesState, playerId: string): Player | undefined {
  return state.players.find((player) => player.id === playerId);
}
