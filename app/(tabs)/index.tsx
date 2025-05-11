<<<<<<< HEAD
<<<<<<< HEAD
// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/UserContext";

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

export default function HomeScreen() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    if (!user) {
      console.error("User not logged in");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Bước 1: Lấy danh sách bài viết từ bảng posts
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
        return;
      }

      // Bước 2: Lấy thông tin profiles dựa trên user_id
      const userIds = postsData.map((post: any) => post.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      const profilesMap = profilesData.reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Bước 3: Kiểm tra trạng thái isLiked cho từng bài viết
      const postIds = postsData.map((post: any) => post.id);
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      if (likesError) {
        console.error("Error checking like status for posts:", likesError);
        return;
      }

      const likedPostIds = new Set(likesData.map((like: any) => like.post_id));

      // Kết hợp dữ liệu từ posts và profiles
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

      setPosts(formattedPosts);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sử dụng useFocusEffect để làm mới dữ liệu khi quay lại trang
  useFocusEffect(
    React.useCallback(() => {
      fetchPosts();
    }, [user])
  );

  const handleLike = async (postId: string) => {
    if (!user) {
      alert("Please log in to like a post.");
      return;
    }

    try {
      const { data: existingLike, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single();

      if (likeError && likeError.code !== "PGRST116") {
        console.error("Error checking like:", likeError);
        return;
      }

      if (existingLike) {
        // Xóa lượt thích
        const { error: deleteError } = await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) {
          console.error("Error removing like:", deleteError);
          return;
        }

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, isLiked: false, likes: post.likes - 1 }
              : post
          )
        );
      } else {
        // Thêm lượt thích
        const { error: insertError } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id });

        if (insertError) {
          console.error("Error adding like:", insertError);
          return;
        }

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, isLiked: true, likes: post.likes + 1 }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/thread?postId=${postId}`);
  };

  const handleShare = (postId: string) => {
    console.log("Share post:", postId);
  };

  const handleMore = (postId: string) => {
    console.log("More options for post:", postId);
  };

  const renderPostItem = (item: Post) => (
    <TouchableOpacity
      onPress={() => handleComment(item.id)}
      style={styles.postItem}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Home</Text>
      </View>
      <FlatList
        data={posts}
        renderItem={({ item }) => renderPostItem(item)}
        keyExtractor={(item) => item.id}
        style={styles.postList}
      />
    </SafeAreaView>
=======
import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';
=======
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
>>>>>>> 6ebc064 (Initial commit for feature/your-feature-name)

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
    console.error("User not logged in");
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
<<<<<<< HEAD
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
>>>>>>> 0f02790 (Initial commit)
=======
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
>>>>>>> 6ebc064 (Initial commit for feature/your-feature-name)
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
<<<<<<< HEAD
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
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
  postList: {
    flex: 1,
  },
  postItem: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postContent: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: "bold",
  },
  content: {
    fontSize: 14,
    marginTop: 2,
  },
  mention: {
    color: "#3897f0",
    fontWeight: "bold",
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    marginTop: 5,
    gap: 15,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  stats: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  time: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
=======
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
>>>>>>> 0f02790 (Initial commit)
=======
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
>>>>>>> 6ebc064 (Initial commit for feature/your-feature-name)
  },
  actionText: { fontSize: 12, color: "#666", marginLeft: 4 },
  mention: { color: "#007AFF" },
  stats: { fontSize: 12, color: "#999" },
  time: { fontSize: 10, color: "#aaa", alignSelf: "flex-end" },
});
