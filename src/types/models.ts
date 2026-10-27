// Domain models shared across features. They mirror the Firestore documents
// (and the Go backend's structs from the SheShield project) so every layer
// uses one shape, with no DTOs or mappers.

export type Gender = "female" | "male" | "other" | "unspecified";

/**
 * Shield is for everyone: any gender may pick any role.
 * - user: can raise SOS alerts
 * - helper: responds to nearby alerts
 * - user_helper: both, with an in-app mode switch
 */
export type UserType = "user" | "helper" | "user_helper";

export type AppMode = "user" | "helper";

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  gender: Gender;
  userType: UserType;
  address?: string;
  bloodGroup?: string;
  medicalNotes?: string;
  isHelperVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  helperActive?: boolean;
  responseRadiusKm?: number;
  location?: GeoPoint | null;
  createdAt: number;
  updatedAt: number;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  relation?: string;
  email?: string;
  createdAt: number;
}

export type AlertStatus = "active" | "accepted" | "resolved" | "cancelled";

export type AlertReason = "manual" | "checkin" | "fall" | "shake";

/** How far the accepting helper has got. Order matters. */
export type ResponseStage = "accepted" | "en_route" | "arrived" | "assisting";

export type SmsDelivery =
  | "auto_sent" // texted from the SIM automatically (Shield's Android build)
  | "partial" // automatic texts reached some contacts but not all
  | "sent" // SMS composer / share sheet opened and sent
  | "cancelled"
  | "unavailable"
  | "no_contacts"
  | "pending";

export interface SosAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userGender: Gender;
  alertType: "SOS";
  reason: AlertReason;
  riskLevel: "high" | "medium";
  status: AlertStatus;
  description: string;
  location: (GeoPoint & { accuracy?: number | null }) | null;
  bloodGroup?: string;
  medicalNotes?: string;
  contactsCount: number;
  smsDelivery: SmsDelivery;
  acceptedBy?: string | null;
  acceptedByName?: string | null;
  acceptedByPhone?: string | null;
  acceptedAt?: number | null;
  stage?: ResponseStage | null;
  helperLocation?: GeoPoint | null;
  resolvedAt?: number | null;
  resolvedBy?: "user" | "helper" | "timeout" | null;
  timestamp: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}
