import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Shield } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-[#0B0F1A]">
      {/* 1. Absolute Background Gradient */}
      <LinearGradient
        colors={["#0B0F1A", "#1E1B4B", "#2E1065"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Main Flex Layout */}
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 px-8 pb-8">
        {/* Top Spacer to force the logo into the exact vertical center */}
        <View className="flex-1" />

        {/* --- Center Content (Logo & Title) --- */}
        <View className="items-center justify-center">
          <View className="w-44 h-44 rounded-full bg-[#10B981]/5 items-center justify-center border-4 border-[#10B981]/10 mb-8">
            <View className="w-32 h-32 rounded-full bg-[#10B981]/10 items-center justify-center border-2 border-[#10B981]/30">
              <Shield
                color="#10B981"
                size={80}
                strokeWidth={1.5}
                fill="rgba(16, 185, 129, 0.2)"
              />
            </View>
          </View>

          <Text className="text-white text-5xl font-black mb-3 tracking-wide">
            Shield
          </Text>
          <Text className="text-[#10B981] text-sm font-bold text-center tracking-widest uppercase">
            Personal Safety Companion
          </Text>
        </View>

        {/* --- Bottom Action Area --- */}
        {/* flex-1 with justify-end pushes the buttons to the very bottom */}
        <View className="flex-1 justify-end">
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-[#10B981] rounded-2xl py-4 items-center shadow-lg mb-4"
            onPress={() => router.push("/signup")}
          >
            <Text className="text-[#0B0F1A] font-black text-lg tracking-widest uppercase">
              Get Started with Shield
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 items-center"
            onPress={() => router.push("/login")}
          >
            <Text className="text-white/60 text-base font-medium">
              Already have an account?{" "}
              <Text className="text-white font-bold">Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
