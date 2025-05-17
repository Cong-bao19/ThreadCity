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
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchNotifications = async () => {
    if (!user?.id) {
      setError("User not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: notificationData, error: notificationError } =
        await supabase
          .from("notifications")
          .select(
            "id, type, created_at, is_read, actor_id, post_id, comment_id, content"
          )
          .eq("user_id", user.id) // Lấy tất cả thông báo của người dùng
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
          isRead: item.is_read,
          type: item.type,
          postId: item.post_id,
          actorId: item.actor_id,
        };
      });
      setNotifications(formattedNotifications);
      setUnreadCount(
        formattedNotifications.filter((item) => !item.isRead).length
      );
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationReadStatus = async (notificationId) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating read status:", error);
    } else {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
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

  const handleNotificationPress = async (notification) => {
    if (notification.type === "follow") {
      if (!notification.username) {
        console.error("Username not found for actorId:", notification.actorId);
        return;
      }
      await updateNotificationReadStatus(notification.id);
      handleProfilePress(notification.username);
    } else if (notification.postId) {
      await updateNotificationReadStatus(notification.id);
      router.push(`/thread/${notification.postId}`);
    }
  };

  const handleProfilePress = (username) => {
    router.push({
      pathname: "/profile/[username]",
      params: { username },
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item)}>
      <View style={styles.notificationItem}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.notificationContent}>
          <Text
            style={[
              styles.notificationText,
              !item.isRead && styles.unreadText, // In đậm nếu chưa đọc
            ]}
          >
            {item.action}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerText}>Activity</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchNotifications()}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: { fontSize: 24, fontWeight: "bold" },
  badge: {
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  refreshButton: { padding: 5 },
  refreshButtonText: { fontSize: 16, color: "#0000ff" },
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
  unreadText: { fontWeight: "bold" }, // In đậm cho thông báo chưa đọc
  time: { fontSize: 12, color: "#666", marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red" },
  emptyText: { textAlign: "center", padding: 20, color: "#666" },
});

export default ActivityScreen;