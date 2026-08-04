import { create } from 'zustand';
import {
  DEFAULT_GOALS,
  type ActivitySource,
  type Competition,
  type DailyActivity,
  type EarnedAward,
  type FeedEvent,
  type Friend,
  type Goals,
} from '../types';
import { createHealthAdapter, type HealthAdapter } from '../health';
import { DemoSocialService } from '../social/demoSocialService';
import type { SocialService } from '../social/SocialService';
import { computeEarnedAwards } from '../lib/awards';
import { currentStreak, longestStreak } from '../lib/streaks';
import { computeRings, ringsClosed, totalPoints } from '../lib/rings';
import { todayKey } from '../lib/dates';

const HISTORY_DAYS = 30;

const health: HealthAdapter = createHealthAdapter();
const social: SocialService = new DemoSocialService();

interface AppState {
  ready: boolean;
  permissionsGranted: boolean;
  healthSource: ActivitySource;
  useMetric: boolean;
  goals: Goals;
  today: DailyActivity | null;
  /** Last 30 days, oldest first, last entry = today. */
  history: DailyActivity[];
  streak: number;
  friends: Friend[];
  feed: FeedEvent[];
  competitions: Competition[];
  awards: EarnedAward[];

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  setGoals: (goals: Goals) => void;
  setUseMetric: (useMetric: boolean) => void;
  sendCheer: (friendId: string, message: string) => Promise<void>;
  inviteToCompetition: (friendId: string) => Promise<void>;
}

function competitionsWonBy(profileId: string, competitions: Competition[]): number {
  return competitions.filter((c) => {
    if (c.status !== 'finished') return false;
    const scores = c.participants.map((p) => ({
      id: p.profileId,
      total: totalPoints(p.dailyPoints),
    }));
    const best = Math.max(...scores.map((s) => s.total));
    return scores.some((s) => s.id === profileId && s.total === best);
  }).length;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  permissionsGranted: false,
  healthSource: health.source,
  useMetric: true,
  goals: DEFAULT_GOALS,
  today: null,
  history: [],
  streak: 0,
  friends: [],
  feed: [],
  competitions: [],
  awards: [],

  init: async () => {
    const available = await health.isAvailable();
    const permissionsGranted = available ? await health.requestPermissions() : false;
    set({ permissionsGranted });
    await get().refresh();
    set({ ready: true });
  },

  refresh: async () => {
    const { goals } = get();
    const [history, friends, feed, competitions] = await Promise.all([
      health.getHistory(HISTORY_DAYS),
      social.getFriends(),
      social.getFeed(),
      social.getCompetitions(),
    ]);
    const today = history[history.length - 1] ?? null;
    const lifetimeSteps = history.reduce((sum, d) => sum + d.steps, 0);
    const awards = computeEarnedAwards(
      {
        history,
        goals,
        lifetimeSteps,
        currentStreak: currentStreak(history, goals),
        longestStreak: longestStreak(history, goals),
        competitionsWon: competitionsWonBy('me', competitions),
      },
      todayKey()
    );
    set({
      today,
      history,
      streak: currentStreak(history, goals),
      friends,
      feed,
      competitions,
      awards,
    });
    if (today) {
      const rings = computeRings(today, goals);
      const closed = [rings.move, rings.exercise, rings.stand].filter((r) => r >= 1).length;
      await social.publishMyDay(today.steps, ringsClosed(rings) ? 3 : closed);
    }
  },

  setGoals: (goals) => {
    set({ goals });
    void get().refresh();
  },

  setUseMetric: (useMetric) => set({ useMetric }),

  sendCheer: async (friendId, message) => {
    await social.sendCheer(friendId, message);
    set({ feed: await social.getFeed() });
  },

  inviteToCompetition: async (friendId) => {
    await social.inviteToCompetition(friendId);
    set({ competitions: await social.getCompetitions() });
  },
}));
