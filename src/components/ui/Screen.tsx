import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, gradients } from "@/theme/colors";

interface ScreenProps {
  children: ReactNode;
  /** Rendered above the scroll area (e.g. <Header />). */
  header?: ReactNode;
  /** Rendered below the scroll area (e.g. a sticky action bar). */
  footer?: ReactNode;
  scroll?: boolean;
  /** Extra bottom padding so content clears the tab bar. */
  bottomInset?: number;
  padded?: boolean;
  keyboard?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  gradient?: readonly [string, string, ...string[]];
}

/**
 * Standard page: midnight gradient, safe area, and a max-width column so the
 * layout stays phone-shaped on web/tablets.
 */
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  bottomInset = 40,
  padded = true,
  keyboard = false,
  onRefresh,
  refreshing = false,
  gradient = gradients.screen,
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: padded ? 20 : 0,
        paddingTop: 16,
        paddingBottom: bottomInset,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1" style={{ paddingHorizontal: padded ? 20 : 0 }}>
      {children}
    </View>
  );

  const column = (
    <View className="flex-1 w-full max-w-md self-center">
      {header}
      {body}
      {footer}
    </View>
  );

  return (
    <View className="flex-1 bg-ink">
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={header ? ["bottom"] : ["top", "bottom"]} className="flex-1">
        {keyboard ? (
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {column}
          </KeyboardAvoidingView>
        ) : (
          column
        )}
      </SafeAreaView>
    </View>
  );
}
