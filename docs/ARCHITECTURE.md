# Relay — Product Architecture (V1)

## Layering

```
src/
  types/        Domain models (User, Game, PlayerCard, Relay, …). Pure types.
  constants/    Catalogs: sports, stat columns per sport, evolution paths/stages.
  domain/       Pure business logic. No React, no stores, no I/O.
    objectives.ts   Objective pools per sport + deterministic daily assignment
    relayEngine.ts  The relay state machine (activate / progress / complete / fail)
    rewards.ts      Coins, multipliers, risk tiers, payout math
    chemistry.ts    Connection bonuses
    progression.ts  Card XP, levels, stages, abilities, evolution choice
    validation.ts   Draft rules (no started games, no duplicates, max five)
    abilities.ts    Per-path ability catalog
  data/         Seeded mock world: fictional teams/players, 12 games, 24 cards,
                active relay, history, quests, notifications. Deterministic
                (seeded PRNG), timed relative to "now" at seed time.
  stores/       Zustand stores, one per concern, persisted to AsyncStorage:
                user, games, collection, relay, history, notifications, rewards.
  services/     Orchestration across stores:
    simulation.ts        Demo controls — the stand-in for a live ingest feed
    relayBuilder.ts      Draft → assembled relay
    bootstrap.ts         Hydration gate + day rollover
    sportsDataService.ts The seam for real sports data (see below)
  hooks/        Small read-side helpers (entity lookups, relay-game sets)
  components/   Presentational library: shared primitives + cards/games/relay
  app/          Expo Router routes only — screens compose components + stores
```

The dependency direction is strict: `domain` knows nothing about stores or
React; stores call domain functions; services coordinate multiple stores;
screens read stores and call services. This is what makes the simulation
honest — the demo buttons use exactly the code path a real feed would.

### How an update flows

```
SimControls (or a future live feed)
  → services/simulation.ts
      → domain/relayEngine (pure state transition + events)
      → relayStore (new relay state)
      → per event: collectionStore (XP/levels) · notificationsStore
                   · rewardsStore (quests/coins) · gamesStore (box score sync)
      → on finish: historyStore + userStore (rating, streaks, profile)
  → screens re-render from their stores; persistence is automatic
```

### State & persistence

Each store persists its own slice under a `relay/*` AsyncStorage key.
`services/bootstrap.ts` gates rendering on rehydration and handles day
rollover: a stale slate is reseeded for the new day, an unfinished
yesterday-relay is archived to history, and daily quests reset.
`resetDemoData()` (Demo controls → Reset) clears every key and rebuilds
the world.

## Replacing mock data with a real sports API

The mock world only enters through two doors, both designed to be swapped:

1. **Schedule/box-score reads** — `services/sportsDataService.ts` defines
   `SportsDataProvider` (`fetchTodaysGames`, `fetchGame`,
   `subscribeToGame`). V1 binds a mock provider that serves the seeded
   store. Step one of a real integration: implement an
   `HttpSportsDataProvider` against your feed, map its payload into the
   `Game` / `PlayerGameStats` / `GamePlay` types, and have the games store
   hydrate from the provider instead of `buildSeed()`.
2. **Live progression writes** — everything the Demo controls do is a
   function in `services/simulation.ts` (`simAdvanceActiveStat`,
   `simCompleteActiveLeg`, `simFailActiveLeg`). A real ingest loop is a
   poller/websocket that diffs incoming box scores and calls the same
   store/domain plumbing: apply the stat delta, let `relayEngine` decide
   whether a leg completed, and the rest of the app updates for free.

Concretely, for something like ESPN's public scoreboard endpoints:

- Map `event.competitions[].competitors` → `Game.home/away` + `TeamScore`
- Map athlete stat lines → `PlayerGameStats.stats` using the keys in
  `constants/statCatalog.ts` (one mapping table per sport)
- Poll live games every ~20s; compute per-player stat deltas; feed them
  through `applyStatToActiveLeg`
- Objective completion, shield saves, XP, notifications, quests, and
  history all keep working untouched — they never knew the data was mock

What you would add for production that V1 deliberately lacks: an ID
mapping layer (provider IDs → internal IDs), a server-authoritative relay
resolver (clients should not self-grade objectives), auth, and push
notifications instead of the local feed.

## Deliberate V1 limitations

- **No backend.** All state is on-device; relays are graded locally by the
  simulation. Multi-device sync and anti-tamper require the server pass.
- **One day of data.** The slate is seeded relative to "now"; yesterday /
  tomorrow in the Games date selector are simulated views of it. Day
  rollover reseeds rather than fetching a real schedule.
- **Simulated liveness.** Clocks and periods don't tick on their own; the
  demo controls advance the world. (The plumbing is event-driven, so a
  ticker is an add, not a rewrite.)
- **Abilities are mostly flavor.** Shield's revive, Connector's objective
  ease, and the path reward bonuses are real mechanics; the level-8/14
  ability texts describe intended future effects and unlock cosmetically.
- **Simple formulas.** XP curve, rating deltas, and payouts are flat and
  inspectable by design — no balancing engine, no tuning pipeline.
- **Placeholder art.** Initials, team colors, and neutral icons; no
  licensed assets. Cosmetic rewards are placeholders.
- **Accessibility is best-effort.** Labels, reduced-motion paths, capped
  Dynamic Type, and tap targets are in place; a full audit (VoiceOver
  traversal order, contrast on tinted chips) is future work.
- **Tests cover the domain layer only.** The relay engine, validation,
  progression, and reward math are tested; screens and stores are not
  (component tests would come with a design-stability milestone).
- **Evolution choice is a re-pick.** Choosing a new path at Elite swaps
  the card's path; a full skill-tree presentation is out of scope.
