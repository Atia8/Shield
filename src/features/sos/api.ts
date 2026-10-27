import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import * as SMS from "expo-sms";
import { useEffect, useMemo, useState } from "react";
import { Platform, Share } from "react-native";
import { contactNumber, fetchContacts } from "@/features/contacts/api";
import { sendDirectSms } from "@/lib/directSms";
import { db } from "@/lib/firebase";
import { getCurrentFix, mapsLink, type Fix } from "@/lib/location";
import type { AlertReason, AppUser, GeoPoint, SmsDelivery, SosAlert, TrustedContact } from "@/types/models";

export const alertsCol = collection(db, "alerts");
export const alertDoc = (id: string) => doc(db, "alerts", id);

export const OPEN_STATUSES = ["active", "accepted"] as const;

export function isOpen(alert: Pick<SosAlert, "status">) {
  return alert.status === "active" || alert.status === "accepted";
}

/**
 * An open alert with no activity (no live-location update, no helper
 * progress) for this long is treated as abandoned: helpers stop seeing it and
 * the owner's app closes it, so a forgotten SOS can't block the next one.
 */
export const OPEN_ALERT_TTL_MS = 6 * 60 * 60 * 1000;

export function isStale(alert: Pick<SosAlert, "timestamp" | "updatedAt">, now = Date.now()) {
  return now - Math.max(alert.timestamp, alert.updatedAt) > OPEN_ALERT_TTL_MS;
}

/** Open and still live: what the SOS screen, Home banner and helpers act on. */
export function isLive(alert: SosAlert, now = Date.now()) {
  return isOpen(alert) && !isStale(alert, now);
}

/** Closes a forgotten alert. History shows it as "Expired". */
function expireAlert(alertId: string) {
  const now = Date.now();
  return updateDoc(alertDoc(alertId), { status: "cancelled", resolvedBy: "timeout", resolvedAt: now, updatedAt: now });
}

export const REASON_LABEL: Record<AlertReason, string> = {
  manual: "SOS button",
  checkin: "Missed check-in",
  fall: "Fall detected",
  shake: "Shake-to-SOS",
};

export function normalizeAlert(id: string, data: Partial<SosAlert> & Record<string, any>): SosAlert {
  // Legacy SheShield alerts stored location as {latitude, longitude, address}
  // with 0/0 meaning "unknown".
  const loc = data.location;
  const hasLoc = loc && typeof loc.latitude === "number" && !(loc.latitude === 0 && loc.longitude === 0);
  return {
    id,
    userId: data.userId ?? "",
    userName: data.userName ?? "Shield user",
    userPhone: data.userPhone ?? "",
    userGender: data.userGender ?? "unspecified",
    alertType: "SOS",
    reason: data.reason ?? "manual",
    riskLevel: data.riskLevel ?? "high",
    status: (data.status ?? "active").toLowerCase() as SosAlert["status"],
    description: data.description ?? "",
    location: hasLoc ? { latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy ?? null } : null,
    bloodGroup: data.bloodGroup ?? "",
    medicalNotes: data.medicalNotes ?? "",
    contactsCount: data.contactsCount ?? 0,
    smsDelivery: data.smsDelivery ?? "pending",
    acceptedBy: data.acceptedBy ?? null,
    acceptedByName: data.acceptedByName ?? null,
    acceptedByPhone: data.acceptedByPhone ?? null,
    acceptedAt: data.acceptedAt ?? null,
    stage: data.stage ?? null,
    helperLocation: data.helperLocation ?? null,
    resolvedAt: data.resolvedAt ?? null,
    resolvedBy: data.resolvedBy ?? null,
    timestamp: data.timestamp ?? Date.now(),
    updatedAt: data.updatedAt ?? data.timestamp ?? Date.now(),
  };
}

/** Every alert the person has raised, newest first. */
export function useMyAlerts(uid: string | undefined) {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(alertsCol, where("userId", "==", uid)),
      (snap) => {
        const list = snap.docs.map((d) => normalizeAlert(d.id, d.data()));
        list.sort((a, b) => b.timestamp - a.timestamp);
        // Tidy up alerts that were left open and forgotten.
        for (const a of list) if (isOpen(a) && isStale(a)) expireAlert(a.id).catch(() => {});
        setAlerts(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uid]);

  const active = useMemo(() => alerts.find((a) => isLive(a)) ?? null, [alerts]);
  return { alerts, active, loading };
}

