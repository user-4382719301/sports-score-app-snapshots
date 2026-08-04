# Making the social layer real

Everything social goes through one interface —
`src/social/SocialService.ts` — currently implemented by an on-device demo
backend. To go multi-user, implement the same five methods against a
server. Firebase (Auth + Firestore + Cloud Functions + FCM) is the lowest
lift; the shapes below map 1:1 onto the existing TypeScript types.

## Firestore schema

```
users/{uid}
  displayName, initials, avatarColor
  goals: { steps, activeMinutes, activeHours }
  lifetimeSteps, streakDays
  friendIds: [uid, ...]              # mutual after invite acceptance

users/{uid}/days/{YYYY-MM-DD}       # written by publishMyDay()
  steps, distanceMeters, activeMinutes, floorsClimbed
  hourlySteps: [24 ints]
  updatedAt

feed/{eventId}                       # fan-out on write via Cloud Function
  friendId, kind, message, at
  audience: [uid, ...]

competitions/{id}
  name, startDate, endDate, status   # invited | active | finished
  participantIds: [uid, uid]
  points: { uid: [dayPoints...] }    # recomputed server-side, see below
```

## Method mapping

| `SocialService` method | Implementation |
|---|---|
| `getFriends()` | read `users` docs for `friendIds`, plus each friend's last 7 `days` docs |
| `getFeed()` | query `feed` where `audience contains uid`, ordered by `at desc` |
| `getCompetitions()` | query `competitions` where `participantIds contains uid` |
| `sendCheer()` | write a `feed` event; a Cloud Function sends the FCM push |
| `inviteToCompetition()` | create `competitions` doc with `status: 'invited'`; push to invitee |
| `publishMyDay()` | upsert today's `users/{uid}/days` doc (throttle to ~every 15 min) |

## Two things the server must own

1. **Competition scoring.** Clients report raw daily activity; a scheduled
   Cloud Function computes `competitionPointsForDay()` from the reported
   days and writes `points`. Never trust client-computed points — it's the
   scoreboard. The scoring function in `src/lib/rings.ts` is dependency-free
   TypeScript precisely so it can run unchanged in a Cloud Function.
2. **Privacy.** Security rules: a user's `days` are readable only by
   accepted friends; `hourlySteps` reveals daily movement patterns, so
   consider exposing only aggregates to friends and keeping hourly data
   private. Cheer/feed writes must be validated against the friendship
   graph.

## Swap procedure

1. `npm install firebase` (or use the REST API from a thin client).
2. Implement `FirebaseSocialService implements SocialService`.
3. In `src/store/useAppStore.ts`, replace the one `new DemoSocialService()`
   line (behind a config flag if you want demo mode to remain available).
4. Add sign-in (Apple / Google via `expo-auth-session`) to establish `uid`.

No UI changes are required — screens only know about the interface.
