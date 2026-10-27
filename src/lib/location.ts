import * as Location from "expo-location";
import { Linking, Platform } from "react-native";
import type { GeoPoint } from "@/types/models";

export type Fix = GeoPoint & { accuracy: number | null };

export async function ensureLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) return true;
    const asked = await Location.requestForegroundPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Best-effort current position. Never throws and never waits longer than
 * `timeoutMs`: an emergency must not be blocked by a slow GPS fix, so it
 * falls back to the last known position, then to null.
 */
export async function getCurrentFix(timeoutMs = 8000): Promise<Fix | null> {
  if (!(await ensureLocationPermission())) return null;

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  try {
    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      timeout,
    ]);
    if (fresh) return toFix(fresh);
  } catch {
    // fall through to last known
  }
  try {
    const last = await Location.getLastKnownPositionAsync();
    return last ? toFix(last) : null;
  } catch {
    return null;
  }
}

export function toFix(loc: Location.LocationObject): Fix {
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy ?? null,
  };
}

/** Subscribes to position updates. Returns an unsubscribe function. */
export async function watchFix(
  onFix: (fix: Fix) => void,
  options: { timeInterval?: number; distanceInterval?: number } = {},
): Promise<() => void> {
  if (!(await ensureLocationPermission())) return () => {};
  try {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: options.timeInterval ?? 10000,
        distanceInterval: options.distanceInterval ?? 15,
      },
      (loc) => onFix(toFix(loc)),
    );
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

export function mapsLink(point: GeoPoint): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
}

export function openDirections(to: GeoPoint) {
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${to.latitude},${to.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${to.latitude},${to.longitude}&travelmode=walking`;
  Linking.openURL(url).catch(() => Linking.openURL(mapsLink(to)));
}

/** Great-circle distance in kilometres (haversine). */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
