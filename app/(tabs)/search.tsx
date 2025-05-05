import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
  is_private: boolean;
}

export default function SearchScreen() {
  const [searchText, setSearchText] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<string[]>([]); // 🆕 danh sách follow

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, is_private")
        .eq("is_private", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching profiles:", error);
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = (userId: string) => {
    setFollowing((prev) => 
      prev.includes(userId) 
        ? prev.filter((id) => id !== userId) // nếu đang follow thì unfollow
        : [...prev, userId] // nếu chưa follow thì follow
    );
  };

  const filteredProfiles = searchText.trim() === ""
    ? profiles
    : profiles.filter((profile) =>
        profile.username.toLowerCase().includes(searchText.toLowerCase())
      );

  const renderItem = ({ item }: { item: Profile }) => {
    const isFollowing = following.includes(item.id);

    return (
      <View style={styles.userRow}>
        <Image
          source={{
            uri: item.avatar_url || "https://via.placeholder.com/50",
          }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.username}</Text>
          </View>
          <Text style={styles.bio} numberOfLines={1}>
            {item.bio || "No bio"}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.followButton,
            { backgroundColor: isFollowing ? "#007aff" : "#fff" }, // 🆕 đổi màu nếu đã follow
          ]}
          onPress={() => handleFollowToggle(item.id)}
        >
          <Text style={[
            styles.followText,
            { color: isFollowing ? "#fff" : "#000" } // 🆕 đổi màu chữ
          ]}>
            {isFollowing ? "Unfollow" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by username"
        value={searchText}
        onChangeText={setSearchText}
      />
      <FlatList
        data={filteredProfiles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  bio: {
    color: "#666",
    fontSize: 13,
    marginTop: 2,
  },
  followButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followText: {
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
});
