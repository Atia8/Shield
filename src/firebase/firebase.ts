import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyB0lpYwh0cUZ9EY78OnFOwCyWceWoQu8KM",
  authDomain: "she111.firebaseapp.com",
  projectId: "she111",
  storageBucket: "she111.firebasestorage.app",
  messagingSenderId: "319786045312",
  appId: "1:319786045312:web:e732bf843a8b97404ebb65",
  
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);