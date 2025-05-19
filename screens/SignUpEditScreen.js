// screens/ProfileEdit.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/UserContext";
import { router } from "expo-router";

export default function ProfileEdit() {
  const { user } = useUser();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hàm tạo profile mặc định nếu chưa có
  const createProfileIfNotExists = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 là "No rows found" - tức chưa có profile
      console.log("Lỗi khi kiểm tra profile:", error);
      return;
    }

    if (!data) {
      // Chưa có profile, tạo mới
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        username: "",
        avatar_url: "",
        bio: "",
        is_private: false,
        created_at: new Date().toISOString(),
      });
      if (insertError) {
        console.log("Lỗi khi tạo profile mới:", insertError);
      } else {
        console.log("Tạo profile mới thành công!");
      }
    }
  };

  // Lấy dữ liệu profile hiện tại khi vào trang
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);

      // Tạo profile nếu chưa có (phòng trường hợp mới đăng nhập)
      await createProfileIfNotExists(user.id);

      // Thử lấy profile, nếu chưa có thì thử lại sau 300ms (tối đa 3 lần)
      let tries = 0;
      let data, error;
      while (tries < 3) {
        const res = await supabase
          .from("profiles")
          .select("username, avatar_url, bio, is_private")
          .eq("id", user.id)
          .single();
        data = res.data;
        error = res.error;
        if (data) break;
        await new Promise((r) => setTimeout(r, 300));
        tries++;
      }

      if (error && !data) {
        Alert.alert("Lỗi", "Không tải được hồ sơ: " + error.message);
      } else if (data) {
        setUsername(data.username || "");
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
        setIsPrivate(data.is_private || false);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleUpdate = async () => {
    if (!username.trim()) {
      Alert.alert("Lỗi", "Username không được để trống");
      return;
    }

    setLoading(true);
    const updates = {
      id: user.id,
      username: username.trim(),
      avatar_url: avatarUrl.trim(),
      bio: bio.trim(),
      is_private: isPrivate,
      created_at: new Date().toISOString(),
    };

    console.log("Updating user profile:", updates);

    const { data, error } = await supabase.from("profiles").upsert(updates).select();

    setLoading(false);

    if (error) {
      console.log("Update error:", error);
      Alert.alert("Lỗi", "Cập nhật hồ sơ thất bại: " + error.message);
    } else {
      console.log("Updated profile:", data);
      Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
      router.replace("/Login");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3897f0" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inner}
      >
        <Text style={styles.title}>Edit Profile</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Avatar URL"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          editable={!loading}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Private Profile</Text>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            disabled={loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 30,
    textAlign: "center",
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    marginBottom: 15,
    color: "#000",
    backgroundColor: "#fff",
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  switchLabel: {
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#3897f0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#a0c4ff",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
