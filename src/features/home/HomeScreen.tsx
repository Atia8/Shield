import { router } from "expo-router";
import {
  Activity,
  Bell,
  ChevronRight,
  CircleCheck,
  Circle,
  Clock,
  Map as MapIcon,
  MapPin,
  Navigation,
  PhoneCall,
  Siren,
  Timer,
  Users,
  Vibrate,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Avatar, Card, IconBadge, ListRow, SectionTitle } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { ModeSwitch } from "@/features/auth/ModeSwitch";
import { useCheckIn } from "@/features/checkin/CheckInProvider";
import { useContacts } from "@/features/contacts/api";
import { useProtection } from "@/features/protection/ProtectionProvider";
import { useMyAlerts } from "@/features/sos/api";
import { SosButton } from "@/features/sos/SosButton";
import { SHARE_TOAST, shareLocationWithContacts } from "@/features/track-route/api";
import { config } from "@/lib/config";
import { callNumber } from "@/lib/dialogs";
import { firstName, mmss } from "@/lib/format";
import { colors } from "@/theme/colors";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  color: string;
  onPress: () => void;
}

export default function HomeScreen() {
  const user = useCurrentUser();
  const toast = useToast();
  const { contacts } = useContacts(user.id);
  const { active } = useMyAlerts(user.id);
  const { checkIn, secondsLeft } = useCheckIn();
  const { settings, sensorAvailable, update } = useProtection();
  const [sharing, setSharing] = useState(false);

  const shareLocation = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const outcome = await shareLocationWithContacts(user, contacts);
      toast(SHARE_TOAST[outcome].text, SHARE_TOAST[outcome].type);
    } catch {
      toast("Couldn't share your location", "error");
    } finally {
      setSharing(false);
    }
  };

  const actions: QuickAction[] = [
    { label: "Track Route", icon: Navigation, color: colors.info, onPress: () => router.push("/track-route") },
    { label: "Check-In Timer", icon: Timer, color: colors.accent, onPress: () => router.push("/check-in") },
    { label: "Share Location", icon: MapPin, color: colors.brand, onPress: shareLocation },
    { label: "Fake Call", icon: PhoneCall, color: "#EC4899", onPress: () => router.push("/fake-call") },
    { label: "Danger Zones", icon: MapIcon, color: colors.warn, onPress: () => router.push("/danger-zone") },
    { label: `Call ${config.emergencyNumber}`, icon: Siren, color: colors.danger, onPress: () => callNumber(config.emergencyNumber) },
  ];

  const checklist = [
    { done: contacts.length > 0, label: "Add at least one trusted contact", go: () => router.push("/contacts") },
    { done: !!user.bloodGroup || !!user.medicalNotes, label: "Add emergency medical info", go: () => router.push("/edit-profile") },
    { done: settings.fallDetection || settings.shakeToSos, label: "Turn on fall or shake detection", go: undefined },
  ];
  const readiness = checklist.filter((c) => c.done).length;

  return (
    <Screen bottomInset={30}>
      {/* Top bar */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white/60 text-sm">Hi, {firstName(user.name)} 👋</Text>
          <Text className="text-white text-3xl font-black">Shield</Text>
        </View>
        <Pressable
          onPress={() => router.push("/alert-history")}
          accessibilityLabel="Alert history"
          className="w-11 h-11 rounded-full bg-white/10 border border-white/15 items-center justify-center"
        >
          <Bell color="white" size={20} />
        </Pressable>
      </View>
      <ModeSwitch />

      {active ? (
        <Card tone={colors.danger} onPress={() => router.push("/sos-active")} className="mt-5">
          <View className="flex-row items-center">
            <IconBadge icon={Siren} color={colors.danger} size={44} />
            <View className="flex-1 ml-3">
              <Text className="text-white font-black text-base">SOS is active</Text>
              <Text className="text-white/70 text-xs mt-0.5">
                {active.status === "accepted"
                  ? `${active.acceptedByName ?? "A helper"} is responding`
                  : "Searching for nearby helpers…"}
              </Text>
            </View>
            <ChevronRight color="white" size={20} />
          </View>
        </Card>
      ) : null}

      {checkIn ? (
        <Card tone={secondsLeft <= 120 ? colors.danger : colors.accent} onPress={() => router.push("/check-in")} className="mt-4">
          <View className="flex-row items-center">
            <IconBadge icon={Clock} color={secondsLeft <= 120 ? colors.danger : colors.accent} size={44} />
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold">Check-in running · {mmss(secondsLeft)}</Text>
              <Text className="text-white/60 text-xs mt-0.5">Tap to check in or extend</Text>
            </View>
            <ChevronRight color="white" size={20} />
          </View>
        </Card>
      ) : null}

      {/* SOS */}
      <View className="mt-4">
        <SosButton
          active={!!active}
          onPress={() => (active ? router.push("/sos-active") : router.push({ pathname: "/sos", params: { reason: "manual" } }))}
        />
        <Text className="text-white/50 text-xs text-center -mt-2">
          You'll get a 5-second countdown to cancel before anyone is alerted.
        </Text>
      </View>

      {/* Status */}
      <Card tone={colors.brand} className="mt-6" onPress={() => router.push("/contacts")}>
        <View className="flex-row items-center">
          <View className="flex-1">
            <View className="flex-row items-center">
              <CircleCheck color={colors.brand} size={18} />
              <Text className="text-white font-extrabold text-base ml-2">
                {contacts.length > 0 ? "You're protected" : "Finish your setup"}
              </Text>
            </View>
            <Text className="text-white/70 text-xs mt-1.5 leading-4">
              {contacts.length > 0
                ? `${contacts.length} trusted contact${contacts.length === 1 ? "" : "s"} and nearby helpers will be alerted by SOS.`
                : "Add a trusted contact so someone you know is alerted during an SOS."}
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center ml-3">
            <Users color="white" size={22} />
          </View>
        </View>
      </Card>

      <SectionTitle title="Quick Actions" />
      <View className="flex-row flex-wrap -mx-1.5">
        {actions.map((a) => (
          <View key={a.label} className="w-1/2 p-1.5">
            <Pressable
              onPress={a.onPress}
              accessibilityRole="button"
              className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-3 h-16"
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <IconBadge icon={a.icon} color={a.color} size={38} />
              <Text className="text-white font-bold text-[13px] ml-2.5 flex-1" numberOfLines={2}>
                {a.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <SectionTitle title="Smart Protection" />
      <View className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <ListRow
          icon={Activity}
          color={colors.brand}
          label="Fall detection"
          detail={sensorAvailable ? "Opens SOS countdown after a hard fall" : "Motion sensor not available here"}
          toggle={{ value: settings.fallDetection, onChange: (v) => update({ fallDetection: v }) }}
        />
        <ListRow
          icon={Vibrate}
          color={colors.accent}
          label="Shake to SOS"
          detail="Shake your phone hard 4 times"
          toggle={{ value: settings.shakeToSos, onChange: (v) => update({ shakeToSos: v }) }}
          last
        />
      </View>
      <Text className="text-white/35 text-[11px] mt-2 ml-1">Works while Shield is open on screen.</Text>

      <SectionTitle title={`Safety Checklist · ${readiness}/3`} />
      <Card>
        {checklist.map((item, i) => (
          <Pressable
            key={item.label}
            onPress={item.go}
            disabled={!item.go || item.done}
            className={`flex-row items-center py-2 ${i < checklist.length - 1 ? "border-b border-white/5" : ""}`}
          >
            {item.done ? <CircleCheck color={colors.brand} size={20} /> : <Circle color={colors.faint} size={20} />}
            <Text className={`ml-3 flex-1 text-sm ${item.done ? "text-white/40 line-through" : "text-white"}`}>
              {item.label}
            </Text>
            {item.go && !item.done ? <ChevronRight color={colors.faint} size={16} /> : null}
          </Pressable>
        ))}
      </Card>

      <SectionTitle title="Trusted Contacts" action="See all" onAction={() => router.push("/contacts")} />
      {contacts.length === 0 ? (
        <Card onPress={() => router.push("/contacts")}>
          <Text className="text-white/60 text-sm">No contacts yet. Tap to add your first trusted contact.</Text>
        </Card>
      ) : (
        <View className="flex-row flex-wrap">
          {contacts.slice(0, 5).map((c) => (
            <View key={c.id} className="items-center mr-4 mb-2" style={{ width: 60 }}>
              <Avatar name={c.name} color={colors.accent} size={52} />
              <Text className="text-white/80 text-xs mt-1.5" numberOfLines={1}>
                {firstName(c.name)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
