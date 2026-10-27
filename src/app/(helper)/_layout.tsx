import { Tabs } from "expo-router";
import { Bot, HandHeart, History, User } from "lucide-react-native";
import { tabBarOptions } from "@/components/ui/tabBar";

export default function HelperTabsLayout() {
  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Respond", tabBarIcon: ({ color, size }) => <HandHeart color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "History", tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="helper-ai"
        options={{ title: "AI Help", tabBarIcon: ({ color, size }) => <Bot color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="helper-profile"
        options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
