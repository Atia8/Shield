import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadValue, removeKey, saveJson, StorageKeys } from "@/lib/storage";

interface CheckInState {
  endsAt: number;
  durationMin: number;
  startedAt: number;
}

interface CheckInContextValue {
  checkIn: CheckInState | null;
  secondsLeft: number;
  start: (minutes: number) => void;
  extend: (minutes: number) => void;
  /** "I'm safe": ends the timer without an alert. */
  complete: () => void;
}

const CheckInContext = createContext<CheckInContextValue | null>(null);

export function useCheckIn() {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error("useCheckIn must be used inside <CheckInProvider>");
  return ctx;
}

/**
 * App-wide timed check-in. It lives above the navigator so it keeps running
 * while the person uses other screens, and survives app restarts. When it
 * expires it opens the SOS countdown ("Are you OK?") instead of alerting
 * silently, so a forgotten timer can still be cancelled.
 */
export function CheckInProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [checkIn, setCheckIn] = useState<CheckInState | null>(null);
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);

  useEffect(() => {
    loadValue<CheckInState>(StorageKeys.checkIn).then((saved) => saved && setCheckIn(saved));
  }, []);

  useEffect(() => {
    if (!checkIn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [checkIn]);

  const persist = useCallback((next: CheckInState | null) => {
    setCheckIn(next);
    fired.current = false;
    if (next) saveJson(StorageKeys.checkIn, next);
    else removeKey(StorageKeys.checkIn);
  }, []);

  useEffect(() => {
    if (!enabled && checkIn) persist(null); // signed out or switched to helper mode
  }, [enabled, checkIn, persist]);

  const secondsLeft = checkIn ? Math.max(0, Math.round((checkIn.endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!checkIn || !enabled || fired.current || checkIn.endsAt > now) return;
    fired.current = true;
    persist(null);
    router.push({ pathname: "/sos", params: { reason: "checkin" } });
  }, [checkIn, now, enabled, persist]);

  const value = useMemo<CheckInContextValue>(
    () => ({
      checkIn,
      secondsLeft,
      start: (minutes) => {
        const t = Date.now();
        setNow(t);
        persist({ startedAt: t, durationMin: minutes, endsAt: t + minutes * 60_000 });
      },
      extend: (minutes) => {
        if (!checkIn) return;
        persist({
          ...checkIn,
          durationMin: checkIn.durationMin + minutes,
          endsAt: checkIn.endsAt + minutes * 60_000,
        });
      },
      complete: () => persist(null),
    }),
    [checkIn, secondsLeft, persist],
  );

  return <CheckInContext.Provider value={value}>{children}</CheckInContext.Provider>;
}
