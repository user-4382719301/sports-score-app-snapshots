const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { computeRings, ringsClosed, competitionPointsForDay, totalPoints } = require('./scoring');

admin.initializeApp();
const db = admin.firestore();

/** YYYY-MM-DD in UTC. Day keys are client-local, so treat boundary days leniently. */
function todayKeyUtc() {
  return new Date().toISOString().slice(0, 10);
}

function dayIndex(startDate, date) {
  return Math.round((Date.parse(date) - Date.parse(startDate)) / 86_400_000);
}

/**
 * Friend links are mutual, so clients can't write them (see firestore.rules).
 * The only way to become friends is this callable, which makes the link
 * symmetric in one transaction.
 */
exports.addFriend = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const code = String(request.data?.code || '').trim().toUpperCase();
  if (!code) throw new HttpsError('invalid-argument', 'A friend code is required.');

  const codeSnapshot = await db.doc(`friendCodes/${code}`).get();
  const friendId = codeSnapshot.data()?.uid;
  if (!friendId) return { friendId: null };
  if (friendId === uid) throw new HttpsError('invalid-argument', "That's your own code.");

  await db.runTransaction(async (tx) => {
    const [me, friend] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`users/${friendId}`)),
    ]);
    if (!me.exists || !friend.exists) throw new HttpsError('not-found', 'Profile missing.');
    tx.update(me.ref, { friendIds: admin.firestore.FieldValue.arrayUnion(friendId) });
    tx.update(friend.ref, { friendIds: admin.firestore.FieldValue.arrayUnion(uid) });
  });
  return { friendId };
});

/**
 * Fires whenever a user publishes a day. Owns everything derived from
 * activity: lifetime steps, streaks, ring-closure feed events, and
 * competition points (never client-written — this is the scoreboard).
 */
exports.onDayWritten = onDocumentWritten('users/{uid}/days/{date}', async (event) => {
  const { uid, date } = event.params;
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after) return;

  const userRef = db.doc(`users/${uid}`);
  const userSnapshot = await userRef.get();
  const user = userSnapshot.data();
  if (!user) return;

  // Lifetime steps: apply the delta for this day's rewrite.
  const stepDelta = (after.steps || 0) - (before?.steps || 0);
  const updates = {};
  if (stepDelta !== 0) {
    updates.lifetimeSteps = admin.firestore.FieldValue.increment(stepDelta);
  }

  // Streak: walk back from this day while the step goal was met.
  const goalSteps = user.goals?.steps || 10000;
  if ((after.steps || 0) >= goalSteps) {
    let streak = 1;
    for (let back = 1; back <= 60; back++) {
      const prevKey = new Date(Date.parse(date) - back * 86_400_000).toISOString().slice(0, 10);
      const prev = await db.doc(`users/${uid}/days/${prevKey}`).get();
      if ((prev.data()?.steps || 0) >= goalSteps) streak++;
      else break;
    }
    updates.streakDays = streak;
  }
  if (Object.keys(updates).length) await userRef.update(updates);

  // Feed event the first time all three rings close for this day.
  const rings = computeRings(after, user.goals);
  const closedBefore = before && ringsClosed(computeRings(before, user.goals));
  if (ringsClosed(rings) && !closedBefore && (user.friendIds || []).length) {
    await db.doc(`feed/rings-${uid}-${date}`).set({
      friendId: uid,
      kind: 'closed-rings',
      message: `${user.displayName} closed all three rings`,
      at: Date.now(),
      audience: user.friendIds,
    });
  }

  // Score active competitions covering this day.
  const competitions = await db
    .collection('competitions')
    .where('participantIds', 'array-contains', uid)
    .where('status', '==', 'active')
    .get();
  const points = competitionPointsForDay(rings);
  await Promise.all(
    competitions.docs
      .filter((d) => date >= d.data().startDate && date <= d.data().endDate)
      .map((d) => {
        const index = dayIndex(d.data().startDate, date);
        const mine = [...(d.data().points?.[uid] || [])];
        while (mine.length <= index) mine.push(0);
        mine[index] = points;
        return d.ref.update({ [`points.${uid}`]: mine });
      })
  );
});

/** Push a notification to everyone in a new feed event's audience. */
exports.onFeedCreated = onDocumentCreated('feed/{id}', async (event) => {
  const feedEvent = event.data?.data();
  if (!feedEvent) return;
  const tokens = [];
  for (const uid of feedEvent.audience || []) {
    const user = await db.doc(`users/${uid}`).get();
    tokens.push(...(user.data()?.fcmTokens || []));
  }
  if (!tokens.length) return;
  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title: 'StepCircle', body: feedEvent.message },
  });
});

/** Nightly: close out finished competitions and announce the winner. */
exports.finishCompetitions = onSchedule('every day 02:00', async () => {
  const today = todayKeyUtc();
  const expired = await db
    .collection('competitions')
    .where('status', '==', 'active')
    .where('endDate', '<', today)
    .get();

  await Promise.all(
    expired.docs.map(async (d) => {
      const data = d.data();
      const totals = data.participantIds.map((uid) => ({
        uid,
        total: totalPoints(data.points?.[uid]),
      }));
      totals.sort((a, b) => b.total - a.total);
      const winner = await db.doc(`users/${totals[0].uid}`).get();
      await d.ref.update({ status: 'finished' });
      await db.doc(`feed/comp-${d.id}`).set({
        friendId: totals[0].uid,
        kind: 'award',
        message: `${winner.data()?.displayName || 'Someone'} won "${data.name}" ${totals[0].total}–${totals[1]?.total ?? 0}`,
        at: Date.now(),
        audience: data.participantIds,
      });
    })
  );
});
