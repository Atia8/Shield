import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import Constants from "expo-constants";
import { connectAuthEmulator, getAuth, initializeAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// Firebase web config is public by design; access is controlled by the
// Firestore security rules in /firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyB0lpYwh0cUZ9EY78OnFOwCyWceWoQu8KM",
  authDomain: "she111.firebaseapp.com",
  projectId: "she111",
  storageBucket: "she111.firebasestorage.app",
  messagingSenderId: "319786045312",
  appId: "1:319786045312:web:e732bf843a8b97404ebb65",
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

function createAuth(): Auth {
  if (Platform.OS === "web" || !isFirstInit) return getAuth(app);
  return initializeAuth(app, {
    // Only the React Native build of firebase/auth exports this helper.
    persistence: (FirebaseAuth as any).getReactNativePersistence(AsyncStorage),
  });
}

export const auth = createAuth();
export const db = getFirestore(app);

/**
 * Local development against the Firebase emulators (`npm run emulators`).
 * Phones reach the emulators on the same machine that serves the JS bundle.
 */
export const usingEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === "true";
if (usingEmulators && isFirstInit) {
  const devHost =
    Platform.OS === "web" ? "localhost" : (Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost");
  connectAuthEmulator(auth, `http://${devHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, devHost, 8080);
}
