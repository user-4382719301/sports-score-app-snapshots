import type { PlayerCard, Relay } from '@/types';
import {
  activateRelay,
  applyStatToActiveLeg,
  assembleRelay,
  completeActiveLeg,
  completedLegCount,
  failActiveLeg,
  activeLeg,
} from '../relayEngine';
import { makeCard, makeDraft, makeGame, makePlayer } from './fixtures';

function buildWorld(paths: Parameters<typeof makeCard>[1][]) {
  const cards = paths.map((path, index) => makeCard(`c${index}`, path));
  const players = cards.map((card) => makePlayer(card.playerId));
  const drafts = cards.map((card) => makeDraft(card));
  const games = drafts.map((draft) => makeGame(draft.gameId, { status: 'live' }));

  const cardsById = Object.fromEntries(cards.map((card) => [card.id, card]));
  const playersById = Object.fromEntries(players.map((player) => [player.id, player]));
  const gamesById = Object.fromEntries(games.map((game) => [game.id, game]));

  const relay = assembleRelay({
    id: 'relay_test',
    dateKey: '2026-07-23',
    drafts,
    cardsById,
    playersById,
    gamesById,
  });
  return { relay, cardsById };
}

function goLive(relay: Relay): Relay {
  return activateRelay(relay);
}

describe('assembleRelay', () => {
  it('creates five waiting legs and detects a shield', () => {
    const { relay } = buildWorld(['spark', 'connector', 'shield', 'power', 'closer']);
    expect(relay.legs).toHaveLength(5);
    expect(relay.legs.every((leg) => leg.status === 'waiting')).toBe(true);
    expect(relay.shieldAvailable).toBe(true);
    expect(relay.status).toBe('locked');
  });

  it('rejects a lineup that is not exactly five legs', () => {
    expect(() => buildWorld(['spark', 'closer'])).toThrow();
  });
});

describe('activateRelay', () => {
  it('puts the baton on leg 1 only', () => {
    const { relay } = buildWorld(['spark', 'connector', 'shield', 'power', 'closer']);
    const live = goLive(relay);
    expect(live.status).toBe('live');
    expect(live.legs[0]?.status).toBe('active');
    expect(live.legs.slice(1).every((leg) => leg.status === 'waiting')).toBe(true);
  });
});

describe('applyStatToActiveLeg', () => {
  it('accumulates progress without completing early', () => {
    const { relay, cardsById } = buildWorld(['spark', 'connector', 'shield', 'power', 'closer']);
    const live = goLive(relay);
    const { relay: after, events } = applyStatToActiveLeg(live, 1, cardsById);
    expect(after.legs[0]?.progress).toBe(1);
    expect(after.legs[0]?.status).toBe('active');
    expect(events).toHaveLength(0);
  });

  it('completes the leg and passes the baton at the target', () => {
    const { relay, cardsById } = buildWorld(['spark', 'spark', 'shield', 'power', 'closer']);
    const live = goLive(relay);
    const { relay: after, events } = applyStatToActiveLeg(live, 2, cardsById);
    expect(after.legs[0]?.status).toBe('completed');
    expect(after.legs[1]?.status).toBe('active');
    expect(events.map((event) => event.type)).toEqual(['leg_completed', 'baton_passed']);
  });
});

