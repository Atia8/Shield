import type { GeoPoint } from "@/types/models";

export interface MapMarker {
  id: string;
  point: GeoPoint;
  color: string;
  title: string;
  description?: string;
}

export interface MapCircle {
  id: string;
  point: GeoPoint;
  radiusMeters: number;
  color: string;
}

export interface SafetyMapProps {
  center: GeoPoint | null;
  markers?: MapMarker[];
  circles?: MapCircle[];
  /** Your own position: drawn as a pulsing blue dot with its GPS accuracy. */
  userLocation?: (GeoPoint & { accuracy?: number | null }) | null;
  /** Route walked so far, drawn as a line. */
  path?: GeoPoint[];
  /** Latitude span shown around the center. */
  span?: number;
  height?: number;
  /** Re-center when `center` changes (live tracking). */
  follow?: boolean;
  /** Zoom so all of these points are visible (overrides `span`). */
  fitPoints?: GeoPoint[];
}

/** Center + span that cover every point, with some padding. */
export function regionFor(points: GeoPoint[], minSpan = 0.01) {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(minSpan, (maxLat - minLat) * 1.4),
    longitudeDelta: Math.max(minSpan, (maxLng - minLng) * 1.4),
  };
}
