import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar, Divider } from "react-native-elements";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";

// Định nghĩa interface cho bài đăng và bình luận
interface Post {
  id: string;
  username: string;
  handle: string;
  content: string;
  time: string;
  likes: number;
  replies: number;
  avatar: string;
  userId: string;
  repliesData: Reply[];
}

interface Reply {
  id: string;
  username: string;
  handle: string;
  content: string;
  time: string;
  likes: number;
  avatar: string;
  userId: string;
}

interface ProfileData {
  username: string;
  avatar_url: string;
  bio: string;
  followersCount: number;
  infor_url: string; // Đường dẫn QR code
}

export default function ProfileScreen() {
  const { userId: targetUserId } = useLocalSearchParams();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Threads" | "Replies">("Threads");
  const [loading, setLoading] = useState(true);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false); // State để điều khiển modal QR

  // Lấy userId của người dùng hiện tại nếu không có targetUserId
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    if (!targetUserId) {
      fetchUser();
    } else {
      setUserId(targetUserId as string);
    }
  }, [targetUserId]);

  // Tải thông tin hồ sơ và số lượng followers
  const fetchProfileData = async () => {
    if (!userId) {
      console.error("No userId provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url, bio, infor_url")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      const { count: followersCount, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      if (followersError) {
        console.error("Error fetching followers count:", followersError);
        return;
      }

      setProfileData({
        username: profileData.username || "Unknown",
        avatar_url: profileData.avatar_url || "https://via.placeholder.com/80",
        bio: profileData.bio || "No bio available",
        followersCount: followersCount || 0,
        infor_url: profileData.infor_url || "",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Tải danh sách bài đăng
  const fetchPosts = async () => {
    if (!userId) return;

    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          id,
          user_id,
          content,
          created_at,
          comments (count),
          likes (count)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile for posts:", profileError);
        return;
      }

      const postIds = postsData.map((post: any) => post.id);
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(
          `
          id,
          post_id,
          user_id,
          content,
          created_at,
          parent_id,
          likes (count)
        `
        )
        .in("post_id", postIds)
        .is("parent_id", null)
        .order("created_at", { ascending: true });

      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        return;
      }

      const userIds = commentsData.map((comment: any) => comment.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles for comments:", profilesError);
        return;
      }

      const profilesMap = profilesData.reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      const formattedPosts: Post[] = postsData.map((post: any) => {
        const createdAt = new Date(post.created_at);
        const now = new Date("2025-04-27T18:30:00+00:00");
        const diffInMs = now.getTime() - createdAt.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const time = diffInMinutes > 0 ? `${diffInMinutes}m` : "Just now";

        const postComments = commentsData.filter(
          (comment: any) => comment.post_id === post.id
        );

        return {
          id: post.id,
          userId: post.user_id,
          username: profileData.username || "Unknown",
          handle: `@${profileData.username || "unknown"}`,
          content: post.content,
          time,
          likes: post.likes?.[0]?.count || 0,
          replies: post.comments?.[0]?.count || 0,
          avatar: profileData.avatar_url || "https://via.placeholder.com/50",
          repliesData: postComments.map((comment: any) => {
            const profile = profilesMap[comment.user_id] || {};
            const commentTime = new Date(comment.created_at);
            const diffInMsComment = now.getTime() - commentTime.getTime();
            const diffInMinutesComment = Math.floor(
              diffInMsComment / (1000 * 60)
            );
            const timeComment =
              diffInMinutesComment > 0
                ? `${diffInMinutesComment}m`
                : "Just now";

            return {
              id: comment.id,
              userId: comment.user_id,
              username: profile.username || "Unknown",
              handle: `@${profile.username || "unknown"}`,
              content: comment.content,
              time: timeComment,
              likes: comment.likes?.[0]?.count || 0,
              avatar: profile.avatar_url || "https://via.placeholder.com/50",
            };
          }),
        };
      });

      setPosts(formattedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  // Tải danh sách bình luận của người dùng (cho tab Replies)
  const fetchReplies = async () => {
    if (!userId) return;

    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(
          `
          id,
          user_id,
          content,
          created_at,
          likes (count)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (commentsError) {
        console.error("Error fetching replies:", commentsError);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile for replies:", profileError);
        return;
      }

      const formattedReplies: Reply[] = commentsData.map((comment: any) => {
        const createdAt = new Date(comment.created_at);
        const now = new Date("2025-04-27T18:30:00+00:00");
        const diffInMs = now.getTime() - createdAt.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const time = diffInMinutes > 0 ? `${diffInMinutes}m` : "Just now";

        return {
          id: comment.id,
          userId: comment.user_id,
          username: profileData.username || "Unknown",
          handle: `@${profileData.username || "unknown"}`,
          content: comment.content,
          time,
          likes: comment.likes?.[0]?.count || 0,
          avatar: profileData.avatar_url || "https://via.placeholder.com/50",
        };
      });

      setReplies(formattedReplies);
    } catch (error) {
      console.error("Error fetching replies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfileData();
      fetchPosts();
      fetchReplies();
    }
  }, [userId]);

  const handlePostPress = (postId: string) => {
    router.push(`/thread/${postId}`);
  };

  const handleProfilePress = (targetUserId: string) => {
    router.push({
      pathname: "/(tabs)/profile",
      params: { userId: targetUserId },
    });
  };

  const handleShareProfile = () => {
    if (!profileData || !profileData.infor_url) {
      console.error("No QR code URL available");
      return;
    }
    setIsQrModalVisible(true); // Hiển thị modal khi bấm Share profile
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => handlePostPress(item.id)}>
      <View style={styles.threadItem}>
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => handleProfilePress(item.userId)}>
            <Avatar
              rounded
              source={{ uri: item.avatar }}
              size="medium"
              containerStyle={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.postContent}>
            <View style={styles.postUser}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.postHandle}>{item.handle}</Text>
              <Text style={styles.time}> • {item.time}</Text>
              <TouchableOpacity>
                <Icon
                  name="ellipsis-horizontal"
                  size={16}
                  color="#666"
                  style={styles.postMenu}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.threadText}>{item.content}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="heart-outline" size={20} color="#000" />
                <Text style={styles.actionText}>{item.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="chatbubble-outline" size={20} color="#000" />
                <Text style={styles.actionText}>{item.replies}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="repeat-outline" size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="share-outline" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {item.repliesData.map((reply) => (
          <View key={reply.id} style={styles.replyContainer}>
            <TouchableOpacity onPress={() => handleProfilePress(reply.userId)}>
              <Avatar
                rounded
                source={{ uri: reply.avatar }}
                size="medium"
                containerStyle={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.postContent}>
              <View style={styles.postUser}>
                <Text style={styles.username}>{reply.username}</Text>
                <Text style={styles.postHandle}>{reply.handle}</Text>
                <Text style={styles.time}> • {reply.time}</Text>
                <TouchableOpacity>
                  <Icon
                    name="ellipsis-horizontal"
                    size={16}
                    color="#666"
                    style={styles.postMenu}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.threadText}>{reply.content}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="heart-outline" size={20} color="#000" />
                  <Text style={styles.actionText}>{reply.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="chatbubble-outline" size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="repeat-outline" size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="share-outline" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderReply = ({ item }: { item: Reply }) => (
    <View style={styles.threadItem}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => handleProfilePress(item.userId)}>
          <Avatar
            rounded
            source={{ uri: item.avatar }}
            size="medium"
            containerStyle={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.postContent}>
          <View style={styles.postUser}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.postHandle}>{item.handle}</Text>
            <Text style={styles.time}> • {item.time}</Text>
            <TouchableOpacity>
              <Icon
                name="ellipsis-horizontal"
                size={16}
                color="#666"
                style={styles.postMenu}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.threadText}>{item.content}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="heart-outline" size={20} color="#000" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="chatbubble-outline" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="repeat-outline" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="share-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const handleEditProfile = () => {
    router.push("/edit");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Profile not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="globe-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="menu-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Avatar
          rounded
          source={{ uri: profileData.avatar_url }}
          size="large"
          containerStyle={styles.profileAvatar}
        />
        <View style={styles.profileStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profileData.followersCount}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
        </View>
      </View>

      {/* Username and Handle */}
      <Text style={styles.headerText}>{profileData.username}</Text>
      <Text
        style={styles.handle}
      >{`@${profileData.username} • threads.net`}</Text>

      {/* Bio */}
      <Text style={styles.bio}>{profileData.bio}</Text>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
          <Text style={styles.buttonText}>Edit profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleShareProfile}>
          <Text style={styles.buttonText}>Share profile</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.navTabs}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab("Threads")}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === "Threads" && styles.navTabActive,
            ]}
          >
            Threads
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab("Replies")}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === "Replies" && styles.navTabActive,
            ]}
          >
            Replies
          </Text>
        </TouchableOpacity>
      </View>

      <Divider style={styles.divider} />

      {/* Threads/Replies Content */}
      {activeTab === "Threads" ? (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          style={styles.content}
        />
      ) : (
        <FlatList
          data={replies}
          renderItem={renderReply}
          keyExtractor={(item) => item.id}
          style={styles.content}
        />
      )}

      {/* Modal hiển thị QR code */}
      <Modal
        visible={isQrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsQrModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile QR Code</Text>
            {profileData.infor_url ? (
              <Image
                source={{ uri: profileData.infor_url }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.errorText}>QR code not available</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsQrModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 16,
  },
  handle: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 16,
    marginTop: 5,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
    justifyContent: "space-between",
  },
  profileAvatar: {
    width: 80,
    height: 80,
  },
  profileStats: {
    flexDirection: "row",
  },
  stat: {
    alignItems: "center",
    marginRight: 16,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  bio: {
    fontSize: 16,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 15,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  navTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 15,
  },
  navTab: {
    marginRight: 20,
  },
  navTabText: {
    fontSize: 16,
    color: "#666",
  },
  navTabActive: {
    fontWeight: "bold",
    color: "#000",
  },
  divider: {
    marginVertical: 10,
  },
  content: {
    flex: 1,
  },
  threadItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  postHeader: {
    flexDirection: "row",
  },
  avatar: {
    width: 50,
    height: 50,
  },
  postContent: {
    flex: 1,
    marginLeft: 10,
  },
  postUser: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  postHandle: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  time: {
    fontSize: 14,
    color: "#666",
  },
  postMenu: {
    marginLeft: 5,
  },
  threadText: {
    fontSize: 16,
    marginTop: 5,
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#666",
  },
  replyContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginLeft: 60,
  },
  // Styles cho modal QR code
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#3897f0",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
