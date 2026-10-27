import { router, useLocalSearchParams } from "expo-router";
import {
  CircleCheck,
  Droplet,
  LifeBuoy,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  Undo2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafetyMap, type MapMarker } from "@/components/map/SafetyMap";
import { Button } from "@/components/ui/Button";
import { Avatar, Card, EmptyState, LoadingView, Pill } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { REASON_LABEL, useAlert } from "@/features/sos/api";
import { config } from "@/lib/config";
import { callNumber, confirm } from "@/lib/dialogs";
import { errorMessage, timeAgo } from "@/lib/format";
import { distanceKm, formatDistance, openDirections, watchFix, type Fix } from "@/lib/location";
import { colors } from "@/theme/colors";
import { releaseAlert, resolveAsHelper, setStage, STAGES, stageIndex, updateResponderLocation } from "./api";

/** The helper's view of an alert they accepted: map, contact, progress. */
export default function RespondScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useCurrentUser();
  const toast = useToast();
  const { alert, loading } = useAlert(id);
  const [fix, setFix] = useState<Fix | null>(null);
  const [busy, setBusy] = useState(false);

  const mine = alert?.acceptedBy === user.id && alert.status === "accepted";

  // Share the helper's live position with the person while responding.
  useEffect(() => {
    if (!mine || !id) return;
    let stop = () => {};
    watchFix(
      (f) => {
        setFix(f);
        updateResponderLocation(id, f).catch(() => {});
      },
      { timeInterval: 5000, distanceInterval: 0 },
    ).then((unsub) => (stop = unsub));
    return () => stop();
  }, [mine, id]);

  if (loading) {
    return <Screen header={<Header title="Response" back />}><LoadingView /></Screen>;
  }

  if (!alert || !mine) {
    const ended = alert && (alert.status === "resolved" || alert.status === "cancelled");
    return (
      <Screen header={<Header title="Response" back />}>
        <EmptyState
          icon={ShieldCheck}
          title={ended ? "This alert has ended" : "This alert isn't yours anymore"}
          message={
            ended
              ? alert?.resolvedBy === "user"
                ? `${alert.userName} marked themselves safe. Thank you for responding.`
                : "The alert was closed. Thank you for helping."
              : "It may have been released or taken by another helper."
          }
        >
          <Button label="BACK TO DASHBOARD" onPress={() => router.replace("/dashboard")} />
        </EmptyState>
      </Screen>
    );
  }

  const target = alert.location;
  const distance = target && fix ? distanceKm(fix, target) : null;
  const current = stageIndex(alert.stage);
  const markers: MapMarker[] = [];
  if (target) markers.push({ id: "person", point: target, color: colors.danger, title: alert.userName });

  const advance = async (index: number) => {
    if (index <= current) return;
    try {
      await setStage(alert.id, STAGES[index].value);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  const resolve = async () => {
    const ok = await confirm("Mark as resolved?", `Confirm that ${alert.userName} is safe now.`, "Resolve");
    if (!ok) return;
    setBusy(true);
    try {
      await resolveAsHelper(alert.id);
      toast("Alert resolved. Thank you for helping! 💚");
      router.replace("/dashboard");
    } catch (e) {
      toast(errorMessage(e), "error");
      setBusy(false);
    }
  };

  const release = async () => {
    const ok = await confirm(
      "Can't make it?",
      "The alert goes back to other nearby helpers. Please only do this if you really can't help.",
      "Release alert",
      true,
    );
    if (!ok) return;
    setBusy(true);
    try {
      await releaseAlert(alert.id);
      toast("Alert released to other helpers", "info");
      router.replace("/dashboard");
    } catch (e) {
      toast(errorMessage(e), "error");
      setBusy(false);
    }
  };

  return (
    <Screen
      header={
        <Header
          title="Responding"
          subtitle={`${REASON_LABEL[alert.reason]} · raised ${timeAgo(alert.timestamp)}`}
          subtitleColor={colors.danger}
          back
          onBack={() => router.replace("/dashboard")}
        />
      }
    >
      <SafetyMap
        center={target ?? fix}
        userLocation={fix}
        markers={markers}
        fitPoints={target && fix ? [target, fix] : undefined}
        follow
        span={0.02}
        height={240}
      />

      <Card className="mt-4">
        <View className="flex-row items-center">
          <Avatar name={alert.userName} color={colors.danger} size={50} />
          <View className="flex-1 ml-3">
            <Text className="text-white font-black text-lg">{alert.userName}</Text>
            <Text className="text-white/60 text-xs mt-0.5">
              {distance != null ? `${formatDistance(distance)} away` : target ? "Locating you…" : "Location not shared"}
              {alert.updatedAt ? ` · updated ${timeAgo(alert.updatedAt)}` : ""}
            </Text>
          </View>
        </View>
        {alert.bloodGroup || alert.medicalNotes ? (
          <View className="mt-4 bg-danger/10 border border-danger/25 rounded-2xl p-3">
            {alert.bloodGroup ? (
              <View className="flex-row items-center">
                <Droplet color={colors.danger} size={14} />
                <Text className="text-white text-sm ml-2">Blood group {alert.bloodGroup}</Text>
              </View>
            ) : null}
            {alert.medicalNotes ? (
              <View className="flex-row items-start mt-1.5">
                <LifeBuoy color={colors.danger} size={14} style={{ marginTop: 2 }} />
                <Text className="text-white/80 text-sm ml-2 flex-1">{alert.medicalNotes}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <View className="flex-row mt-4">
          <View className="flex-1 mr-1.5">
            <Button
              label="Directions"
              icon={Navigation}
              size="md"
              disabled={!target}
              onPress={() => target && openDirections(target)}
            />
          </View>
          <View className="flex-1 mx-1.5">
            <Button
              label="Chat"
              icon={MessageCircle}
              size="md"
              variant="secondary"
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: alert.id } })}
            />
          </View>
          {alert.userPhone ? (
            <View className="flex-1 ml-1.5">
              <Button
                label="Call"
                icon={Phone}
                size="md"
                variant="secondary"
                onPress={() => callNumber(alert.userPhone.replace(/\s/g, ""))}
              />
            </View>
          ) : null}
        </View>
      </Card>

      <Text className="text-white font-extrabold text-base mt-6 mb-3">Your progress</Text>
      <Card>
        {STAGES.map((stage, i) => {
          const done = i <= current;
          const next = i === current + 1;
          return (
            <Pressable
              key={stage.value}
              onPress={() => advance(i)}
              disabled={!next}
              className={`flex-row items-center py-3 ${i < STAGES.length - 1 ? "border-b border-white/5" : ""}`}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: done ? colors.brand : "rgba(255,255,255,0.08)" }}
              >
                {done ? <CircleCheck color={colors.ink} size={18} /> : <Text className="text-white/50 font-bold">{i + 1}</Text>}
              </View>
              <View className="flex-1">
                <Text className={`font-bold ${done ? "text-white" : "text-white/60"}`}>{stage.label}</Text>
                <Text className="text-white/40 text-xs">{stage.description}</Text>
              </View>
              {next ? <Pill label="Tap to update" color={colors.accent} /> : null}
            </Pressable>
          );
        })}
      </Card>

      <Button label="MARK AS RESOLVED" icon={ShieldCheck} onPress={resolve} loading={busy} className="mt-6" />
      <Button
        label={`Call ${config.emergencyNumber}`}
        icon={Phone}
        variant="outlineDanger"
        onPress={() => callNumber(config.emergencyNumber)}
        className="mt-3"
      />
      <Pressable onPress={release} disabled={busy} className="flex-row items-center justify-center py-4">
        <Undo2 color={colors.faint} size={16} />
        <Text className="text-white/50 font-bold ml-2">I can't make it, release alert</Text>
      </Pressable>
    </Screen>
  );
}
