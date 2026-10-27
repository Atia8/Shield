import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, Text, View } from "react-native";
import { colors, withAlpha } from "@/theme/colors";

/** The big pulsing SOS button. Pressing it opens the cancellable countdown. */
export function SosButton({ onPress, active = false }: { onPress: () => void; active?: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const color = active ? colors.warn : colors.danger;
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View className="items-center justify-center" style={{ height: 260 }}>
      <Animated.View
        style={{
          pointerEvents: "none",
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: withAlpha(color, 0.35),
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        }}
      />
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={active ? "Open active SOS" : "Send SOS emergency alert"}
        style={({ pressed }) => ({
          width: 220,
          height: 220,
          borderRadius: 110,
          borderWidth: 4,
          borderColor: color,
          backgroundColor: withAlpha(color, 0.2),
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <View
          style={{
            width: 176,
            height: 176,
            borderRadius: 88,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-white font-black text-5xl tracking-wider">SOS</Text>
          <Text className="text-white/85 font-bold text-[11px] mt-1 uppercase tracking-widest text-center px-4">
            {active ? "Alert active, tap to view" : "Tap for emergency"}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
