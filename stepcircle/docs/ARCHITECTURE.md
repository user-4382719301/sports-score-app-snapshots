# Architecture

```
┌─────────────────────────── UI (React Native) ───────────────────────────┐
│  Summary        Sharing        Compete        Awards        Settings    │
│  (rings, week)  (friends,feed) (7-day comps)  (medals)      (goals)     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ zustand store (src/store/useAppStore.ts)
                ┌───────────────┴───────────────┐
                │                               │
        HealthAdapter                    SocialService
        (src/health)                     (src/social)
                │                               │
   ┌────────────┼────────────┐          DemoSocialService (on-device)
   │            │            │          └─ swap for a server impl,
HealthKit  Health Connect  Demo            see docs/BACKEND.md
 (iOS)      (Android)     (fallback)
   ▲            ▲
   │            │
Apple Watch   Wear OS / Galaxy Watch / Fitbit
(automatic sync into the platform health store)
```

## Design decisions

**Health stores are the integration point, not devices.** The app never
talks to a watch directly. HealthKit and Health Connect already receive,
merge and de-duplicate step data from phones and watches, so one adapter
per platform covers every wearable. This is the same posture Apple Fitness
takes.

**Pure logic lives in `src/lib` and is unit-tested.** Ring math, streak
rules, award predicates and competition scoring have no React or native
dependencies, so they run under plain jest and can be shared with a future
server (competition scoring must eventually be server-verified — see
BACKEND.md).

**Adapters degrade gracefully.** `createHealthAdapter()` lazy-requires the
native module and falls back to `DemoHealthAdapter` (deterministic seeded
data) when it's missing — Expo Go, simulators and tests all work without
native builds. The demo generator is also reused to fabricate friend data.

**The Stand ring becomes "Active hours".** Phones can't detect standing,
so the third ring counts hours containing ≥250 steps (the same heuristic
Apple uses for wheelchair-mode "Roll" and similar to Garmin's move bar).
The threshold and all three goals are user-adjustable in Settings.

**Competition scoring mirrors Apple Watch.** One point per ring percentage
point, 600/day cap, 7-day windows. `competitionPointsForDay()` is the
single source of truth for both the demo backend and the UI copy.

## Data model

`DailyActivity` is the atom: steps, distance, active minutes, floors and a
24-slot `hourlySteps` array (drives the active-hours ring and the hourly
chart). `Goals` maps onto the three rings. `Friend` = profile + today +
trailing week. `Competition` stores per-participant `dailyPoints` so the
UI can render both totals and day-by-day breakdowns.

## What's deliberately not here yet

- Persistence of goals/units (add `zustand/middleware` persist +
  AsyncStorage).
- Push notifications for cheers/feed (Expo Notifications; the demo backend
  fabricates the feed locally).
- Background step observers (HealthKit background delivery is enabled in
  the entitlements; wiring `initStepCountObserver` → store refresh is a
  small follow-up).
- Server-side competition verification (see BACKEND.md).
