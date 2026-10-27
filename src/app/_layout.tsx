import "../global.css";

import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Shield } from "lucide-react-native";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { CheckInProvider } from "@/features/checkin/CheckInProvider";
import { ProtectionProvider } from "@/features/protection/ProtectionProvider";
import { colors } from "@/theme/colors";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/**
 * All access rules live here as Stack.Protected guards:
 * - signed out: welcome, login, sign-up
 * - user mode: the user tabs plus SOS and personal-safety tools
 * - helper mode: the helper tabs plus the alert response screen
 * - any signed-in person: chat, verification, profile & info pages
 * When a guard flips (sign in/out, mode switch) the router redirects to the
 * first screen that is allowed, so the order below matters.
 */
function RootNavigator() {
  const { status, mode } = useAuth();
  const signedIn = status === "signedIn";
  const userMode = signedIn && mode === "user";
  const helperMode = signedIn && mode === "helper";

  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  // Guards hide screens; this sends a signed-in person to the right home
  // (after login/sign-up, on app start, and when switching modes).
  const segments = useSegments();
  const top = segments[0] as string | undefined;
  useEffect(() => {
    if (status !== "signedIn") return;
    const onAuthScreen = !top || top === "index" || top === "login" || top === "signup";
    const inWrongShell = (mode === "helper" && top === "(user)") || (mode === "user" && top === "(helper)");
    if (onAuthScreen || inWrongShell) router.replace(mode === "helper" ? "/dashboard" : "/home");
  }, [status, mode, top]);

  // Mount the navigator only once the session is known: while restoring, every
  // guard is closed, and the router would drop the opened URL (deep link,
  // web reload) in favour of the welcome screen.
  if (status === "loading") return <LoadingOverlay />;

  return (
    <CheckInProvider enabled={userMode}>
      <ProtectionProvider enabled={userMode}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.ink },
            animation: "slide_from_right",
          }}
        >
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
          </Stack.Protected>

          <Stack.Protected guard={userMode}>
            <Stack.Screen name="(user)" />
            <Stack.Screen
              name="sos"
              options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }}
            />
            <Stack.Screen name="sos-active" options={{ gestureEnabled: false }} />
            <Stack.Screen name="check-in" />
            <Stack.Screen name="track-route" />
            <Stack.Screen name="fake-call" options={{ presentation: "fullScreenModal", animation: "fade" }} />
            <Stack.Screen name="danger-zone" />
            <Stack.Screen name="alert-history" />
          </Stack.Protected>

          <Stack.Protected guard={helperMode}>
            <Stack.Screen name="(helper)" />
            <Stack.Screen name="respond/[id]" />
          </Stack.Protected>

          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="verification" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="help" />
            <Stack.Screen name="privacy" />
          </Stack.Protected>
        </Stack>
      </ProtectionProvider>
    </CheckInProvider>
  );
}

/** Shown while the session is restored (web has no native splash). */
function LoadingOverlay() {
  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.ink }}
      className="items-center justify-center"
    >
      <Shield color={colors.brand} size={64} strokeWidth={1.5} />
      <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
    </View>
  );
}
