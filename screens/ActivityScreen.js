// app/(tabs)/ActivityScreen.js
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ActivityScreen = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) {
        setError("User not found");
        setLoading(false);
        return;
      }

      try {
        const { data: notificationData, error: notificationError } =
          await supabase
            .from("notifications")
            .select(
              "id, type, created_at, is_read, actor_id, post_id, comment_id, content"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (notificationError) throw notificationError;

        const actorIds = [
          ...new Set(notificationData.map((item) => item.actor_id)),
        ];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", actorIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map(
          profilesData.map((profile) => [profile.id, profile])
        );
        const formattedNotifications = notificationData.map((item) => {
          const username = profileMap.get(item.actor_id)?.username || "Unknown";
          let action;
          switch (item.type) {
            case "like":
              action = `${username} đã like bài viết của bạn`;
              break;
            case "comment":
              action = `${username} đã bình luận bài viết của bạn`;
              break;
            case "follow":
              action = `${username} đã theo dõi bạn`;
              break;
            case "reply":
              action = `${username} đã phản hồi bình luận của bạn`;
              break;
            case "like cmt":
              action = `${username} đã thích bình luận của bạn`;
              break;
            default:
              action = item.content || "Thông báo không xác định";
          }
          return {
            id: item.id,
            username,
            action,
            time: calculateTimeAgo(item.created_at),
            avatar:
              profileMap.get(item.actor_id)?.avatar_url ||
              "https://via.placeholder.com/40",
            followStatus: "Follow",
            isRead: item.is_read,
            type: item.type,
            postId: item.post_id,
          };
        });
        setNotifications(formattedNotifications);
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  const calculateTimeAgo = (createdAt) => {
    const now = new Date();
    const diffMs = now - new Date(createdAt);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays}d` : "today";
  };

  const filteredNotifications = notifications.filter((item) => {
    switch (activeTab) {
      case "Replies":
        return item.type === "reply";
      case "Comments":
        return item.type === "comment";
      case "Follows":
        return item.type === "follow";
      default:
        return true;
    }
  });

  const handleNotificationPress = (postId) => {
    if (postId) {
      router.push(`/thread/${postId}`); // Đổi route thành /thread/[postId]
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item.postId)}>
      <View style={styles.notificationItem}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>{item.action}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>{item.followStatus}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Activity</Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "ALL" && styles.activeTab]}
          onPress={() => setActiveTab("ALL")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "ALL" && styles.activeTabText,
            ]}
          >
            ALL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Replies" && styles.activeTab]}
          onPress={() => setActiveTab("Replies")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Replies" && styles.activeTabText,
            ]}
          >
            Replies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Comments" && styles.activeTab]}
          onPress={() => setActiveTab("Comments")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Comments" && styles.activeTabText,
            ]}
          >
            Comments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Follows" && styles.activeTab]}
          onPress={() => setActiveTab("Follows")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Follows" && styles.activeTabText,
            ]}
          >
            Follows
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredNotifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.notificationList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notifications</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingVertical: 10 },
  headerText: { fontSize: 24, fontWeight: "bold" },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingHorizontal: 16,
  },
  tab: { paddingVertical: 10, paddingHorizontal: 16 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#000" },
  tabText: { fontSize: 14, color: "#666" },
  activeTabText: { color: "#000", fontWeight: "bold" },
  notificationList: { flex: 1 },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  notificationContent: { flex: 1 },
  notificationText: { fontSize: 14 },
  username: { fontWeight: "bold" },
  time: { fontSize: 12, color: "#666", marginTop: 2 },
  followButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  followButtonText: { fontSize: 14, color: "#000", fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red" },
  emptyText: { textAlign: "center", padding: 20, color: "#666" },
});

export default ActivityScreen;
