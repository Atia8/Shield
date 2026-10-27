import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Mic, Phone, PhoneOff, Volume2 } from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Avatar, Chip } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { mmss } from "@/lib/format";
import { colors } from "@/theme/colors";

type Phase = "setup" | "waiting" | "ringing" | "talking";

const CALLERS = ["Mom", "Dad", "Brother", "Sister", "Best friend", "Office"];
const DELAYS = [
  { label: "Now", seconds: 0 },
  { label: "10 s", seconds: 10 },
  { label: "30 s", seconds: 30 },
  { label: "1 min", seconds: 60 },
];

/** Fake incoming call: an excuse to leave an uncomfortable situation. */
export default function FakeCallScreen() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [caller, setCaller] = useState("Mom");
  const [delay, setDelay] = useState(10);
  const [countdown, setCountdown] = useState(0);
  const [talkSeconds, setTalkSeconds] = useState(0);

  useEffect(() => {
    if (phase !== "waiting") return;
    if (countdown <= 0) {
      setPhase("ringing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "ringing") return;
    Vibration.vibrate([0, 800, 600], true);
    return () => Vibration.cancel();
  }, [phase]);

  useEffect(() => {
    if (phase !== "talking") return;
    const t = setInterval(() => setTalkSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const end = () => {
    Vibration.cancel();
    router.back();
  };

  if (phase === "setup" || phase === "waiting") {
    return (
      <Screen keyboard header={<Header title="Fake Call" subtitle="Get out of an awkward situation" subtitleColor="#EC4899" back="close" />}>
        <Text className="text-white/70 text-sm leading-5 mb-5">
          Your phone will ring with a realistic incoming call. Answer it and pretend to talk, giving you a reason to
          leave.
        </Text>
        <Text className="text-sm font-semibold text-white/90 mb-2">Who's calling?</Text>
        <View className="flex-row flex-wrap -m-1 mb-3">
          {CALLERS.map((c) => (
            <View key={c} className="w-1/3 p-1">
              <Chip label={c} selected={caller === c} onPress={() => setCaller(c)} />
            </View>
          ))}
        </View>
        <TextField label="Or type a name" placeholder="Caller name" value={caller} onChangeText={setCaller} maxLength={24} />

        <Text className="text-sm font-semibold text-white/90 mb-2">Ring in…</Text>
        <View className="flex-row -m-1 mb-8">
          {DELAYS.map((d) => (
            <View key={d.label} className="flex-1 p-1">
              <Chip label={d.label} selected={delay === d.seconds} onPress={() => setDelay(d.seconds)} />
            </View>
          ))}
        </View>

        {phase === "waiting" ? (
          <>
            <Text className="text-white text-center text-lg font-bold mb-4">Ringing in {countdown}s…</Text>
            <Text className="text-white/50 text-center text-xs mb-4">Lock your screen or put the phone away.</Text>
            <Button label="Cancel" variant="secondary" onPress={() => setPhase("setup")} />
          </>
        ) : (
          <Button
            label="SCHEDULE CALL"
            icon={Phone}
            onPress={() => {
              setCountdown(delay);
              setPhase(delay === 0 ? "ringing" : "waiting");
            }}
            disabled={!caller.trim()}
          />
        )}
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={["#1F2937", "#000000"]} style={StyleSheet.absoluteFill} />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-between py-16 w-full max-w-md self-center">
          <View className="items-center">
            <Text className="text-white/60 text-base mb-6">
              {phase === "ringing" ? "Incoming call…" : mmss(talkSeconds)}
            </Text>
            <Avatar name={caller || "?"} color="#9CA3AF" size={110} />
            <Text className="text-white text-4xl font-light mt-6">{caller || "Unknown"}</Text>
            <Text className="text-white/50 text-base mt-2">mobile</Text>
          </View>

          {phase === "ringing" ? (
            <View className="flex-row w-full justify-around px-10">
              <RoundButton color={colors.danger} label="Decline" onPress={end} icon={<PhoneOff color="white" size={30} />} />
              <RoundButton
                color="#22C55E"
                label="Accept"
                onPress={() => {
                  Vibration.cancel();
                  setPhase("talking");
                }}
                icon={<Phone color="white" size={30} />}
              />
            </View>
          ) : (
            <View className="items-center w-full">
              <View className="flex-row justify-around w-full px-10 mb-12">
                <RoundButton color="rgba(255,255,255,0.15)" label="Mute" onPress={() => {}} icon={<Mic color="white" size={26} />} />
                <RoundButton
                  color="rgba(255,255,255,0.15)"
                  label="Speaker"
                  onPress={() => {}}
                  icon={<Volume2 color="white" size={26} />}
                />
              </View>
              <RoundButton color={colors.danger} label="End" onPress={end} icon={<PhoneOff color="white" size={30} />} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function RoundButton({ color, label, onPress, icon }: { color: string; label: string; onPress: () => void; icon: ReactNode }) {
  return (
    <View className="items-center">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: color, alignItems: "center", justifyContent: "center" }}
      >
        {icon}
      </Pressable>
      <Text className="text-white/80 text-sm mt-2">{label}</Text>
    </View>
  );
}
