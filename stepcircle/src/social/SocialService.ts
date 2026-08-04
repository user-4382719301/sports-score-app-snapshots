import type { Competition, DailyActivity, FeedEvent, Friend, MyProfile } from '../types';

/**
 * Backend surface for everything social. Implemented by the on-device demo
 * backend (demoSocialService.ts) and the Firebase backend
 * (firebaseSocialService.ts); the store picks one via src/social/index.ts.
 */
export interface SocialService {
  /** My profile (creating it on first launch), including my shareable friend code. */
  getMe(): Promise<MyProfile>;
  getFriends(): Promise<Friend[]>;
  getFeed(): Promise<FeedEvent[]>;
  getCompetitions(): Promise<Competition[]>;
  /** Add a friend by their shared code. Resolves null if the code is unknown. */
  addFriend(code: string): Promise<Friend | null>;
  /** Send an encouragement ("cheer") to a friend. Returns the feed event created. */
  sendCheer(friendId: string, message: string): Promise<FeedEvent>;
  /** Challenge a friend to a 7-day competition starting tomorrow. */
  inviteToCompetition(friendId: string): Promise<Competition>;
  /** Publish my current day so friends see live numbers and the server can score competitions. */
  publishMyDay(day: DailyActivity): Promise<void>;
}
