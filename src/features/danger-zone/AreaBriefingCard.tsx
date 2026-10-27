import { router } from "expo-router";
import { ChevronRight, ExternalLink, Moon, RefreshCw, Sparkles } from "lucide-react-native";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import { Card, Pill } from "@/components/ui/Card";
import { timeAgo } from "@/lib/format";
import { colors } from "@/theme/colors";
import {
  BRIEFING_RISK_COLOR,
  BRIEFING_RISK_LABEL,
  HAZARD_TIME_LABEL,
  type AreaBriefing,
  type AreaInfo,
} from "./aiBriefing";

interface Props {
  area: AreaInfo | null;
  briefing: AreaBriefing | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/** Full AI briefing: risk, what recent news shows, hazards, tips, sources. */
export function AreaBriefingCard({ area, briefing, loading, error, onRefresh }: Props) {
  const tone = briefing ? BRIEFING_RISK_COLOR[briefing.riskLevel] : colors.accent;
  // Show the stored briefing while a refresh is running, but only for the same area.
  const current = briefing && (!area || briefing.area === area.label) ? briefing : null;

  return (
    <Card tone={tone} className="mb-4">
      <View className="flex-row items-center">
        <Sparkles color={colors.accent} size={18} />
        <Text className="text-white font-extrabold ml-2 flex-1" numberOfLines={1}>
          AI area briefing{area ? ` · ${area.label}` : ""}
        </Text>
        <Pressable onPress={onRefresh} disabled={loading || !area} hitSlop={8} accessibilityLabel="Refresh briefing">
          {loading ? <ActivityIndicator color={colors.accent} size="small" /> : <RefreshCw color={colors.muted} size={16} />}
        </Pressable>
      </View>

      {!current && loading ? (
        <Text className="text-white/60 text-sm mt-3 leading-5">
          {area ? "Searching recent local news…" : "Finding your area…"} This can take up to a minute.
        </Text>
      ) : null}
      {!current && !loading && error ? <Text className="text-white/70 text-sm mt-3 leading-5">{error}</Text> : null}
      {!current && !loading && !error && !area ? (
        <Text className="text-white/60 text-sm mt-3">Waiting for your location…</Text>
      ) : null}

      {current ? (
        <>
          <View className="mt-3">
            <Pill label={BRIEFING_RISK_LABEL[current.riskLevel]} color={tone} />
          </View>
          <Text className="text-white font-bold text-base mt-2 leading-5">{current.headline}</Text>
          {current.summary && current.summary !== current.headline ? (
            <Text className="text-white/70 text-sm mt-1.5 leading-5">{current.summary}</Text>
          ) : null}

          {current.hazards.length > 0 ? (
            <View className="mt-4">
              {current.hazards.map((h) => (
                <View key={h.title} className="flex-row mb-2.5">
                  <View className="w-1.5 rounded-full mr-3" style={{ backgroundColor: tone }} />
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold text-sm flex-shrink">{h.title}</Text>
                      <View className="flex-row items-center ml-2">
                        {h.when === "night" || h.when === "evening" ? <Moon color={colors.muted} size={11} /> : null}
                        <Text className="text-white/45 text-[11px] ml-1">{HAZARD_TIME_LABEL[h.when]}</Text>
                      </View>
                    </View>
                    {h.detail ? <Text className="text-white/60 text-xs mt-0.5 leading-4">{h.detail}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {current.tips.length > 0 ? (
            <View className="mt-2">
              {current.tips.map((tip) => (
                <View key={tip} className="flex-row mb-1.5">
                  <Text className="text-brand mr-2">•</Text>
                  <Text className="text-white/75 text-sm leading-5 flex-1">{tip}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {current.sources.length > 0 ? (
            <View className="mt-3 pt-3 border-t border-white/10">
              <Text className="text-white/40 text-[11px] font-bold uppercase tracking-wide mb-1.5">Sources</Text>
              {current.sources.map((s) => (
                <Pressable key={s.url} onPress={() => Linking.openURL(s.url)} className="flex-row items-center py-1">
                  <ExternalLink color={colors.info} size={12} />
                  <Text className="text-xs ml-1.5 flex-1" style={{ color: colors.info }} numberOfLines={1}>
                    {s.title || s.url}
                    {s.date ? ` · ${s.date}` : ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text className="text-white/35 text-[11px] mt-3">
            {error ? `${error} Showing the last briefing. ` : ""}Updated {timeAgo(current.generatedAt)} · AI summary of
            public news, may be incomplete.
          </Text>
        </>
      ) : null}
    </Card>
  );
}

/** One-line banner for screens that just need a heads-up (e.g. Track Route). */
export function AreaBriefingBanner({ briefing }: { briefing: AreaBriefing }) {
  const tone = BRIEFING_RISK_COLOR[briefing.riskLevel];
  return (
    <Card tone={tone} onPress={() => router.push("/danger-zone")} className="mt-4">
      <View className="flex-row items-center">
        <Sparkles color={tone} size={18} />
        <View className="flex-1 ml-3">
          <Text className="text-white font-bold text-sm" numberOfLines={1}>
            {BRIEFING_RISK_LABEL[briefing.riskLevel]} · {briefing.area}
          </Text>
          <Text className="text-white/65 text-xs mt-0.5 leading-4" numberOfLines={2}>
            {briefing.headline}
          </Text>
        </View>
        <ChevronRight color={colors.muted} size={18} />
      </View>
    </Card>
  );
}
