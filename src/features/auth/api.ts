import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser, Gender, UserType } from "@/types/models";

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  countryCode: string;
  gender: Gender;
  userType: UserType;
}

export const userDoc = (uid: string) => doc(db, "users", uid);

/** Any role is open to any gender: Shield is for everyone. */
export const ROLE_OPTIONS: { value: UserType; title: string; description: string }[] = [
  {
    value: "user",
    title: "User",
    description: "Get protection: SOS alerts, trusted contacts, check-ins and safety tools.",
  },
  {
    value: "helper",
    title: "Helper",
    description: "Volunteer to respond to SOS alerts near you once your ID is verified.",
  },
  {
    value: "user_helper",
    title: "Both",
    description: "Stay protected and help others. Switch modes any time.",
  },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "unspecified", label: "Prefer not to say" },
];

export function isHelperRole(type: UserType) {
  return type === "helper" || type === "user_helper";
}

export function isUserRole(type: UserType) {
  return type === "user" || type === "user_helper";
}

export function roleLabel(type: UserType) {
  return type === "user_helper" ? "User & Helper" : type === "helper" ? "Helper" : "User";
}

export async function signUp(input: SignUpInput) {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const now = Date.now();
  const profile: Omit<AppUser, "id"> = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    countryCode: input.countryCode,
    gender: input.gender,
    userType: input.userType,
    address: "",
    bloodGroup: "",
    medicalNotes: "",
    isHelperVerified: false,
    verificationStatus: "none",
    helperActive: false,
    responseRadiusKm: 5,
    location: null,
    createdAt: now,
    updatedAt: now,
  };
  // Write the profile first: the session only becomes "ready" once it exists.
  await setDoc(userDoc(cred.user.uid), profile);
  updateAuthProfile(cred.user, { displayName: profile.name }).catch(() => {});
  return cred.user;
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await ensureProfile(cred.user.uid, cred.user.email ?? email, cred.user.displayName);
  return cred.user;
}

/**
 * Accounts created by the older SheShield apps (or an interrupted sign-up)
 * may lack a profile document; create a minimal one so the app can start.
 */
async function ensureProfile(uid: string, email: string, displayName: string | null) {
  const snap = await getDoc(userDoc(uid));
  if (snap.exists()) {
    const data = snap.data() as Partial<AppUser>;
    // Backfill fields that legacy SheShield documents don't have.
    const patch: Partial<AppUser> = {};
    if (!data.verificationStatus) patch.verificationStatus = data.isHelperVerified ? "approved" : "none";
    if (!data.countryCode) patch.countryCode = "+880";
    if (!data.userType) patch.userType = "user";
    if (Object.keys(patch).length) await updateDoc(userDoc(uid), patch);
    return;
  }
  const now = Date.now();
  await setDoc(userDoc(uid), {
    name: displayName || email.split("@")[0],
    email: email.toLowerCase(),
    phone: "",
    countryCode: "+880",
    gender: "unspecified",
    userType: "user",
    isHelperVerified: false,
    verificationStatus: "none",
    helperActive: false,
    responseRadiusKm: 5,
    location: null,
    createdAt: now,
    updatedAt: now,
  } satisfies Omit<AppUser, "id">);
}

export function signOut() {
  return firebaseSignOut(auth);
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export type ProfilePatch = Partial<
  Pick<
    AppUser,
    "name" | "phone" | "countryCode" | "address" | "bloodGroup" | "medicalNotes" | "userType" | "gender"
  >
>;

export async function updateProfile(uid: string, patch: ProfilePatch) {
  await updateDoc(userDoc(uid), { ...patch, updatedAt: Date.now() });
}
