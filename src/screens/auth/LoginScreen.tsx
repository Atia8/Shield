import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AirbnbInput from "../../components/AirbnbInput";
import { login } from "../../services/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      // Firebase Authentication
      await login(email.trim(), password);

      // Use replace so user cannot click back into login screen after logging in
      router.replace("/home");
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.message || "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* HEADER */}
      <View className="px-6 pt-6 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full border border-[#DDDDDD] items-center justify-center mb-6"
        >
          <ArrowLeft size={18} color="#222222" />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-[#222222]">Welcome back</Text>
        <Text className="text-[#717171] text-base mt-1">
          Log in to access your Shield protection
        </Text>
      </View>

      {/* FORM CONTENT */}
      <View className="flex-1 px-6 pt-4">
        <AirbnbInput
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AirbnbInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          right={
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              {showPass ? (
                <EyeOff size={18} color="#717171" />
              ) : (
                <Eye size={18} color="#717171" />
              )}
            </TouchableOpacity>
          }
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading || !email || !password}
          className={`w-full py-4 rounded-2xl mt-4 items-center ${
            email && password ? "bg-[#FF385C]" : "bg-[#F7F7F7]"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className={`font-bold text-base ${
                email && password ? "text-white" : "text-[#BBBBBB]"
              }`}
            >
              Log in
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-[#717171]">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text className="font-bold underline text-[#222222]">Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text className="px-8 pb-8 text-center text-[11px] text-[#717171]">
        Protected by SheShield Emergency Network
      </Text>
    </SafeAreaView>
  );
}
