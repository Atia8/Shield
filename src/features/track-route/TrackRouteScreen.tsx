import { Crosshair, MessageSquare, Navigation, Share2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Share, Text, View } from "react-native";
import { SafetyMap } from "@/components/map/SafetyMap";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useContacts } from "@/features/contacts/api";
import { useAreaBriefing } from "@/features/danger-zone/aiBriefing";
import { AreaBriefingBanner } from "@/features/danger-zone/AreaBriefingCard";
import { ensureLocationPermission, watchFix, type Fix } from "@/lib/location";
import { colors } from "@/theme/colors";
import { locationMessage, SHARE_TOAST, shareLocationWithContacts } from "./api";

export default function TrackRouteScreen() {
  const user = useCurrentUser();
  const toast = useToast();
  const { contacts } = useContacts(user.id);
  const [fix, setFix] = useState<Fix | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [denied, setDenied] = useState(false);
  const [path, setPath] = useState<Fix[]>([]);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const { briefing } = useAreaBriefing(fix);
  const warnedArea = useRef<string | null>(null);

  // Heads-up when the walk enters an area with recent incident reports.
  useEffect(() => {
    if (!briefing || warnedArea.current === briefing.area) return;
    warnedArea.current = briefing.area;
    if (briefing.riskLevel === "medium" || briefing.riskLevel === "high") {
      toast(`${briefing.area}: ${briefing.headline}`, briefing.riskLevel === "high" ? "error" : "info");
    }
  }, [briefing, toast]);

  // Ticks the "updated Xs ago" label so it's visibly live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let stop = () => {};
    ensureLocationPermission().then((ok) => {
      if (!ok) {
        setDenied(true);
        return;
      }
      watchFix(
        (f) => {
          setFix(f);
          setUpdatedAt(Date.now());
          setPath((p) => [...p.slice(-200), f]);
        },
        // distanceInterval 0: keep updating every few seconds even when standing still.
        { timeInterval: 3000, distanceInterval: 0 },
      ).then((unsub) => (stop = unsub));
    });
    return () => stop();
  }, []);

  const distanceWalked = path.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const prev = path[i - 1];
    const dLat = (p.latitude - prev.latitude) * 111_000;
    const dLng = (p.longitude - prev.longitude) * 111_000 * Math.cos((p.latitude * Math.PI) / 180);
    return sum + Math.sqrt(dLat * dLat + dLng * dLng);
  }, 0);

  const secondsAgo = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null;
  const isLive = secondsAgo !== null && secondsAgo < 15;

  const textContacts = async () => {
    setSending(true);
    try {
      const outcome = await shareLocationWithContacts(user, contacts, fix);
      toast(SHARE_TOAST[outcome].text, SHARE_TOAST[outcome].type);
    } finally {
      setSending(false);
    }
  };

  const shareAnywhere = async () => {
    if (!fix) {
      toast("Waiting for GPS signal…", "info");
      return;
    }
    await Share.share({ message: locationMessage(user, fix) }).catch(() => {});
  };

  return (
    <Screen
      header={
        <Header
          title="Track My Route"
          subtitle={!fix ? "Finding your location…" : isLive ? "● Live GPS" : "GPS signal weak, waiting for update…"}
          subtitleColor={!fix || isLive ? colors.brand : colors.warn}
          back
        />
      }
    >
      {denied ? (
        <Card tone={colors.danger} className="mb-4">
          <Text className="text-white text-sm">
            Location permission is off. Enable it in Privacy & permissions to track your route.
          </Text>
        </Card>
      ) : null}

      <SafetyMap center={fix} userLocation={fix} path={path} follow span={0.008} height={340} />

      <View className="flex-row mt-4">
        <Card className="flex-1 mr-2">
          <Text className="text-white/50 text-xs">Distance</Text>
          <Text className="text-white font-black text-xl mt-1">
            {distanceWalked < 1000 ? `${Math.round(distanceWalked)} m` : `${(distanceWalked / 1000).toFixed(2)} km`}
          </Text>
        </Card>
        <Card className="flex-1 ml-2">
          <Text className="text-white/50 text-xs">Last update</Text>
          <Text className="text-white font-black text-xl mt-1">
            {secondsAgo === null ? "—" : secondsAgo < 2 ? "just now" : `${secondsAgo}s ago`}
          </Text>
        </Card>
      </View>

      {briefing ? <AreaBriefingBanner briefing={briefing} /> : null}

      {fix ? (
        <View className="flex-row items-center mt-3">
          <Crosshair color={colors.brand} size={14} />
          <Text className="text-white/50 text-xs ml-1.5">
            {fix.latitude.toFixed(5)}, {fix.longitude.toFixed(5)}
            {fix.accuracy ? ` · ±${Math.round(fix.accuracy)} m` : ""}
          </Text>
        </View>
      ) : null}

      <Button
        label={`Text location to ${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}
        icon={MessageSquare}
        onPress={textContacts}
        loading={sending}
        disabled={!fix}
        className="mt-6"
      />
      <Button label="Share via…" icon={Share2} variant="secondary" onPress={shareAnywhere} className="mt-3" />

      <Card tone={colors.info} className="mt-6">
        <View className="flex-row">
          <Navigation color={colors.info} size={20} />
          <Text className="text-white/70 text-xs leading-5 ml-3 flex-1">
            Keep this screen open during a walk or ride. If something goes wrong, the SOS button on Home also keeps
            your live location updated for your helper.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