export function useAlert(id: string | undefined) {
  const [alert, setAlert] = useState<SosAlert | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      alertDoc(id),
      (snap) => {
        setAlert(snap.exists() ? normalizeAlert(snap.id, snap.data()) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [id]);
  return { alert, loading };
}

export function sosMessage(user: AppUser, fix: GeoPoint | null, reason: AlertReason): string {
  const why =
    reason === "checkin"
      ? "I missed my safety check-in"
      : reason === "fall"
        ? "A possible fall was detected on my phone"
        : "I need help";
  const where = fix ? `My location: ${mapsLink(fix)}` : "My location is unavailable right now.";
  return `🚨 SHIELD SOS from ${user.name}: ${why}. ${where} Please call me${user.phone ? ` (${user.countryCode} ${user.phone})` : ""} or contact emergency services (999).`;
}

export interface SosResult {
  alertId: string;
  contacts: TrustedContact[];
  fix: Fix | null;
  reused: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

/**
 * Raises an SOS. Safety-critical, so it degrades instead of failing:
 * - every read is time-boxed and a missing location never blocks it;
 * - the alert write is not awaited (offline it is queued and syncs later),
 *   so texting contacts from the SIM happens immediately;
 * - only one alert is open at a time: a second trigger returns the open one
 *   (forgotten alerts past OPEN_ALERT_TTL_MS are closed, not reused).
 */
export async function triggerSos(user: AppUser, reason: AlertReason): Promise<SosResult> {
  const [existing, contacts, fix] = await Promise.all([
    withTimeout(
      getDocs(query(alertsCol, where("userId", "==", user.id))).catch(() => null),
      4000,
      null,
    ),
    withTimeout(fetchContacts(user.id).catch(() => [] as TrustedContact[]), 4000, [] as TrustedContact[]),
    getCurrentFix(6000),
  ]);

  const mine = existing?.docs.map((d) => normalizeAlert(d.id, d.data())) ?? [];
  for (const a of mine) if (isOpen(a) && isStale(a)) expireAlert(a.id).catch(() => {});
  const open = mine.find((a) => isLive(a));
  if (open) {
    if (fix) updateAlertLocation(open.id, fix).catch(() => {});
    return { alertId: open.id, contacts, fix, reused: true };
  }

  const now = Date.now();
  const ref = doc(alertsCol);
  setDoc(ref, {
    userId: user.id,
    userName: user.name,
    userPhone: user.phone ? `${user.countryCode} ${user.phone}` : "",
    userGender: user.gender,
    alertType: "SOS",
    reason,
    riskLevel: "high",
    status: "active",
    description: `${REASON_LABEL[reason]}: ${user.name} needs help`,
    location: fix,
    bloodGroup: user.bloodGroup ?? "",
    medicalNotes: user.medicalNotes ?? "",
    contactsCount: contacts.length,
    smsDelivery: contacts.length ? "pending" : "no_contacts",
    acceptedBy: null,
    stage: null,
    timestamp: now,
    updatedAt: now,
  }).catch(() => {
    // Rejected writes (e.g. rules) surface on the active screen as a missing alert.
  });
  return { alertId: ref.id, contacts, fix, reused: false };
}

/**
 * Texts trusted contacts from the phone's SIM (works without mobile data).
 * In Shield's Android build with SMS permission the texts go out
 * automatically; otherwise (Expo Go, iOS, permission off, or every automatic
 * send failed) the OS composer opens and needs one tap. The result is
 * recorded honestly on the alert instead of claiming a blanket "sent".
 */
export async function textContacts(
  alertId: string | null,
  user: AppUser,
  contacts: TrustedContact[],
  fix: GeoPoint | null,
  reason: AlertReason,
): Promise<SmsDelivery> {
  const message = sosMessage(user, fix, reason);
  const auto = contacts.length ? await sendDirectSms(contacts.map(contactNumber), message).catch(() => null) : null;
  const autoSent = auto?.filter((r) => r.ok).length ?? 0;

  let delivery: SmsDelivery;
  if (contacts.length === 0) {
    delivery = "no_contacts";
  } else if (auto && autoSent > 0) {
    delivery = autoSent === auto.length ? "auto_sent" : "partial";
  } else if (Platform.OS !== "web" && (await SMS.isAvailableAsync().catch(() => false))) {
    try {
      const { result } = await SMS.sendSMSAsync(contacts.map(contactNumber), message);
      // Android reports "unknown" because the composer can't tell us.
      delivery = result === "cancelled" ? "cancelled" : "sent";
    } catch {
      delivery = "unavailable";
    }
  } else {
    // No SMS (web, tablets): fall back to the share sheet.
    try {
      const res = await Share.share({ message });
      delivery = res.action === Share.dismissedAction ? "cancelled" : "sent";
    } catch {
      delivery = "unavailable";
    }
  }
  if (alertId) {
    updateDoc(alertDoc(alertId), { smsDelivery: delivery, updatedAt: Date.now() }).catch(() => {});
  }
  return delivery;
}

/**
 * Follow-up text with the person's new position while an SOS is open. Only
 * sent automatically (Shield's Android build); never opens the composer.
 */
export async function textLocationUpdate(user: AppUser, contacts: TrustedContact[], fix: GeoPoint): Promise<boolean> {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const message = `📍 SHIELD update from ${user.name} (${time}): still need help. Now at ${mapsLink(fix)}`;
  const results = await sendDirectSms(contacts.map(contactNumber), message).catch(() => null);
  return !!results?.some((r) => r.ok);
}

export function updateAlertLocation(alertId: string, fix: Fix) {
  return updateDoc(alertDoc(alertId), {
    location: { latitude: fix.latitude, longitude: fix.longitude, accuracy: fix.accuracy },
    updatedAt: Date.now(),
  });
}

/** The person marks themselves safe (resolved) or cancels a false alarm. */
export function endAlert(alertId: string, outcome: "resolved" | "cancelled") {
  const now = Date.now();
  return updateDoc(alertDoc(alertId), {
    status: outcome,
    resolvedAt: now,
    resolvedBy: "user",
    updatedAt: now,
  });
}

export const SMS_LABEL: Record<SmsDelivery, { text: string; ok: boolean }> = {
  auto_sent: { text: "Texted your contacts automatically", ok: true },
  partial: { text: "Texted some contacts; others failed", ok: false },
  sent: { text: "Text opened & sent to contacts", ok: true },
  cancelled: { text: "Text to contacts was cancelled", ok: false },
  unavailable: { text: "SMS isn't available on this device", ok: false },
  no_contacts: { text: "No trusted contacts to text", ok: false },
  pending: { text: "Contacts haven't been texted yet", ok: false },
};
