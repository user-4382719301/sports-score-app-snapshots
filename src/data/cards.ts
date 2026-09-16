import type { CardEvolutionPath, CardHistoryEvent, CardMilestone, PlayerCard } from '@/types';
import { abilitiesForPath } from '@/domain/abilities';
import { stageForLevel, xpToNext, EVOLUTION_CHOICE_LEVEL } from '@/domain/progression';
import { createRng, rangeInt } from './rng';
import { SEASON } from './teams';

interface CardSpec {
  playerId: string;
  path: CardEvolutionPath;
  level: number;
  favorite?: boolean;
}

/** Level spread intentionally covers every stage, rookie through legend. */
const CARD_SPECS: CardSpec[] = [
  { playerId: 'pl_delgado', path: 'spark', level: 7, favorite: true },
  { playerId: 'pl_watanabe', path: 'connector', level: 11 },
  { playerId: 'pl_brooks', path: 'power', level: 5 },
  { playerId: 'pl_fuentes', path: 'closer', level: 9 },
  { playerId: 'pl_whitaker', path: 'shield', level: 4 },
  { playerId: 'pl_ramos', path: 'wildcard', level: 3 },
  { playerId: 'pl_carter', path: 'spark', level: 13, favorite: true },
  { playerId: 'pl_okafor', path: 'power', level: 8 },
  { playerId: 'pl_marin', path: 'connector', level: 6 },
  { playerId: 'pl_lindqvist', path: 'shield', level: 10 },
  { playerId: 'pl_whitfield', path: 'closer', level: 19, favorite: true },
  { playerId: 'pl_bennett', path: 'power', level: 6 },
  { playerId: 'pl_petrovic', path: 'connector', level: 12 },
  { playerId: 'pl_cole', path: 'shield', level: 5 },
  { playerId: 'pl_donovan', path: 'wildcard', level: 2 },
  { playerId: 'pl_lindgren', path: 'spark', level: 8 },
  { playerId: 'pl_salo', path: 'power', level: 7 },
  { playerId: 'pl_brandt', path: 'shield', level: 6 },
  { playerId: 'pl_girard', path: 'closer', level: 10, favorite: true },
  { playerId: 'pl_volkov', path: 'wildcard', level: 4 },
  { playerId: 'pl_vidal', path: 'power', level: 14 },
  { playerId: 'pl_mensah', path: 'connector', level: 9 },
  { playerId: 'pl_tanaka', path: 'spark', level: 5 },
  { playerId: 'pl_obi', path: 'shield', level: 3 },
];

function milestonesFor(spec: CardSpec, successfulLegs: number): CardMilestone[] {
  return [
    {
      id: 'legs_10',
      label: 'Complete 10 relay legs',
      target: 10,
      progress: Math.min(successfulLegs, 10),
      achievedAt: successfulLegs >= 10 ? 'earlier this season' : undefined,
    },
    {
      id: 'legs_25',
      label: 'Complete 25 relay legs',
      target: 25,
      progress: Math.min(successfulLegs, 25),
      achievedAt: successfulLegs >= 25 ? 'earlier this season' : undefined,
    },
    {
      id: 'runs_5',
      label: 'Appear in 5 perfect relays',
      target: 5,
      progress: Math.min(Math.floor(successfulLegs / 6), 5),
    },
  ];
}

function seededHistory(spec: CardSpec): CardHistoryEvent[] {
  const events: CardHistoryEvent[] = [
    {
      id: `hist_${spec.playerId}_level`,
      date: 'this week',
      type: 'level_up',
      label: `Reached level ${spec.level}`,
    },
    {
      id: `hist_${spec.playerId}_leg`,
      date: 'this week',
      type: 'relay_leg',
      label: 'Completed a relay leg',
    },
  ];
  const stage = stageForLevel(spec.level);
  if (stage !== 'rookie') {
    events.push({
      id: `hist_${spec.playerId}_stage`,
      date: 'earlier this season',
      type: 'stage_up',
      label: `Evolved to ${stage} stage`,
    });
  }
  events.push({
    id: `hist_${spec.playerId}_start`,
    date: 'season start',
    type: 'relay_leg',
    label: `Joined the ${SEASON} collection`,
  });
  return events;
}

function buildCard(spec: CardSpec): PlayerCard {
  const rng = createRng(`card:${spec.playerId}`);
  // Usage numbers scale with level so a card's story matches its strength.
  const relayAppearances = spec.level * 2 + rangeInt(rng, 0, 4);
  const successfulLegs = Math.max(
    spec.level,
    Math.round(relayAppearances * (0.55 + rng() * 0.3)),
  );
  const relayFinishes = Math.max(1, Math.round(successfulLegs / 4));
  const unlockedAbilities = abilitiesForPath(spec.path)
    .filter((ability) => ability.unlockLevel <= spec.level)
    .map((ability) => ability.id);

  return {
    id: `card_${spec.playerId.replace('pl_', '')}`,
    playerId: spec.playerId,
    season: SEASON,
    level: spec.level,
    xp: rangeInt(rng, 10, Math.max(20, xpToNext(spec.level) - 30)),
    xpToNextLevel: xpToNext(spec.level),
    stage: stageForLevel(spec.level),
    evolutionPath: spec.path,
    evolutionChoiceAvailable: spec.level >= EVOLUTION_CHOICE_LEVEL && rng() > 0.6,
    relayAppearances,
    successfulLegs: Math.min(successfulLegs, relayAppearances),
    relayFinishes,
    successRate:
      relayAppearances === 0 ? 0 : Math.min(successfulLegs, relayAppearances) / relayAppearances,
    favorite: spec.favorite ?? false,
    unlockedAbilities,
    milestones: milestonesFor(spec, successfulLegs),
    history: seededHistory(spec),
  };
}

export function buildSeedCards(): PlayerCard[] {
  return CARD_SPECS.map(buildCard);
}
