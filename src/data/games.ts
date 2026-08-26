import type {
  Game,
  GamePlay,
  GameStatus,
  Player,
  PlayerGameStats,
  SportId,
  StatLine,
  TeamStatLine,
} from '@/types';
import { minutesFromNow } from '@/utils/time';
import { fillerPlayersForTeam, TRACKED_PLAYERS } from './players';
import { createRng, pick, rangeInt } from './rng';

interface GameSpec {
  id: string;
  sport: SportId;
  awayTeamId: string;
  homeTeamId: string;
  status: GameStatus;
  /** Minutes relative to now for start time (negative = already started). */
  startOffsetMinutes: number;
  awayScore: number;
  homeScore: number;
  periodLabel: string;
  clock?: string;
  favorite?: boolean;
}

const GAME_SPECS: GameSpec[] = [
  { id: 'gm_mlb_live', sport: 'mlb', awayTeamId: 'tm_hca', homeTeamId: 'tm_ssb', status: 'live', startOffsetMinutes: -105, awayScore: 3, homeScore: 2, periodLabel: 'Top 5', favorite: true },
  { id: 'gm_mlb_up', sport: 'mlb', awayTeamId: 'tm_bay', homeTeamId: 'tm_rgl', status: 'scheduled', startOffsetMinutes: 120, awayScore: 0, homeScore: 0, periodLabel: '' },
  { id: 'gm_mlb_final', sport: 'mlb', awayTeamId: 'tm_ccc', homeTeamId: 'tm_lks', status: 'final', startOffsetMinutes: -320, awayScore: 4, homeScore: 6, periodLabel: 'Final' },
  { id: 'gm_wnba_live', sport: 'wnba', awayTeamId: 'tm_met', homeTeamId: 'tm_aur', status: 'live', startOffsetMinutes: -75, awayScore: 58, homeScore: 54, periodLabel: 'Q3', clock: '4:12' },
  { id: 'gm_wnba_up', sport: 'wnba', awayTeamId: 'tm_cap', homeTeamId: 'tm_sea', status: 'scheduled', startOffsetMinutes: 90, awayScore: 0, homeScore: 0, periodLabel: '' },
  { id: 'gm_nba_live', sport: 'nba', awayTeamId: 'tm_mid', homeTeamId: 'tm_irn', status: 'live', startOffsetMinutes: -55, awayScore: 41, homeScore: 38, periodLabel: 'Q2', clock: '8:44' },
  { id: 'gm_nba_up', sport: 'nba', awayTeamId: 'tm_cre', homeTeamId: 'tm_sum', status: 'scheduled', startOffsetMinutes: 180, awayScore: 0, homeScore: 0, periodLabel: '' },
  { id: 'gm_nhl_up', sport: 'nhl', awayTeamId: 'tm_gla', homeTeamId: 'tm_nor', status: 'scheduled', startOffsetMinutes: 150, awayScore: 0, homeScore: 0, periodLabel: '' },
  { id: 'gm_nhl_final', sport: 'nhl', awayTeamId: 'tm_ste', homeTeamId: 'tm_fro', status: 'final', startOffsetMinutes: -260, awayScore: 2, homeScore: 3, periodLabel: 'Final / OT' },
  { id: 'gm_soc_live', sport: 'soccer', awayTeamId: 'tm_riv', homeTeamId: 'tm_atl', status: 'live', startOffsetMinutes: -70, awayScore: 1, homeScore: 1, periodLabel: '2nd Half', clock: "63'" },
  { id: 'gm_soc_up', sport: 'soccer', awayTeamId: 'tm_por', homeTeamId: 'tm_eve', status: 'scheduled', startOffsetMinutes: 100, awayScore: 0, homeScore: 0, periodLabel: '' },
  { id: 'gm_soc_final', sport: 'soccer', awayTeamId: 'tm_nrb', homeTeamId: 'tm_mer', status: 'final', startOffsetMinutes: -380, awayScore: 0, homeScore: 2, periodLabel: 'Final', favorite: true },
];

