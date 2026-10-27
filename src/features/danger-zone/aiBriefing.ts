import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { callClaude, ClaudeError, textOf, type ClaudeResponse } from "@/lib/claude";
import { config } from "@/lib/config";
import { distanceKm } from "@/lib/location";
import { loadValue, saveJson } from "@/lib/storage";
import type { GeoPoint } from "@/types/models";

export type BriefingRisk = "low" | "medium" | "high" | "unknown";
export type HazardTime = "night" | "evening" | "day" | "any";

export interface AreaInfo {
  /** Stable cache key for the area (normalized label or rounded coordinates). */
  key: string;
  /** Human-readable name, e.g. "Boalia, Rajshahi". */
  label: string;
  city: string | null;
  region: string | null;
  countryCode: string | null;
  point: GeoPoint;
}

export interface AreaBriefing {
  area: string;
  riskLevel: BriefingRisk;
  headline: string;
  summary: string;
  hazards: { title: string; when: HazardTime; detail: string }[];
  tips: string[];
  sources: { title: string; url: string; date?: string }[];
  generatedAt: number;
}

export const BRIEFING_RISK_LABEL: Record<BriefingRisk, string> = {
  low: "Low risk",
  medium: "Be cautious",
  high: "High risk",
  unknown: "Not enough data",
};

export const BRIEFING_RISK_COLOR: Record<BriefingRisk, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
  unknown: "#94A3B8",
};

export const HAZARD_TIME_LABEL: Record<HazardTime, string> = {
  night: "At night",
  evening: "Evenings",
  day: "Daytime",
  any: "Any time",
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const cacheKey = (areaKey: string) => `shield.areaBriefing.${areaKey}`;

/** Turns a GPS fix into a neighbourhood-level area. Never throws. */
export async function describeArea(point: GeoPoint): Promise<AreaInfo> {
  const fallback: AreaInfo = {
    key: `${point.latitude.toFixed(2)},${point.longitude.toFixed(2)}`,
    label: `near ${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)}`,
    city: null,
    region: null,
    countryCode: null,
    point,
  };
  // The geocoder is native-only; the web build works from coordinates.
  if (Platform.OS === "web") return roundKey(fallback);
  try {
    const [place] = await Location.reverseGeocodeAsync(point);
    if (!place) return roundKey(fallback);
    const local = place.district || place.subregion || place.name;
    const city = place.city || place.region;
    const parts = [local, city].filter((p, i, all): p is string => !!p && all.indexOf(p) === i);
    if (parts.length === 0) return roundKey(fallback);
    const label = parts.join(", ");
    return {
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label,
      city: place.city,
      region: place.region,
      countryCode: place.isoCountryCode,
      point,
    };
  } catch {
    return roundKey(fallback);
  }
}

/** ~5 km buckets so coordinate-only areas don't refetch on every step. */
function roundKey(area: AreaInfo): AreaInfo {
  const lat = (Math.round(area.point.latitude / 0.05) * 0.05).toFixed(2);
  const lng = (Math.round(area.point.longitude / 0.05) * 0.05).toFixed(2);
  return { ...area, key: `geo-${lat}_${lng}` };
}

const inFlight = new Map<string, Promise<AreaBriefing>>();

/** Cached (12 h per area) AI safety briefing for an area. Throws a friendly Error. */
export async function getAreaBriefing(area: AreaInfo, force = false): Promise<AreaBriefing> {
  if (!force) {
    const cached = await loadValue<AreaBriefing>(cacheKey(area.key));
    if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) return cached;
  }
  const pending = inFlight.get(area.key);
  if (pending) return pending;

  const request = fetchBriefing(area)
    .then(async (briefing) => {
      await saveJson(cacheKey(area.key), briefing);
      return briefing;
    })
    .finally(() => inFlight.delete(area.key));
  inFlight.set(area.key, request);
  return request;
}

const SYSTEM_PROMPT = `You are the area-safety analyst inside Shield, a personal-safety app used by people of every gender.
Given the user's current area, use web search to find recent (last 12 months) news and reports about crime and public safety there: snatching, mugging, robbery, hijacking, harassment, assault, kidnapping, unsafe roads or transport, political unrest or clashes.
Prefer local and national news outlets and police statements. Search in English and, for Bangladesh, Bangla too.

Rules:
- Only report incidents that the search results actually describe. Never invent incidents, numbers, dates or URLs.
- If nothing specific to the neighbourhood turns up, say so and fall back to city-level context; use riskLevel "unknown" when there is too little evidence to judge.
- Be calm and practical, never alarmist. Write for someone standing in that area right now.
- Mention time-of-day patterns when the sources show them (e.g. snatching after dark).

Finish with ONLY a JSON object in a \`\`\`json code block, no text after it:
{
  "riskLevel": "low" | "medium" | "high" | "unknown",
  "headline": "one short sentence, max 90 characters",
  "summary": "2-3 sentences on what recent reports show",
  "hazards": [{ "title": "short name", "when": "night" | "evening" | "day" | "any", "detail": "one sentence" }],
  "tips": ["short practical tip"],
  "sources": [{ "title": "article title", "url": "https://...", "date": "YYYY-MM-DD" }]
}
At most 4 hazards, 4 tips and 5 sources. Every source must be a URL you found in the search results.`;

