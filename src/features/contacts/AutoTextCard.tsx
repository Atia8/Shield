import { MessageSquareText } from "lucide-react-native";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, Pill } from "@/components/ui/Card";
import { directSmsReady, directSmsSupported, enableDirectSms } from "@/lib/directSms";
import { colors } from "@/theme/colors";

/**
 * Turns on automatic SOS texts (Android build only). Hidden where the app
 * can't send SMS by itself (Expo Go, iOS, web): there the SMS app opens with
 * the message ready and one tap sends it.
 */
export function AutoTextCard() {
  const [ready, setReady] = useState(directSmsReady);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!directSmsSupported()) return null;

  const enable = async () => {
    setBusy(true);
    const ok = await enableDirectSms().catch(() => false);
    setReady(ok);
    setDenied(!ok);
    setBusy(false);
  };

  return (
    <Card tone={ready ? colors.brand : colors.warn} className="mb-5">
      <View className="flex-row items-center">
        <MessageSquareText color={ready ? colors.brand : colors.warn} size={22} />
        <Text className="text-white font-bold text-base ml-3 flex-1">Automatic SOS texts</Text>
        <Pill label={ready ? "On" : "Off"} color={ready ? colors.brand : colors.warn} />
      </View>
      <Text className="text-white/70 text-xs leading-5 mt-2">
        {ready
          ? "When you send an SOS, your contacts are texted straight away, no tap needed. While the SOS is open they also get your new location when you move."
          : "Let Shield send your SOS text by itself, so it goes out even if you can't reach your screen."}
      </Text>
      {ready ? null : denied ? (
        <Button
          label="Allow SMS in Settings"
          variant="secondary"
          size="md"
          onPress={() => Linking.openSettings()}
          className="mt-3"
        />
      ) : (
        <Button label="Turn on" size="md" loading={busy} onPress={enable} className="mt-3" />
      )}
    </Card>
  );
}
