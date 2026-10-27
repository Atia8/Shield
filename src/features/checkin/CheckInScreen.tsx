import { router } from "expo-router";
import { Plus, ShieldCheck, Timer, TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, Chip } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { useContacts } from "@/features/contacts/api";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { ensureLocationPermission } from "@/lib/location";
import { mmss } from "@/lib/format";
import { colors, withAlpha } from "@/theme/colors";
import { useCheckIn } from "./CheckInProvider";

const PRESETS = [5, 15, 30, 45, 60, 90];

export default function CheckInScreen() {
  const user = useCurrentUser();
  const toast = useToast();
  const { contacts } = useContacts(user.id);
  const { checkIn, secondsLeft, start, extend, complete } = useCheckIn();
  const [minutes, setMinutes] = useState(30);
  const [custom, setCustom] = useState("");

  const chosen = custom ? Math.min(600, Math.max(1, parseInt(custom, 10) || 0)) : minutes;

  const begin = async () => {
    await ensureLocationPermission(); // so the SOS can include a location fix
    start(chosen);
    toast(`Check-in set for ${chosen} min`, "info");
  };

  if (checkIn) {
    const total = checkIn.durationMin * 60;
    const progress = total > 0 ? secondsLeft / total : 0;
    const tone = secondsLeft <= 120 ? colors.danger : secondsLeft <= 300 ? colors.warn : colors.brand;
    return (
      <Screen header={<Header title="Timed Check-In" subtitle="Timer running" subtitleColor={tone} back />}>
        <View
          className="w-full border-2 rounded-[32px] p-6 items-center mb-5"
          style={{ backgroundColor: withAlpha(tone, 0.08), borderColor: withAlpha(tone, 0.3) }}
        >
          <Timer color={tone} size={44} />
          <Text className="text-white text-6xl font-black my-3 tracking-wider" accessibilityLiveRegion="polite">
            {mmss(secondsLeft)}
          </Text>
          <Text className="text-white/50 font-bold text-xs tracking-widest uppercase mb-5">time remaining</Text>
          <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <View style={{ width: `${progress * 100}%`, backgroundColor: tone }} className="h-full rounded-full" />
          </View>
        </View>

        {secondsLeft <= 300 ? (
          <Card tone={tone} className="mb-4">
            <View className="flex-row items-center">
              <TriangleAlert color={tone} size={20} />
              <Text className="text-white text-sm ml-3 flex-1">
                {secondsLeft <= 120 ? "Check in now. SOS is about to start." : "Reminder: check in soon."}
              </Text>
            </View>
          </Card>
        ) : null}

        <Button
          label="I'M SAFE, CHECK IN"
          icon={ShieldCheck}
          onPress={() => {
            complete();
            toast("Checked in. Glad you're safe!");
            router.back();
          }}
        />
        <View className="flex-row mt-3">
          <View className="flex-1 mr-2">
            <Button label="+15 min" icon={Plus} variant="secondary" size="md" onPress={() => extend(15)} />
          </View>
          <View className="flex-1 ml-2">
            <Button label="+30 min" icon={Plus} variant="secondary" size="md" onPress={() => extend(30)} />
          </View>
        </View>
        <Button
          label="Cancel timer"
          variant="ghost"
          size="md"
          onPress={() => {
            complete();
            toast("Check-in cancelled", "info");
          }}
          className="mt-2"
        />
        <Text className="text-white/40 text-xs text-center mt-4 leading-4">
          The timer keeps running while you use other screens. When it ends you'll get 15 seconds to respond before an
          SOS goes to {contacts.length} contact{contacts.length === 1 ? "" : "s"} and nearby helpers.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen keyboard header={<Header title="Timed Check-In" subtitle="Set a safety countdown" subtitleColor={colors.accent} back />}>
      <Card className="mb-5">
        <Text className="text-white font-bold text-lg mb-4">How long until you check in?</Text>
        <View className="flex-row flex-wrap -m-1 mb-4">
          {PRESETS.map((m) => (
            <View key={m} className="w-1/3 p-1">
              <Chip
                label={`${m} min`}
                selected={!custom && minutes === m}
                onPress={() => {
                  setCustom("");
                  setMinutes(m);
                }}
              />
            </View>
          ))}
        </View>
        <TextField
          label="Custom minutes"
          placeholder="e.g. 20"
          keyboardType="number-pad"
          value={custom}
          onChangeText={(t) => setCustom(t.replace(/[^0-9]/g, "").slice(0, 3))}
        />
        <View className="bg-accent/10 border border-accent/20 rounded-2xl p-4">
          <Text className="text-white/70 text-xs leading-5">
            If you don't check in within <Text className="font-bold text-white">{chosen} min</Text>, Shield asks if
            you're OK and then sends an SOS automatically. Great for walks home, rides and first dates.
          </Text>
        </View>
      </Card>
      {contacts.length === 0 ? (
        <Card tone={colors.warn} className="mb-4">
          <Text className="text-white/80 text-xs leading-5">
            Tip: add a trusted contact first so someone you know is texted if you miss the check-in.
          </Text>
        </Card>
      ) : null}
      <Button label="START SAFETY TIMER" variant="accent" icon={Timer} onPress={begin} disabled={chosen < 1} />
    </Screen>
  );
}
