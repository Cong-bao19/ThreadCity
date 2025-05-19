import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/UserContext";
import { router } from "expo-router";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();

  const handleSignUp = async () => {
    if (!email.trim() || !password || !rePassword) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password !== rePassword) {
      Alert.alert("Thông báo", "Mật khẩu không khớp");
      return;
    }

    setLoading(true);

    try {
      // Đăng ký tài khoản
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert("Lỗi", error.message);
        return;
      }

      if (data.user) {
        // Lưu user vào context
        setUser(data.user);

        // Kiểm tra xem profile đã tồn tại chưa
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profileData) {
          // Nếu chưa có profile, chuyển đến trang chỉnh sửa profile
          router.replace("/SignUpEdit");
        } else {
          // Nếu đã có profile, chuyển tới màn hình chính hoặc login
          router.replace("/Login");
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      Alert.alert("Lỗi", "Đã xảy ra lỗi không xác định.");
    } finally {
      setLoading(false);
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
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Re-enter Password"
            placeholderTextColor="#aaa"
            value={rePassword}
            onChangeText={setRePassword}
            secureTextEntry={secureTextEntry}
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
            style={[
              styles.signUpButton,
              loading && styles.signUpButtonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity
            onPress={() => router.push("/Login")}
            disabled={loading}
          >
            <Text style={styles.loginButton}> Log In</Text>
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
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 60,
    resizeMode: "contain",
  },
  formContainer: {
    width: "100%",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  showPasswordButton: {
    marginBottom: 20,
    alignItems: "flex-end",
  },
  showPasswordText: {
    color: "#3897f0",
    fontSize: 14,
  },
  signUpButton: {
    backgroundColor: "#3897f0",
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  signUpButtonDisabled: {
    backgroundColor: "#a0c4ff",
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginButton: {
    color: "#3897f0",
    fontSize: 14,
    fontWeight: "bold",
  },
});
