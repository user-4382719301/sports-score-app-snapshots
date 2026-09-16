import { canAddCard, isCardEligible, validateDraft } from '../validation';
import { makeCard, makeGame } from './fixtures';

const NOW = new Date('2026-07-23T18:00:00Z');

describe('canAddCard', () => {
  const card = makeCard('c1', 'spark');
  const upcoming = makeGame('gm1', {
    startTime: new Date(NOW.getTime() + 30 * 60 * 1000).toISOString(),
  });

  it('accepts an eligible player', () => {
    expect(canAddCard([], card, upcoming, NOW).ok).toBe(true);
  });

  it('rejects the same player twice', () => {
    const check = canAddCard([card.id], card, upcoming, NOW);
    expect(check.ok).toBe(false);
    expect(check.code).toBe('duplicate_player');
    expect(check.message).toBeTruthy();
  });

  it('rejects a sixth player', () => {
    const check = canAddCard(['a', 'b', 'c', 'd', 'e'], card, upcoming, NOW);
    expect(check.ok).toBe(false);
    expect(check.code).toBe('relay_full');
  });

  it('rejects a player whose game is live', () => {
    const liveGame = makeGame('gm2', { status: 'live' });
    const check = canAddCard([], card, liveGame, NOW);
    expect(check.ok).toBe(false);
    expect(check.code).toBe('game_started');
  });

  it('rejects a player whose game already started by the clock', () => {
    const started = makeGame('gm3', {
      startTime: new Date(NOW.getTime() - 5 * 60 * 1000).toISOString(),
    });
    const check = canAddCard([], card, started, NOW);
    expect(check.ok).toBe(false);
    expect(check.code).toBe('game_started');
  });

  it('rejects a player whose game is final', () => {
    const finalGame = makeGame('gm4', { status: 'final' });
    const check = canAddCard([], card, finalGame, NOW);
    expect(check.ok).toBe(false);
    expect(check.code).toBe('game_finished');
  });

  it('rejects a player with no game today', () => {
    const check = canAddCard([], card, undefined, NOW);
    expect(check.ok).toBe(false);
    expect(check.code).toBe('no_game_today');
  });
});

describe('isCardEligible', () => {
  it('is true only for unstarted scheduled games', () => {
    expect(isCardEligible(makeGame('g', { startTime: new Date(NOW.getTime() + 1000).toISOString() }), NOW)).toBe(true);
    expect(isCardEligible(makeGame('g', { status: 'live' }), NOW)).toBe(false);
    expect(isCardEligible(makeGame('g', { status: 'final' }), NOW)).toBe(false);
    expect(isCardEligible(undefined, NOW)).toBe(false);
  });
});

describe('validateDraft', () => {
  it('requires five legs', () => {
    const result = validateDraft(['a', 'b'], {}, NOW);
    expect(result.complete).toBe(false);
    expect(result.messages[0]).toContain('Add 3 more');
  });

  it('is complete with five eligible legs', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const games = Object.fromEntries(
      ids.map((id) => [
        id,
        makeGame(`gm_${id}`, {
          startTime: new Date(NOW.getTime() + 60 * 60 * 1000).toISOString(),
        }),
      ]),
    );
    const result = validateDraft(ids, games, NOW);
    expect(result.complete).toBe(true);
    expect(result.messages).toHaveLength(0);
  });

  it('flags a drafted player whose game went live', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const games = Object.fromEntries(
      ids.map((id, index) => [
        id,
        makeGame(`gm_${id}`, {
          status: index === 2 ? ('live' as const) : ('scheduled' as const),
          startTime: new Date(NOW.getTime() + 60 * 60 * 1000).toISOString(),
        }),
      ]),
    );
    const result = validateDraft(ids, games, NOW);
    expect(result.complete).toBe(false);
    expect(result.messages[0]).toContain('game has started');
  });
});
