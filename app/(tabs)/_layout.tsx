// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";
import { UserProvider } from "@/lib/UserContext";
import { Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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
            tabBarIcon: ({ focused, color }) => {
              const iconColor = focused ? 'black' : 'gray';
              return <Icon name="home" size={24} color={iconColor} />;
            },
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ focused }) => {
              const iconColor = focused ? 'black' : 'gray'
              return <Icon name="search" size={22} color={iconColor} />
            },
          }}
        />
        <Tabs.Screen
          name="NewThread"
          options={{
            title: "New Thread",
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/images/addThread.png')}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: focused ? '#000' : '#666', // Đổi màu dựa trên focus
                }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Activity"
          options={{
            title: "Activity",
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/images/heart.png')}
                style={{
                  width: 22,
                  height: 22,
                  tintColor: focused ? '#000' : '#gray', // Đổi màu dựa trên focus
                }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chatUserList"
          options={{
            title: "Chat",
            tabBarIcon: ({ focused }) => (
              <Icon name="chatbubble-ellipses-outline" size={22} color={focused ? "#000" : "#666"} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/images/person.png')}
                style={{
                  width: 22,
                  height: 22,
                  tintColor: focused ? '#000' : '#666', // Đổi màu dựa trên focus
                }}
              />
            )
          }}
        />
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="thread" options={{ href: null }} />
        <Tabs.Screen name="edit" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="profile-settings" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="saved" options={{ href: null }} />
        <Tabs.Screen name="likes" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="account-status" options={{ href: null }} />
        <Tabs.Screen name="about" options={{ href: null }} />
        <Tabs.Screen name="help" options={{ href: null }} />
        <Tabs.Screen name="invite-friends" options={{ href: null }} />
        <Tabs.Screen name="chat" options={{ href: null }} />
      </Tabs>
    </UserProvider>
  );
}