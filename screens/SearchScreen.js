import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import users from "../data/fakeUsers";

const SearchScreen = () => {
  const [searchText, setSearchText] = useState("");

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }) => (

    <View style={styles.userRow}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.verified && (
            <Feather
              name="check-circle"
              size={16}
              color="#007aff"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.followers}>{item.followers} followers</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        value={searchText}
        onChangeText={setSearchText}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  searchInput: {
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontWeight: "bold", fontSize: 16 },
  username: { color: "#666" },
  followers: { color: "#888", fontSize: 12 },
  followButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followText: { color: "#000", fontWeight: "500" },
});