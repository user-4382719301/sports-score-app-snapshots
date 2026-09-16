import type { SportId, StatKey, StatLine } from '@/types';

export interface StatColumn {
  key: StatKey;
  label: string;
  /** Format raw numeric value for display (defaults to String). */
  format?: (value: number) => string;
}

const pct = (value: number): string => `${Math.round(value)}%`;
const avg = (value: number): string => value.toFixed(3).replace(/^0/, '');

/**
 * Box score columns per sport, in display order. Batting average and FG are
 * derived in the UI from counting stats where possible; here they are stored
 * directly for simplicity of simulation.
 */
export const STAT_COLUMNS: Record<SportId, StatColumn[]> = {
  mlb: [
    { key: 'ab', label: 'AB' },
    { key: 'r', label: 'R' },
    { key: 'h', label: 'H' },
    { key: 'rbi', label: 'RBI' },
    { key: 'bb', label: 'BB' },
    { key: 'so', label: 'SO' },
    { key: 'tb', label: 'TB' },
  ],
  wnba: [
    { key: 'min', label: 'MIN' },
    { key: 'pts', label: 'PTS' },
    { key: 'reb', label: 'REB' },
    { key: 'ast', label: 'AST' },
    { key: 'stl', label: 'STL' },
    { key: 'blk', label: 'BLK' },
    { key: 'fgm', label: 'FGM' },
  ],
  nba: [
    { key: 'min', label: 'MIN' },
    { key: 'pts', label: 'PTS' },
    { key: 'reb', label: 'REB' },
    { key: 'ast', label: 'AST' },
    { key: 'stl', label: 'STL' },
    { key: 'blk', label: 'BLK' },
    { key: 'fgm', label: 'FGM' },
  ],
  nhl: [
    { key: 'toi', label: 'TOI' },
    { key: 'g', label: 'G' },
    { key: 'a', label: 'A' },
    { key: 'sog', label: 'SOG' },
    { key: 'hits', label: 'HIT' },
    { key: 'plusMinus', label: '+/-' },
  ],
  soccer: [
    { key: 'min', label: 'MIN' },
    { key: 'g', label: 'G' },
    { key: 'a', label: 'A' },
    { key: 'sh', label: 'SH' },
    { key: 'sot', label: 'SOT' },
    { key: 'passPct', label: 'PASS%', format: pct },
    { key: 'tkl', label: 'TKL' },
  ],
};

/** Human labels for stat keys, used in objective copy and live stat chips. */
export const STAT_LABELS: Record<StatKey, string> = {
  ab: 'at-bats',
  r: 'runs',
  h: 'hits',
  rbi: 'RBI',
  bb: 'walks',
  so: 'strikeouts',
  tb: 'total bases',
  hr: 'home runs',
  min: 'minutes',
  pts: 'points',
  reb: 'rebounds',
  ast: 'assists',
  stl: 'steals',
  blk: 'blocks',
  fgm: 'field goals',
  fga: 'field goal attempts',
  tpm: 'three-pointers',
  g: 'goals',
  a: 'assists',
  sog: 'shots on goal',
  hits: 'hits',
  toi: 'time on ice',
  plusMinus: 'plus-minus',
  sh: 'shots',
  sot: 'shots on target',
  passPct: 'pass accuracy',
  tkl: 'tackles',
};

export function formatStatValue(column: StatColumn, line: StatLine): string {
  const value = line[column.key];
  if (value === undefined) {
    return '–';
  }
  return column.format ? column.format(value) : String(value);
}

export { avg as formatBattingAverage };
