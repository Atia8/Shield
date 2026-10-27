import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Activity, Clock, Siren, Vibrate } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { directSmsReady } from "@/lib/directSms";
import { colors } from "@/theme/colors";
import type { AlertReason } from "@/types/models";
import { textContacts, triggerSos } from "./api";

const COPY: Record<AlertReason, { title: string; subtitle: string; seconds: number; icon: typeof Siren }> = {
  manual: { title: "Sending SOS", subtitle: "Your contacts and nearby helpers will be alerted.", seconds: 5, icon: Siren },
  checkin: {
    title: "You missed your check-in",
    subtitle: "Are you OK? If you don't respond, an SOS will be sent.",
    seconds: 15,
    icon: Clock,
  },
  fall: {
    title: "Did you fall?",
    subtitle: "A hard fall was detected. If you don't respond, an SOS will be sent.",
    seconds: 15,
    icon: Activity,
  },
  shake: { title: "Shake detected", subtitle: "Sending an SOS unless you cancel.", seconds: 5, icon: Vibrate },
};

type Phase = "counting" | "sending";

/** Cancellable countdown before any alert goes out (5 s, or 15 s for automatic triggers). */
export default function SosCountdownScreen() {
  const user = useCurrentUser();
  const params = useLocalSearchParams<{ reason?: string }>();
  const reason: AlertReason = (["manual", "checkin", "fall", "shake"] as const).includes(params.reason as AlertReason)
    ? (params.reason as AlertReason)
    : "manual";
  const copy = COPY[reason];

  const [secondsLeft, setSecondsLeft] = useState(copy.seconds);
  const [phase, setPhase] = useState<Phase>("counting");
  const [status, setStatus] = useState("Getting your location…");
  const started = useRef(false);

  const send = async () => {
    if (started.current) return;
    started.current = true;
    setPhase("sending");
    Vibration.cancel();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    try {
      const result = await triggerSos(user, reason);
      setStatus(
        !result.contacts.length
          ? "Alerting nearby helpers…"
          : directSmsReady()
            ? "Texting your contacts…"
            : "Opening a text to your contacts…",
      );
      // Text contacts on every trigger, including a repeat press while an SOS
      // is already open: the newest location goes out each time.
      await textContacts(result.alertId, user, result.contacts, result.fix, reason);
    } catch {
      // The active screen shows what did and didn't go out.
    }
    router.replace("/sos-active");
  };

  useEffect(() => {
    if (phase !== "counting") return;
    if (secondsLeft <= 0) {
      send();
      return;
    }
    Vibration.vibrate(reason === "manual" ? 120 : 400);
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, phase]);

  useEffect(() => () => Vibration.cancel(), []);

  const cancel = () => {
    Vibration.cancel();
    router.back();
  };

  const Icon = copy.icon;
  const progress = secondsLeft / copy.seconds;

  return (
    <View className="flex-1 bg-ink">
      <LinearGradient colors={["#450A0A", colors.ink]} style={StyleSheet.absoluteFill} />
      <SafeAreaView className="flex-1">
        <View className="flex-1 w-full max-w-md self-center px-6 justify-between py-8">
          <View className="items-center mt-6">
            <View className="w-16 h-16 rounded-2xl bg-danger/20 border border-danger/40 items-center justify-center mb-5">
              <Icon color={colors.danger} size={32} />
            </View>
            <Text className="text-white text-3xl font-black text-center">{copy.title}</Text>
            <Text className="text-white/70 text-base text-center mt-3 leading-6 px-2">{copy.subtitle}</Text>
          </View>

          <View className="items-center">
            {phase === "counting" ? (
              <View
                className="w-56 h-56 rounded-full items-center justify-center border-8"
                style={{ borderColor: `rgba(239,68,68,${0.25 + 0.75 * progress})` }}
                accessibilityLiveRegion="assertive"
              >
                <Text className="text-white font-black" style={{ fontSize: 88 }}>
                  {secondsLeft}
                </Text>
                <Text className="text-white/60 font-bold text-xs tracking-widest uppercase">seconds</Text>
              </View>
            ) : (
              <View className="w-56 h-56 rounded-full items-center justify-center bg-danger/15 border-8 border-danger">
                <ActivityIndicator color="white" size="large" />
                <Text className="text-white font-bold mt-4 text-center px-6">{status}</Text>
              </View>
            )}
          </View>

          <View>
            {phase === "counting" ? (
              <>
                <Button
                  label={reason === "manual" ? "CANCEL" : "I'M OK, CANCEL"}
                  variant="secondary"
                  onPress={cancel}
                  className="mb-3"
                />
                <Button label="SEND SOS NOW" variant="danger" icon={Siren} onPress={send} />
              </>
            ) : (
              <Text className="text-white/50 text-center text-sm">
                Stay where it's safest. Help is being alerted.
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
