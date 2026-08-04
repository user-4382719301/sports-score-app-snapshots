import {
  COMPETITION_LENGTH_DAYS,
  DEFAULT_GOALS,
  type Competition,
  type FeedEvent,
  type Friend,
} from '../types';
import { addDays, dayRange, todayKey } from '../lib/dates';
import { computeRings, competitionPointsForDay } from '../lib/rings';
import { hashSeed, seededRandom } from '../lib/seededRandom';
import { generateDay } from '../health/demoAdapter';
import type { SocialService } from './SocialService';

const FRIEND_SEEDS: Array<Pick<Friend, 'id' | 'displayName' | 'initials' | 'avatarColor'>> = [
  { id: 'maya', displayName: 'Maya Chen', initials: 'MC', avatarColor: '#FA114F' },
  { id: 'diego', displayName: 'Diego Alvarez', initials: 'DA', avatarColor: '#92E82A' },
  { id: 'priya', displayName: 'Priya Nair', initials: 'PN', avatarColor: '#00D3F9' },
  { id: 'sam', displayName: 'Sam Okafor', initials: 'SO', avatarColor: '#FFD60A' },
  { id: 'lena', displayName: 'Lena Fischer', initials: 'LF', avatarColor: '#BF5AF2' },
];

function buildFriend(seed: (typeof FRIEND_SEEDS)[number]): Friend {
  const today = todayKey();
  const week = dayRange(today, 7).map((key) => generateDay(key, seed.id, key === today));
  const rand = seededRandom(hashSeed(seed.id));
  return {
    ...seed,
    goals: DEFAULT_GOALS,
    today: week[week.length - 1],
    week,
    streakDays: Math.floor(rand() * 21),
    lifetimeSteps: Math.floor(1_500_000 + rand() * 6_000_000),
  };
}

/**
 * On-device demo backend. Data is deterministic per day; cheers and invites
 * mutate in-memory state so the UI behaves like the real thing.
 */
export class DemoSocialService implements SocialService {
  private friends: Friend[] = FRIEND_SEEDS.map(buildFriend);
  private extraFeed: FeedEvent[] = [];
  private extraCompetitions: Competition[] = [];

  async getFriends(): Promise<Friend[]> {
    return this.friends;
  }

  async getFeed(): Promise<FeedEvent[]> {
    const now = Date.now();
    const generated: FeedEvent[] = [];
    for (const friend of this.friends) {
      const rings = computeRings(friend.today, friend.goals);
      if (rings.move >= 1 && rings.exercise >= 1 && rings.stand >= 1) {
        generated.push({
          id: `feed-${friend.id}-rings`,
          friendId: friend.id,
          kind: 'closed-rings',
          message: `${friend.displayName} closed all three rings`,
          at: now - hashSeed(friend.id) % (5 * 3_600_000),
        });
      } else if (rings.move >= 1) {
        generated.push({
          id: `feed-${friend.id}-goal`,
          friendId: friend.id,
          kind: 'goal-met',
          message: `${friend.displayName} hit their step goal`,
          at: now - hashSeed(friend.id) % (8 * 3_600_000),
        });
      }
    }
    return [...this.extraFeed, ...generated].sort((a, b) => b.at - a.at);
  }

  async getCompetitions(): Promise<Competition[]> {
    const today = todayKey();
    const start = addDays(today, -3); // an active competition, 4 days in
    const maya = this.friends[0];
    const elapsedDays = dayRange(today, 4);

    const active: Competition = {
      id: 'comp-maya',
      name: `You vs. ${maya.displayName}`,
      startDate: start,
      endDate: addDays(start, COMPETITION_LENGTH_DAYS - 1),
      status: 'active',
      participants: [
        {
          profileId: 'me',
          dailyPoints: elapsedDays.map((key) =>
            competitionPointsForDay(computeRings(generateDay(key, 'me', key === today), DEFAULT_GOALS))
          ),
        },
        {
          profileId: maya.id,
          dailyPoints: elapsedDays.map((key) =>
            competitionPointsForDay(
              computeRings(generateDay(key, maya.id, key === today), maya.goals)
            )
          ),
        },
      ],
    };
    return [active, ...this.extraCompetitions];
  }

  async sendCheer(friendId: string, message: string): Promise<FeedEvent> {
    const event: FeedEvent = {
      id: `cheer-${friendId}-${Date.now()}`,
      friendId,
      kind: 'cheer',
      message,
      at: Date.now(),
    };
    this.extraFeed.unshift(event);
    return event;
  }

  async inviteToCompetition(friendId: string): Promise<Competition> {
    const friend = this.friends.find((f) => f.id === friendId);
    const start = addDays(todayKey(), 1);
    const competition: Competition = {
      id: `comp-${friendId}-${Date.now()}`,
      name: `You vs. ${friend?.displayName ?? 'Friend'}`,
      startDate: start,
      endDate: addDays(start, COMPETITION_LENGTH_DAYS - 1),
      status: 'invited',
      participants: [
        { profileId: 'me', dailyPoints: [] },
        { profileId: friendId, dailyPoints: [] },
      ],
    };
    this.extraCompetitions.unshift(competition);
    return competition;
  }

  async publishMyDay(): Promise<void> {
    // No-op in demo mode; a real backend would upsert today's totals here.
  }
}
