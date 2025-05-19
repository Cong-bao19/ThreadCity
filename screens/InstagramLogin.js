// screens/InstagramLogin.js
import React, { useState } from "react";
import { FontAwesome } from "@expo/vector-icons"; // icon Facebook

import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/UserContext";
import { router } from "expo-router";

export default function InstagramLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error("Login error:", error.message);
        alert("Sai email hoặc mật khẩu");
        return;
      }

      if (data.user) {
        setUser(data.user);
        console.log("User ID:", data.user.id);
        alert("Đăng nhập thành công");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Lỗi không xác định khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
      });

      if (error) {
        console.error("Facebook login error:", error.message);
        alert("Không thể đăng nhập bằng Facebook");
      } else {
        console.log("Redirecting to Facebook...");
      }
    } catch (err) {
      console.error("Unexpected Facebook login error:", err);
      alert("Đã xảy ra lỗi khi đăng nhập Facebook");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.innerContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/threadlogo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry={secureTextEntry}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setSecureTextEntry(!secureTextEntry)}
            style={styles.showPasswordButton}
            disabled={loading}
          >
            <Text style={styles.showPasswordText}>
              {secureTextEntry ? "Show" : "Hide"} Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFacebookLogin}
            style={styles.facebookButton}
            disabled={loading}
          >
            <FontAwesome
              name="facebook"
              size={20}
              color="#fff"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.facebookButtonText}>
              Continue with Facebook
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => router.push("/SignUp")}
            disabled={loading}
          >
            <Text style={styles.signupButton}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 20,
  },
  innerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logo: { width: 200, height: 60, resizeMode: "contain" },
  formContainer: { width: "100%" },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  showPasswordButton: { marginBottom: 20, alignItems: "flex-end" },
  showPasswordText: { color: "#3897f0", fontSize: 14 },
  loginButton: {
    backgroundColor: "#3897f0",
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  loginButtonDisabled: { backgroundColor: "#a0c4ff" },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  facebookButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1877F2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    justifyContent: "center",
  },
  facebookButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: { fontSize: 14 },
  signupButton: { color: "#3897f0", fontSize: 14, fontWeight: "bold" },
});
