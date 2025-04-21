// InstagramLogin.js
import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router"; // Import useRouter
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getDatabase, ref, set } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDI6DLthnC4AKKOqgc-WZYiiI8al4p_1t8",
  authDomain: "threadcity-95278.firebaseapp.com",
  databaseURL:
    "https://threadcity-95278-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "threadcity-95278",
  storageBucket: "threadcity-95278.firebasestorage.app",
  messagingSenderId: "534208854598",
  appId: "1:534208854598:web:f4dedbdf2979dd9eb12847",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

function guidulieu() {
  const db = getDatabase();
  set(ref(db, "dia chi gui len"), {
    tenbien: "gia tri gui len",
  });
}

export default function InstagramLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Khởi tạo router để chuyển hướng
  const router = useRouter();

  const handleLogin = () => {
    console.log("Logging in with", username, password);

    // Sau khi đăng nhập thành công, chuyển hướng tới trang profile
    router.push("/profile");
  };

  const handleLogoPress = () => {
    router.push("/edit"); // Chuyển hướng đến Activity
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.innerContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={guidulieu}>
            <Image
              source={require("../assets/images/instagram-logo.png")}
              style={styles.logo}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Phone number, username, or email"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry={secureTextEntry}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setSecureTextEntry(!secureTextEntry)}
            style={styles.showPasswordButton}
          >
            <Text style={styles.showPasswordText}>
              {secureTextEntry ? "Show" : "Hide"} Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity>
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
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
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
  loginButton: {
    backgroundColor: "#3897f0",
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPassword: {
    color: "#3897f0",
    fontSize: 14,
    textAlign: "center",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
  },
  signupButton: {
    color: "#3897f0",
    fontSize: 14,
    fontWeight: "bold",
  },
});
