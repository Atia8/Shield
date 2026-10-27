import { router } from "expo-router";
import { ChevronRight, HandHeart, History } from "lucide-react-native";
import { Text, View } from "react-native";
import { Card, EmptyState, LoadingView, Pill } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { REASON_LABEL } from "@/features/sos/api";
import { STATUS_STYLE } from "@/features/sos/AlertHistoryScreen";
import { dateTime } from "@/lib/format";
import { colors } from "@/theme/colors";
import { useMyResponses } from "./api";

export default function HelperHistoryScreen() {
  const user = useCurrentUser();
  const { responses, stats, loading } = useMyResponses(user.id);

  return (
    <Screen
      header={<Header title="Response History" subtitle={`${stats.resolved} resolved of ${stats.total} accepted`} />}
      bottomInset={30}
    >
      {loading ? (
        <LoadingView />
      ) : responses.length === 0 ? (
        <EmptyState
          icon={History}
          title="No responses yet"
          message="Alerts you accept will be listed here. Thank you for being part of the Shield network."
        />
      ) : (
        responses.map((r) => {
          const style = STATUS_STYLE[r.status] ?? STATUS_STYLE.cancelled;
          const open = r.status === "accepted";
          return (
            <Card
              key={r.id}
              className="mb-3"
              onPress={open ? () => router.push({ pathname: "/respond/[id]", params: { id: r.id } }) : undefined}
            >
              <View className="flex-row items-center">
                <HandHeart color={colors.brand} size={20} />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-bold">{r.userName}</Text>
                  <Text className="text-white/50 text-xs mt-0.5">
                    {REASON_LABEL[r.reason]} · {dateTime(r.acceptedAt ?? r.timestamp)}
                  </Text>
                </View>
                <Pill label={open ? "In progress" : style.label} color={open ? colors.warn : style.color} />
                {open ? <ChevronRight color="white" size={16} style={{ marginLeft: 6 }} /> : null}
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
