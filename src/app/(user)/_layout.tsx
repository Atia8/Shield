import { Tabs } from "expo-router";
import { Bot, Shield, User, Users } from "lucide-react-native";
import { tabBarOptions } from "@/components/ui/tabBar";

export default function UserTabsLayout() {
  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Shield color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="contacts"
        options={{ title: "Contacts", tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="ai"
        options={{ title: "AI Help", tabBarIcon: ({ color, size }) => <Bot color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
