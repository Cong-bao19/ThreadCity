// app/(tabs)/index.tsx
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface Post {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  image: string | null;
  time: string;
  replies: number;
  likes: number;
  isLiked: boolean;
}

const fetchPosts = async (userId: string | null): Promise<Post[]> => {
  if (!userId) {
    return [];
  }

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(
      `
      id,
      user_id,
      content,
      created_at,
      image_url,
      comments (count),
      likes (count)
    `
    )
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    return [];
  }

  const userIds = postsData.map((post: any) => post.user_id);
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }

  const profilesMap = profilesData.reduce((acc: any, profile: any) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

  const postIds = postsData.map((post: any) => post.id);
  const { data: likesData, error: likesError } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (likesError) {
    console.error("Error checking like status for posts:", likesError);
    return [];
  }

  const likedPostIds = new Set(likesData.map((like: any) => like.post_id));

  const formattedPosts: Post[] = postsData.map((post: any) => {
    const profile = profilesMap[post.user_id] || {};
    return {
      id: post.id,
      userId: post.user_id,
      username: profile.username || "Unknown",
      avatar: profile.avatar_url || "https://via.placeholder.com/40",
      content: post.content,
      image: post.image_url,
      time: new Date(post.created_at).toLocaleTimeString(),
      replies: post.comments?.[0]?.count || 0,
      likes: post.likes?.[0]?.count || 0,
      isLiked: likedPostIds.has(post.id),
    };
  });

  return formattedPosts;
};

// Hàm tạo thông báo
const createNotification = async (
  userId: string, // Người nhận thông báo (chủ comment hoặc bài viết)
  actorId: string, // Người thực hiện hành động (người dùng hiện tại)
  postId: string, // ID bài viết
  commentId: string | null, // ID comment (dùng cho reply)
  type: "like" | "comment" | "share" | "reply", // Loại hành động
  content: string // Nội dung thông báo
) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    actor_id: actorId,
    post_id: postId,
    comment_id: commentId,
    type: type,
    content: content,
    is_read: false,
  });

  if (error) {
    console.error(`Error creating ${type} notification:`, error);
  }
};

