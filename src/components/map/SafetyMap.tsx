import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { mapsLink } from "@/lib/location";
import { colors } from "@/theme/colors";
import { LEAFLET_HTML, toMapState } from "./leaflet";
import type { SafetyMapProps } from "./types";

export type { MapCircle, MapMarker } from "./types";

/**
 * Live map drawn by Leaflet inside a WebView. Unlike Google Maps it needs no
 * API key, so tiles load in Expo Go and in release builds alike.
 */
export function SafetyMap(props: SafetyMapProps) {
  const { center, height = 260 } = props;
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const state = JSON.stringify(toMapState(props));

  useEffect(() => {
    if (ready && center) ref.current?.injectJavaScript(`window.update && window.update(${state}); true;`);
  }, [ready, state, center]);

  const onMessage = (e: WebViewMessageEvent) => {
    if (e.nativeEvent.data === "ready") setReady(true);
  };

  if (!center) {
    return (
      <View style={{ height }} className="rounded-3xl bg-surface border border-white/10 items-center justify-center">
        <Text className="text-white/50 text-sm">Waiting for location…</Text>
      </View>
    );
  }

  return (
    <View style={{ height }} className="rounded-3xl overflow-hidden border border-white/10 bg-ink">
      <WebView
        ref={ref}
        source={{ html: LEAFLET_HTML }}
        originWhitelist={["*"]}
        onMessage={onMessage}
        // The page reloads after an Android renderer crash; ask for state again.
        onLoadStart={() => setReady(false)}
        scrollEnabled={false}
        nestedScrollEnabled
        overScrollMode="never"
        setBuiltInZoomControls={false}
        style={{ flex: 1, backgroundColor: colors.ink }}
      />
      <Pressable
        onPress={() => Linking.openURL(mapsLink(center))}
        className="absolute top-2 left-2 bg-ink/80 rounded-full px-3 py-1 flex-row items-center"
        hitSlop={6}
      >
        <View className="w-1.5 h-1.5 rounded-full bg-brand mr-1.5" />
        <Text style={{ color: colors.brand }} className="text-[11px] font-bold">
          Live · Open in Google Maps
        </Text>
      </Pressable>
    </View>
  );
}
