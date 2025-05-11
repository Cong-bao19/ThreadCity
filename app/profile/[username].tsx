import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

// Định nghĩa interface cho Post
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

// Định nghĩa interface cho Reply
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

// Định nghĩa interface cho User Profile
interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  link: string;
  is_private: boolean;
  followers: number;
}

// Định nghĩa interface cho Tab
interface Tab {
  label: string;
  value: string;
}

// Fetch thông tin user từ Supabase
const fetchUserProfile = async (username: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, link, is_private")
    .eq("username", username)
    .single();

  if (error) throw new Error(`Error fetching user profile: ${error.message}`);

  const { count: followersCount, error: followersError } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", data.id);

  if (followersError)
    throw new Error(`Error fetching followers: ${followersError.message}`);

  return {
    id: data.id,
    username: data.username || "Unknown",
    avatar: data.avatar_url || "https://via.placeholder.com/40",
    bio: data.bio || "",
    link: data.link || "",
    is_private: data.is_private || false,
    followers: followersCount || 0,
  };
};

// Fetch danh sách bài đăng của user từ Supabase
const fetchUserPosts = async (userId: string): Promise<Post[]> => {
  if (!userId) return [];

  const now = new Date();

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(
      `
      id,
      user_id,
      content,
      created_at,
      likes (count),
      comments (count)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (postsError)
    throw new Error(`Error fetching posts: ${postsError.message}`);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .single();

  if (profileError)
    throw new Error(`Error fetching profile: ${profileError.message}`);

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
      likes (count)
    `
    )
    .in("post_id", postIds)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (commentsError)
    throw new Error(`Error fetching comments: ${commentsError.message}`);

  const commentUserIds = commentsData.map((comment: any) => comment.user_id);
  const { data: commentProfilesData, error: commentProfilesError } =
    await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", commentUserIds);

  if (commentProfilesError)
    throw new Error(
      `Error fetching profiles for comments: ${commentProfilesError.message}`
    );

  const profilesMap = commentProfilesData.reduce((acc: any, profile: any) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

  const formattedPosts: Post[] = postsData.map((post: any) => {
    const createdAt = new Date(post.created_at);
    const diffInMs = now.getTime() - createdAt.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    let time;
    if (diffInDays > 0) {
      time = `${diffInDays} Days`;
    } else if (diffInHours > 0) {
      time = `${diffInHours} Hours`;
    } else if (diffInMinutes > 0) {
      time = `${diffInMinutes} Minutes`;
    } else {
      time = "Just now";
    }

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
        const diffInMinutesComment = Math.floor(diffInMsComment / (1000 * 60));
        const diffInHoursComment = Math.floor(
          diffInMsComment / (1000 * 60 * 60)
        );
        const diffInDaysComment = Math.floor(
          diffInMsComment / (1000 * 60 * 60 * 24)
        );

        let timeComment;
        if (diffInDaysComment > 0) {
          timeComment = `${diffInDaysComment}D`;
        } else if (diffInHoursComment > 0) {
          timeComment = `${diffInHoursComment}H`;
        } else if (diffInMinutesComment > 0) {
          timeComment = `${diffInMinutesComment}M`;
        } else {
          timeComment = "Just now";
        }

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

  return formattedPosts;
};

// Fetch danh sách bình luận của user (cho tab Replies)
const fetchUserReplies = async (userId: string): Promise<any[]> => {
  if (!userId) return [];

  const now = new Date();

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

  if (commentsError)
    throw new Error(`Error fetching replies: ${commentsError.message}`);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .single();

  if (profileError)
    throw new Error(
      `Error fetching profile for replies: ${profileError.message}`
    );

  const formattedReplies: any[] = commentsData.map((comment: any) => {
    const createdAt = new Date(comment.created_at);
    const diffInMs = now.getTime() - createdAt.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    let time;
    if (diffInDays > 0) {
      time = `${diffInDays} Day`;
    } else if (diffInHours > 0) {
      time = `${diffInHours} Hours`;
    } else if (diffInMinutes > 0) {
      time = `${diffInMinutes} Minutes`;
    } else {
      time = "Just now";
    }

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

  return formattedReplies;
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

export default function ProfileScreen() {
  const { username: rawUsername } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const currentUserId = user?.id || null;
  const queryClient = useQueryClient();

  // Xử lý username để đảm bảo là string
  const username = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("Thread");

  // Fetch thông tin user
  const {
    data: userProfile,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useQuery<UserProfile, Error>({
    queryKey: ["userProfile", username],
    queryFn: () => fetchUserProfile(username as string),
    enabled: !!username,
  });

  // Fetch danh sách bài đăng
  const {
    data: posts,
    isLoading: isPostsLoading,
    isError: isPostsError,
    error: postsError,
  } = useQuery<Post[], Error>({
    queryKey: ["userPosts", userProfile?.id],
    queryFn: () => fetchUserPosts(userProfile?.id as string),
    enabled: !!userProfile?.id,
  });

  // Fetch danh sách bình luận
  const {
    data: replies,
    isLoading: isRepliesLoading,
    isError: isRepliesError,
    error: repliesError,
  } = useQuery<any[], Error>({
    queryKey: ["userReplies", userProfile?.id],
    queryFn: () => fetchUserReplies(userProfile?.id as string),
    enabled: !!userProfile?.id,
  });

  // Kiểm tra trạng thái follow
  useEffect(() => {
    if (userProfile?.id && currentUserId) {
      checkFollowing(currentUserId, userProfile.id).then(setIsFollowing);
    }
  }, [userProfile?.id, currentUserId]);

  const handleFollow = async () => {
    if (!currentUserId || !userProfile?.id) return;

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userProfile.id);

      if (error) console.error("Error unfollowing:", error);
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: userProfile.id });

      if (error) console.error("Error following:", error);
    }

    setIsFollowing(!isFollowing);
    await queryClient.refetchQueries({ queryKey: ["userProfile", username] });
  };

  const handlePostPress = (postId: string) => {
    router.push(`/thread/${postId}`);
  };

  const handleShare = async (post: Post) => {
    try {
      await Share.share({
        message: `${post.content} - Shared from ${post.handle} (Post ID: ${post.id})`,
        url: `https://yourapp.com/thread/${post.id}`, // Thay bằng URL thực tế của ứng dụng
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => handlePostPress(item.id)}>
      <View style={styles.postItem}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.postContent}>
          <View style={styles.headerRow}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <Text style={styles.content}>{item.content}</Text>
          <View style={styles.actions}>
            <TouchableOpacity>
              <Icon name="heart-outline" size={20} color="#666" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Icon name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.actionText}>{item.replies}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare(item)}>
              <Icon name="share-outline" size={20} color="#666" />
              <Text style={styles.actionText}>0</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isUserLoading || isPostsLoading || isRepliesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (isUserError || isPostsError || isRepliesError) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Error: {(userError || postsError || repliesError)?.message}</Text>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{userProfile.username}</Text>
        <Text style={styles.usernameText}>{userProfile.username}</Text>
        <Image
          source={{ uri: userProfile.avatar }}
          style={styles.profileImage}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.location}>{userProfile.bio}</Text>
        <Text style={styles.location}>{userProfile.link}</Text>
        <Text style={styles.followers}>
          {userProfile.followers} người theo dõi
        </Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isFollowing ? "#ccc" : "#000" },
          ]}
          onPress={handleFollow}
          disabled={userProfile.is_private && userProfile.id !== currentUserId}
        >
          <Text
            style={[
              styles.buttonText,
              { color: isFollowing ? "#000" : "#fff" },
            ]}
          >
            {isFollowing ? "Đang theo dõi" : "Theo dõi"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.messageButton]}>
          <Text style={styles.buttonText}>Nhắn tin</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        <FlatList
          data={[
            { label: "Thread", value: "Thread" },
            { label: "Thread trả lời", value: "Thread trả lời" },
            { label: "File phương tiện", value: "File phương tiện" },
            { label: "Bài đăng lại", value: "Bài đăng lại" },
          ]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.value && styles.activeTab]}
              onPress={() => setActiveTab(item.value)}
            >
              <Text style={styles.tabText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.value}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
      <FlatList
        data={
          activeTab === "Thread"
            ? posts
            : activeTab === "Thread trả lời"
            ? replies
            : []
        }
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        style={styles.postList}
      />
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
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 8,
  },
  usernameText: {
    color: "#666",
    marginRight: "auto",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  info: {
    padding: 16,
  },
  location: {
    fontSize: 16,
  },
  followers: {
    fontSize: 14,
    color: "#666",
  },
  buttons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  messageButton: {
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonText: {
    fontWeight: "bold",
  },
  tabs: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
  },
  postList: {
    flex: 1,
  },
  postItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  postContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  username: {
    fontWeight: "bold",
  },
  timeText: {
    fontSize: 12,
    color: "#666",
  },
  content: {
    fontSize: 14,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 120,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});
