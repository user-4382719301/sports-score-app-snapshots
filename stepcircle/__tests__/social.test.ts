import { DemoSocialService } from '../src/social/demoSocialService';
import { competitionPointsForDay, computeRings, ringsClosed } from '../src/lib/rings';
import { seededRandom } from '../src/lib/seededRandom';
import { DEFAULT_GOALS, MAX_DAILY_POINTS, type DailyActivity } from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const scoring = require('../firebase/functions/scoring');

describe('DemoSocialService', () => {
  it('exposes my profile with a friend code', async () => {
    const me = await new DemoSocialService().getMe();
    expect(me.id).toBe('me');
    expect(me.friendCode).toBe('DEMO42');
  });

  it('adds a friend by code and rejects empty codes', async () => {
    const social = new DemoSocialService();
    const before = (await social.getFriends()).length;
    const added = await social.addFriend('abc123');
    expect(added?.week).toHaveLength(7);
    expect((await social.getFriends()).length).toBe(before + 1);
    expect(await social.addFriend('   ')).toBeNull();
  });

  it('records cheers into the feed', async () => {
    const social = new DemoSocialService();
    await social.sendCheer('maya', 'You cheered Maya on');
    const feed = await social.getFeed();
    expect(feed.some((e) => e.kind === 'cheer')).toBe(true);
  });
});

describe('server scoring parity', () => {
  it('firebase/functions/scoring.js agrees with src/lib/rings.ts', () => {
    const rand = seededRandom(42);
    for (let i = 0; i < 250; i++) {
      const hourlySteps = Array.from({ length: 24 }, () => Math.floor(rand() * 1200));
      const day: DailyActivity = {
        date: '2026-08-04',
        steps: hourlySteps.reduce((a, b) => a + b, 0),
        distanceMeters: 0,
        activeMinutes: Math.floor(rand() * 90),
        floorsClimbed: 0,
        hourlySteps,
        source: 'demo',
      };
      const client = computeRings(day, DEFAULT_GOALS);
      const server = scoring.computeRings(day, DEFAULT_GOALS);
      expect(server).toEqual(client);
      expect(scoring.competitionPointsForDay(server)).toBe(competitionPointsForDay(client));
      expect(scoring.ringsClosed(server)).toBe(ringsClosed(client));
    }
    expect(scoring.MAX_DAILY_POINTS).toBe(MAX_DAILY_POINTS);
  });
});
