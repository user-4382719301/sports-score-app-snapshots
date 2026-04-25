# sports-score-app-snapshots

Daily snapshots of ESPN's qualified-leaderboard ranks for every stat the
companion app at `sports-score-app` cares about. Used to render rank-change
deltas (▲13 / ▼2) in the app without needing a backend.

A GitHub Actions cron runs `scripts/snapshot.mjs` at 09:00 UTC, fetches
ESPN, and commits the result back to this repo. The app reads:

```
https://raw.githubusercontent.com/<user>/sports-score-app-snapshots/main/leaderboards/<league>/latest.json
```

## File layout

```
leaderboards/
├── nba/
│   ├── latest.json           # overwritten daily
│   └── 2026-04-24.json       # per-day archive (ymd UTC)
└── mlb/
    ├── latest.json
    └── 2026-04-24.json
```

## Snapshot shape

```json
{
  "snapshotDate": "2026-04-24T09:00:00.123Z",
  "league": "MLB",
  "season": 2026,
  "stats": {
    "batting.avg": [
      { "playerId": "33192", "rank": 1, "value": "0.347" },
      { "playerId": "...", "rank": 2, "value": "0.341" }
    ],
    "batting.homeRuns": [...]
  }
}
```

## Running locally

```sh
node scripts/snapshot.mjs
```

Writes to `leaderboards/<league>/{latest,YYYY-MM-DD}.json`.

## Keeping the catalog in sync

The `SORT_KEYS` and `ASC_KEYS` constants in `scripts/snapshot.mjs` mirror
the rank catalog in the companion app
(`src/api/rankCatalog.ts`). If the app adds or renames a sort key, update
this script to match — the snapshot entry for an unrequested key will be
empty and the app will silently fall back to "no delta".
