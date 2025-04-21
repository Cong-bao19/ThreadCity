// (tabs)/NewThreadScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

const NewThreadScreen = ({ onClose }) => {
  const [threadText, setThreadText] = useState("");

  const handleAddThread = () => {
    if (threadText.trim() === "") {
      Alert.alert("Error", "Please enter some text to create a thread.");
      return;
    }
    Alert.alert("Success", "Thread created: " + threadText);
    setThreadText("");
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleAttach = () => {
    Alert.alert("Attach", "Opening file picker...");
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
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
          <Text style={styles.username}>kmodi21</Text>
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
      ></KeyboardAvoidingView>
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
  },
  attachButton: {
    marginTop: 10,
  },
  addButton: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  addButtonText: {
    fontSize: 16,
    color: "#666",
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  keyboard: {
    backgroundColor: "#f0f0f0",
    padding: 10,
  },
  suggestions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  suggestion: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  keyboardRows: {
    marginBottom: 10,
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 5,
  },
  key: {
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 5,
    textAlign: "center",
    minWidth: 30,
  },
  spaceKey: {
    flex: 1,
    marginHorizontal: 5,
  },
  keyboardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
});

export default NewThreadScreen;