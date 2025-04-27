import React, { useEffect, useState } from "react";
import { Stack, useRouter, SplashScreen } from "expo-router";
import { UserProvider } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";

// Giữ SplashScreen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [appReady, setAppReady] = useState(false); // đổi loading -> appReady

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setAppReady(true); // Chỉ khi lấy session xong mới render app
    };

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!appReady) return; // Chờ app ready mới redirect
    if (session) {
      router.replace("/(tabs)");
    } else {
      router.replace("/Login");
    }
    SplashScreen.hideAsync();
  }, [appReady, session]);

  if (!appReady) {
    return null; // Loading screen tạm
  }

  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Login" options={{ headerShown: false }} />
      </Stack>
    </UserProvider>
  );
}
