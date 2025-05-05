// app/(tabs)/thread.tsx
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
import { useLocalSearchParams, router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "@/lib/supabase";

// Định nghĩa interface cho bài viết và bình luận
interface Post {
  id: string;
  username: string;
  avatar: string;
  content: string;
  image: string | null;
  time: string;
  replies: number;
  likes: number;
  isLiked: boolean;
}

interface Comment {
  id: string;
  username: string;
  avatar: string;
  content: string;
  time: string;
  isLiked: boolean;
}

export default function Thread() {
  const { postId } = useLocalSearchParams(); // Lấy postId từ query params
  const [mainPost, setMainPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!postId) {
        console.error("No postId provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Lấy bài viết chính từ bảng posts
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select(`
            id,
            user_id,
            content,
            created_at,
            image_url,
            comments (count),
            likes (count)
          `)
          .eq("id", postId)
          .single();

        if (postError) {
          console.error("Error fetching post:", postError);
          return;
        }

        // Lấy thông tin người đăng từ bảng profiles
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", postData.user_id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        // Định dạng bài viết chính
        const formattedPost: Post = {
          id: postData.id,
          username: profileData.username || "Unknown",
          avatar: profileData.avatar_url || "https://via.placeholder.com/40",
          content: postData.content,
          image: postData.image_url,
          time: new Date(postData.created_at).toLocaleTimeString(),
          replies: postData.comments?.count || 0,
          likes: postData.likes?.count || 0,
          isLiked: false, // Có thể thêm logic kiểm tra trạng thái like
        };
        setMainPost(formattedPost);

        // Lấy danh sách bình luận từ bảng comments
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select(`
            id,
            user_id,
            content,
            created_at
          `)
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
          return;
        }

        // Lấy thông tin người bình luận từ bảng profiles
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

        // Định dạng danh sách bình luận
        const formattedComments: Comment[] = commentsData.map((comment: any) => {
          const profile = profilesMap[comment.user_id] || {};
          return {
            id: comment.id,
            username: profile.username || "Unknown",
            avatar: profile.avatar_url || "https://via.placeholder.com/40",
            content: comment.content,
            time: new Date(comment.created_at).toLocaleTimeString(),
            isLiked: false, // Có thể thêm logic kiểm tra trạng thái like
          };
        });
        setComments(formattedComments);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/Login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLike = (threadId: string) => {
    console.log("Liked thread:", threadId);
  };

  const handleComment = (threadId: string) => {
    console.log("Comment on thread:", threadId);
  };

  const handleShare = (threadId: string) => {
    console.log("Share thread:", threadId);
  };

  const handleMore = (threadId: string) => {
    console.log("More options for thread:", threadId);
  };

  const renderThreadItem = (item: Post | Comment, isMainPost = false) => (
    <View style={[styles.threadItem, !isMainPost && styles.commentItem]}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.threadContent}>
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
        {"image" in item && item.image && (
          <Image source={{ uri: item.image }} style={styles.postImage} />
        )}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleLike(item.id)}>
            <Icon
              name={item.isLiked ? "heart" : "heart-outline"}
              size={20}
              color={item.isLiked ? "#ff0000" : "#666"}
            />
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
        {isMainPost && (
          <Text style={styles.stats}>
            {item.replies > 0 ? `${item.replies} replies` : ""}
            {item.replies > 0 && item.likes > 0 ? " • " : ""}
            {item.likes > 0 ? `${(item.likes / 1000).toFixed(1)}K likes` : ""}
          </Text>
        )}
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!mainPost) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Post not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Thread</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Icon name="log-out-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[mainPost, ...comments]}
        renderItem={({ item, index }) => renderThreadItem(item, index === 0)}
        keyExtractor={(item) => item.id}
        style={styles.threadList}
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
    justifyContent: "space-between",
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
  threadList: {
    flex: 1,
  },
  threadItem: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  commentItem: {
    marginLeft: 50,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  threadContent: {
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