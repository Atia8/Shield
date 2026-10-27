import { router } from "expo-router";
import {
  CircleCheck,
  HandHeart,
  MessageCircle,
  Phone,
  Radio,
  RefreshCw,
  ShieldCheck,
  Siren,
  TriangleAlert,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafetyMap, type MapMarker } from "@/components/map/SafetyMap";
import { Button } from "@/components/ui/Button";
import { Card, IconBadge, LoadingView, Pill } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useContacts } from "@/features/contacts/api";
import { STAGES, stageIndex } from "@/features/helper/api";
import { config } from "@/lib/config";
import { callNumber, confirm } from "@/lib/dialogs";
import { timeAgo } from "@/lib/format";
import { distanceKm, formatDistance, watchFix, type Fix } from "@/lib/location";
import { colors } from "@/theme/colors";
import {
  endAlert,
  REASON_LABEL,
  SMS_LABEL,
  textContacts,
  textLocationUpdate,
  updateAlertLocation,
  useMyAlerts,
} from "./api";

/** Follow-up texts: when moved this far since the last text, at most this often. */
const UPDATE_TEXT_METERS = 300;
const UPDATE_TEXT_EVERY_MS = 5 * 60 * 1000;

export default function SosActiveScreen() {
  const user = useCurrentUser();
  const toast = useToast();
  const { active: alert, loading } = useMyAlerts(user.id);
  const { contacts } = useContacts(user.id);
  const [fix, setFix] = useState<Fix | null>(null);
  const [ending, setEnding] = useState(false);
  const [resending, setResending] = useState(false);

  const alertId = alert?.id;
  // Where contacts were last texted; starts at the alert's first position.
  const lastTexted = useRef<{ at: number; point: Fix | null } | null>(null);
  const latest = useRef({ user, contacts });
  latest.current = { user, contacts };

  // Live location: keep the alert's position fresh while the SOS is open, and
  // text contacts the new position after a real move (automatic texts only).
  useEffect(() => {
    if (!alertId) return;
    let stop = () => {};
    lastTexted.current = null;
    watchFix(
      (f) => {
        setFix(f);
        updateAlertLocation(alertId, f).catch(() => {});

        const now = Date.now();
        const last = lastTexted.current;
        if (!last) {
          lastTexted.current = { at: now, point: f };
          return;
        }
        const moved = last.point ? distanceKm(last.point, f) * 1000 : Infinity;
        if (moved >= UPDATE_TEXT_METERS && now - last.at >= UPDATE_TEXT_EVERY_MS && latest.current.contacts.length) {
          lastTexted.current = { at: now, point: f };
          textLocationUpdate(latest.current.user, latest.current.contacts, f).catch(() => {});
        }
      },
      { timeInterval: 5000, distanceInterval: 0 },
    ).then((unsub) => (stop = unsub));
    return () => stop();
  }, [alertId]);

  if (loading) {
    return <Screen header={<Header title="SOS" />}><LoadingView label="Loading your alert…" /></Screen>;
  }

  if (!alert) {
    return (
      <Screen header={<Header title="You're safe" subtitle="No active SOS" />}>
        <View className="items-center py-10">
          <View className="w-24 h-24 rounded-full bg-brand/15 border border-brand/30 items-center justify-center mb-5">
            <ShieldCheck color={colors.brand} size={48} />
          </View>
          <Text className="text-white text-xl font-black text-center">Your SOS has ended</Text>
          <Text className="text-white/60 text-center mt-2 leading-5 px-6">
            We hope you're okay. You can review it any time in your alert history.
          </Text>
        </View>
        <Button label="BACK TO HOME" onPress={() => router.replace("/home")} />
        <Button label="View alert history" variant="ghost" onPress={() => router.replace("/alert-history")} className="mt-2" />
      </Screen>
    );
  }

  const position = fix ?? alert.location;
  const accepted = alert.status === "accepted";
  const helperDistance =
    accepted && alert.helperLocation && position ? distanceKm(alert.helperLocation, position) : null;
  const sms = SMS_LABEL[alert.smsDelivery];

  const markers: MapMarker[] = [];
  if (alert.helperLocation) {
    markers.push({ id: "helper", point: alert.helperLocation, color: colors.brand, title: alert.acceptedByName ?? "Helper" });
  }

  const finish = async (outcome: "resolved" | "cancelled") => {
    const ok = await confirm(
      outcome === "resolved" ? "Mark yourself safe?" : "Cancel this SOS?",
      outcome === "resolved"
        ? "This ends the alert for your helper and stops live location sharing."
        : "Use this if the alert was a mistake. Helpers will stop responding.",
      outcome === "resolved" ? "I'm safe" : "Cancel SOS",
      outcome === "cancelled",
    );
    if (!ok) return;
    setEnding(true);
    try {
      await endAlert(alert.id, outcome);
      toast(outcome === "resolved" ? "Glad you're safe. SOS ended." : "SOS cancelled", "success");
      router.replace("/home");
    } catch {
      toast("Couldn't end the SOS. Check your connection.", "error");
      setEnding(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const result = await textContacts(alert.id, user, contacts, position, alert.reason);
      toast(SMS_LABEL[result].text, SMS_LABEL[result].ok ? "success" : "info");
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen
      header={
        <Header
          title={accepted ? "Help is on the way" : "SOS Active"}
          subtitle={`${REASON_LABEL[alert.reason]} · started ${timeAgo(alert.timestamp)}`}
          subtitleColor={accepted ? colors.brand : colors.danger}
          left={
            <View className="mr-3">
              <IconBadge icon={Siren} color={accepted ? colors.brand : colors.danger} size={44} />
            </View>
          }
          right={
            <Pressable onPress={() => router.replace("/home")} hitSlop={8}>
              <Text className="text-white/60 font-bold text-sm">Home</Text>
            </Pressable>
          }
        />
      }
    >
      <SafetyMap
        center={position}
        userLocation={position}
        markers={markers}
        // Once a helper is on the way, keep both of you in view.
        fitPoints={position && alert.helperLocation ? [position, alert.helperLocation] : undefined}
        follow
        span={0.015}
        height={230}
      />
      <View className="flex-row items-center mt-2 mb-4">
        <Radio color={colors.brand} size={14} />
        <Text className="text-brand text-xs font-bold ml-1.5">
          {fix ? "Sharing live location" : position ? "Location shared" : "Location unavailable: describe where you are in chat"}
        </Text>
      </View>

      {/* Responder */}
      {accepted ? (
        <Card tone={colors.brand}>
          <View className="flex-row items-center">
            <IconBadge icon={HandHeart} color={colors.brand} size={46} />
            <View className="flex-1 ml-3">
              <Text className="text-white font-black text-base">{alert.acceptedByName ?? "A verified helper"}</Text>
              <Text className="text-white/70 text-xs mt-0.5">
                Verified helper{helperDistance != null ? ` · ${formatDistance(helperDistance)} away` : ""}
              </Text>
            </View>
            <Pill label={STAGES[stageIndex(alert.stage)].label} />
          </View>
          <View className="flex-row mt-4">
            {STAGES.map((s, i) => (
              <View
                key={s.value}
                className={`flex-1 h-1.5 rounded-full ${i < STAGES.length - 1 ? "mr-1.5" : ""}`}
                style={{ backgroundColor: i <= stageIndex(alert.stage) ? colors.brand : "rgba(255,255,255,0.12)" }}
              />
            ))}
          </View>
          <View className="flex-row mt-4">
            <View className="flex-1 mr-2">
              <Button
                label="Chat"
                icon={MessageCircle}
                size="md"
                onPress={() => router.push({ pathname: "/chat/[id]", params: { id: alert.id } })}
              />
            </View>
            {alert.acceptedByPhone ? (
              <View className="flex-1 ml-2">
                <Button
                  label="Call"
                  icon={Phone}
                  size="md"
                  variant="secondary"
                  onPress={() => callNumber(alert.acceptedByPhone!.replace(/\s/g, ""))}
                />
              </View>
            ) : null}
          </View>
        </Card>
      ) : (
        <Card tone={colors.warn}>
          <View className="flex-row items-center">
            <ActivityIndicator color={colors.warn} />
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold">Alerting verified helpers nearby</Text>
              <Text className="text-white/60 text-xs mt-0.5 leading-4">
                You'll see their name and live location here as soon as someone accepts.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Delivery report: per channel, never a blanket "sent" */}
      <Text className="text-white font-extrabold text-base mt-6 mb-3">Who has been alerted</Text>
      <Card>
        <View className="flex-row items-center mb-3">
          <CircleCheck color={colors.brand} size={18} />
          <Text className="text-white text-sm ml-3 flex-1">Nearby helpers on the Shield network</Text>
        </View>
        <View className="flex-row items-center">
          {sms.ok ? <CircleCheck color={colors.brand} size={18} /> : <TriangleAlert color={colors.warn} size={18} />}
          <Text className="text-white text-sm ml-3 flex-1">
            {sms.text}
            {alert.contactsCount ? ` (${alert.contactsCount})` : ""}
          </Text>
        </View>
        {contacts.length > 0 ? (
          <Button
            label="Text my contacts again"
            icon={RefreshCw}
            variant="secondary"
            size="md"
            loading={resending}
            onPress={resend}
            className="mt-4"
          />
        ) : null}
      </Card>

      <Button
        label={`CALL ${config.emergencyNumber}`}
        icon={Phone}
        variant="danger"
        onPress={() => callNumber(config.emergencyNumber)}
        className="mt-6"
      />
      <Button label="I'M SAFE, END SOS" icon={ShieldCheck} onPress={() => finish("resolved")} loading={ending} className="mt-3" />
      <Pressable onPress={() => finish("cancelled")} className="items-center py-4" disabled={ending}>
        <Text className="text-white/50 font-bold">Cancel (false alarm)</Text>
      </Pressable>
    </Screen>
  );
}
