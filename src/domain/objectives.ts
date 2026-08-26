import type {
  CardEvolutionPath,
  ObjectiveDifficulty,
  Player,
  RelayObjective,
  SportId,
} from '@/types';

interface ObjectiveTemplate {
  key: string;
  sport: SportId;
  statKey: RelayObjective['statKey'];
  target: number;
  label: string;
  shortLabel: string;
  difficulty: ObjectiveDifficulty;
}

/**
 * Objective pool per sport. Single counting stats only so live progress is
 * always "current value vs target" — composite objectives are a post-V1 idea.
 */
const TEMPLATES: ObjectiveTemplate[] = [
  // MLB
  { key: 'mlb_hit', sport: 'mlb', statKey: 'h', target: 1, label: 'Record a hit', shortLabel: '1 H', difficulty: 1 },
  { key: 'mlb_run', sport: 'mlb', statKey: 'r', target: 1, label: 'Score a run', shortLabel: '1 R', difficulty: 1 },
  { key: 'mlb_walk', sport: 'mlb', statKey: 'bb', target: 1, label: 'Draw a walk', shortLabel: '1 BB', difficulty: 1 },
  { key: 'mlb_tb2', sport: 'mlb', statKey: 'tb', target: 2, label: 'Record two total bases', shortLabel: '2 TB', difficulty: 2 },
  { key: 'mlb_rbi', sport: 'mlb', statKey: 'rbi', target: 1, label: 'Drive in a run', shortLabel: '1 RBI', difficulty: 2 },
  { key: 'mlb_2h', sport: 'mlb', statKey: 'h', target: 2, label: 'Record two hits', shortLabel: '2 H', difficulty: 3 },
  { key: 'mlb_hr', sport: 'mlb', statKey: 'hr', target: 1, label: 'Hit a home run', shortLabel: '1 HR', difficulty: 3 },

  // Basketball — shared by NBA and WNBA below via cloning
  { key: 'nba_three', sport: 'nba', statKey: 'tpm', target: 1, label: 'Make a three-pointer', shortLabel: '1 3PM', difficulty: 1 },
  { key: 'nba_12pts', sport: 'nba', statKey: 'pts', target: 12, label: 'Score 12 points', shortLabel: '12 PTS', difficulty: 1 },
  { key: 'nba_6ast', sport: 'nba', statKey: 'ast', target: 6, label: 'Record six assists', shortLabel: '6 AST', difficulty: 2 },
  { key: 'nba_8reb', sport: 'nba', statKey: 'reb', target: 8, label: 'Grab eight rebounds', shortLabel: '8 REB', difficulty: 2 },
  { key: 'nba_20pts', sport: 'nba', statKey: 'pts', target: 20, label: 'Score 20 points', shortLabel: '20 PTS', difficulty: 3 },
  { key: 'nba_2stl', sport: 'nba', statKey: 'stl', target: 2, label: 'Record two steals', shortLabel: '2 STL', difficulty: 3 },

  // NHL
  { key: 'nhl_3sog', sport: 'nhl', statKey: 'sog', target: 3, label: 'Put three shots on goal', shortLabel: '3 SOG', difficulty: 1 },
  { key: 'nhl_3hits', sport: 'nhl', statKey: 'hits', target: 3, label: 'Deliver three hits', shortLabel: '3 HIT', difficulty: 1 },
  { key: 'nhl_assist', sport: 'nhl', statKey: 'a', target: 1, label: 'Record an assist', shortLabel: '1 A', difficulty: 2 },
  { key: 'nhl_goal', sport: 'nhl', statKey: 'g', target: 1, label: 'Score a goal', shortLabel: '1 G', difficulty: 3 },

  // Soccer
  { key: 'soc_3sh', sport: 'soccer', statKey: 'sh', target: 3, label: 'Take three shots', shortLabel: '3 SH', difficulty: 1 },
  { key: 'soc_4tkl', sport: 'soccer', statKey: 'tkl', target: 4, label: 'Win four tackles', shortLabel: '4 TKL', difficulty: 1 },
  { key: 'soc_2sot', sport: 'soccer', statKey: 'sot', target: 2, label: 'Put two shots on target', shortLabel: '2 SOT', difficulty: 2 },
  { key: 'soc_assist', sport: 'soccer', statKey: 'a', target: 1, label: 'Record an assist', shortLabel: '1 A', difficulty: 3 },
  { key: 'soc_goal', sport: 'soccer', statKey: 'g', target: 1, label: 'Score a goal', shortLabel: '1 G', difficulty: 3 },
];

const wnbaTemplates: ObjectiveTemplate[] = TEMPLATES.filter((t) => t.sport === 'nba').map((t) => ({
  ...t,
  key: t.key.replace('nba_', 'wnba_'),
  sport: 'wnba' as const,
}));

const ALL_TEMPLATES = [...TEMPLATES, ...wnbaTemplates];

export function objectivePool(sport: SportId): ObjectiveTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.sport === sport);
}

/** Small stable hash so a player's daily objective is deterministic. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function toObjective(template: ObjectiveTemplate, dateKey: string): RelayObjective {
  return {
    id: `${template.key}_${dateKey}`,
    sport: template.sport,
    statKey: template.statKey,
    target: template.target,
    label: template.label,
    shortLabel: template.shortLabel,
    difficulty: template.difficulty,
  };
}

/**
 * Pick the player's objective of the day. Power and Wildcard paths always
 * draw from the hard pool (their reward bonuses compensate); everyone else
 * draws from the standard pool.
 */
export function dailyObjectiveFor(
  player: Player,
  path: CardEvolutionPath,
  dateKey: string,
): RelayObjective {
  const pool = objectivePool(player.sport);
  const hardPool = pool.filter((t) => t.difficulty === 3);
  const standardPool = pool.filter((t) => t.difficulty < 3);
  const source = path === 'power' || path === 'wildcard' ? hardPool : standardPool;
  const index = hashString(`${player.id}:${dateKey}`) % source.length;
  const template = source[index];
  if (!template) {
    throw new Error(`No objective template for sport ${player.sport}`);
  }
  return toObjective(template, dateKey);
}
