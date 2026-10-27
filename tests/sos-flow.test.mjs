// End-to-end SOS flow between two (three) real signed-in users, run against
// the Firebase emulators with the production security rules (firestore.rules).
//
//   npm run test:emulators
//
// Covers what the two apps do: the person raises an SOS, a helper sees it,
// accepts it (race-safe), both chat and share live location, it gets resolved,
// and everything the rules must refuse is refused.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { deleteApp, initializeApp } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? "she111";
const RUN = Date.now().toString(36);

/** One "phone": its own Firebase app, auth session and Firestore client. */
async function device(name) {
  const app = initializeApp({ apiKey: "demo-key", projectId: PROJECT_ID }, `${name}-${RUN}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = initializeFirestore(app, {});
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  const { user } = await createUserWithEmailAndPassword(auth, `${name}-${RUN}@shield.test`, "test-password-123");
  await setDoc(doc(db, "users", user.uid), {
    id: user.uid,
    name,
    email: user.email,
    phone: "1712345678",
    countryCode: "+880",
    gender: "unspecified",
    userType: "user_helper",
    isHelperVerified: false,
    verificationStatus: "none",
    helperActive: false,
    createdAt: Date.now(),
  });
  return { app, auth, db, uid: user.uid, name };
}

/** Resolves with the first snapshot value matching `predicate` (realtime listener). */
function waitFor(ref, predicate, ms = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsub();
      reject(new Error("timed out waiting for realtime update"));
    }, ms);
    const unsub = onSnapshot(ref, (snap) => {
      const value = predicate(snap);
      if (value) {
        clearTimeout(timer);
        unsub();
        resolve(value);
      }
    }, reject);
  });
}

/** Same transaction as acceptAlert() in src/features/helper/api.ts. */
function accept(helper, alertId) {
  return runTransaction(helper.db, async (tx) => {
    const ref = doc(helper.db, "alerts", alertId);
    const snap = await tx.get(ref);
    if (snap.data().status !== "active") throw new Error("Another helper already accepted this alert.");
    const now = Date.now();
    tx.update(ref, {
      status: "accepted",
      acceptedBy: helper.uid,
      acceptedByName: helper.name,
      acceptedByPhone: "+880 1712345678",
      acceptedAt: now,
      stage: "accepted",
      helperLocation: { latitude: 24.37, longitude: 88.61 },
      updatedAt: now,
    });
  });
}

const RAJSHAHI = { latitude: 24.3625, longitude: 88.6049, accuracy: 12 };

describe("SOS between two phones", () => {
  let person, helper, otherHelper, alertId;

  before(async () => {
    [person, helper, otherHelper] = await Promise.all([device("person"), device("helper"), device("helper2")]);
  });

  after(async () => {
    await Promise.all([person, helper, otherHelper].filter(Boolean).map((d) => deleteApp(d.app)));
  });

  test("person adds a trusted contact (only they can read it)", async () => {
    await addDoc(collection(person.db, "users", person.uid, "contacts"), {
      name: "Mum",
      phone: "1798765432",
      countryCode: "+880",
      createdAt: Date.now(),
    });
    const mine = await getDocs(collection(person.db, "users", person.uid, "contacts"));
    assert.equal(mine.size, 1);
    await assert.rejects(getDocs(collection(helper.db, "users", person.uid, "contacts")), /permission/i);
  });

  test("profiles are private to their owner", async () => {
    await assert.rejects(getDoc(doc(helper.db, "users", person.uid)), /permission/i);
  });

  test("person raises an SOS (same document the app writes)", async () => {
    const ref = doc(collection(person.db, "alerts"));
    alertId = ref.id;
    const now = Date.now();
    await setDoc(ref, {
      userId: person.uid,
      userName: person.name,
      userPhone: "+880 1712345678",
      userGender: "unspecified",
      alertType: "SOS",
      reason: "manual",
      riskLevel: "high",
      status: "active",
      description: "SOS button: person needs help",
      location: RAJSHAHI,
      contactsCount: 1,
      smsDelivery: "pending",
      acceptedBy: null,
      stage: null,
      timestamp: now,
      updatedAt: now,
    });
  });

  test("nobody can raise an SOS in someone else's name", async () => {
    await assert.rejects(
      setDoc(doc(collection(helper.db, "alerts")), { userId: person.uid, status: "active", timestamp: Date.now() }),
      /permission/i,
    );
  });

  test("helper's dashboard query receives the SOS in real time", async () => {
    const found = await waitFor(query(collection(helper.db, "alerts"), where("status", "==", "active")), (snap) =>
      snap.docs.find((d) => d.id === alertId),
    );
    assert.equal(found.data().userName, "person");
    assert.deepEqual(
      { lat: found.data().location.latitude, lng: found.data().location.longitude },
      { lat: RAJSHAHI.latitude, lng: RAJSHAHI.longitude },
    );
  });

  test("person's live location updates reach the helper", async () => {
    await updateDoc(doc(person.db, "alerts", alertId), {
      location: { latitude: 24.3631, longitude: 88.6052, accuracy: 8 },
      updatedAt: Date.now(),
    });
    const lat = await waitFor(doc(helper.db, "alerts", alertId), (snap) =>
      snap.data().location.latitude === 24.3631 ? snap.data().location.latitude : null,
    );
    assert.equal(lat, 24.3631);
  });

  test("a helper can't edit an alert they haven't accepted", async () => {
    await assert.rejects(
      updateDoc(doc(otherHelper.db, "alerts", alertId), { description: "hijacked" }),
      /permission/i,
    );
  });

  test("two helpers accept at once: exactly one wins", async () => {
    const results = await Promise.allSettled([accept(helper, alertId), accept(otherHelper, alertId)]);
    const winners = results.filter((r) => r.status === "fulfilled");
    assert.equal(winners.length, 1, JSON.stringify(results.map((r) => r.status)));
    const snap = await getDoc(doc(person.db, "alerts", alertId));
    assert.equal(snap.data().status, "accepted");
    // Make the rest of the suite deterministic about who holds it.
    if (snap.data().acceptedBy !== helper.uid) {
      [helper, otherHelper] = [otherHelper, helper];
    }
  });

  test("the person sees who accepted, in real time", async () => {
    const name = await waitFor(doc(person.db, "alerts", alertId), (snap) =>
      snap.data().status === "accepted" ? snap.data().acceptedByName : null,
    );
    assert.equal(name, helper.name);
  });

  test("the losing helper can no longer take or change the alert", async () => {
    await assert.rejects(accept(otherHelper, alertId));
    await assert.rejects(updateDoc(doc(otherHelper.db, "alerts", alertId), { stage: "arrived" }), /permission/i);
  });

  test("helper shares progress and live position with the person", async () => {
    await updateDoc(doc(helper.db, "alerts", alertId), { stage: "en_route", updatedAt: Date.now() });
    await updateDoc(doc(helper.db, "alerts", alertId), { helperLocation: { latitude: 24.365, longitude: 88.606 } });
    const seen = await waitFor(doc(person.db, "alerts", alertId), (snap) =>
      snap.data().stage === "en_route" && snap.data().helperLocation?.latitude === 24.365 ? snap.data() : null,
    );
    assert.equal(seen.stage, "en_route");
  });

  test("chat: person and accepting helper talk, outsiders can't read", async () => {
    const messages = collection(person.db, "alerts", alertId, "messages");
    await addDoc(messages, { senderId: person.uid, senderName: person.name, text: "I'm hiding in a shop", createdAt: Date.now() });
    await addDoc(collection(helper.db, "alerts", alertId, "messages"), {
      senderId: helper.uid,
      senderName: helper.name,
      text: "I'm on my way",
      createdAt: Date.now(),
    });
    const thread = await getDocs(collection(helper.db, "alerts", alertId, "messages"));
    assert.equal(thread.size, 2);
    await assert.rejects(getDocs(collection(otherHelper.db, "alerts", alertId, "messages")), /permission/i);
    await assert.rejects(
      addDoc(collection(helper.db, "alerts", alertId, "messages"), {
        senderId: person.uid,
        senderName: "spoof",
        text: "fake",
        createdAt: Date.now(),
      }),
      /permission/i,
    );
    await assert.rejects(
      addDoc(messages, { senderId: person.uid, senderName: person.name, text: "x".repeat(501), createdAt: Date.now() }),
      /permission/i,
    );
  });

  test("helper can release the alert back to others, who can then accept it", async () => {
    await updateDoc(doc(helper.db, "alerts", alertId), {
      status: "active",
      acceptedBy: null,
      acceptedByName: null,
      acceptedByPhone: null,
      acceptedAt: null,
      stage: null,
      helperLocation: null,
      updatedAt: Date.now(),
    });
    await accept(otherHelper, alertId);
    const snap = await getDoc(doc(person.db, "alerts", alertId));
    assert.equal(snap.data().acceptedBy, otherHelper.uid);
  });

  test("person marks themselves safe; helpers stop seeing it", async () => {
    const now = Date.now();
    await updateDoc(doc(person.db, "alerts", alertId), {
      status: "resolved",
      resolvedAt: now,
      resolvedBy: "user",
      updatedAt: now,
    });
    const active = await getDocs(query(collection(helper.db, "alerts"), where("status", "==", "active")));
    assert.ok(!active.docs.some((d) => d.id === alertId));
    const snap = await getDoc(doc(otherHelper.db, "alerts", alertId));
    assert.equal(snap.data().status, "resolved");
  });

  test("a forgotten SOS is expired by its owner and a new one can be raised", async () => {
    const old = Date.now() - 7 * 60 * 60 * 1000;
    const staleRef = doc(collection(person.db, "alerts"));
    await setDoc(staleRef, { userId: person.uid, status: "active", reason: "manual", timestamp: old, updatedAt: old });
    // What useMyAlerts()/triggerSos() do for open alerts past OPEN_ALERT_TTL_MS.
    const now = Date.now();
    await updateDoc(staleRef, { status: "cancelled", resolvedBy: "timeout", resolvedAt: now, updatedAt: now });
    const fresh = doc(collection(person.db, "alerts"));
    await setDoc(fresh, { userId: person.uid, status: "active", reason: "manual", timestamp: now, updatedAt: now });
    const open = await getDocs(
      query(collection(person.db, "alerts"), where("userId", "==", person.uid), where("status", "==", "active")),
    );
    assert.deepEqual(
      open.docs.map((d) => d.id),
      [fresh.id],
    );
  });
});
