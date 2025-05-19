// app/(tabs)/EditProfile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  SafeAreaView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "@/lib/supabase";

export default function EditProfile() {
  const [name, setName] = useState("Krunal Modi (kmodi21)");
  const [bio, setBio] = useState(
    "Curious to learn something unique or challenging"
  );
  const [link, setLink] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get current user's userId
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load current profile data from Supabase
        const { data, error } = await supabase
          .from("profiles")
          .select("username, bio, link, is_private")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (data) {
          setName(data.username || "Krunal Modi (kmodi21)");
          setBio(
            data.bio || "Curious to learn something unique or challenging"
          );
          setLink(data.link || "");
          setIsPrivate(data.is_private || false);
        }
      }
    };
    fetchUser();
  }, []);

  const validateInputs = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return false;
    }
    return true;
  };

  const handleDone = async () => {
    if (!validateInputs()) return;

    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: name,
          bio,
          link,
          is_private: isPrivate,
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating profile:", error);
        Alert.alert("Error", "Failed to update profile. Please try again.");
        return;
      }

      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit profile</Text>
        <TouchableOpacity onPress={handleDone} disabled={loading}>
          <Text style={[styles.doneText, loading && styles.disabledText]}>
            {loading ? "Saving..." : "Done"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="+ Write bio"
            placeholderTextColor="#aaa"
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Link</Text>
          <TextInput
            style={styles.input}
            value={link}
            onChangeText={setLink}
            placeholder="+ Add link"
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Private profile</Text>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: "#ddd", true: "#3897f0" }}
            thumbColor={isPrivate ? "#fff" : "#fff"}
            style={styles.switch}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  cancelText: {
    fontSize: 16,
    color: "#000",
  },
  doneText: {
    fontSize: 16,
    color: "#3897f0",
    fontWeight: "bold",
  },
  disabledText: {
    color: "#aaa",
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
});