function statLineFor(sport: SportId, rng: () => number, full: boolean): StatLine {
  const scale = full ? 1 : 0.6;
  switch (sport) {
    case 'mlb': {
      const ab = rangeInt(rng, full ? 3 : 2, full ? 5 : 3);
      const h = Math.min(ab, rangeInt(rng, 0, 2));
      return {
        ab,
        h,
        tb: h + (rng() > 0.7 ? rangeInt(rng, 1, 2) : 0),
        r: rangeInt(rng, 0, 1),
        rbi: rangeInt(rng, 0, 2),
        bb: rangeInt(rng, 0, 1),
        so: rangeInt(rng, 0, 2),
        hr: 0,
      };
    }
    case 'nba':
    case 'wnba': {
      const fgm = rangeInt(rng, 1, Math.round(9 * scale));
      return {
        min: rangeInt(rng, Math.round(12 * scale), Math.round(34 * scale)),
        pts: fgm * 2 + rangeInt(rng, 0, Math.round(6 * scale)),
        reb: rangeInt(rng, 0, Math.round(9 * scale)),
        ast: rangeInt(rng, 0, Math.round(8 * scale)),
        stl: rangeInt(rng, 0, 2),
        blk: rangeInt(rng, 0, 2),
        fgm,
        fga: fgm + rangeInt(rng, 2, 8),
        tpm: rangeInt(rng, 0, 3),
      };
    }
    case 'nhl':
      return {
        toi: rangeInt(rng, Math.round(8 * scale), Math.round(22 * scale)),
        g: rng() > 0.8 ? 1 : 0,
        a: rangeInt(rng, 0, 2),
        sog: rangeInt(rng, 0, Math.round(5 * scale)),
        hits: rangeInt(rng, 0, Math.round(4 * scale)),
        plusMinus: rangeInt(rng, -2, 3),
      };
    case 'soccer': {
      const sh = rangeInt(rng, 0, Math.round(4 * scale));
      return {
        min: full ? 90 : rangeInt(rng, 45, 70),
        g: rng() > 0.85 ? 1 : 0,
        a: rng() > 0.85 ? 1 : 0,
        sh,
        sot: Math.min(sh, rangeInt(rng, 0, 2)),
        passPct: rangeInt(rng, 68, 94),
        tkl: rangeInt(rng, 0, 5),
      };
    }
  }
}

function teamStatsFor(spec: GameSpec, rng: () => number): TeamStatLine[] {
  const make = (teamId: string): TeamStatLine => {
    switch (spec.sport) {
      case 'mlb':
        return {
          teamId,
          rows: [
            { label: 'Hits', value: String(rangeInt(rng, 4, 11)) },
            { label: 'Errors', value: String(rangeInt(rng, 0, 2)) },
            { label: 'Left on base', value: String(rangeInt(rng, 3, 9)) },
          ],
        };
      case 'nba':
      case 'wnba':
        return {
          teamId,
          rows: [
            { label: 'FG%', value: `${rangeInt(rng, 39, 55)}%` },
            { label: '3PM', value: String(rangeInt(rng, 4, 14)) },
            { label: 'Rebounds', value: String(rangeInt(rng, 18, 46)) },
            { label: 'Assists', value: String(rangeInt(rng, 9, 27)) },
            { label: 'Turnovers', value: String(rangeInt(rng, 5, 16)) },
          ],
        };
      case 'nhl':
        return {
          teamId,
          rows: [
            { label: 'Shots', value: String(rangeInt(rng, 14, 38)) },
            { label: 'Power play', value: `${rangeInt(rng, 0, 2)}/${rangeInt(rng, 2, 4)}` },
            { label: 'Faceoff %', value: `${rangeInt(rng, 42, 58)}%` },
            { label: 'Hits', value: String(rangeInt(rng, 10, 28)) },
          ],
        };
      case 'soccer':
        return {
          teamId,
          rows: [
            { label: 'Possession', value: `${rangeInt(rng, 38, 62)}%` },
            { label: 'Shots', value: String(rangeInt(rng, 5, 17)) },
            { label: 'On target', value: String(rangeInt(rng, 1, 8)) },
            { label: 'Corners', value: String(rangeInt(rng, 2, 9)) },
            { label: 'Fouls', value: String(rangeInt(rng, 6, 15)) },
          ],
        };
    }
  };
  return [make(spec.awayTeamId), make(spec.homeTeamId)];
}

