#!/usr/bin/env node
// Daily ESPN leaderboard snapshot. Run by .github/workflows/snapshot.yml on
// a cron and committed back to this repo. Output:
//
//   leaderboards/<league>/latest.json
//   leaderboards/<league>/<YYYY-MM-DD>.json
//
// Each file: { snapshotDate, league, season, stats: { sortKey: [{playerId, rank, value}] } }
//
// The companion app reads `latest.json` at launch and computes rank deltas
// against the qualified leaderboard returned by ESPN at the same instant.

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SPORT_PATH = { NBA: 'basketball/nba', MLB: 'baseball/mlb' };

// Same sortKeys as the app's rank catalog. Keep these in sync.
const SORT_KEYS = {
  NBA: [
    'offensive.avgPoints',
    'offensive.avgAssists',
    'offensive.fieldGoalPct',
    'offensive.threePointFieldGoalPct',
    'offensive.freeThrowPct',
    'offensive.avgTurnovers',
    'general.avgRebounds',
    'general.avgMinutes',
    'general.gamesPlayed',
    'defensive.avgSteals',
    'defensive.avgBlocks',
  ],
  MLB: [
    'batting.avg',
    'batting.onBasePct',
    'batting.slugAvg',
    'batting.OPS',
    'batting.atBats',
    'batting.hits',
    'batting.homeRuns',
    'batting.RBIs',
    'batting.runs',
    'batting.walks',
    'batting.doubles',
    'batting.totalBases',
    'batting.stolenBases',
    'pitching.wins',
    'pitching.losses',
    'pitching.ERA',
    'pitching.WHIP',
    'pitching.strikeouts',
    'pitching.innings',
    'pitching.saves',
    'pitching.homeRuns',
    'pitching.walks',
    'pitching.strikeoutsPerNineInnings',
    'pitching.gamesStarted',
    'pitching.qualityStarts',
  ],
};

// Stats whose sort direction is ascending (lower is better) — matches the
// rank-catalog `sortDir: 'asc'` overrides on the app side.
const ASC_KEYS = new Set([
  'pitching.losses',
  'pitching.ERA',
  'pitching.WHIP',
  'pitching.homeRuns',
  'pitching.walks',
  'offensive.avgTurnovers',
]);

const LIMIT = 500;
const SLEEP_MS = 250;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function urlFor(league, sortKey) {
  const dir = ASC_KEYS.has(sortKey) ? 'asc' : 'desc';
  const sport = SPORT_PATH[league];
  return (
    `https://site.web.api.espn.com/apis/common/v3/sports/${sport}/statistics/byathlete` +
    `?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=${LIMIT}` +
    `&sort=${encodeURIComponent(sortKey)}%3A${dir}`
  );
}

// Pull `category.field` numeric value from one athlete row.
function valueFor(athlete, sortKey) {
  const [category, field] = sortKey.split('.');
  const cat = athlete.categories?.find(c => c.name === category);
  if (!cat) return null;
  const i = cat.names?.indexOf(field) ?? -1;
  if (i < 0) return null;
  return cat.totals?.[i] ?? null;
}

async function fetchOne(league, sortKey) {
  const url = urlFor(league, sortKey);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'sports-score-app-snapshots/1.0' },
  });
  if (!res.ok) throw new Error(`${sortKey} → HTTP ${res.status}`);
  const json = await res.json();
  const rows = (json.athletes ?? []).map((a, idx) => ({
    playerId: a.athlete?.id,
    rank: idx + 1,
    value: valueFor(a, sortKey),
  })).filter(r => r.playerId);
  return rows;
}

async function snapshotLeague(league) {
  const stats = {};
  for (const sortKey of SORT_KEYS[league]) {
    try {
      stats[sortKey] = await fetchOne(league, sortKey);
      console.log(`  ${league} ${sortKey}: ${stats[sortKey].length} rows`);
    } catch (e) {
      console.error(`  ${league} ${sortKey} FAILED: ${e.message}`);
      // Continue — partial snapshot is better than no snapshot.
      stats[sortKey] = [];
    }
    await sleep(SLEEP_MS);
  }
  return stats;
}

async function writeSnapshot(league, stats) {
  const now = new Date();
  const isoDate = now.toISOString();
  const ymd = isoDate.slice(0, 10);
  const payload = {
    snapshotDate: isoDate,
    league,
    season: now.getUTCFullYear(),
    stats,
  };
  const body = JSON.stringify(payload, null, 2) + '\n';
  const dir = resolve(ROOT, 'leaderboards', league.toLowerCase());
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, 'latest.json'), body);
  await writeFile(resolve(dir, `${ymd}.json`), body);
  console.log(`  wrote leaderboards/${league.toLowerCase()}/{latest,${ymd}}.json`);
}

async function main() {
  for (const league of ['NBA', 'MLB']) {
    console.log(`Snapshotting ${league}…`);
    const stats = await snapshotLeague(league);
    await writeSnapshot(league, stats);
  }
  console.log('Done.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
