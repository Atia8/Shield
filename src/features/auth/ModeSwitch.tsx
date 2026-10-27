import { HandHeart, Siren } from "lucide-react-native";
import { View } from "react-native";
import { Segmented } from "@/components/ui/Card";
import { useAuth } from "./AuthProvider";

/**
 * For "Both" accounts: switch between asking for help and responding to
 * alerts. Changing it flips the route guards, which swaps the tab shell.
 */
export function ModeSwitch() {
  const { canSwitchMode, mode, setMode } = useAuth();
  if (!canSwitchMode) return null;
  return (
    <View className="mt-4">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "user", label: "Ask for help", icon: Siren },
          { value: "helper", label: "Respond to alerts", icon: HandHeart },
        ]}
      />
    </View>
  );
}
