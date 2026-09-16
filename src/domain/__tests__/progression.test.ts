import { EVOLUTION_CHOICE_LEVEL, grantCardXp, recordLegResult, stageForLevel, xpToNext } from '../progression';
import { makeCard } from './fixtures';

describe('stageForLevel', () => {
  it('maps levels to stages at 4 / 10 / 18', () => {
    expect(stageForLevel(1)).toBe('rookie');
    expect(stageForLevel(3)).toBe('rookie');
    expect(stageForLevel(4)).toBe('pro');
    expect(stageForLevel(9)).toBe('pro');
    expect(stageForLevel(10)).toBe('elite');
    expect(stageForLevel(17)).toBe('elite');
    expect(stageForLevel(18)).toBe('legend');
  });
});

describe('grantCardXp', () => {
  it('accumulates xp below the threshold without leveling', () => {
    const card = makeCard('c1', 'spark');
    const result = grantCardXp(card, 50, 'today');
    expect(result.card.level).toBe(1);
    expect(result.card.xp).toBe(50);
    expect(result.levelsGained).toBe(0);
  });

  it('levels up and carries surplus xp', () => {
    const card = makeCard('c1', 'spark');
    const needed = xpToNext(1);
    const result = grantCardXp(card, needed + 10, 'today');
    expect(result.card.level).toBe(2);
    expect(result.card.xp).toBe(10);
    expect(result.card.xpToNextLevel).toBe(xpToNext(2));
    expect(result.levelsGained).toBe(1);
  });

  it('can gain multiple levels from one large grant', () => {
    const card = makeCard('c1', 'spark');
    const result = grantCardXp(card, xpToNext(1) + xpToNext(2) + 5, 'today');
    expect(result.card.level).toBe(3);
    expect(result.levelsGained).toBe(2);
  });

  it('unlocks the level-3 signature ability', () => {
    const card = makeCard('c1', 'shield', { level: 2, xpToNextLevel: xpToNext(2) });
    const result = grantCardXp(card, xpToNext(2), 'today');
    expect(result.card.level).toBe(3);
    expect(result.abilitiesUnlocked).toContain('shield_1');
    expect(result.card.unlockedAbilities).toContain('shield_1');
  });

  it('reports a stage change at pro', () => {
    const card = makeCard('c1', 'power', { level: 3, xpToNextLevel: xpToNext(3) });
    const result = grantCardXp(card, xpToNext(3), 'today');
    expect(result.card.stage).toBe('pro');
    expect(result.newStage).toBe('pro');
  });

  it('unlocks the evolution choice at elite', () => {
    const card = makeCard('c1', 'spark', {
      level: EVOLUTION_CHOICE_LEVEL - 1,
      xpToNextLevel: xpToNext(EVOLUTION_CHOICE_LEVEL - 1),
    });
    const result = grantCardXp(card, xpToNext(EVOLUTION_CHOICE_LEVEL - 1), 'today');
    expect(result.evolutionChoiceUnlocked).toBe(true);
    expect(result.card.evolutionChoiceAvailable).toBe(true);
  });

  it('records level-up history', () => {
    const card = makeCard('c1', 'spark');
    const result = grantCardXp(card, xpToNext(1), 'today');
    expect(result.card.history.some((event) => event.type === 'level_up')).toBe(true);
  });
});

describe('recordLegResult', () => {
  it('tracks appearances and success rate', () => {
    let card = makeCard('c1', 'spark');
    card = recordLegResult(card, true, false, 'today');
    card = recordLegResult(card, true, false, 'today');
    card = recordLegResult(card, false, false, 'today');
    expect(card.relayAppearances).toBe(3);
    expect(card.successfulLegs).toBe(2);
    expect(card.successRate).toBeCloseTo(2 / 3);
  });
});
