import { router } from "expo-router";
import { Bell, ChevronRight, HandHeart, MapPin } from "lucide-react-native";
import { Text, View } from "react-native";
import { Card, EmptyState, LoadingView, Pill } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { dateTime } from "@/lib/format";
import { colors } from "@/theme/colors";
import type { AlertStatus } from "@/types/models";
import { isLive, REASON_LABEL, useMyAlerts } from "./api";

export const STATUS_STYLE: Record<AlertStatus, { label: string; color: string }> = {
  active: { label: "Active", color: colors.danger },
  accepted: { label: "Helper responding", color: colors.warn },
  resolved: { label: "Resolved", color: colors.brand },
  cancelled: { label: "Cancelled", color: "#94A3B8" },
};

export default function AlertHistoryScreen() {
  const user = useCurrentUser();
  const { alerts, loading } = useMyAlerts(user.id);

  return (
    <Screen header={<Header title="Alert History" subtitle={`${alerts.length} alert${alerts.length === 1 ? "" : "s"}`} back />}>
      {loading ? (
        <LoadingView />
      ) : alerts.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts yet" message="Alerts you send will appear here so you can review them later." />
      ) : (
        alerts.map((a) => {
          const style =
            a.resolvedBy === "timeout" ? { label: "Expired", color: "#94A3B8" } : (STATUS_STYLE[a.status] ?? STATUS_STYLE.cancelled);
          return (
            <Card key={a.id} className="mb-3" onPress={isLive(a) ? () => router.push("/sos-active") : undefined}>
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-bold">{REASON_LABEL[a.reason]}</Text>
                <Pill label={style.label} color={style.color} />
              </View>
              <Text className="text-white/50 text-xs mt-1">{dateTime(a.timestamp)}</Text>
              {a.acceptedByName ? (
                <View className="flex-row items-center mt-3">
                  <HandHeart color={colors.brand} size={15} />
                  <Text className="text-white/80 text-sm ml-2">Helped by {a.acceptedByName}</Text>
                </View>
              ) : null}
              <View className="flex-row items-center mt-2">
                <MapPin color={colors.faint} size={14} />
                <Text className="text-white/50 text-xs ml-2 flex-1">
                  {a.location ? `${a.location.latitude.toFixed(4)}, ${a.location.longitude.toFixed(4)}` : "No location fix"}
                </Text>
                {isLive(a) ? <ChevronRight color="white" size={16} /> : null}
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
