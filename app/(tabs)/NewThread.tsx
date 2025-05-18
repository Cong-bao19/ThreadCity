import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";

const NewThread: React.FC = () => {
  const [threadText, setThreadText] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("Loading...");
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    "https://via.placeholder.com/40"
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("Error fetching user:", error);
        setUsername("Unknown User");
        return;
      }

      setUserId(user.id);

      // Fetch user profile to get username and avatar
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setUsername(user.email || "Unknown User");
      } else {
        setUsername(profileData.username || user.email || "Unknown User");
        setAvatarUrl(profileData.avatar_url || "https://via.placeholder.com/40");
      }
    };

    fetchUser();

    // Yêu cầu quyền truy cập thư viện ảnh
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to upload images!"
        );
      }
    })();
  }, []);

  // Hàm tải ảnh lên Supabase Storage
  const uploadImage = async (imageUri: string): Promise<string | null> => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated.");
      return null;
    }

    try {
      setIsUploading(true);

      // Lấy phần mở rộng của file ảnh
      const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpeg";
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Chuyển đổi URI thành Base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileReader = new FileReader();

      return new Promise((resolve, reject) => {
        fileReader.onload = async () => {
          try {
            const base64 = fileReader.result?.toString().split(",")[1];
            if (!base64) {
              throw new Error("Failed to convert image to base64");
            }

            const { data, error } = await supabase.storage
              .from("posts")
              .upload(filePath, decode(base64), {
                contentType: `image/${fileExt}`,
              });

            if (error) {
              throw error;
            }

            // Tạo URL công khai cho ảnh
            const { data: publicUrl } = supabase.storage
              .from("posts")
              .getPublicUrl(filePath);

            resolve(publicUrl?.publicUrl || null);
          } catch (error) {
            console.error("Error uploading image:", error);
            reject(error);
          } finally {
            setIsUploading(false);
          }
        };

        fileReader.onerror = () => {
          setIsUploading(false);
          reject(new Error("Failed to read file"));
        };

        fileReader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error in uploadImage:", error);
      setIsUploading(false);
      return null;
    }
  };

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
      let uploadedImageUrl = imageUrl;

      // Nếu có ảnh được chọn, tải lên Supabase trước
      if (selectedImage) {
        setIsUploading(true);
        uploadedImageUrl = (await uploadImage(selectedImage)) || "";
        if (!uploadedImageUrl) {
          Alert.alert("Error", "Failed to upload image.");
          return;
        }
      }

      const { error } = await supabase
        .from("posts")
        .insert([
          {
            user_id: userId,
            content: threadText,
            image_url: uploadedImageUrl || "",
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
      setSelectedImage(null);
      router.back();
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "Failed to create thread.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAttach = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Không bắt buộc chỉnh sửa
        quality: 0.8,
        // Đã loại bỏ tham số aspect để không bắt buộc tỉ lệ cố định
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setSelectedImage(selectedAsset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not select image. Please try again.");
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
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
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
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

        {/* Hiển thị ảnh đã chọn */}
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={removeSelectedImage}
            >
              <Icon name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.attachButton} onPress={handleAttach}>
          <Icon name="image-outline" size={24} color="#666" />
          <Text style={styles.attachText}>Add photo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.addButton, isUploading && styles.disabledButton]}
        onPress={handleAddThread}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.addButtonText}>Post thread</Text>
        )}
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
    flex: 1,
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
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  attachText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#666",
  },
  addButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 30,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#7FC0FF",
  },
  addButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  keyboardContainer: {
    flex: 0,
  },
  selectedImageContainer: {
    marginTop: 15,
    position: "relative",
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 2,
  },
});

export default NewThread;
