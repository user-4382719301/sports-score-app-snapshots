export type SportId = 'mlb' | 'wnba' | 'nba' | 'nhl' | 'soccer';

export interface Sport {
  id: SportId;
  name: string;
  /** Short display label, e.g. "MLB". */
  shortName: string;
  /** Ionicons glyph name used as a neutral sport icon. */
  icon: string;
}

export interface League {
  id: string;
  sport: SportId;
  name: string;
  season: string;
}

export interface Team {
  id: string;
  sport: SportId;
  leagueId: string;
  /** City or region, e.g. "Harbor City". */
  location: string;
  /** Nickname, e.g. "Admirals". */
  name: string;
  abbreviation: string;
  /** Accent color used for generated placeholder art. */
  color: string;
}

export interface Player {
  id: string;
  sport: SportId;
  teamId: string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber: number;
}

/**
 * Union of every stat key across all sports. A stat line stores only the
 * keys relevant to its sport; labels live in constants/statCatalog.
 */
export type StatKey =
  // MLB
  | 'ab' | 'r' | 'h' | 'rbi' | 'bb' | 'so' | 'tb' | 'hr'
  // Basketball (NBA / WNBA)
  | 'min' | 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'fgm' | 'fga' | 'tpm'
  // NHL
  | 'g' | 'a' | 'sog' | 'hits' | 'toi' | 'plusMinus'
  // Soccer
  | 'sh' | 'sot' | 'passPct' | 'tkl';

export type StatLine = Partial<Record<StatKey, number>>;

export interface PlayerGameStats {
  playerId: string;
  gameId: string;
  stats: StatLine;
}

export type GameStatus = 'scheduled' | 'live' | 'final';

export interface TeamScore {
  teamId: string;
  score: number;
}

export interface TeamStatLine {
  teamId: string;
  rows: { label: string; value: string }[];
}

export interface GamePlay {
  id: string;
  /** Broadcast-style clock context, e.g. "T5" or "Q3 4:12" or "63'". */
  clockLabel: string;
  description: string;
  /** Player involved, when it is one of the tracked players. */
  playerId?: string;
  isScoringPlay: boolean;
}

export interface Game {
  id: string;
  sport: SportId;
  leagueId: string;
  status: GameStatus;
  startTime: string;
  home: TeamScore;
  away: TeamScore;
  /** Sport-aware period label: "Top 5", "Q3", "2nd Period", "2nd Half". */
  periodLabel: string;
  /** Game clock where the sport has one, e.g. "4:12" or "63'". */
  clock?: string;
  favorite: boolean;
  playerStats: PlayerGameStats[];
  teamStats: TeamStatLine[];
  plays: GamePlay[];
}
