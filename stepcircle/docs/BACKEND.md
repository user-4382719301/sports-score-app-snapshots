# The social backend

Everything social goes through one interface —
`src/social/SocialService.ts` — with two implementations:

- **`demoSocialService.ts`** (default): on-device fake friends, feed and
  competitions. Zero setup; what you get in Expo Go.
- **`firebaseSocialService.ts`**: real multi-user backend on Firebase
  (anonymous Auth + Firestore + Cloud Functions). The server pieces it
  pairs with live in [`../firebase/`](../firebase/).

## Turning on the real backend

1. Create a Firebase project; enable **Anonymous** sign-in (Authentication
   → Sign-in method) and **Firestore**.
2. Copy the web-app config into `FIREBASE_CONFIG` in `src/config.ts` and
   set `SOCIAL_BACKEND = 'firebase'`.
3. Deploy rules, indexes and functions:
   ```sh
   cd firebase
   npm --prefix functions install
   firebase deploy --only firestore,functions
   ```
4. `npm install` in the app (pulls `firebase` +
   `@react-native-async-storage/async-storage`, which persists the
   anonymous user across launches) and rebuild.

Users start as anonymous accounts with a generated name and a 6-character
**friend code** (shown on the Sharing tab). Trading codes is the whole
friending flow — same spirit as Apple Fitness sharing invites. To make
accounts portable across devices, link Apple/Google credentials onto the
anonymous user with `expo-auth-session` + `linkWithCredential` (not wired
up yet).

## Firestore schema

```
users/{uid}
  displayName, initials, avatarColor
  goals: { steps, activeMinutes, activeHours }
  friendCode                          # immutable after creation
  friendIds: [uid, ...]               # ONLY written by the addFriend function
  lifetimeSteps, streakDays           # ONLY written by onDayWritten
  expoPushTokens: [token, ...]        # registered by the app on launch

users/{uid}/days/{YYYY-MM-DD}         # written by publishMyDay(), throttled
  steps, distanceMeters, activeMinutes, floorsClimbed
  hourlySteps: [24 ints]
  updatedAt

friendCodes/{CODE} -> { uid }         # lookup table, one per user

feed/{eventId}
  friendId (the actor), kind, message, at
  audience: [uid, ...]                # who may read it

competitions/{id}
  name, startDate, endDate
  status: invited | active | finished # invitee flips invited -> active
  participantIds: [uid, uid]
  points: { uid: [dayPoints...] }     # ONLY written by onDayWritten
```

## What the server owns (Cloud Functions, `firebase/functions/`)

| Function | Trigger | Responsibility |
|---|---|---|
| `addFriend` | callable | Resolves a friend code and creates the **mutual** link in one transaction. Clients can't write `friendIds` at all. |
| `onDayWritten` | day doc write | Lifetime steps, streak recompute, "closed all rings" feed events, and **competition points** — scoring uses `scoring.js`, a direct port of `src/lib/rings.ts`, so the server and the UI always agree. Clients never write points; it's the scoreboard. |
| `onFeedCreated` | feed doc create | Push to the event's audience via the Expo push API (cross-platform, no APNs/FCM client setup). |
| `finishCompetitions` | nightly schedule | Flips expired competitions to `finished` and posts the winner announcement. |

`firestore.rules` enforces the same boundaries: profile days are readable
only by accepted friends, feed events only by their audience, clients can
author only `cheer` events as themselves, and competition `points`/`status`
transitions are locked down. Note `hourlySteps` reveals daily movement
patterns even to friends — if that's too exposed for your audience, strip
it to aggregates server-side and make the raw field owner-only.

## Costs and scaling notes

- `getFriends()` reads 7 day-docs per friend per refresh; fine for
  Apple-Fitness-sized friend lists (dozens). For bigger graphs, denormalize
  a `weekSummary` array onto the user doc from `onDayWritten`.
- `publishMyDay` is throttled client-side to one write per 5 minutes.
- Both list queries need the composite indexes in
  `firestore.indexes.json` (deployed in step 3).
