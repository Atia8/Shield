import { ChevronRight, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Switch, Text, View, type ViewStyle } from "react-native";
import { initials } from "@/lib/format";
import { colors, withAlpha } from "@/theme/colors";

/** Glass card. Pass `tone` for a tinted variant. */
export function Card({
  children,
  tone,
  onPress,
  className = "",
  style,
}: {
  children: ReactNode;
  tone?: string;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
}) {
  const toneStyle: ViewStyle = tone
    ? { backgroundColor: withAlpha(tone, 0.1), borderColor: withAlpha(tone, 0.3) }
    : {};
  const base = `rounded-3xl p-5 border ${tone ? "" : "bg-white/5 border-white/10"} ${className}`;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className={base}
        style={({ pressed }) => [toneStyle, style, { opacity: pressed ? 0.8 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View className={base} style={[toneStyle, style]}>
      {children}
    </View>
  );
}

export function IconBadge({ icon: Icon, color, size = 48 }: { icon: LucideIcon; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: withAlpha(color, 0.18),
        borderColor: withAlpha(color, 0.3),
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon color={color} size={size * 0.5} />
    </View>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mt-7 mb-3">
      <Text className="text-white text-lg font-extrabold">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-brand text-sm font-bold">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Pill({ label, color = colors.brand, icon: Icon }: { label: string; color?: string; icon?: LucideIcon }) {
  return (
    <View
      className="flex-row items-center self-start px-2.5 py-1 rounded-full"
      style={{ backgroundColor: withAlpha(color, 0.15), borderColor: withAlpha(color, 0.35), borderWidth: 1 }}
    >
      {Icon ? <Icon color={color} size={12} /> : null}
      <Text style={{ color, marginLeft: Icon ? 4 : 0 }} className="text-[11px] font-bold uppercase tracking-wide">
        {label}
      </Text>
    </View>
  );
}

export function Avatar({ name, color = colors.brand, size = 48 }: { name: string; color?: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: withAlpha(color, 0.2),
        borderColor: withAlpha(color, 0.35),
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color, fontSize: size * 0.36 }} className="font-black">
        {initials(name)}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  children,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <View className="items-center py-10 px-6">
      <View className="w-16 h-16 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-4">
        <Icon color={colors.faint} size={28} />
      </View>
      <Text className="text-white font-bold text-base text-center">{title}</Text>
      <Text className="text-white/50 text-sm text-center mt-1 leading-5">{message}</Text>
      {children ? <View className="mt-5 w-full">{children}</View> : null}
    </View>
  );
}

export function ListRow({
  icon: Icon,
  label,
  detail,
  color = colors.accent,
  onPress,
  destructive,
  toggle,
  last,
}: {
  icon: LucideIcon;
  label: string;
  detail?: string;
  color?: string;
  onPress?: () => void;
  destructive?: boolean;
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  last?: boolean;
}) {
  const tint = destructive ? colors.danger : color;
  return (
    <Pressable
      onPress={toggle ? () => toggle.onChange(!toggle.value) : onPress}
      accessibilityRole={toggle ? "switch" : "button"}
      className={`flex-row items-center px-4 py-3.5 ${last ? "" : "border-b border-white/5"}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: withAlpha(tint, 0.15) }}
      >
        <Icon color={tint} size={18} />
      </View>
      <View className="flex-1">
        <Text style={{ color: destructive ? colors.danger : colors.text }} className="font-semibold text-[15px]">
          {label}
        </Text>
        {detail ? <Text className="text-white/50 text-xs mt-0.5">{detail}</Text> : null}
      </View>
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ false: "#334155", true: withAlpha(colors.brand, 0.5) }}
          thumbColor={toggle.value ? colors.brand : "#f4f3f4"}
        />
      ) : destructive ? null : (
        <ChevronRight color={colors.faint} size={18} />
      )}
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row bg-white/5 border border-white/10 rounded-2xl p-1">
      {options.map((opt) => {
        const selected = opt.value === value;
        const Icon = opt.icon;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${selected ? "bg-brand" : ""}`}
          >
            {Icon ? <Icon color={selected ? colors.ink : colors.muted} size={15} /> : null}
            <Text
              style={{ color: selected ? colors.ink : colors.muted, marginLeft: Icon ? 6 : 0 }}
              className="font-bold text-[13px]"
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`px-4 h-11 rounded-xl items-center justify-center border ${
        selected ? "bg-accent border-accent" : "bg-white/5 border-white/10"
      }`}
    >
      <Text className="text-white font-bold text-sm">{label}</Text>
    </Pressable>
  );
}

export function LoadingView({ label }: { label?: string }) {
  return (
    <View className="items-center justify-center py-16">
      <ActivityIndicator color={colors.accent} size="large" />
      {label ? <Text className="text-white/60 mt-4 font-medium">{label}</Text> : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-4">
      <Text className="text-red-300 text-sm leading-5">{message}</Text>
    </View>
  );
}
