// app/_layout.js
import { UserProvider } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ❌ ReactQueryDevtools chỉ hoạt động với web – không import nữa
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SplashScreen, Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [appReady, setAppReady] = useState(false);

  // Tạo instance QueryClient
  const queryClient = new QueryClient();

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setAppReady(true);
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
    if (!appReady) return;
    if (session) {
      router.replace("/(tabs)");
    } else {
      router.replace("/Login");
    }
    SplashScreen.hideAsync();
  }, [appReady, session]);

  if (!appReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="Login" options={{ headerShown: false }} />
          <Stack.Screen
            name="thread/[postId]"
            options={{ headerShown: false }}
          />
        </Stack>
      </UserProvider>

      {/* ❌ ReactQueryDevtools không hỗ trợ React Native, xóa bỏ */}
      {/* <ReactQueryDevtools initialIsOpen={true} /> */}
    </QueryClientProvider>
  );
}