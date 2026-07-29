import { LinearGradient } from "expo-linear-gradient";
import {
    Activity,
    AlertTriangle,
    ChevronRight,
    Clock,
    Mic,
    Navigation,
    Settings,
    Shield,
    Users,
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
    Alert,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { triggerEmergencyAlert } from "../../services/sos";

interface HomeScreenProps {
  onNavigateToTrackRoute?: () => void;
  onNavigateToTimedCheckIn?: () => void;
  onNavigateToResponders?: () => void;
  onNavigateToMovement?: () => void;
}

type SosState = "IDLE" | "COUNTDOWN" | "SENDING" | "SENT";

export default function HomeScreen({
  onNavigateToTrackRoute,
  onNavigateToTimedCheckIn,
  onNavigateToResponders,
  onNavigateToMovement,
}: HomeScreenProps) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMovementActive, setIsMovementActive] = useState(false);
  const [sosState, setSosState] = useState<SosState>("IDLE");
  const [countdown, setCountdown] = useState(5);

  // FIXED: Using ReturnType to get the correct cross-platform timer type
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const executeSos = async () => {
    setSosState("SENDING");
    try {
      // Calls the Firebase backend service
      await triggerEmergencyAlert();
      setSosState("SENT");
    } catch (error: any) {
      Alert.alert(
        "SOS Failed",
        error.message || "Could not reach emergency contacts.",
      );
      setSosState("IDLE");
    } finally {
      // Return to default state after 4 seconds of showing "SENT"
      setTimeout(() => setSosState("IDLE"), 4000);
    }
  };

  const handleSosPress = () => {
    if (sosState === "IDLE") {
      setSosState("COUNTDOWN");
      setCountdown(5);

      let currentSeconds = 5;
      timerRef.current = setInterval(() => {
        currentSeconds -= 1;
        setCountdown(currentSeconds);

        if (currentSeconds <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          executeSos();
        }
      }, 1000);
    } else if (sosState === "COUNTDOWN") {
      // Cancel the SOS if tapped during the countdown
      if (timerRef.current) clearInterval(timerRef.current);
      setSosState("IDLE");
      setCountdown(5);
    }
  };

  return (
    <View className="flex-1 bg-[#0B0F1A]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- 1. TOP BAR SECTION --- */}
        <LinearGradient
          colors={["#1E1B4B", "rgba(11, 15, 26, 0.8)"]}
          className="pt-12 pb-6 px-6 rounded-b-[32px]"
        >
          <SafeAreaView edges={["top"]}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-3xl font-black">
                  SheShield
                </Text>
                <Text className="text-[#10B981] text-sm font-bold mt-1">
                  You're protected
                </Text>
              </View>
              <TouchableOpacity className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/15">
                <Settings color="white" size={20} />
              </TouchableOpacity>
            </View>

            {/* Status Card */}
            <View className="bg-white/10 border border-white/15 rounded-2xl p-4 flex-row items-center mt-2">
              <View className="w-12 h-12 rounded-xl bg-purple-500/20 items-center justify-center mr-4 border border-purple-500/30">
                <Shield color="#8B5CF6" size={26} />
              </View>
              <View>
                <Text className="text-white font-bold text-base">
                  Safety Status: Active
                </Text>
                <Text className="text-white/60 text-xs mt-0.5">
                  3 trusted contacts linked
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* --- 2. VOICE PROTECTION CARD --- */}
        <View className="px-6 mt-4">
          <View
            className={`p-5 rounded-3xl border flex-row items-center justify-between ${
              isVoiceEnabled
                ? "bg-[#10B981]/10 border-[#10B981]/40"
                : "bg-white/10 border-white/15"
            }`}
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-3">
                <Mic color={isVoiceEnabled ? "#10B981" : "#EA580C"} size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">
                  Voice Protection
                </Text>
                <Text className="text-white/60 text-xs mt-0.5">
                  {isVoiceEnabled
                    ? "Active - Monitoring keywords"
                    : "Hands-free SOS trigger"}
                </Text>
              </View>
            </View>
            <Switch
              value={isVoiceEnabled}
              onValueChange={setIsVoiceEnabled}
              trackColor={{ false: "#334155", true: "rgba(16, 185, 129, 0.5)" }}
              thumbColor={isVoiceEnabled ? "#10B981" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* --- 3. MOVEMENT STATUS BANNER --- */}
        {isMovementActive && (
          <View className="px-6 mt-3">
            <TouchableOpacity
              onPress={onNavigateToMovement}
              className="p-4 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex-row items-center"
            >
              <Activity color="#10B981" size={22} />
              <View className="ml-3 flex-1">
                <Text className="text-white font-bold text-sm">
                  Movement Monitoring
                </Text>
                <Text className="text-[#10B981] text-xs">
                  Active - Monitoring anomalies
                </Text>
              </View>
              <ChevronRight color="white" size={20} />
            </TouchableOpacity>
          </View>
        )}

        {/* --- 4. CENTRAL SOS BUTTON --- */}
        <View className="items-center my-8">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSosPress}
            className="items-center justify-center"
          >
            {/* Outer Glow Ring */}
            <View
              className={`w-64 h-64 rounded-full items-center justify-center border-4 ${
                sosState === "SENT"
                  ? "bg-[#10B981]/20 border-[#10B981]"
                  : sosState === "COUNTDOWN"
                    ? "bg-amber-500/20 border-amber-500"
                    : sosState === "SENDING"
                      ? "bg-purple-500/20 border-purple-500"
                      : "bg-red-600/20 border-red-500"
              }`}
            >
              {/* Inner Solid Button */}
              <View
                className={`w-52 h-52 rounded-full items-center justify-center border-2 ${
                  sosState === "SENT"
                    ? "bg-[#10B981] border-white/50"
                    : sosState === "COUNTDOWN"
                      ? "bg-amber-500 border-white/50"
                      : sosState === "SENDING"
                        ? "bg-purple-500 border-white/50"
                        : "bg-red-600 border-white/50"
                }`}
              >
                <Text className="text-white font-black text-4xl tracking-wider">
                  {sosState === "COUNTDOWN"
                    ? `${countdown}...`
                    : sosState === "SENDING"
                      ? "WAIT"
                      : sosState === "SENT"
                        ? "SENT"
                        : "SOS"}
                </Text>
                <Text className="text-white/80 font-bold text-xs mt-1 uppercase tracking-widest text-center px-4">
                  {sosState === "COUNTDOWN"
                    ? "Tap to Cancel"
                    : sosState === "SENDING"
                      ? "Locating & Alerting..."
                      : sosState === "SENT"
                        ? "Help Notified"
                        : "Tap for Emergency"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* --- 5. QUICK ACTIONS GRID --- */}
        <View className="px-6">
          <Text className="text-white text-xl font-extrabold mb-4">
            Quick Actions
          </Text>

          {/* Grid Row 1 */}
          <View className="flex-row justify-between mb-4">
            <TouchableOpacity
              onPress={onNavigateToTrackRoute}
              className="w-[48%] h-36 bg-white/10 border border-white/15 rounded-3xl p-4 justify-between"
            >
              <View className="w-10 h-10 rounded-xl bg-purple-500/20 items-center justify-center">
                <Navigation color="#8B5CF6" size={22} />
              </View>
              <View>
                <Text className="text-white font-bold text-base">
                  Track Route
                </Text>
                <Text className="text-white/50 text-xs mt-0.5">
                  Share location
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateToTimedCheckIn}
              className="w-[48%] h-36 bg-white/10 border border-white/15 rounded-3xl p-4 justify-between"
            >
              <View className="w-10 h-10 rounded-xl bg-purple-500/20 items-center justify-center">
                <Clock color="#8B5CF6" size={22} />
              </View>
              <View>
                <Text className="text-white font-bold text-base">
                  Timed Check-In
                </Text>
                <Text className="text-white/50 text-xs mt-0.5">
                  Set safety timer
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Responders Card (Full Width) */}
          <TouchableOpacity
            onPress={onNavigateToResponders}
            className="w-full bg-white/10 border border-white/15 rounded-3xl p-5 flex-row items-center mb-4"
          >
            <View className="w-12 h-12 rounded-2xl bg-emerald-500/20 items-center justify-center mr-4">
              <Users color="#10B981" size={26} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">
                Responders Near Me
              </Text>
              <Text className="text-white/60 text-xs mt-0.5">
                Find verified community helpers
              </Text>
            </View>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>

          {/* Movement Detection Button */}
          <TouchableOpacity
            onPress={() => {
              setIsMovementActive(!isMovementActive);
              if (onNavigateToMovement) onNavigateToMovement();
            }}
            className={`w-full h-14 rounded-2xl flex-row items-center justify-center mb-4 ${
              isMovementActive ? "bg-[#10B981]" : "bg-[#8B5CF6]"
            }`}
          >
            <Activity color="white" size={22} />
            <Text className="text-white font-bold text-base ml-3">
              {isMovementActive
                ? "Monitoring Active"
                : "Enable Movement Detection"}
            </Text>
          </TouchableOpacity>

          {/* Safe Caution Box */}
          <View className="w-full bg-[#EA580C]/10 border border-[#EA580C]/20 rounded-2xl p-4 flex-row items-center">
            <AlertTriangle color="#EA580C" size={24} />
            <View className="ml-3 flex-1">
              <Text className="text-[#EA580C] font-bold text-sm">
                Safety Alert
              </Text>
              <Text className="text-white/70 text-xs mt-0.5">
                Caution: High incident rate reported in nearby area.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
