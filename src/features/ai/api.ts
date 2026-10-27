import { callClaude, textOf } from "@/lib/claude";
import { config } from "@/lib/config";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
}

const SYSTEM_PROMPT = `You are Shield AI, the safety companion inside the Shield personal-safety app, used by people of every gender.
Give calm, short, practical safety guidance a stressed person can follow: at most 6 short bullet points or 4 sentences.
If someone is in immediate danger, first tell them to press the SOS button in the app or call 999 (Bangladesh national emergency), then give steps.
Useful app features you can point to: SOS button, Trusted Contacts, Timed Check-In, Track Route & share location, Fake Call, Danger Zone map, fall/shake detection.
Never claim you have contacted anyone yourself. Do not give medical or legal certainty; suggest professionals when relevant.`;

export const QUICK_QUESTIONS = [
  "I think I'm being followed",
  "Walking home alone at night",
  "What to do in an emergency",
  "Help me calm down",
  "Unsafe ride / taxi",
  "Someone is harassing me online",
];

export async function askAi(history: AiMessage[]): Promise<string> {
  const question = history[history.length - 1]?.text ?? "";
  if (!config.claudeApiKey) return offlineAnswer(question);

  const messages = history.slice(-10).map((m) => ({ role: m.role, content: m.text }));
  // The API requires the conversation to start with a user turn.
  while (messages.length > 0 && messages[0].role !== "user") messages.shift();
  if (messages.length === 0) return offlineAnswer(question);

  try {
    const res = await callClaude({
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages,
      // Chat-style guidance: low effort keeps replies fast.
      output_config: { effort: "low" },
    });
    if (res.stop_reason === "refusal") return offlineAnswer(question);
    return textOf(res) || offlineAnswer(question);
  } catch (e) {
    // No key, network failure or timeout: fall back to built-in guidance.
    console.warn(`Claude API: ${e instanceof Error ? e.message : String(e)}`);
    return offlineAnswer(question);
  }
}

/** Built-in guidance so the companion still helps with no key or no internet. */
export function offlineAnswer(question: string): string {
  const q = question.toLowerCase();
  if (/follow|stalk|behind me/.test(q)) {
    return [
      "• Head toward a busy, well-lit place: a shop, mosque, pharmacy or police box.",
      "• Don't go home directly if you're being followed.",
      "• Call a trusted contact and stay on the line, or start a Fake Call.",
      "• Cross the street or change direction to confirm you're being followed.",
      "• If you feel in danger, press SOS in Shield or call 999.",
    ].join("\n");
  }
  if (/night|alone|walk/.test(q)) {
    return [
      "• Start a Timed Check-In before you leave, so contacts are alerted if you don't arrive.",
      "• Share your live route with a trusted contact.",
      "• Stick to lit main roads and keep one earbud out.",
      "• Keep your phone charged and your keys ready.",
      "• Trust your instincts: change plans if a place feels wrong.",
    ].join("\n");
  }
  if (/taxi|ride|uber|pathao|cab|driver/.test(q)) {
    return [
      "• Check the plate and driver photo match before getting in.",
      "• Sit in the back and share your trip with a contact.",
      "• Keep the Track Route screen open so your location stays fresh.",
      "• If the route changes unexpectedly, ask to stop somewhere busy, and use SOS if needed.",
    ].join("\n");
  }
  if (/calm|panic|anxious|scared|afraid/.test(q)) {
    return [
      "You're doing the right thing by reaching out.",
      "• Breathe in for 4 seconds, hold for 4, out for 6. Repeat 4 times.",
      "• Name 5 things you can see around you.",
      "• If you're not safe right now, press SOS, and help will be alerted.",
    ].join("\n");
  }
  if (/online|harass|message|blackmail/.test(q)) {
    return [
      "• Don't reply or negotiate. Take screenshots with dates.",
      "• Block and report the account on the platform.",
      "• In Bangladesh, call 999 or the Police Cyber Support helpline; for violence against women and children call 109.",
      "• Tell someone you trust; you don't have to handle it alone.",
    ].join("\n");
  }
  return [
    "If you're in immediate danger, press the SOS button or call 999 now.",
    "• Move toward people and light.",
    "• Tell a trusted contact where you are.",
    "• Use Track Route to share your location.",
    "Tell me more about your situation and I'll guide you step by step.",
  ].join("\n");
}
