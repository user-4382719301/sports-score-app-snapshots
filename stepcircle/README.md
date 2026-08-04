# StepCircle 👣⭕️

A social step counting app for iOS and Android, built with Expo / React
Native, borrowing the concepts that make Apple Fitness sticky:

- **Activity rings** — Move (steps), Exercise (active minutes) and an
  Active-hours ring (hours with 250+ steps, the Stand-ring analog), drawn
  as the familiar concentric trio.
- **Streaks** — consecutive days at your step goal, with the current day
  counted only once it's actually met.
- **Sharing** — a friends list with live mini-rings, an activity feed
  ("Maya closed all three rings"), and one-tap cheers.
- **Competitions** — 7-day head-to-heads scored exactly like Apple Watch
  competitions: one point per ring percentage point filled, capped at 600
  a day.
- **Awards** — Perfect Week, streak medals, lifetime milestones,
  competition trophies.

## Smartwatch support

The app reads from **HealthKit** on iOS and **Health Connect** on Android.
That is also how watches deliver data: Apple Watch writes to HealthKit;
Wear OS, Galaxy Watch and Fitbit write to Health Connect. Both stores
de-duplicate phone + watch samples, so anyone wearing a watch gets
watch-quality data in the app with no extra setup. Optional native watch
companion apps (rings on the wrist) are provided as reference code in
[`watch/`](watch/README.md).

## Running it

```sh
npm install

# Fastest look around (demo data, no native health modules needed):
npx expo start          # then open in Expo Go — the app auto-falls back to demo mode

# Real health data requires a dev build (native modules):
npx expo prebuild
npx expo run:ios        # or: npx expo run:android
```

- In **Expo Go** / simulators, the health adapter falls back to
  deterministic demo data so every screen is explorable.
- In a **dev build**, iOS prompts for Health access and Android prompts via
  Health Connect (Android 14+ has it built in; earlier versions install it
  from Play).

Social features run against an on-device demo backend
(`src/social/demoSocialService.ts`). The service interface is one file —
see [`docs/BACKEND.md`](docs/BACKEND.md) for the Firestore schema and swap
plan to make it multi-user for real.

## Tests

```sh
npm test        # jest — ring math, streaks, competition scoring, awards
npm run typecheck
```

## Project layout

```
src/
├── types.ts            # domain model: DailyActivity, Goals, Friend, Competition…
├── lib/                # pure logic: rings, streaks, awards, scoring (unit-tested)
├── health/             # HealthKit / Health Connect / demo adapters
├── social/             # SocialService interface + on-device demo backend
├── store/              # zustand app state
├── components/         # ActivityRings, WeekBars, StatCard, Avatar
├── screens/            # Summary, Sharing, FriendDetail, Compete, Awards, Settings
└── navigation/
watch/                  # native watchOS + Wear OS companion reference apps
docs/                   # architecture + backend plan
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the pieces fit.
