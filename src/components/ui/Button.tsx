import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { colors, gradients, withAlpha } from "@/theme/colors";

type Variant = "primary" | "danger" | "accent" | "secondary" | "ghost" | "outlineDanger";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  size?: "md" | "lg";
  className?: string;
}

const solid: Partial<Record<Variant, readonly [string, string]>> = {
  primary: gradients.brand,
  danger: gradients.danger,
  accent: [colors.accent, "#7C3AED"],
};

export function Button({
  label,
  onPress,
  variant = "primary",
  icon: Icon,
  loading = false,
  disabled = false,
  size = "lg",
  className = "",
}: ButtonProps) {
  const inactive = disabled || loading;
  const height = size === "lg" ? 56 : 46;
  const gradient = inactive && solid[variant] ? gradients.disabled : solid[variant];
  const textColor =
    variant === "primary" && !inactive
      ? colors.ink
      : variant === "outlineDanger"
        ? colors.danger
        : inactive && gradient
          ? colors.faint
          : colors.text;

  const content = (
    <View className="flex-row items-center justify-center px-5" style={{ height }}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {Icon ? <Icon color={textColor} size={20} /> : null}
          <Text
            style={{ color: textColor, marginLeft: Icon ? 10 : 0 }}
            className={`font-black tracking-wide ${size === "lg" ? "text-base" : "text-sm"}`}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={`w-full rounded-2xl overflow-hidden ${className}`}
      style={({ pressed }) => [
        { opacity: pressed ? 0.85 : 1 },
        variant === "secondary" && {
          backgroundColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.15)",
        },
        variant === "outlineDanger" && {
          backgroundColor: withAlpha(colors.danger, 0.12),
          borderWidth: 1,
          borderColor: withAlpha(colors.danger, 0.35),
        },
      ]}
    >
      {gradient ? (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}
