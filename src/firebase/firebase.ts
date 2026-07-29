import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyB0lpYwh0cUZ9EY78OnFOwCyWceWoQu8KM",
  authDomain: "she111.firebaseapp.com",
  projectId: "she111",
  storageBucket: "she111.firebasestorage.app",
  messagingSenderId: "319786045312",
  appId: "1:319786045312:web:e732bf843a8b97404ebb65",
};

const app = initializeApp(firebaseConfig);

// Conditionally initialize Firebase Auth based on the current platform
export const auth =
  Platform.OS === "web"
    ? getAuth(app) // On Web: Firebase automatically uses the browser's native storage
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage), // On Mobile: Use AsyncStorage
      });

export const db = getFirestore(app);
export const functions = getFunctions(app);
