import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { mapsLink } from "@/lib/location";
import { colors } from "@/theme/colors";
import { LEAFLET_HTML, toMapState } from "./leaflet";
import type { SafetyMapProps } from "./types";

export type { MapCircle, MapMarker } from "./types";

type MapWindow = Window & { update?: (state: unknown) => void };

/** Web build: the same Leaflet page as native, in a same-origin iframe. */
export function SafetyMap(props: SafetyMapProps) {
  const { center, height = 260 } = props;
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const state = JSON.stringify(toMapState(props));

  useEffect(() => {
    if (ready && center) (ref.current?.contentWindow as MapWindow | null)?.update?.(JSON.parse(state));
  }, [ready, state, center]);

  if (!center) {
    return (
      <View style={{ height }} className="rounded-3xl bg-surface border border-white/10 items-center justify-center">
        <Text className="text-white/50 text-sm">Waiting for location…</Text>
      </View>
    );
  }

  return (
    <View style={{ height }} className="rounded-3xl overflow-hidden border border-white/10 bg-ink">
      <iframe
        ref={ref}
        title="map"
        srcDoc={LEAFLET_HTML}
        onLoad={() => setReady(true)}
        style={{ border: 0, width: "100%", height: "100%" }}
      />
      <Pressable
        onPress={() => Linking.openURL(mapsLink(center))}
        className="absolute top-2 left-2 bg-ink/80 rounded-full px-3 py-1 flex-row items-center"
      >
        <View className="w-1.5 h-1.5 rounded-full bg-brand mr-1.5" />
        <Text style={{ color: colors.brand }} className="text-[11px] font-bold">
          Live · Open in Google Maps
        </Text>
      </Pressable>
    </View>
  );
}
