import * as SMS from "expo-sms";
import { Platform, Share } from "react-native";
import { contactNumber } from "@/features/contacts/api";
import { sendDirectSms } from "@/lib/directSms";
import { getCurrentFix, mapsLink } from "@/lib/location";
import type { AppUser, GeoPoint, TrustedContact } from "@/types/models";

export function locationMessage(user: AppUser, point: GeoPoint) {
  return `📍 ${user.name} is sharing their location via Shield: ${mapsLink(point)}`;
}

export type ShareOutcome = "sent" | "cancelled" | "no_location" | "no_contacts" | "shared";

/**
 * Texts the current location to all trusted contacts (SMS composer), or
 * opens the share sheet where SMS isn't available.
 */
export async function shareLocationWithContacts(
  user: AppUser,
  contacts: TrustedContact[],
  point?: GeoPoint | null,
): Promise<ShareOutcome> {
  const fix = point ?? (await getCurrentFix());
  if (!fix) return "no_location";
  const message = locationMessage(user, fix);

  // Shield's Android build with SMS permission: send straight from the SIM.
  const auto = await sendDirectSms(contacts.map(contactNumber), message).catch(() => null);
  if (auto?.some((r) => r.ok)) return "sent";

  if (Platform.OS !== "web" && contacts.length > 0 && (await SMS.isAvailableAsync().catch(() => false))) {
    const { result } = await SMS.sendSMSAsync(contacts.map(contactNumber), message);
    return result === "cancelled" ? "cancelled" : "sent";
  }
  if (contacts.length === 0 && Platform.OS !== "web") return "no_contacts";
  const res = await Share.share({ message });
  return res.action === Share.dismissedAction ? "cancelled" : "shared";
}

export const SHARE_TOAST: Record<ShareOutcome, { text: string; type: "success" | "error" | "info" }> = {
  sent: { text: "Location sent to your contacts", type: "success" },
  shared: { text: "Location shared", type: "success" },
  cancelled: { text: "Sharing cancelled", type: "info" },
  no_location: { text: "Couldn't get your location. Check location permission.", type: "error" },
  no_contacts: { text: "Add a trusted contact first", type: "error" },
};
