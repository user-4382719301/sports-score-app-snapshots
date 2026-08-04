/** A local calendar day in YYYY-MM-DD form. */
export type DayKey = string;

/** Where a day's numbers came from. Watch data arrives merged via HealthKit / Health Connect. */
export type ActivitySource = 'healthkit' | 'health-connect' | 'demo';

export interface DailyActivity {
  date: DayKey;
  steps: number;
  distanceMeters: number;
  /** Minutes of brisk activity — Apple "Exercise" analog. */
  activeMinutes: number;
  floorsClimbed: number;
  /** Steps per clock hour (24 entries) — used for the Stand-ring analog ("active hours"). */
  hourlySteps: number[];
  source: ActivitySource;
}

export interface Goals {
  /** Daily step goal — the "Move" ring analog. */
  steps: number;
  /** Daily active-minute goal — the "Exercise" ring analog. */
  activeMinutes: number;
  /** Hours with at least `activeHourStepThreshold` steps — the "Stand" ring analog. */
  activeHours: number;
}

export const DEFAULT_GOALS: Goals = { steps: 10000, activeMinutes: 30, activeHours: 12 };

/** An hour "counts" toward the active-hours ring at this many steps. */
export const ACTIVE_HOUR_STEP_THRESHOLD = 250;

/** Ring fill fractions. May exceed 1 when a goal is beaten. */
export interface RingProgress {
  move: number;
  exercise: number;
  stand: number;
}

export interface Profile {
  id: string;
  displayName: string;
  /** Two-letter monogram shown in the avatar circle. */
  initials: string;
  avatarColor: string;
  goals: Goals;
}

export interface Friend extends Profile {
  today: DailyActivity;
  /** Most recent 7 days, oldest first, including today. */
  week: DailyActivity[];
  streakDays: number;
  lifetimeSteps: number;
}

/** Apple-Fitness-style feed of notable friend moments. */
export interface FeedEvent {
  id: string;
  friendId: string;
  kind: 'closed-rings' | 'goal-met' | 'workout' | 'award' | 'cheer';
  message: string;
  /** Epoch millis. */
  at: number;
}

export interface CompetitionParticipant {
  profileId: string;
  /** Points per elapsed day, oldest first. */
  dailyPoints: number[];
}

/**
 * A 7-day head-to-head, scored like Apple Watch competitions:
 * one point per ring percentage point filled, capped at MAX_DAILY_POINTS per day.
 */
export interface Competition {
  id: string;
  name: string;
  startDate: DayKey;
  endDate: DayKey;
  participants: CompetitionParticipant[];
  status: 'active' | 'finished' | 'invited';
}

export const MAX_DAILY_POINTS = 600;
export const COMPETITION_LENGTH_DAYS = 7;

export interface AwardDefinition {
  id: string;
  name: string;
  description: string;
  /** Emoji used as the medal art. */
  icon: string;
  category: 'streak' | 'milestone' | 'competition' | 'week';
}

export interface EarnedAward extends AwardDefinition {
  earnedOn: DayKey;
}

/** Everything award predicates can look at. */
export interface AwardContext {
  history: DailyActivity[];
  goals: Goals;
  lifetimeSteps: number;
  currentStreak: number;
  longestStreak: number;
  competitionsWon: number;
}
