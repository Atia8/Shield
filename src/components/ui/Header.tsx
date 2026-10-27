import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowLeft, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients } from "@/theme/colors";

interface HeaderProps {
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  /** Show a back (or close) button. Defaults to router.back(). */
  back?: boolean | "close";
  onBack?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
}

export function Header({
  title,
  subtitle,
  subtitleColor = colors.brand,
  back = false,
  onBack,
  left,
  right,
  children,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")));

  return (
    <LinearGradient
      colors={gradients.header}
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: 18,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        borderBottomWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row items-center">
        {back ? (
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel={back === "close" ? "Close" : "Go back"}
            hitSlop={8}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 items-center justify-center mr-4"
          >
            {back === "close" ? <X color="white" size={20} /> : <ArrowLeft color="white" size={20} />}
          </Pressable>
        ) : null}
        {left}
        <View className="flex-1">
          <Text className="text-white text-2xl font-black" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: subtitleColor }} className="text-xs font-bold mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </LinearGradient>
  );
}
