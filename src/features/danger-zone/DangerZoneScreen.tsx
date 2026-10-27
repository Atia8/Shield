import { MapPin, RefreshCw, ShieldCheck, Sun } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafetyMap, type MapCircle, type MapMarker } from "@/components/map/SafetyMap";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, ErrorBanner, LoadingView, SectionTitle } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { errorMessage } from "@/lib/format";
import { formatDistance, getCurrentFix, type Fix } from "@/lib/location";
import { colors, withAlpha } from "@/theme/colors";
import { useAreaBriefing } from "./aiBriefing";
import { AreaBriefingCard } from "./AreaBriefingCard";
import { loadDangerZones, RISK_COLOR, RISK_LABEL, timeOfDayRisk, type ZoneCell } from "./api";

// "Nationwide" covers Bangladesh from anywhere inside it while leaving out
// stray far-away points (e.g. emulator test alerts from other countries).
const RADIUS_OPTIONS = [
  { km: 5, label: "5 km" },
  { km: 25, label: "25 km" },
  { km: 100, label: "100 km" },
  { km: 600, label: "Nationwide" },
];

export default function DangerZoneScreen() {
  const [fix, setFix] = useState<Fix | null>(null);
  const [allZones, setAllZones] = useState<ZoneCell[]>([]);
  const [radiusKm, setRadiusKm] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeRisk = timeOfDayRisk();
  const ai = useAreaBriefing(fix);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const here = await getCurrentFix();
      setFix(here);
      if (!here) {
        setError("Turn on location to see danger zones around you.");
        return;
      }
      setAllZones(await loadDangerZones(here));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const zones = allZones.filter((z) => z.distanceKm <= radiusKm);
  const nearestOutside = zones.length === 0 ? [...allZones].sort((a, b) => a.distanceKm - b.distanceKm)[0] : undefined;

  const circles: MapCircle[] = zones.map((z) => ({
    id: z.id,
    point: z.center,
    radiusMeters: 280,
    color: RISK_COLOR[z.riskLevel],
  }));
  // Pins stay visible at any zoom level; circles show the area at close range.
  const markers: MapMarker[] = zones.slice(0, 40).map((z) => ({
    id: `pin-${z.id}`,
    point: z.center,
    color: RISK_COLOR[z.riskLevel],
    title: RISK_LABEL[z.riskLevel],
    description: `${z.alertCount} alert${z.alertCount === 1 ? "" : "s"} in the last year`,
  }));
  // Zoom to show you plus every zone in range (or the radius itself if empty).
  const fitPoints = fix
    ? zones.length > 0
      ? [fix, ...zones.map((z) => z.center)]
      : [
          fix,
          { latitude: fix.latitude + radiusKm / 111, longitude: fix.longitude },
          { latitude: fix.latitude - radiusKm / 111, longitude: fix.longitude },
        ]
    : undefined;

  return (
    <Screen
      header={
        <Header title="Danger Zones" subtitle="AI news briefing + community SOS reports" subtitleColor={colors.warn} back />
      }
    >
      <AreaBriefingCard area={ai.area} briefing={ai.briefing} loading={ai.loading} error={ai.error} onRefresh={ai.refresh} />

      <Text className="text-white font-extrabold text-base mb-3">Community SOS reports</Text>
      <View className="flex-row mb-3">
        {RADIUS_OPTIONS.map((opt) => {
          const selected = radiusKm === opt.km;
          return (
            <Pressable
              key={opt.km}
              onPress={() => setRadiusKm(opt.km)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`flex-1 py-2 rounded-xl mr-1.5 items-center border ${
                selected ? "bg-warn border-warn" : "bg-white/5 border-white/10"
              }`}
            >
              <Text className={`text-xs font-bold ${selected ? "text-ink" : "text-white/70"}`}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SafetyMap center={fix} userLocation={fix} circles={circles} markers={markers} fitPoints={fitPoints} span={0.02} height={320} />

      <View className="flex-row justify-center mt-3">
        {(["low", "medium", "high"] as const).map((r) => (
          <View key={r} className="flex-row items-center mx-2.5">
            <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: RISK_COLOR[r] }} />
            <Text className="text-white/60 text-xs">{RISK_LABEL[r]}</Text>
          </View>
        ))}
      </View>

      <Card tone={timeRisk.color} className="mt-5">
        <View className="flex-row items-center">
          <Sun color={timeRisk.color} size={20} />
          <Text className="text-white font-bold ml-2">Right now: {timeRisk.label}</Text>
        </View>
        <Text className="text-white/70 text-xs leading-5 mt-1.5">{timeRisk.tip}</Text>
      </Card>

      <SectionTitle title={`Zones within ${RADIUS_OPTIONS.find((o) => o.km === radiusKm)?.label ?? `${radiusKm} km`}`} action="Refresh" onAction={load} />
      {error ? <ErrorBanner message={error} /> : null}
      {loading ? (
        <LoadingView label="Analysing reports near you…" />
      ) : zones.length === 0 && !error ? (
        <EmptyState
          icon={ShieldCheck}
          title="No reported incidents in this range"
          message={
            nearestOutside
              ? `The nearest reported area is ${formatDistance(nearestOutside.distanceKm)} away.`
              : "No SOS alerts with a location have been raised in the last year."
          }
        >
          {nearestOutside ? (
            <Button
              label="Show nationwide"
              variant="secondary"
              size="md"
              onPress={() => setRadiusKm(RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1].km)}
            />
          ) : null}
        </EmptyState>
      ) : (
        zones.slice(0, 20).map((z) => (
          <View
            key={z.id}
            className="flex-row items-center rounded-2xl p-4 mb-2.5 border"
            style={{
              backgroundColor: withAlpha(RISK_COLOR[z.riskLevel], 0.08),
              borderColor: withAlpha(RISK_COLOR[z.riskLevel], 0.3),
            }}
          >
            <MapPin color={RISK_COLOR[z.riskLevel]} size={20} />
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold">{RISK_LABEL[z.riskLevel]}</Text>
              <Text className="text-white/60 text-xs mt-0.5">
                {z.alertCount} alert{z.alertCount === 1 ? "" : "s"} in the last year
                {z.nightShare >= 0.5 ? " · mostly at night" : ""}
              </Text>
            </View>
            <Text className="text-white/70 text-sm font-bold">{formatDistance(z.distanceKm)}</Text>
          </View>
        ))
      )}

      <Text className="text-white/35 text-[11px] leading-4 mt-4">
        Zones are built from past Shield SOS alerts grouped into ~500 m areas. Individual alert locations are never
        shown.
      </Text>
      {error ? <Button label="Try again" icon={RefreshCw} variant="secondary" size="md" onPress={load} className="mt-4" /> : null}
    </Screen>
  );
}
