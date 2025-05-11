import { useUser } from "@/lib/UserContext"; // Thêm useUser để lấy userId
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
  is_private: boolean;
  followers: number; // Thêm followers để hiển thị số lượng người theo dõi
}

// Fetch danh sách profile từ Supabase
const fetchProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, is_private")
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Error fetching profiles: ${error.message}`);

  // Fetch số lượng followers cho từng profile
  const profilesWithFollowers = await Promise.all(
    data.map(async (profile: any) => {
      const { count: followersCount, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id);

      if (followersError)
        throw new Error(`Error fetching followers: ${followersError.message}`);

      return {
        ...profile,
        followers: followersCount || 0,
      };
    })
  );

  return profilesWithFollowers;
};

// Kiểm tra trạng thái follow
const checkFollowing = async (
  currentUserId: string | null,
  profileId: string
): Promise<boolean> => {
  if (!currentUserId) return false;

  const { data, error } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", currentUserId)
    .eq("following_id", profileId)
    .single();

  if (error && error.code !== "PGRST116")
    throw new Error(`Error checking follow: ${error.message}`);
  return !!data;
};

export default function SearchScreen() {
  const [searchText, setSearchText] = useState("");
  const { user } = useUser();
  const currentUserId = user?.id || null;
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState<{ [key: string]: boolean }>({}); // Lưu trạng thái follow cho từng profile

  // Fetch danh sách profile
  const {
    data: profiles,
    isLoading,
    isError,
    error,
  } = useQuery<Profile[], Error>({
    queryKey: ["searchProfiles"],
    queryFn: fetchProfiles,
  });

  // Kiểm tra trạng thái follow khi profiles thay đổi
  useEffect(() => {
    if (profiles && currentUserId) {
      const fetchFollowingStatus = async () => {
        const followingStatus: { [key: string]: boolean } = {};
        for (const profile of profiles) {
          const isFollowing = await checkFollowing(currentUserId, profile.id);
          followingStatus[profile.id] = isFollowing;
        }
        setFollowing(followingStatus);
      };
      fetchFollowingStatus();
    }
  }, [profiles, currentUserId]);

  // Mutation để xử lý follow/unfollow
  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!currentUserId) throw new Error("User not logged in");

      const isFollowing = following[userId];

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);

        if (error) throw new Error(`Error unfollowing: ${error.message}`);
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: userId });

        if (error) throw new Error(`Error following: ${error.message}`);
      }

      // Cập nhật state cục bộ
      setFollowing((prev) => ({
        ...prev,
        [userId]: !isFollowing,
      }));
    },
    onSuccess: () => {
      // Refetch danh sách profiles để cập nhật số lượng followers
      queryClient.invalidateQueries({ queryKey: ["searchProfiles"] });
    },
    onError: (error: Error) => {
      console.error("Follow/Unfollow error:", error.message);
    },
  });

  const handleFollowToggle = (userId: string) => {
    followMutation.mutate(userId);
  };

  const handleProfilePress = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const filteredProfiles =
    searchText.trim() === ""
      ? profiles || []
      : (profiles || []).filter((profile) =>
          profile.username.toLowerCase().includes(searchText.toLowerCase())
        );

  const renderItem = ({ item }: { item: Profile }) => {
    const isFollowing = following[item.id] || false;

    return (
      <TouchableOpacity onPress={() => handleProfilePress(item.username)}>
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
            <Text style={styles.followers}>{item.followers} followers</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.followButton,
              { backgroundColor: isFollowing ? "#007aff" : "#fff" },
            ]}
            onPress={() => handleFollowToggle(item.id)}
          >
            <Text
              style={[
                styles.followText,
                { color: isFollowing ? "#fff" : "#000" },
              ]}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Error: {error.message}</Text>
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
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users found</Text>
        }
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
  followers: {
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
