// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";
import { UserProvider } from "@/lib/UserContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <UserProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#000",
          tabBarInactiveTintColor: "#666",
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarShowLabel: false,
          tabBarStyle: Platform.select({
            ios: { position: "absolute", backgroundColor: "transparent" },
            default: {
              backgroundColor: "#fff",
              borderTopWidth: 1,
              borderTopColor: "#ddd",
            },
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="magnifyingglass" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="NewThread"
          options={{
            title: "New Thread",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="plus.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Activity"
          options={{
            title: "Activity",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="heart.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    </UserProvider>
  );
}
