import type { Relay } from '@/types';
import {
  BASE_COINS,
  computePathBonuses,
  computeRelayReward,
  computeRewardMultiplier,
  computeRiskTier,
} from '../rewards';
import { makeCard, makeObjective } from './fixtures';

function makeRelay(overrides: Partial<Relay> = {}): Relay {
  const legs = Array.from({ length: 5 }, (_, slot) => ({
    slot,
    cardId: `c${slot}`,
    playerId: `pl_c${slot}`,
    gameId: `gm_${slot}`,
    objective: makeObjective(2),
    status: 'completed' as const,
    progress: 2,
    savedByShield: false,
  }));
  return {
    id: 'relay_r',
    dateKey: '2026-07-23',
    status: 'completed',
    legs,
    lockAt: '2026-07-23T18:00:00Z',
    riskTier: 'medium',
    rewardMultiplier: 1,
    chemistry: [],
    shieldAvailable: false,
    shieldUsed: false,
    ...overrides,
  };
}

describe('computePathBonuses', () => {
  it('pays spark early, closer late, power and wildcard anywhere', () => {
    const cardsById = {
      c0: makeCard('c0', 'spark'),
      c1: makeCard('c1', 'wildcard'),
      c2: makeCard('c2', 'shield'),
      c3: makeCard('c3', 'power'),
      c4: makeCard('c4', 'closer'),
    };
    const legs = Array.from({ length: 5 }, (_, slot) => ({ cardId: `c${slot}`, slot }));
    const bonuses = computePathBonuses(legs, cardsById);
    const total = bonuses.reduce((sum, bonus) => sum + bonus.bonus, 0);
    // spark slot 1 (0.1) + wildcard (0.4) + power (0.25) + closer slot 5 (0.1)
    expect(total).toBeCloseTo(0.85);
  });
});

describe('computeRewardMultiplier', () => {
  it('adds path and chemistry bonuses onto 1', () => {
    const multiplier = computeRewardMultiplier(
      [{ id: 'p', label: 'p', bonus: 0.25 }],
      [{ id: 'c', label: 'c', bonus: 0.05 }],
    );
    expect(multiplier).toBe(1.3);
  });
});

describe('computeRiskTier', () => {
  it('classifies by average difficulty', () => {
    expect(computeRiskTier([1, 1, 1, 1, 2])).toBe('low');
    expect(computeRiskTier([2, 2, 2, 2, 2])).toBe('medium');
    expect(computeRiskTier([3, 3, 3, 2, 2])).toBe('high');
    expect(computeRiskTier([])).toBe('low');
  });
});

describe('computeRelayReward', () => {
  it('pays base coins times multiplier with completion and perfect bonuses', () => {
    const relay = makeRelay({ rewardMultiplier: 1 });
    const reward = computeRelayReward(relay);
    // 5 legs at difficulty 2 = 350 base, ×1.5 completion, ×1.25 perfect.
    expect(reward.coins).toBe(Math.round(5 * BASE_COINS[2] * 1.5 * 1.25));
    expect(reward.ratingDelta).toBe(5 * 8 + 25);
  });

  it('drops the perfect bonus when the shield was used', () => {
    const clean = computeRelayReward(makeRelay());
    const shielded = computeRelayReward(makeRelay({ shieldUsed: true }));
    expect(shielded.coins).toBeLessThan(clean.coins);
  });

  it('pays partial coins on a failed relay', () => {
    const relay = makeRelay({
      status: 'failed',
      legs: makeRelay().legs.map((leg) =>
        leg.slot >= 2
          ? { ...leg, status: leg.slot === 2 ? ('failed' as const) : ('locked' as const), progress: 0 }
          : leg,
      ),
    });
    const reward = computeRelayReward(relay);
    expect(reward.coins).toBe(2 * BASE_COINS[2]);
    expect(reward.ratingDelta).toBe(2 * 8 - 15);
  });
});
