import { router } from "expo-router";
import { Shield } from "lucide-react-native";
import {
  Image,

  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Hero Image */}
      <View className="flex-[3]">
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900",
          }}
          className="w-full h-full"
          resizeMode="cover"
        />

<LinearGradient
  
  colors={[
  "rgba(0,0,0,0.08)",
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0.75)",
]}
locations={[0, 0.4, 1]}
   style={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }}
/>

        {/* Overlay */}
        <View className="absolute bottom-8 left-6 pb-5">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-coral items-center justify-center mr-3">
              <Shield color="white" size={20} />
            </View>

            <Text className="text-white text-3xl font-bold">
              SheShield 
            </Text>
          </View>

          <Text className="text-white mt-3 text-base">
            Personal safety, everywhere you go.
          </Text>
        </View>
      </View>

      {/* Bottom Card */}
      <View className="flex-2 bg-white rounded-t-[32px] -mt-6 px-6 pt-8 pb-4">
        <Text className="text-3xl font-bold text-nearBlack">
          Safety you can rely on,
        </Text>

        <Text className="text-3xl font-bold text-nearBlack">
          community you can trust.
        </Text>

        <Text className="text-midGray mt-4 leading-6">
          Join thousands of women who travel safer every day.
        </Text>

        <TouchableOpacity
          className="bg-coral rounded-2xl py-4 mt-8 items-center"
          onPress={() => router.push("/signup")}
        >
          <Text className="text-white font-bold text-lg">
            Sign up with Email
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center mt-6"
          onPress={() => router.push("/login")}
        >
          <Text className="text-midGray">
            Already have an account?{" "}
            <Text className="text-nearBlack font-bold">
              Log in
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}