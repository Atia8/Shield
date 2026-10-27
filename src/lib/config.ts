import Constants from "expo-constants";

// Runtime configuration from .env.local (see .env.example).
// Note: these values are bundled into the app, so they are not secret.

export const config = {
  /** CLAUDE_API_KEY, passed through app.config.js `extra`. */
  claudeApiKey: (Constants.expoConfig?.extra?.claudeApiKey as string | undefined) ?? "",
  /** National emergency number dialled from the SOS screens. */
  emergencyNumber: process.env.EXPO_PUBLIC_EMERGENCY_NUMBER || "999",
  /**
   * Presentation/demo convenience: approve helper verification right after
   * submission. Without it an admin approves in the Firebase console.
   */
  demoAutoVerify: process.env.EXPO_PUBLIC_DEMO_AUTO_VERIFY === "true",
};

export const EMERGENCY_HOTLINES = [
  { name: "National Emergency Service", number: "999", detail: "Police, fire, ambulance" },
  { name: "Violence Against Women & Children", number: "109", detail: "24/7 national helpline" },
  { name: "Child Helpline", number: "1098", detail: "Children in danger" },
  { name: "Government Information & Services", number: "333", detail: "Social issues, information" },
  { name: "Kaan Pete Roi", number: "09612119911", detail: "Emotional support (BD)" },
];
