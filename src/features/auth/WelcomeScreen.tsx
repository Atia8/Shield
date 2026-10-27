import { router } from "expo-router";
import { HandHeart, MapPin, Shield, Siren } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { colors, gradients } from "@/theme/colors";

const HIGHLIGHTS = [
  { icon: Siren, text: "One-tap SOS to your trusted contacts" },
  { icon: HandHeart, text: "Verified helpers nearby can respond" },
  { icon: MapPin, text: "Live location, check-ins & danger zones" },
];

export default function WelcomeScreen() {
  return (
    <Screen gradient={gradients.welcome} scroll={false} padded>
      <View className="flex-1 justify-between pb-6">
        <View className="flex-1" />

        <View className="items-center">
          <View className="w-44 h-44 rounded-full bg-brand/5 items-center justify-center border-4 border-brand/10 mb-8">
            <View className="w-32 h-32 rounded-full bg-brand/10 items-center justify-center border-2 border-brand/30">
              <Shield color={colors.brand} size={80} strokeWidth={1.5} fill="rgba(16, 185, 129, 0.2)" />
            </View>
          </View>
          <Text className="text-white text-5xl font-black mb-3 tracking-wide">Shield</Text>
          <Text className="text-brand text-sm font-bold text-center tracking-widest uppercase">
            Personal Safety Companion
          </Text>
          <Text className="text-white/60 text-center mt-3 px-4 leading-5">
            Safety for everyone, and a community ready to help.
          </Text>

          <View className="mt-8 w-full">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <View key={text} className="flex-row items-center mb-3 px-2">
                <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-3">
                  <Icon color={colors.brand} size={16} />
                </View>
                <Text className="text-white/80 text-sm flex-1">{text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="flex-1 justify-end">
          <Button label="GET STARTED" onPress={() => router.push("/signup")} />
          <Pressable className="py-4 items-center" onPress={() => router.push("/login")}>
            <Text className="text-white/60 text-base font-medium">
              Already have an account? <Text className="text-white font-bold">Log in</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
