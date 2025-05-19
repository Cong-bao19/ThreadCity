// import React from 'react';
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://ixdmmblxqxjvtrsilszz.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4ZG1tYmx4cXhqdnRyc2lsc3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1ODcyOTUsImV4cCI6MjA2MTE2MzI5NX0.NSBGwTzevWBnuBN8NMGsK0Vs3HXjw4GwlRF7GK60v-Y";
// Tự động dùng localStorage cho Web, AsyncStorage cho Mobile
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  ...(Platform.OS !== "web"
    ? {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    : {}),
});

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}