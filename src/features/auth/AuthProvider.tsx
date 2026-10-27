import { onAuthStateChanged, type User } from "firebase/auth";
import { onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth } from "@/lib/firebase";
import { loadValue, saveJson, StorageKeys } from "@/lib/storage";
import type { AppMode, AppUser } from "@/types/models";
import { signOut as apiSignOut, userDoc } from "./api";

type SessionStatus = "loading" | "signedOut" | "signedIn";

interface AuthContextValue {
  status: SessionStatus;
  /** The signed-in user's profile. Non-null whenever status is "signedIn". */
  user: AppUser | null;
  /** Which hat the person is wearing right now. */
  mode: AppMode;
  /** Only `user_helper` accounts can switch. */
  canSwitchMode: boolean;
  setMode: (mode: AppMode) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** For screens that only render when signed in. */
export function useCurrentUser(): AppUser {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser called while signed out");
  return user;
}

function normalize(id: string, data: Partial<AppUser>): AppUser {
  return {
    id,
    name: data.name ?? "Shield user",
    email: data.email ?? "",
    phone: data.phone ?? "",
    countryCode: data.countryCode ?? "+880",
    gender: data.gender ?? "unspecified",
    userType: data.userType ?? "user",
    address: data.address ?? "",
    bloodGroup: data.bloodGroup ?? "",
    medicalNotes: data.medicalNotes ?? "",
    isHelperVerified: data.isHelperVerified ?? false,
    verificationStatus: data.verificationStatus ?? (data.isHelperVerified ? "approved" : "none"),
    verificationNote: data.verificationNote,
    helperActive: data.helperActive ?? false,
    responseRadiusKm: data.responseRadiusKm ?? 5,
    location: data.location ?? null,
    createdAt: data.createdAt ?? Date.now(),
    updatedAt: data.updatedAt ?? Date.now(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = not known yet
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<AppUser | null | undefined>(undefined);
  const [preferredMode, setPreferredMode] = useState<AppMode | null>(null);

  useEffect(() => onAuthStateChanged(auth, setAuthUser), []);

  useEffect(() => {
    loadValue<AppMode>(StorageKeys.mode).then((m) => m && setPreferredMode(m));
  }, []);

  const uid = authUser?.uid;
  useEffect(() => {
    if (!uid) {
      setProfile(authUser === null ? null : undefined);
      return;
    }
    setProfile(undefined);
    return onSnapshot(
      userDoc(uid),
      (snap) => setProfile(snap.exists() ? normalize(snap.id, snap.data() as Partial<AppUser>) : null),
      () => setProfile(null),
    );
  }, [uid, authUser]);

  // A signed-in account without a profile document (mid sign-up) stays on
  // the auth screens until the profile write lands.
  const status: SessionStatus =
    authUser === undefined || (authUser && profile === undefined)
      ? "loading"
      : authUser && profile
        ? "signedIn"
        : "signedOut";

  const user = status === "signedIn" ? (profile ?? null) : null;
  const canSwitchMode = user?.userType === "user_helper";
  const mode: AppMode =
    user?.userType === "helper" ? "helper" : user?.userType === "user_helper" ? (preferredMode ?? "user") : "user";

  const setMode = useCallback((next: AppMode) => {
    setPreferredMode(next);
    saveJson(StorageKeys.mode, next);
  }, []);

  const signOut = useCallback(async () => {
    if (user?.helperActive) {
      await updateDoc(userDoc(user.id), { helperActive: false }).catch(() => {});
    }
    await apiSignOut();
  }, [user?.id, user?.helperActive]);

  const value = useMemo(
    () => ({ status, user, mode, canSwitchMode, setMode, signOut }),
    [status, user, mode, canSwitchMode, setMode, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
