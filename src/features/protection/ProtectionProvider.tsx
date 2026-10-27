import { Accelerometer } from "expo-sensors";
import { router, usePathname } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadJson, saveJson, StorageKeys } from "@/lib/storage";
import type { AlertReason } from "@/types/models";

export interface ProtectionSettings {
  fallDetection: boolean;
  shakeToSos: boolean;
}

const DEFAULTS: ProtectionSettings = { fallDetection: false, shakeToSos: false };

interface ProtectionContextValue {
  settings: ProtectionSettings;
  sensorAvailable: boolean;
  update: (patch: Partial<ProtectionSettings>) => void;
}

const ProtectionContext = createContext<ProtectionContextValue | null>(null);

export function useProtection() {
  const ctx = useContext(ProtectionContext);
  if (!ctx) throw new Error("useProtection must be used inside <ProtectionProvider>");
  return ctx;
}

// Accelerometer readings are in g (1 g = resting).
const FREE_FALL_G = 0.35;
const IMPACT_G = 2.7;
const FALL_WINDOW_MS = 1000;
const SHAKE_G = 2.3;
const SHAKES_NEEDED = 4;
const SHAKE_WINDOW_MS = 2000;
const COOLDOWN_MS = 30_000;

/**
 * Motion protection ported from SheShield's MovementDetector: a free-fall
 * followed by a hard impact reads as a fall; several sharp jolts in a row
 * read as a deliberate shake. Either opens the cancellable SOS countdown.
 * Runs while the app is open (foreground), which is what Expo Go allows.
 */
export function ProtectionProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [settings, setSettings] = useState<ProtectionSettings>(DEFAULTS);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    loadJson(StorageKeys.protection, DEFAULTS).then(setSettings);
    Accelerometer.isAvailableAsync()
      .then(setSensorAvailable)
      .catch(() => setSensorAvailable(false));
  }, []);

  const update = useCallback((patch: Partial<ProtectionSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveJson(StorageKeys.protection, next);
      return next;
    });
  }, []);

  const lastTrigger = useRef(0);
  const trigger = useCallback((reason: AlertReason) => {
    const now = Date.now();
    if (now - lastTrigger.current < COOLDOWN_MS || pathRef.current.startsWith("/sos")) return;
    lastTrigger.current = now;
    router.push({ pathname: "/sos", params: { reason } });
  }, []);

  const active = enabled && sensorAvailable && (settings.fallDetection || settings.shakeToSos);

  useEffect(() => {
    if (!active) return;
    let freeFallAt = 0;
    let shakes: number[] = [];

    Accelerometer.setUpdateInterval(60);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const g = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (settings.fallDetection) {
        if (g < FREE_FALL_G) freeFallAt = now;
        else if (g > IMPACT_G && freeFallAt && now - freeFallAt < FALL_WINDOW_MS) {
          freeFallAt = 0;
          trigger("fall");
          return;
        }
      }

      if (settings.shakeToSos && g > SHAKE_G) {
        shakes = [...shakes.filter((t) => now - t < SHAKE_WINDOW_MS), now];
        // Ignore samples from the same jolt (within 150 ms).
        shakes = shakes.filter((t, i) => i === 0 || t - shakes[i - 1] > 150);
        if (shakes.length >= SHAKES_NEEDED) {
          shakes = [];
          trigger("shake");
        }
      }
    });
    return () => sub.remove();
  }, [active, settings.fallDetection, settings.shakeToSos, trigger]);

  const value = useMemo(() => ({ settings, sensorAvailable, update }), [settings, sensorAvailable, update]);
  return <ProtectionContext.Provider value={value}>{children}</ProtectionContext.Provider>;
}
