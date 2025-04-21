// (tabs)/EditProfile.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

export default function EditProfile() {
  const [name, setName] = useState("Krunal Modi (kmodi21)");
  const [bio, setBio] = useState(
    "Curious to learn something unique or challenging"
  );
  const [link, setLink] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleDone = () => {
    // Logic để lưu thông tin (có thể gọi API hoặc lưu vào state)
    console.log("Profile updated:", { name, bio, link, isPrivate });
    router.back(); // Quay lại trang trước (Profile)
  };

  const handleClose = () => {
    router.back(); // Quay lại trang trước (Profile)
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Icon name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Profile</Text>
        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.doneText}>Done</Text>
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
            placeholder="Enter your bio"
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
            placeholder="Add link"
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
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  doneText: {
    fontSize: 16,
    color: "#3897f0",
    fontWeight: "bold",
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
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    color: "#000",
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
});
