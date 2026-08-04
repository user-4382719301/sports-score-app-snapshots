import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  signInAnonymously,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FIREBASE_CONFIG } from '../config';
import {
  COMPETITION_LENGTH_DAYS,
  DEFAULT_GOALS,
  type Competition,
  type DailyActivity,
  type FeedEvent,
  type Friend,
  type Goals,
  type MyProfile,
} from '../types';
import { addDays, dayRange, todayKey } from '../lib/dates';
import { emptyDay } from '../health/HealthAdapter';
import { hashSeed, seededRandom } from '../lib/seededRandom';
import type { SocialService } from './SocialService';

const AVATAR_COLORS = ['#FA114F', '#92E82A', '#00D3F9', '#FFD60A', '#BF5AF2', '#FF9F0A'];
/** No 0/O/1/I — friend codes get read aloud. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PUBLISH_THROTTLE_MS = 5 * 60_000;
const FEED_LIMIT = 50;

export function generateFriendCode(rand: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return code;
}

function defaultProfile(uid: string): Omit<MyProfile, 'id'> {
  const rand = seededRandom(hashSeed(uid));
  const number = 100 + Math.floor(rand() * 900);
  return {
    displayName: `Walker ${number}`,
    initials: `W${String(number)[0]}`,
    avatarColor: AVATAR_COLORS[Math.floor(rand() * AVATAR_COLORS.length)],
    goals: DEFAULT_GOALS,
    friendCode: generateFriendCode(rand),
  };
}

interface UserDoc {
  displayName: string;
  initials: string;
  avatarColor: string;
  goals: Goals;
  friendCode: string;
  friendIds: string[];
  lifetimeSteps: number;
  streakDays: number;
}

function toDay(date: string, data: Record<string, unknown> | undefined): DailyActivity {
  const day = emptyDay(date, 'health-connect');
  if (!data) return day;
  return {
    ...day,
    steps: (data.steps as number) ?? 0,
    distanceMeters: (data.distanceMeters as number) ?? 0,
    activeMinutes: (data.activeMinutes as number) ?? 0,
    floorsClimbed: (data.floorsClimbed as number) ?? 0,
    hourlySteps: (data.hourlySteps as number[]) ?? day.hourlySteps,
  };
}

/**
 * Firestore-backed SocialService. Schema, security rules and the Cloud
 * Functions this pairs with live in ../../firebase — competition points and
 * friend links are written server-side only (see docs/BACKEND.md).
 *
 * Auth is anonymous by default so the app works without a sign-in screen;
 * link Apple/Google credentials later to make accounts portable.
 */
