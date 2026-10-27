import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/format";
import { colors } from "@/theme/colors";
import { resetPassword, signIn } from "./api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = EMAIL_RE.test(email.trim()) && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      // The route guard moves us to the app once the session is ready.
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter your email above, then tap “Forgot password?” again.");
      return;
    }
    try {
      await resetPassword(email);
      toast("Password reset email sent", "success");
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Screen keyboard header={<Header title="Welcome back" subtitle="Log in to your Shield protection" back />}>
      <View className="pt-4">
        {error ? <ErrorBanner message={error} /> : null}
        <TextField
          label="Email Address"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Password"
          icon={Lock}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={handleLogin}
          right={
            <Pressable onPress={() => setShowPass(!showPass)} hitSlop={8} accessibilityLabel="Toggle password visibility">
              {showPass ? <EyeOff size={18} color={colors.placeholder} /> : <Eye size={18} color={colors.placeholder} />}
            </Pressable>
          }
        />
        <Pressable onPress={handleReset} className="self-end mb-6" hitSlop={8}>
          <Text className="text-brand text-sm font-bold">Forgot password?</Text>
        </Pressable>

        <Button label="LOG IN" onPress={handleLogin} loading={loading} disabled={!canSubmit} />

        <View className="flex-row justify-center mt-6">
          <Text className="text-white/60">Don't have an account? </Text>
          <Pressable onPress={() => router.replace("/signup")}>
            <Text className="font-bold underline text-white">Sign up</Text>
          </Pressable>
        </View>
        <Text className="text-center text-[11px] text-white/30 mt-10">Protected by the Shield Emergency Network</Text>
      </View>
    </Screen>
  );
}
