import { requireOptionalNativeModule } from "expo";
import { PermissionsAndroid, Platform } from "react-native";

/**
 * Automatic SOS texts on Android: the local `modules/direct-sms` Expo module
 * sends straight from the SIM. It only exists in Shield's own Android build,
 * so in Expo Go, on iOS and on the web this is unavailable and callers fall
 * back to the SMS composer.
 */
interface DirectSmsNative {
  isAvailable(): boolean;
  hasPermission(): boolean;
  sendAsync(numbers: string[], message: string): Promise<SmsRecipientResult[]>;
}

export interface SmsRecipientResult {
  number: string;
  ok: boolean;
  /** Handed to the network but not yet confirmed (slow signal). */
  queued?: boolean;
  error?: string;
}

const native = Platform.OS === "android" ? requireOptionalNativeModule<DirectSmsNative>("DirectSms") : null;

/** True in Shield's Android build on a phone with a SIM. */
export function directSmsSupported(): boolean {
  try {
    return !!native && native.isAvailable();
  } catch {
    return false;
  }
}

export function directSmsReady(): boolean {
  try {
    return directSmsSupported() && native!.hasPermission();
  } catch {
    return false;
  }
}

/** Asks for "send SMS" permission. Returns whether automatic texts are on. */
export async function enableDirectSms(): Promise<boolean> {
  if (!directSmsSupported()) return false;
  if (directSmsReady()) return true;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.SEND_SMS, {
    title: "Send SOS texts automatically?",
    message:
      "When you send an SOS, Shield texts your trusted contacts your location straight away, without you having to tap Send.",
    buttonPositive: "Allow",
    buttonNegative: "Not now",
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** Sends `message` to every number. Null when automatic texts aren't available. */
export async function sendDirectSms(numbers: string[], message: string): Promise<SmsRecipientResult[] | null> {
  if (!directSmsReady() || numbers.length === 0) return null;
  return native!.sendAsync(numbers, message);
}
