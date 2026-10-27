import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { colors } from "@/theme/colors";

type TabOptions = Exclude<ComponentProps<typeof Tabs>["screenOptions"], ((...args: any[]) => any) | undefined>;

export const tabBarOptions: TabOptions = {
  headerShown: false,
  sceneStyle: { backgroundColor: colors.ink },
  tabBarStyle: {
    backgroundColor: colors.ink,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    height: 66,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarActiveTintColor: colors.brand,
  tabBarInactiveTintColor: colors.placeholder,
  tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
};
