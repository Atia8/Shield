import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

import {
    doc,
    setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

export async function login(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return await signOut(auth);
}

export async function signup(
  email: string,
  password: string,
  gender: string,
  userType: string
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const uid = credential.user.uid;

  await setDoc(doc(db, "users", uid), {
    email,
    gender,
    userType,
    name: email.split("@")[0],
    phone: "",
    address: "",
    isHelperVerified: false,
    helperLevel: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return credential;
}