const PLAY_CLOCKS: Record<SportId, readonly string[]> = {
  mlb: ['T1', 'B2', 'T3', 'B3', 'T4', 'B4', 'T5'],
  wnba: ['Q1 6:20', 'Q1 2:05', 'Q2 7:44', 'Q2 3:12', 'Q3 8:01', 'Q3 4:12'],
  nba: ['Q1 8:12', 'Q1 3:40', 'Q2 10:22', 'Q2 8:44'],
  nhl: ['P1 12:30', 'P1 4:18', 'P2 15:02', 'P3 8:47', 'OT 2:14'],
  soccer: ["12'", "27'", "39'", "51'", "58'", "63'"],
};

function playsFor(spec: GameSpec, tracked: Player[], rng: () => number): GamePlay[] {
  const templates: Record<SportId, readonly string[]> = {
    mlb: [
      'lines a single to center',
      'doubles down the line',
      'draws a walk',
      'strikes out swinging',
      'scores on a sacrifice fly',
    ],
    wnba: [
      'drills a three from the wing',
      'scores on a driving layup',
      'finds the cutter for an assist',
      'grabs a defensive board',
      'blocks the shot at the rim',
    ],
    nba: [
      'pulls up from deep — good',
      'attacks the rim for two',
      'threads a no-look assist',
      'rips a steal at midcourt',
      'cleans the glass',
    ],
    nhl: [
      'rips a wrister on net',
      'feeds the slot for a chance',
      'lays a big hit along the boards',
      'buries one five-hole',
      'wins the draw cleanly',
    ],
    soccer: [
      'curls one just over the bar',
      'slides a through ball into the box',
      'wins a crunching tackle',
      'forces a save from distance',
      'heads home the cross',
    ],
  };

  const clocks = PLAY_CLOCKS[spec.sport];
  const lines = templates[spec.sport];
  const count = Math.min(clocks.length, 6);
  const plays: GamePlay[] = [];
  for (let i = 0; i < count; i += 1) {
    const player = tracked.length > 0 && rng() > 0.35 ? pick(rng, tracked) : undefined;
    const description = player
      ? `${player.firstName} ${player.lastName} ${pick(rng, lines)}`
      : `${pick(rng, ['The away side', 'The home side'])} ${pick(rng, lines).replace('scores', 'score')}`;
    plays.push({
      id: `${spec.id}_play_${i}`,
      clockLabel: clocks[i] ?? '',
      description,
      playerId: player?.id,
      isScoringPlay: rng() > 0.7,
    });
  }
  // Newest first, matching a broadcast feed.
  return plays.reverse();
}

/**
 * Build the day's slate. `statOverrides` lets the seeded relay force exact
 * stat values for its players so box scores agree with relay progress.
 */
export function buildSeedGames(
  now: Date,
  statOverrides: Record<string, StatLine> = {},
): { games: Game[]; boxScorePlayers: Player[] } {
  const boxScorePlayers: Player[] = [];
  const games = GAME_SPECS.map((spec) => {
    const rng = createRng(`game:${spec.id}`);
    const hasBox = spec.status !== 'scheduled';
    const tracked = TRACKED_PLAYERS.filter(
      (p) => p.teamId === spec.awayTeamId || p.teamId === spec.homeTeamId,
    );

    let playerStats: PlayerGameStats[] = [];
    if (hasBox) {
      const fillers = [
        ...fillerPlayersForTeam(spec.awayTeamId, spec.sport, 4),
        ...fillerPlayersForTeam(spec.homeTeamId, spec.sport, 4),
      ];
      boxScorePlayers.push(...fillers);
      playerStats = [...tracked, ...fillers].map((player) => ({
        playerId: player.id,
        gameId: spec.id,
        stats: {
          ...statLineFor(spec.sport, rng, spec.status === 'final'),
          ...statOverrides[player.id],
        },
      }));
    }

    const game: Game = {
      id: spec.id,
      sport: spec.sport,
      leagueId: `lg_${spec.sport}`,
      status: spec.status,
      startTime: minutesFromNow(spec.startOffsetMinutes, now),
      away: { teamId: spec.awayTeamId, score: spec.awayScore },
      home: { teamId: spec.homeTeamId, score: spec.homeScore },
      periodLabel: spec.periodLabel,
      clock: spec.clock,
      favorite: spec.favorite ?? false,
      playerStats,
      teamStats: hasBox ? teamStatsFor(spec, rng) : [],
      plays: hasBox ? playsFor(spec, tracked, rng) : [],
    };
    return game;
  });

  return { games, boxScorePlayers };
}