async function fetchBriefing(area: AreaInfo): Promise<AreaBriefing> {
  if (!config.claudeApiKey) throw new Error("AI briefing needs CLAUDE_API_KEY in .env.local.");

  const today = new Date().toISOString().slice(0, 10);
  const where = [area.label, area.region, area.countryCode].filter(Boolean).join(", ");
  const messages: { role: "user" | "assistant"; content: unknown }[] = [
    {
      role: "user",
      content: `Today is ${today}. I am in ${where} (GPS ${area.point.latitude.toFixed(4)}, ${area.point.longitude.toFixed(4)}). What should I know about safety here right now?`,
    },
  ];

  try {
    let res: ClaudeResponse | null = null;
    // Web search runs a server-side loop that may pause; resume it up to twice.
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await callClaude(
        {
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages,
          // No user_location: web search rejects some countries (e.g. BD);
          // the prompt already names the area and coordinates.
          tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
          output_config: { effort: "medium" },
        },
        120_000,
      );
      if (res.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: res.content ?? [] });
    }
    if (!res || res.stop_reason === "refusal") throw new Error("The AI couldn't produce a briefing for this area.");
    const parsed = parseBriefing(textOf(res));
    if (!parsed) throw new Error("The AI briefing came back incomplete. Try refreshing.");
    return { ...parsed, area: area.label, generatedAt: Date.now() };
  } catch (e) {
    if (e instanceof ClaudeError) {
      throw new Error(e.status === 401 ? "The Claude API key was rejected." : `AI briefing unavailable: ${e.message}`);
    }
    throw e;
  }
}

const RISKS: BriefingRisk[] = ["low", "medium", "high", "unknown"];
const TIMES: HazardTime[] = ["night", "evening", "day", "any"];

/** Lenient parse of the final ```json block (or the last {...} in the text). */
export function parseBriefing(text: string): Omit<AreaBriefing, "area" | "generatedAt"> | null {
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].pop()?.[1];
  const raw = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  const headline = str(data.headline);
  const summary = str(data.summary);
  if (!headline && !summary) return null;
  return {
    riskLevel: RISKS.includes(data.riskLevel as BriefingRisk) ? (data.riskLevel as BriefingRisk) : "unknown",
    headline: headline || summary,
    summary,
    hazards: list(data.hazards)
      .map((h) => ({
        title: str(h?.title),
        when: TIMES.includes(h?.when) ? (h.when as HazardTime) : "any",
        detail: str(h?.detail),
      }))
      .filter((h) => h.title)
      .slice(0, 4),
    tips: list(data.tips).map(str).filter(Boolean).slice(0, 4),
    sources: list(data.sources)
      .map((s) => ({ title: str(s?.title), url: str(s?.url), date: str(s?.date) || undefined }))
      .filter((s) => /^https?:\/\//.test(s.url))
      .slice(0, 5),
  };
}

/**
 * Briefing for wherever `fix` is. Re-geocodes only after ~400 m of movement
 * and fetches only when the area actually changes.
 */
export function useAreaBriefing(fix: GeoPoint | null) {
  const [area, setArea] = useState<AreaInfo | null>(null);
  const [briefing, setBriefing] = useState<AreaBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastGeocoded = useRef<GeoPoint | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!fix) return;
    if (lastGeocoded.current && distanceKm(lastGeocoded.current, fix) < 0.4) return;
    lastGeocoded.current = fix;
    describeArea(fix).then((next) => setArea((prev) => (prev?.key === next.key ? prev : next)));
  }, [fix?.latitude, fix?.longitude]);

  const load = useCallback(async (target: AreaInfo, force: boolean) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getAreaBriefing(target, force);
      if (id === requestId.current) setBriefing(result);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : "AI briefing unavailable.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (area) load(area, false);
  }, [area, load]);

  const refresh = useCallback(() => {
    if (area) load(area, true);
  }, [area, load]);

  return { area, briefing, loading, error, refresh };
}
