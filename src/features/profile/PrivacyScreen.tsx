import { Camera, MapPin, Settings, Vibrate } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, ListRow, SectionTitle } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/theme/colors";

type PermissionState = "granted" | "denied" | "undetermined" | "unknown";

const STATE_LABEL: Record<PermissionState, string> = {
  granted: "Allowed",
  denied: "Blocked. Tap to open settings",
  undetermined: "Not asked yet. Tap to allow",
  unknown: "Not available on this device",
};

const DATA_WE_STORE = [
  "Your profile: name, email, phone, gender, role and emergency medical info.",
  "Trusted contacts you add (name, number, relationship).",
  "SOS alerts: time, reason and location while the alert is open.",
  "Chat messages between you and the helper on an alert.",
  "Helper ID photos (only if you apply to be a helper), used for verification.",
  "AI area briefings send only your area name (e.g. a neighbourhood and city) to Claude to search recent local news, never a live GPS trail. Briefings are cached on your phone for 12 hours.",
];

export default function PrivacyScreen() {
  const [location, setLocation] = useState<PermissionState>("unknown");
  const [camera, setCamera] = useState<PermissionState>("unknown");

  const refresh = useCallback(() => {
    Location.getForegroundPermissionsAsync()
      .then((p) => setLocation(p.status as PermissionState))
      .catch(() => setLocation("unknown"));
    ImagePicker.getCameraPermissionsAsync()
      .then((p) => setCamera(p.status as PermissionState))
      .catch(() => setCamera("unknown"));
  }, []);

  useFocusEffect(refresh);

  const handle = async (state: PermissionState, request: () => Promise<unknown>) => {
    if (state === "denied" && Platform.OS !== "web") {
      Linking.openSettings();
      return;
    }
    if (state !== "granted") {
      await request().catch(() => {});
      refresh();
    }
  };

  return (
    <Screen header={<Header title="Privacy & Permissions" subtitle="You stay in control" back />}>
      <View className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <ListRow
          icon={MapPin}
          color={location === "granted" ? colors.brand : colors.warn}
          label="Location"
          detail={`${STATE_LABEL[location]}. Needed for SOS and helper mode`}
          onPress={() => handle(location, Location.requestForegroundPermissionsAsync)}
        />
        <ListRow
          icon={Camera}
          color={camera === "granted" ? colors.brand : colors.warn}
          label="Camera"
          detail={`${STATE_LABEL[camera]}. Used for the helper selfie`}
          onPress={() => handle(camera, ImagePicker.requestCameraPermissionsAsync)}
        />
        <ListRow
          icon={Vibrate}
          label="Motion sensors"
          detail="Used only for fall & shake detection, on your phone"
          onPress={() => {}}
          last
        />
      </View>
      {Platform.OS !== "web" ? (
        <Button label="Open system settings" icon={Settings} variant="secondary" size="md" onPress={() => Linking.openSettings()} className="mt-4" />
      ) : null}

      <SectionTitle title="What Shield stores" />
      <Card>
        {DATA_WE_STORE.map((line) => (
          <View key={line} className="flex-row mb-2">
            <Text className="text-brand mr-2">•</Text>
            <Text className="text-white/70 text-sm leading-5 flex-1">{line}</Text>
          </View>
        ))}
        <Text className="text-white/45 text-xs leading-4 mt-2">
          Your location is only shared while an SOS is open or when you choose to share it. Trusted contacts receive
          texts from your own phone. Shield never sells your data.
        </Text>
      </Card>
    </Screen>
  );
}
