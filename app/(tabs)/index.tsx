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
  );
}

const styles = StyleSheet.create({
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
  },
});
