// Seeds the local Firebase emulators with two demo accounts for testing the
// person ↔ helper flow in two app windows. Emulator only, never production.
//
//   npm run emulators            (in one terminal)
//   node tests/seed-emulator.mjs (in another)
//
// Accounts (emulator-only test values):
//   person@shield.test / shield-test-123   regular user with one trusted contact
//   helper@shield.test / shield-test-123   verified user + helper
import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { addDoc, collection, connectFirestoreEmulator, doc, initializeFirestore, setDoc } from "firebase/firestore";

const PASSWORD = "shield-test-123";
const RAJSHAHI = { latitude: 24.3625, longitude: 88.6049 };

async function seed(email, profile, contact) {
  const app = initializeApp({ apiKey: "demo-key", projectId: "she111" }, email);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = initializeFirestore(app, {});
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD).catch(() =>
    signInWithEmailAndPassword(auth, email, PASSWORD),
  );
  const uid = cred.user.uid;
  await setDoc(doc(db, "users", uid), { id: uid, email, createdAt: Date.now(), ...profile });
  if (contact) await addDoc(collection(db, "users", uid, "contacts"), { ...contact, createdAt: Date.now() });
  await deleteApp(app);
  console.log(`seeded ${email} (${uid})`);
}

await seed(
  "person@shield.test",
  {
    name: "Rina Person",
    phone: "1711111111",
    countryCode: "+880",
    gender: "female",
    userType: "user",
    isHelperVerified: false,
    verificationStatus: "none",
    helperActive: false,
  },
  { name: "Mum", phone: "1722222222", countryCode: "+880" },
);
await seed("helper@shield.test", {
  name: "Karim Helper",
  phone: "1733333333",
  countryCode: "+880",
  gender: "male",
  userType: "user_helper",
  isHelperVerified: true,
  verificationStatus: "approved",
  helperActive: false,
  responseRadiusKm: 5,
  location: RAJSHAHI,
});
process.exit(0);