export default function HomeScreen() {
  const { user } = useUser();
  const userId = user?.id || null;
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const queryClient = useQueryClient();


  // Query để fetch danh sách bài viết
  const { data, isLoading, isError, error, refetch } = useQuery<Post[], Error>({
    queryKey: ["posts", userId],
    queryFn: () => fetchPosts(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Dữ liệu "tươi" trong 5 phút
    gcTime: 10 * 60 * 1000, // Thời gian giữ cache trong bộ nhớ
  });

  // Cập nhật state khi dữ liệu từ query thay đổi
  React.useEffect(() => {
    if (data) {
      setNewPosts(data);
    }
  }, [data]);

  // Mutation cho like
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data: existingLike, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (likeError && likeError.code !== "PGRST116") {
        throw new Error(`Error checking like: ${likeError.message}`);
      }

      // Tìm bài viết để lấy thông tin userId (chủ bài viết)
      const post = newPosts.find((p) => p.id === postId);
      const postOwnerId = post?.userId;

      let actionPerformed = "";
      if (existingLike) {
        const { error: deleteError } = await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);
        if (deleteError)
          throw new Error(`Error removing like: ${deleteError.message}`);
        actionPerformed = "unlike";
      } else {
        const { error: insertError } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: userId });
        if (insertError)
          throw new Error(`Error adding like: ${insertError.message}`);
        actionPerformed = "like";
      }

      // Refetch dữ liệu sau khi like/unlike
      await queryClient.refetchQueries({ queryKey: ["posts", userId] });

      // Tạo thông báo nếu hành động là "like" và bài viết không phải của người dùng hiện tại
      if (
        actionPerformed === "like" &&
        userId &&
        postOwnerId &&
        userId !== postOwnerId
      ) {
        const { data: actorProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single();

        const actorUsername = actorProfile?.username || "Someone";
        const notificationContent = `${actorUsername} liked your post`;

        await createNotification(
          postOwnerId,
          userId,
          postId,
          null,
          "like",
          notificationContent
        );
      }
    },
    onError: (err) => {
      console.error("Like error:", err);
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch(); // Refetch khi focus lại tab
    }, [userId])
  );

    if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading user...</Text>
      </SafeAreaView>
    );
  }

  const handleLike = (postId: string) => {
    if (!user) {
      alert("Please log in to like a post.");
      return;
    }
    likeMutation.mutate(postId);
  };

  const handleComment = async (postId: string) => {
    if (!user) {
      alert("Please log in to comment on a post.");
      return;
    }

    // Tìm bài viết để lấy thông tin userId (chủ bài viết)
    const post = newPosts.find((p) => p.id === postId);
    const postOwnerId = post?.userId;

    // Tạo thông báo nếu bài viết không phải của người dùng hiện tại
    if (userId && postOwnerId && userId !== postOwnerId) {
      const { data: actorProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      const actorUsername = actorProfile?.username || "Someone";
      const notificationContent = `${actorUsername} commented on your post`;

      await createNotification(
        postOwnerId,
        userId,
        postId,
        null,
        "comment",
        notificationContent
      );
    }

    // Chuyển hướng đến trang chi tiết bài viết để thực hiện comment hoặc reply
    router.push(`/thread/${postId}`);
  };

  const handleShare = async (postId: string) => {
    if (!user) {
      alert("Please log in to share a post.");
      return;
    }

    // Tìm bài viết để lấy thông tin userId (chủ bài viết)
    const post = newPosts.find((p) => p.id === postId);
    const postOwnerId = post?.userId;

    // Tạo thông báo nếu bài viết không phải của người dùng hiện tại
    if (userId && postOwnerId && userId !== postOwnerId) {
      const { data: actorProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      const actorUsername = actorProfile?.username || "Someone";
      const notificationContent = `${actorUsername} shared your post`;

      await createNotification(
        postOwnerId,
        userId,
        postId,
        null,
        "share",
        notificationContent
      );
    }

    console.log("Share post:", postId);
  };

  const handleMore = (postId: string) => {
    console.log("More options for post:", postId);
  };

  const handleProfilePress = (username: string) => {
    router.push({
      pathname: "/profile/[username]",
      params: { username },
    });
  };

  const renderPostItem = (item: Post) => (
    <TouchableOpacity
      onPress={() => handleComment(item.id)}
      style={styles.postItem}
    >
      <TouchableOpacity onPress={() => handleProfilePress(item.username)}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      </TouchableOpacity>
      <View style={styles.postContent}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.content}>
          {item.content.split(" ").map((word, index) =>
            word.startsWith("@") ? (
              <Text key={index} style={styles.mention}>
                {word}{" "}
              </Text>
            ) : (
              <Text key={index}>{word} </Text>
            )
          )}
        </Text>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.postImage} />
        )}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleLike(item.id)}>
            <Icon
              name={item.isLiked ? "heart" : "heart-outline"}
              size={20}
              color={item.isLiked ? "#ff0000" : "#666"}
            />
            {item.likes > 0 && (
              <Text style={styles.actionText}>{item.likes}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleComment(item.id)}>
            <Icon name="chatbubble-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item.id)}>
            <Icon name="share-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleMore(item.id)}>
            <Icon name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.stats}>
          {item.replies > 0 ? `${item.replies} replies` : ""}
          {item.replies > 0 && item.likes > 0 ? " • " : ""}
          {item.likes > 0 ? `${item.likes} likes` : ""}
        </Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Error: {error.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Home</Text>
      </View>
      <FlatList
        data={newPosts}
        renderItem={({ item }) => renderPostItem(item)}
        keyExtractor={(item) => item.id}
        style={styles.postList}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 16 },
  headerText: { fontSize: 24, fontWeight: "bold" },
  postList: { flex: 1 },
  postItem: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  postContent: { flex: 1 },
  username: { fontWeight: "bold", marginBottom: 4 },
  content: { marginBottom: 8 },
  postImage: { width: "100%", height: 200, borderRadius: 8 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4,
  },
  actionText: { fontSize: 12, color: "#666", marginLeft: 4 },
  mention: { color: "#007AFF" },
  stats: { fontSize: 12, color: "#999" },
  time: { fontSize: 10, color: "#aaa", alignSelf: "flex-end" },
});