export class FirebaseSocialService implements SocialService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private user: User | null = null;
  private profile: MyProfile | null = null;
  private lastPublishAt = 0;

  constructor() {
    this.app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
    this.auth = this.initAuth();
    this.db = getFirestore(this.app);
  }

  /** Persist the anonymous user across launches when AsyncStorage is present. */
  private initAuth(): Auth {
    try {
      const { getReactNativePersistence } = require('firebase/auth');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return initializeAuth(this.app, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch {
      return getAuth(this.app);
    }
  }

  private async ensureSignedIn(): Promise<User> {
    if (this.user) return this.user;
    const cred = this.auth.currentUser ?? (await signInAnonymously(this.auth)).user;
    this.user = cred;
    return cred;
  }

  async getMe(): Promise<MyProfile> {
    if (this.profile) return this.profile;
    const user = await this.ensureSignedIn();
    const ref = doc(this.db, 'users', user.uid);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      const fresh = defaultProfile(user.uid);
      const userDoc: UserDoc = { ...fresh, friendIds: [], lifetimeSteps: 0, streakDays: 0 };
      await setDoc(ref, { ...userDoc, createdAt: serverTimestamp() });
      await setDoc(doc(this.db, 'friendCodes', fresh.friendCode), { uid: user.uid });
      this.profile = { id: user.uid, ...fresh };
      return this.profile;
    }

    const data = snapshot.data() as UserDoc;
    this.profile = {
      id: user.uid,
      displayName: data.displayName,
      initials: data.initials,
      avatarColor: data.avatarColor,
      goals: data.goals ?? DEFAULT_GOALS,
      friendCode: data.friendCode,
    };
    return this.profile;
  }

  async getFriends(): Promise<Friend[]> {
    const user = await this.ensureSignedIn();
    const meSnapshot = await getDoc(doc(this.db, 'users', user.uid));
    const friendIds: string[] = (meSnapshot.data() as UserDoc | undefined)?.friendIds ?? [];
    const friends = await Promise.all(friendIds.map((id) => this.loadFriend(id)));
    return friends.filter((f): f is Friend => f !== null);
  }

  private async loadFriend(friendId: string): Promise<Friend | null> {
    const snapshot = await getDoc(doc(this.db, 'users', friendId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as UserDoc;

    const keys = dayRange(todayKey(), 7);
    const week = await Promise.all(
      keys.map(async (key) => {
        const dayDoc = await getDoc(doc(this.db, 'users', friendId, 'days', key));
        return toDay(key, dayDoc.data());
      })
    );

    return {
      id: friendId,
      displayName: data.displayName,
      initials: data.initials,
      avatarColor: data.avatarColor,
      goals: data.goals ?? DEFAULT_GOALS,
      today: week[week.length - 1],
      week,
      streakDays: data.streakDays ?? 0,
      lifetimeSteps: data.lifetimeSteps ?? 0,
    };
  }

  async getFeed(): Promise<FeedEvent[]> {
    const user = await this.ensureSignedIn();
    const snapshot = await getDocs(
      query(
        collection(this.db, 'feed'),
        where('audience', 'array-contains', user.uid),
        orderBy('at', 'desc'),
        limit(FEED_LIMIT)
      )
    );
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        friendId: data.friendId,
        kind: data.kind,
        message: data.message,
        at: data.at,
      } as FeedEvent;
    });
  }

  async getCompetitions(): Promise<Competition[]> {
    const user = await this.ensureSignedIn();
    const snapshot = await getDocs(
      query(
        collection(this.db, 'competitions'),
        where('participantIds', 'array-contains', user.uid),
        orderBy('startDate', 'desc'),
        limit(20)
      )
    );
    return snapshot.docs.map((d) => {
      const data = d.data();
      const points: Record<string, number[]> = data.points ?? {};
      return {
        id: d.id,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        participants: (data.participantIds as string[]).map((profileId) => ({
          profileId,
          dailyPoints: points[profileId] ?? [],
        })),
      } as Competition;
    });
  }

  /** Friend links are mutual, so they're written by the addFriend Cloud Function, not the client. */
  async addFriend(code: string): Promise<Friend | null> {
    await this.ensureSignedIn();
    const callable = httpsCallable<{ code: string }, { friendId: string | null }>(
      getFunctions(this.app),
      'addFriend'
    );
    const result = await callable({ code: code.trim().toUpperCase() });
    if (!result.data.friendId) return null;
    return this.loadFriend(result.data.friendId);
  }

  async sendCheer(friendId: string, message: string): Promise<FeedEvent> {
    const user = await this.ensureSignedIn();
    const event = {
      friendId: user.uid, // the actor
      kind: 'cheer' as const,
      message,
      at: Date.now(),
      audience: [friendId],
    };
    const ref = await addDoc(collection(this.db, 'feed'), event);
    return { id: ref.id, ...event };
  }

  async inviteToCompetition(friendId: string): Promise<Competition> {
    const user = await this.ensureSignedIn();
    const me = await this.getMe();
    const friendSnapshot = await getDoc(doc(this.db, 'users', friendId));
    const friendName = (friendSnapshot.data() as UserDoc | undefined)?.displayName ?? 'Friend';
    const start = addDays(todayKey(), 1);

    const competition = {
      name: `${me.displayName} vs. ${friendName}`,
      startDate: start,
      endDate: addDays(start, COMPETITION_LENGTH_DAYS - 1),
      status: 'invited' as const,
      participantIds: [user.uid, friendId],
      points: {},
      createdAt: Date.now(),
    };
    const ref = await addDoc(collection(this.db, 'competitions'), competition);
    return {
      id: ref.id,
      name: competition.name,
      startDate: competition.startDate,
      endDate: competition.endDate,
      status: competition.status,
      participants: competition.participantIds.map((profileId) => ({
        profileId,
        dailyPoints: [],
      })),
    };
  }

  async publishMyDay(day: DailyActivity): Promise<void> {
    const now = Date.now();
    if (now - this.lastPublishAt < PUBLISH_THROTTLE_MS) return;
    this.lastPublishAt = now;

    const user = await this.ensureSignedIn();
    await setDoc(
      doc(this.db, 'users', user.uid, 'days', day.date),
      {
        steps: day.steps,
        distanceMeters: day.distanceMeters,
        activeMinutes: day.activeMinutes,
        floorsClimbed: day.floorsClimbed,
        hourlySteps: day.hourlySteps,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
