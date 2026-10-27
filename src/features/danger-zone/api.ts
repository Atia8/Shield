import { getDocs, query, where } from "firebase/firestore";
import { alertsCol, normalizeAlert } from "@/features/sos/api";
import { distanceKm } from "@/lib/location";
import type { GeoPoint } from "@/types/models";

export type RiskLevel = "low" | "medium" | "high";

export interface ZoneCell {
  id: string;
  center: GeoPoint;
  alertCount: number;
  nightShare: number; // fraction of alerts raised between 18:00 and 06:00
  riskLevel: RiskLevel;
  distanceKm: number;
}

/** ~550 m cells, same granularity as the Go backend's heat map. */
const CELL_DEG = 0.005;
export const LOOKBACK_DAYS = 365;

export const RISK_COLOR: Record<RiskLevel, string> = {
  low: "#F59E0B",
  medium: "#F97316",
  high: "#EF4444",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Some reports",
  medium: "Caution",
  high: "High risk",
};

function riskFor(count: number): RiskLevel {
  if (count >= 4) return "high";
  if (count >= 2) return "medium";
  return "low";
}

/**
 * Community danger map: past SOS alerts from the last year, bucketed into
 * grid cells, with each cell's distance from `center` (nearest first after
 * risk). Only cell counts are shown, never individual alert locations.
 * Pass `radiusKm: null` for every reported area.
 */
export async function loadDangerZones(center: GeoPoint, radiusKm: number | null = null): Promise<ZoneCell[]> {
  const since = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const snap = await getDocs(query(alertsCol, where("timestamp", ">=", since)));

  const cells = new Map<string, { lat: number; lng: number; count: number; night: number }>();
  for (const d of snap.docs) {
    const alert = normalizeAlert(d.id, d.data());
    if (!alert.location || alert.status === "cancelled") continue;
    if (radiusKm !== null && distanceKm(center, alert.location) > radiusKm) continue;
    const row = Math.floor(alert.location.latitude / CELL_DEG);
    const col = Math.floor(alert.location.longitude / CELL_DEG);
    const key = `${row}:${col}`;
    const hour = new Date(alert.timestamp).getHours();
    const cell = cells.get(key) ?? { lat: (row + 0.5) * CELL_DEG, lng: (col + 0.5) * CELL_DEG, count: 0, night: 0 };
    cell.count += 1;
    if (hour >= 18 || hour < 6) cell.night += 1;
    cells.set(key, cell);
  }

  return [...cells.entries()]
    .map(([id, c]) => {
      const point = { latitude: c.lat, longitude: c.lng };
      return {
        id,
        center: point,
        alertCount: c.count,
        nightShare: c.night / c.count,
        riskLevel: riskFor(c.count),
        distanceKm: distanceKm(center, point),
      };
    })
    .sort((a, b) => b.alertCount - a.alertCount || a.distanceKm - b.distanceKm);
}

/** Time-of-day hint shown alongside the map. */
export function timeOfDayRisk(date = new Date()): { label: string; color: string; tip: string } {
  const h = date.getHours();
  if (h >= 22 || h < 5) {
    return { label: "Late night", color: "#EF4444", tip: "Fewer people around. Prefer rides over walking and keep a check-in running." };
  }
  if (h >= 18) {
    return { label: "Evening", color: "#F59E0B", tip: "Stay on lit main roads and share your route with someone." };
  }
  return { label: "Daytime", color: "#10B981", tip: "Generally safer, but stay aware in crowded places." };
}
