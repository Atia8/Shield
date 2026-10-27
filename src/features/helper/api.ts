import { onSnapshot, query, runTransaction, updateDoc, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { userDoc } from "@/features/auth/api";
import { alertDoc, alertsCol, isStale, normalizeAlert } from "@/features/sos/api";
import { db } from "@/lib/firebase";
import { distanceKm } from "@/lib/location";
import type { AppUser, GeoPoint, ResponseStage, SosAlert } from "@/types/models";

export const RADIUS_OPTIONS = [1, 3, 5, 10, 25];

export const STAGES: { value: ResponseStage; label: string; description: string }[] = [
  { value: "accepted", label: "Accepted", description: "You took this alert" },
  { value: "en_route", label: "On my way", description: "Heading to the person" },
  { value: "arrived", label: "Arrived", description: "You're at the location" },
  { value: "assisting", label: "Assisting", description: "Helping in person" },
];

export function stageIndex(stage: ResponseStage | null | undefined) {
  return Math.max(0, STAGES.findIndex((s) => s.value === (stage ?? "accepted")));
}

export function canAcceptAlerts(user: AppUser) {
  return user.isHelperVerified || user.verificationStatus === "approved";
}

export function setHelperActive(uid: string, active: boolean, location?: GeoPoint | null) {
  return updateDoc(userDoc(uid), {
    helperActive: active,
    ...(location ? { location: { latitude: location.latitude, longitude: location.longitude } } : {}),
    updatedAt: Date.now(),
  });
}

export function updateHelperLocation(uid: string, location: GeoPoint) {
  return updateDoc(userDoc(uid), {
    location: { latitude: location.latitude, longitude: location.longitude },
  });
}

export function setResponseRadius(uid: string, km: number) {
  return updateDoc(userDoc(uid), { responseRadiusKm: km });
}

export interface NearbyAlert {
  alert: SosAlert;
  distanceKm: number | null;
}

/**
 * Open alerts within the helper's radius, nearest first. Alerts without a
 * location fix are still shown (a missing GPS fix must never hide an SOS).
 */
export function useNearbyAlerts(helperId: string, position: GeoPoint | null, radiusKm: number, enabled: boolean) {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      query(alertsCol, where("status", "==", "active")),
      (snap) => {
        setAlerts(snap.docs.map((d) => normalizeAlert(d.id, d.data())));
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [enabled]);

  const nearby = useMemo<NearbyAlert[]>(() => {
    const now = Date.now();
    return alerts
      .filter((a) => a.userId !== helperId && !isStale(a, now))
      .map((alert) => ({
        alert,
        distanceKm: position && alert.location ? distanceKm(position, alert.location) : null,
      }))
      .filter((n) => n.distanceKm === null || n.distanceKm <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [alerts, helperId, position?.latitude, position?.longitude, radiusKm]);

  return { nearby, loading, error };
}

/** Alerts this helper has accepted (current and past), newest first. */
export function useMyResponses(helperId: string | undefined) {
  const [responses, setResponses] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!helperId) return;
    return onSnapshot(
      query(alertsCol, where("acceptedBy", "==", helperId)),
      (snap) => {
        const list = snap.docs.map((d) => normalizeAlert(d.id, d.data()));
        list.sort((a, b) => (b.acceptedAt ?? b.timestamp) - (a.acceptedAt ?? a.timestamp));
        setResponses(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [helperId]);

  const current = useMemo(() => responses.find((r) => r.status === "accepted") ?? null, [responses]);
  const stats = useMemo(
    () => ({
      total: responses.length,
      resolved: responses.filter((r) => r.status === "resolved").length,
    }),
    [responses],
  );
  return { responses, current, stats, loading };
}

/**
 * Accept inside a transaction so two helpers tapping at once can't both
 * win: only an alert that is still "active" can be taken.
 */
export async function acceptAlert(alertId: string, helper: AppUser, position: GeoPoint | null) {
  await runTransaction(db, async (tx) => {
    const ref = alertDoc(alertId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("This alert no longer exists.");
    const status = String(snap.data().status ?? "").toLowerCase();
    if (status !== "active") {
      throw new Error(
        status === "accepted" ? "Another helper already accepted this alert." : "This alert has already ended.",
      );
    }
    const now = Date.now();
    tx.update(ref, {
      status: "accepted",
      acceptedBy: helper.id,
      acceptedByName: helper.name,
      acceptedByPhone: helper.phone ? `${helper.countryCode} ${helper.phone}` : "",
      acceptedAt: now,
      stage: "accepted",
      helperLocation: position ? { latitude: position.latitude, longitude: position.longitude } : null,
      updatedAt: now,
    });
  });
}

export function setStage(alertId: string, stage: ResponseStage) {
  return updateDoc(alertDoc(alertId), { stage, updatedAt: Date.now() });
}

export function updateResponderLocation(alertId: string, position: GeoPoint) {
  return updateDoc(alertDoc(alertId), {
    helperLocation: { latitude: position.latitude, longitude: position.longitude },
  });
}

/** Hand the alert back so another helper can take it. */
export function releaseAlert(alertId: string) {
  return updateDoc(alertDoc(alertId), {
    status: "active",
    acceptedBy: null,
    acceptedByName: null,
    acceptedByPhone: null,
    acceptedAt: null,
    stage: null,
    helperLocation: null,
    updatedAt: Date.now(),
  });
}

export function resolveAsHelper(alertId: string) {
  const now = Date.now();
  return updateDoc(alertDoc(alertId), {
    status: "resolved",
    resolvedAt: now,
    resolvedBy: "helper",
    updatedAt: now,
  });
}
