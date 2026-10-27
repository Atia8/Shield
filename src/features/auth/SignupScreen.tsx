import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check, Eye, EyeOff, HandHeart, Lock, Mail, Shield, User, Users, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Avatar, ErrorBanner } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { PhoneField } from "@/components/ui/PhoneField";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { DEFAULT_COUNTRY, isValidPhone } from "@/lib/countries";
import { errorMessage } from "@/lib/format";
import { colors, gradients, withAlpha } from "@/theme/colors";
import type { Gender, UserType } from "@/types/models";
import { GENDER_OPTIONS, ROLE_OPTIONS, signUp } from "./api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_ICON: Record<UserType, LucideIcon> = { user: Shield, helper: HandHeart, user_helper: Users };

export default function SignupScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);

  const [userType, setUserType] = useState<UserType>("user");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = email.length > 0 && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address" : undefined;
  const step1Valid = name.trim().length >= 2 && EMAIL_RE.test(email.trim()) && isValidPhone(phone, country) && gender !== null;
  const passwordError = password.length > 0 && password.length < 8 ? "At least 8 characters" : undefined;
  const confirmError = confirm.length > 0 && confirm !== password ? "Passwords don't match" : undefined;
  const step2Valid = password.length >= 8 && confirm === password && agreed;

  const handleSignup = async () => {
    if (!step1Valid || !step2Valid || !gender) return;
    setLoading(true);
    setError(null);
    try {
      await signUp({ name, email, password, phone, countryCode: country.dial, gender, userType });
      // The route guard opens the right home (user or helper) once the profile exists.
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  const progress = step === 1 ? "50%" : "100%";

  return (
    <Screen
      keyboard
      header={
        <Header
          title={step === 1 ? "Create Account" : "Your Role & Security"}
          subtitle={step === 1 ? "Join Shield: personal safety for everyone" : "Choose how you'll use Shield"}
          back
          onBack={() => (step === 2 ? setStep(1) : router.back())}
        >
          <View className="mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs font-bold text-brand">STEP {step} OF 2</Text>
              <Text className="text-xs font-bold text-brand">{progress}</Text>
            </View>
            <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: progress, height: "100%", borderRadius: 999 }}
              />
            </View>
          </View>
        </Header>
      }
    >
      {error ? <ErrorBanner message={error} /> : null}

      {step === 1 ? (
        <View>
          <TextField
            label="Full Name"
            icon={User}
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />
          <TextField
            label="Email Address"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={emailError}
          />
          <PhoneField country={country} onCountryChange={setCountry} phone={phone} onPhoneChange={setPhone} />

          <Text className="text-sm font-semibold text-white/90 mb-2">Gender</Text>
          <View className="flex-row flex-wrap -mx-1 mb-1">
            {GENDER_OPTIONS.map((g) => {
              const selected = gender === g.value;
              return (
                <View key={g.value} className="w-1/2 p-1">
                  <Pressable
                    onPress={() => setGender(g.value)}
                    accessibilityRole="radio"
                    accessibilityLabel={g.label}
                    accessibilityState={{ selected }}
                    className={`h-12 rounded-xl items-center justify-center border ${
                      selected ? "border-brand bg-brand/15" : "border-white/10 bg-surface"
                    }`}
                  >
                    <Text className={`font-semibold ${selected ? "text-brand" : "text-white/60"}`}>{g.label}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Text className="text-white/40 text-xs mb-8 ml-1">
            Shield is for everyone. Your gender never limits which role you can choose.
          </Text>

          <Button label="CONTINUE" onPress={() => setStep(2)} disabled={!step1Valid} />
          <View className="flex-row justify-center mt-6">
            <Text className="text-white/60">Already have an account? </Text>
            <Pressable onPress={() => router.replace("/login")}>
              <Text className="font-bold underline text-white">Log in</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          <View className="flex-row items-center bg-surface border border-white/10 rounded-2xl px-4 py-3 mb-6">
            <Avatar name={name} size={44} />
            <View className="ml-3 flex-1">
              <Text className="font-bold text-white text-base">{name}</Text>
              <Text className="text-xs text-white/60">
                {email} · {country.dial} {phone}
              </Text>
            </View>
            <Pressable onPress={() => setStep(1)} hitSlop={8}>
              <Text className="text-xs font-bold text-brand">EDIT</Text>
            </Pressable>
          </View>

          <Text className="text-sm font-semibold text-white/90 mb-3">How will you use Shield?</Text>
          {ROLE_OPTIONS.map((role) => {
            const selected = userType === role.value;
            const Icon = ROLE_ICON[role.value];
            return (
              <Pressable
                key={role.value}
                onPress={() => setUserType(role.value)}
                accessibilityRole="radio"
                accessibilityLabel={`${role.title}: ${role.description}`}
                accessibilityState={{ selected }}
                className="flex-row items-center rounded-2xl p-4 mb-3 border"
                style={{
                  backgroundColor: selected ? withAlpha(colors.brand, 0.12) : colors.surface,
                  borderColor: selected ? colors.brand : colors.border,
                }}
              >
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: withAlpha(selected ? colors.brand : colors.accent, 0.18) }}
                >
                  <Icon color={selected ? colors.brand : colors.accent} size={22} />
                </View>
                <View className="flex-1 pr-2">
                  <Text className={`font-bold text-base ${selected ? "text-brand" : "text-white"}`}>{role.title}</Text>
                  <Text className="text-white/60 text-xs mt-0.5 leading-4">{role.description}</Text>
                </View>
                <View
                  className="w-6 h-6 rounded-full border-2 items-center justify-center"
                  style={{ borderColor: selected ? colors.brand : "rgba(255,255,255,0.3)" }}
                >
                  {selected ? <View className="w-3 h-3 rounded-full bg-brand" /> : null}
                </View>
              </Pressable>
            );
          })}
          {userType !== "user" ? (
            <Text className="text-white/40 text-xs mb-4 ml-1 leading-4">
              Helpers verify their identity (ID + selfie) before they can accept alerts. You can do this after signing up.
            </Text>
          ) : (
            <View className="mb-4" />
          )}

          <TextField
            label="Create Password"
            icon={Lock}
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            autoComplete="new-password"
            error={passwordError}
            right={
              <Pressable onPress={() => setShowPass(!showPass)} hitSlop={8} accessibilityLabel="Toggle password visibility">
                {showPass ? <EyeOff size={18} color={colors.placeholder} /> : <Eye size={18} color={colors.placeholder} />}
              </Pressable>
            }
          />
          <TextField
            label="Confirm Password"
            icon={Lock}
            placeholder="Re-enter password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPass}
            autoComplete="new-password"
            error={confirmError}
          />

          <Pressable
            className="flex-row items-start mt-1 mb-8"
            onPress={() => setAgreed(!agreed)}
            accessibilityRole="checkbox"
            accessibilityLabel="Agree to the Terms of Service and Privacy Policy"
            accessibilityState={{ checked: agreed }}
          >
            <View
              className={`w-5 h-5 rounded-md border mr-3 items-center justify-center ${
                agreed ? "bg-brand border-brand" : "border-white/30"
              }`}
            >
              {agreed ? <Check size={14} color={colors.ink} strokeWidth={3} /> : null}
            </View>
            <Text className="flex-1 text-sm text-white/60 leading-5">
              I agree to Shield's Terms of Service and Privacy Policy, and to share my location with my contacts and
              helpers during an SOS.
            </Text>
          </Pressable>

          <Button label="CREATE ACCOUNT" onPress={handleSignup} loading={loading} disabled={!step2Valid} />
        </View>
      )}
    </Screen>
  );
}