describe('completeActiveLeg', () => {
  it('completes all five legs into a completed relay', () => {
    const { relay, cardsById } = buildWorld(['spark', 'spark', 'power', 'power', 'closer']);
    let current = goLive(relay);
    for (let i = 0; i < 5; i += 1) {
      current = completeActiveLeg(current, cardsById, false).relay;
    }
    expect(current.status).toBe('completed');
    expect(completedLegCount(current)).toBe(5);
    expect(activeLeg(current)).toBeUndefined();
  });

  it('emits relay_completed on the anchor leg', () => {
    const { relay, cardsById } = buildWorld(['spark', 'spark', 'power', 'power', 'closer']);
    let current = goLive(relay);
    for (let i = 0; i < 4; i += 1) {
      current = completeActiveLeg(current, cardsById, false).relay;
    }
    const { events } = completeActiveLeg(current, cardsById, false);
    expect(events.map((event) => event.type)).toContain('relay_completed');
  });

  it('a completing Connector eases the next objective by one', () => {
    const { relay, cardsById } = buildWorld(['connector', 'spark', 'power', 'power', 'closer']);
    const live = goLive(relay);
    const before = live.legs[1]?.objective.target ?? 0;
    const { relay: after, events } = completeActiveLeg(live, cardsById, false);
    expect(after.legs[1]?.objective.target).toBe(before - 1);
    expect(events.map((event) => event.type)).toContain('connector_boost');
  });

  it('never eases an objective below one', () => {
    const { relay, cardsById } = buildWorld(['connector', 'spark', 'power', 'power', 'closer']);
    const eased: Relay = {
      ...relay,
      legs: relay.legs.map((leg) =>
        leg.slot === 1 ? { ...leg, objective: { ...leg.objective, target: 1 } } : leg,
      ),
    };
    const live = goLive(eased);
    const { relay: after } = completeActiveLeg(live, cardsById, false);
    expect(after.legs[1]?.objective.target).toBe(1);
  });
});

describe('failActiveLeg', () => {
  it('uses the shield once to revive a failed leg', () => {
    const { relay, cardsById } = buildWorld(['spark', 'shield', 'power', 'power', 'closer']);
    const live = goLive(relay);
    const { relay: after, events } = failActiveLeg(live, cardsById);
    expect(after.shieldUsed).toBe(true);
    expect(after.legs[0]?.status).toBe('completed');
    expect(after.legs[0]?.savedByShield).toBe(true);
    expect(after.legs[1]?.status).toBe('active');
    expect(events.map((event) => event.type)).toContain('shield_used');
  });

  it('ends the relay and locks later legs without a shield', () => {
    const { relay, cardsById } = buildWorld(['spark', 'spark', 'power', 'power', 'closer']);
    const live = goLive(relay);
    const { relay: after, events } = failActiveLeg(live, cardsById);
    expect(after.status).toBe('failed');
    expect(after.legs[0]?.status).toBe('failed');
    expect(after.legs.slice(1).every((leg) => leg.status === 'locked')).toBe(true);
    expect(events.map((event) => event.type)).toEqual(['leg_failed', 'relay_failed']);
  });

  it('a second failure after a shield save ends the relay', () => {
    const { relay, cardsById } = buildWorld(['spark', 'shield', 'power', 'power', 'closer']);
    const live = goLive(relay);
    const saved = failActiveLeg(live, cardsById).relay;
    const { relay: after } = failActiveLeg(saved, cardsById);
    expect(after.status).toBe('failed');
    expect(after.legs[1]?.status).toBe('failed');
  });

  it('ignores operations when the relay is not live', () => {
    const { relay, cardsById } = buildWorld(['spark', 'spark', 'power', 'power', 'closer']);
    const { relay: after, events } = failActiveLeg(relay, cardsById);
    expect(after).toBe(relay);
    expect(events).toHaveLength(0);
  });
});

describe('reward multiplier integration', () => {
  it('pays spark and closer only in their preferred slots', () => {
    const cards: PlayerCard[] = [
      makeCard('c0', 'closer'),
      makeCard('c1', 'connector'),
      makeCard('c2', 'connector'),
      makeCard('c3', 'connector'),
      makeCard('c4', 'spark'),
    ];
    const players = cards.map((card) => makePlayer(card.playerId));
    const drafts = cards.map((card) => makeDraft(card));
    const relay = assembleRelay({
      id: 'relay_slots',
      dateKey: '2026-07-23',
      drafts,
      cardsById: Object.fromEntries(cards.map((card) => [card.id, card])),
      playersById: Object.fromEntries(players.map((player) => [player.id, player])),
      gamesById: {},
    });
    // Closer in slot 1 and Spark in slot 5 are both out of position and the
    // Connectors add nothing, so the only bonus left is the same-sport
    // rhythm chemistry (+5%) from five NBA fixtures.
    expect(relay.rewardMultiplier).toBe(1.05);
  });
});
