import type { Competition, FeedEvent, Friend } from '../types';

/**
 * Backend surface for everything social. The demo implementation runs fully
 * on-device; swap in a server-backed implementation (see docs/BACKEND.md for a
 * Firestore schema) without touching any UI code.
 */
export interface SocialService {
  getFriends(): Promise<Friend[]>;
  getFeed(): Promise<FeedEvent[]>;
  getCompetitions(): Promise<Competition[]>;
  /** Send an encouragement ("cheer") to a friend. Returns the feed event created. */
  sendCheer(friendId: string, message: string): Promise<FeedEvent>;
  /** Challenge a friend to a 7-day competition starting tomorrow. */
  inviteToCompetition(friendId: string): Promise<Competition>;
  /** Publish my current day so friends see live numbers. */
  publishMyDay(steps: number, ringsClosedCount: number): Promise<void>;
}
