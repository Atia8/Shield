import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  HandHeart,
  IdCard,
  MapPin,
  Power,
  Radar,
  ShieldCheck,
  Siren,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Switch, Text, Vibration, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, ErrorBanner, IconBadge, Pill, SectionTitle } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { ModeSwitch } from "@/features/auth/ModeSwitch";
import { REASON_LABEL } from "@/features/sos/api";
import { confirm } from "@/lib/dialogs";
import { errorMessage, firstName, timeAgo } from "@/lib/format";
import { formatDistance, getCurrentFix, watchFix, type Fix } from "@/lib/location";
import { colors, withAlpha } from "@/theme/colors";
import {
  acceptAlert,
  canAcceptAlerts,
  RADIUS_OPTIONS,
  setHelperActive,
  setResponseRadius,
  STAGES,
  stageIndex,
  updateHelperLocation,
  useMyResponses,
  useNearbyAlerts,
  type NearbyAlert,
} from "./api";

export default function HelperDashboardScreen() {
  const user = useCurrentUser();
  const toast = useToast();
  const active = !!user.helperActive;
  const radius = user.responseRadiusKm ?? 5;
  const verified = canAcceptAlerts(user);

  const [position, setPosition] = useState<Fix | null>(user.location ? { ...user.location, accuracy: null } : null);
  const [toggling, setToggling] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const { nearby, loading, error } = useNearbyAlerts(user.id, position, radius, active);
  const { current, stats } = useMyResponses(user.id);

  // While on duty, keep the helper's position fresh (for distances and matching).
  useEffect(() => {
    if (!active) return;
    let stop = () => {};
    watchFix(
      (f) => {
        setPosition(f);
        updateHelperLocation(user.id, f).catch(() => {});
      },
      { timeInterval: 30000, distanceInterval: 50 },
    ).then((unsub) => (stop = unsub));
    return () => stop();
  }, [active, user.id]);

  // Buzz when a new alert appears nearby.
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (loading) return;
    const ids = new Set(nearby.map((n) => n.alert.id));
    if (seen.current) {
      const fresh = nearby.filter((n) => !seen.current!.has(n.alert.id));
      if (fresh.length > 0) {
        Vibration.vibrate([0, 500, 250, 500]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        toast(`🚨 New SOS nearby: ${fresh[0].alert.userName}`, "error");
      }
    }
    seen.current = ids;
  }, [nearby, loading]);

  const toggleActive = async (next: boolean) => {
    setToggling(true);
    try {
      if (next) {
        const fix = await getCurrentFix();
        if (!fix) toast("Location is off. Distances to alerts won't be shown.", "info");
        if (fix) setPosition(fix);
        await setHelperActive(user.id, true, fix);
        toast("You're on duty. Nearby alerts will appear here.");
      } else {
        await setHelperActive(user.id, false);
        toast("You're off duty", "info");
      }
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setToggling(false);
    }
  };

  const accept = async (item: NearbyAlert) => {
    if (!verified) {
      const go = await confirm(
        "Verification needed",
        "To keep people safe, only verified helpers can accept alerts. Verify your ID now?",
        "Verify",
      );
      if (go) router.push("/verification");
      return;
    }
    if (current) {
      toast("Finish your current response first", "info");
      return;
    }
    setAccepting(item.alert.id);
    try {
      await acceptAlert(item.alert.id, user, position);
      router.push({ pathname: "/respond/[id]", params: { id: item.alert.id } });
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setAccepting(null);
    }
  };

  return (
    <Screen bottomInset={30}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white/60 text-sm">Hi, {firstName(user.name)}</Text>
          <Text className="text-white text-3xl font-black">Helper Mode</Text>
        </View>
        {verified ? <Pill label="Verified" icon={BadgeCheck} /> : <Pill label="Unverified" color={colors.warn} />}
      </View>
      <ModeSwitch />

      {!verified ? (
        <Card tone={colors.warn} onPress={() => router.push("/verification")} className="mt-5">
          <View className="flex-row items-center">
            <IconBadge icon={IdCard} color={colors.warn} size={44} />
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold">
                {user.verificationStatus === "pending" ? "Verification under review" : "Verify your identity"}
              </Text>
              <Text className="text-white/60 text-xs mt-0.5 leading-4">
                {user.verificationStatus === "pending"
                  ? "You can go on duty and see alerts; accepting unlocks once approved."
                  : user.verificationStatus === "rejected"
                    ? `Rejected${user.verificationNote ? `: ${user.verificationNote}` : ""}. Tap to resubmit.`
                    : "Upload your ID and a selfie to start accepting alerts."}
              </Text>
            </View>
            <ChevronRight color="white" size={18} />
          </View>
        </Card>
      ) : null}

      {/* Duty toggle */}
      <View
        className="rounded-3xl p-5 mt-5 border"
        style={{
          backgroundColor: withAlpha(active ? colors.brand : "#64748B", 0.12),
          borderColor: withAlpha(active ? colors.brand : "#64748B", 0.35),
        }}
      >
        <View className="flex-row items-center">
          <IconBadge icon={Power} color={active ? colors.brand : "#94A3B8"} size={48} />
          <View className="flex-1 ml-3">
            <Text className="text-white font-black text-lg">{active ? "On duty" : "Off duty"}</Text>
            <Text className="text-white/60 text-xs mt-0.5">
              {active ? `Watching for SOS alerts within ${radius} km` : "Go on duty to receive nearby SOS alerts"}
            </Text>
          </View>
          {toggling ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <Switch
              value={active}
              onValueChange={toggleActive}
              trackColor={{ false: "#334155", true: withAlpha(colors.brand, 0.5) }}
              thumbColor={active ? colors.brand : "#f4f3f4"}
              accessibilityLabel="On duty"
            />
          )}
        </View>
        <Text className="text-white/50 text-xs font-bold mt-4 mb-2 uppercase tracking-wider">Response radius</Text>
        <View className="flex-row">
          {RADIUS_OPTIONS.map((km) => (
            <Pressable
              key={km}
              onPress={() => setResponseRadius(user.id, km).catch(() => {})}
              className={`flex-1 py-2 rounded-xl mr-1.5 items-center border ${
                radius === km ? "bg-brand border-brand" : "bg-white/5 border-white/10"
              }`}
            >
              <Text className={`text-xs font-bold ${radius === km ? "text-ink" : "text-white/70"}`}>{km} km</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row mt-4">
        <Stat label="Responses" value={stats.total} color={colors.accent} />
        <Stat label="Resolved" value={stats.resolved} color={colors.brand} />
        <Stat label="Nearby now" value={active ? nearby.length : "–"} color={colors.danger} />
      </View>

      {current ? (
        <>
          <SectionTitle title="Your current response" />
          <Card tone={colors.brand} onPress={() => router.push({ pathname: "/respond/[id]", params: { id: current.id } })}>
            <View className="flex-row items-center">
              <IconBadge icon={HandHeart} color={colors.brand} size={44} />
              <View className="flex-1 ml-3">
                <Text className="text-white font-bold">{current.userName}</Text>
                <Text className="text-white/60 text-xs mt-0.5">
                  {STAGES[stageIndex(current.stage)].label} · accepted {timeAgo(current.acceptedAt ?? current.timestamp)}
                </Text>
              </View>
              <ChevronRight color="white" size={18} />
            </View>
          </Card>
        </>
      ) : null}

      <SectionTitle title="Nearby alerts" />
      {error ? <ErrorBanner message={errorMessage({ code: "permission-denied" }, error)} /> : null}
      {!active ? (
        <EmptyState icon={Radar} title="You're off duty" message="Turn on duty above to see people near you who need help." />
      ) : loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginVertical: 30 }} />
      ) : nearby.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="All quiet nearby" message="No active SOS alerts in your area. Thank you for being ready to help." />
      ) : (
        nearby.map((item) => (
          <Card key={item.alert.id} tone={colors.danger} className="mb-3">
            <View className="flex-row items-center">
              <IconBadge icon={Siren} color={colors.danger} size={44} />
              <View className="flex-1 ml-3">
                <Text className="text-white font-black text-base">{item.alert.userName}</Text>
                <Text className="text-white/70 text-xs mt-0.5">{REASON_LABEL[item.alert.reason]}</Text>
              </View>
              <Pill label="Urgent" color={colors.danger} />
            </View>
            <View className="flex-row mt-3">
              <View className="flex-row items-center mr-4">
                <MapPin color={colors.muted} size={14} />
                <Text className="text-white/70 text-xs ml-1">
                  {item.distanceKm != null ? `${formatDistance(item.distanceKm)} away` : "Distance unknown"}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock color={colors.muted} size={14} />
                <Text className="text-white/70 text-xs ml-1">{timeAgo(item.alert.timestamp)}</Text>
              </View>
            </View>
            <Button
              label={verified ? "ACCEPT & RESPOND" : "VERIFY TO ACCEPT"}
              icon={HandHeart}
              size="md"
              onPress={() => accept(item)}
              loading={accepting === item.alert.id}
              disabled={accepting !== null && accepting !== item.alert.id}
              className="mt-4"
            />
          </Card>
        ))
      )}

      <SectionTitle title="Safety reminders" />
      <Card>
        {[
          "Your own safety comes first. Don't enter a dangerous situation alone.",
          "Call 999 if there's violence, a weapon or a medical emergency.",
          "Stay in public view and keep the person informed via chat.",
        ].map((tip) => (
          <View key={tip} className="flex-row mb-2">
            <Text className="text-brand mr-2">•</Text>
            <Text className="text-white/70 text-sm leading-5 flex-1">{tip}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 mx-1 items-center">
      <Text style={{ color }} className="text-2xl font-black">
        {value}
      </Text>
      <Text className="text-white/50 text-[11px] mt-0.5">{label}</Text>
    </View>
  );
}
