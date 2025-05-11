import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

const NewThread: React.FC = () => {
  const [threadText, setThreadText] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("Loading...");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("Error fetching user:", error);
        setUsername("Unknown User");
        return;
      }

      setUsername(user.email || "Unknown User");
      setUserId(user.id);
    };

    fetchUser();
  }, []);

  const handleAddThread = async () => {
    if (threadText.trim() === "") {
      Alert.alert("Error", "Please enter some text to create a thread.");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .insert([
          {
            user_id: userId,
            content: threadText,
            image_url: imageUrl || "",
          },
        ]);

      if (error) {
        console.error("Error inserting post:", error);
        Alert.alert("Error", "Failed to create thread.");
        return;
      }

      Alert.alert("Success", "Thread created successfully!");
      setThreadText("");
      setImageUrl("");
      router.back();
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "Failed to create thread.");
    }
  };

  const handleAttach = () => {
    Alert.alert("Attach", "Opening file picker...");
    // Bạn có thể thêm thư viện chọn ảnh như 'expo-image-picker' ở đây
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Icon name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>New Thread</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.threadContainer}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: "https://via.placeholder.com/40" }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{username}</Text>
        </View>

        <TextInput
          style={styles.threadInput}
          placeholder="Start a thread..."
          placeholderTextColor="#666"
          value={threadText}
          onChangeText={setThreadText}
          multiline
        />

        <TouchableOpacity style={styles.attachButton} onPress={handleAttach}>
          <Icon name="attach" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddThread}>
        <Text style={styles.addButtonText}>Add to thread</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      />
    </SafeAreaView>
  );
};

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
  },
  threadContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  threadInput: {
    fontSize: 16,
    color: "#000",
    marginTop: 10,
    paddingVertical: 0,
    minHeight: 100,
  },
  attachButton: {
    marginTop: 10,
  },
  addButton: {
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 16,
    color: "#007BFF",
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
});

export default NewThread;
