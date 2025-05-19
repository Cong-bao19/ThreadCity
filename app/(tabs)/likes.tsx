import React, { useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Share } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/UserContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calculateTimeAgo } from "../thread/[postId]";
import ProfilePost from "../profile/ProfilePost";
import { Post } from "../profile/profileTypes";

export default function LikesScreen() {
  const params = useLocalSearchParams();
  const username = params.username as string | undefined;
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  // Function to fetch liked posts
  const fetchLikedPosts = async (): Promise<Post[]> => {
    if (!user?.id) throw new Error("User not authenticated");

    try {
      console.log("Fetching liked posts for user:", user.id);
      // 1. Get all post likes by the current user
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .is("comment_id", null);

      if (likesError) throw new Error(`Error fetching likes: ${likesError.message}`);
      
      if (!likesData || !Array.isArray(likesData) || likesData.length === 0) {
        console.log("No liked posts found");
        return [];
      }

      const postIds = likesData.map(like => like.post_id);

      // 2. Get details for all liked posts
      const { data: postsData, error: postsError } = await supabase
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
        .in("id", postIds)
        .order("created_at", { ascending: false });

      if (postsError) throw new Error(`Error fetching posts: ${postsError.message}`);

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // 3. Get user profiles for the posts
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) throw new Error(`Error fetching profiles: ${profilesError.message}`);

      const profilesMap = (profilesData || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Fetch comments for displaying replies count
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("post_id, id")
        .in("post_id", postIds);

      if (commentsError) throw new Error(`Error fetching comments: ${commentsError.message}`);
      
      // Group comments by post_id
      const commentsByPost = (commentsData || []).reduce((acc: {[key: string]: any[]}, comment: any) => {
        if (!acc[comment.post_id]) {
          acc[comment.post_id] = [];
        }
        acc[comment.post_id].push(comment);
        return acc;
      }, {});

      // 4. Check which posts are liked by the current user
      const { data: likedByUser, error: likedError } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .is("comment_id", null);

      if (likedError) throw new Error(`Error checking liked posts: ${likedError.message}`);
      
      const likedPostIds = new Set((likedByUser || []).map((like: any) => like.post_id));
      
      // 5. Format the data to match the Post interface
      return postsData.map(post => {
        const profile = profilesMap[post.user_id] || {};
        const postReplies = commentsByPost[post.id] || [];
        
        return {
          id: post.id,
          userId: post.user_id,
          username: profile.username || "Unknown",
          handle: `@${profile.username || "unknown"}`,
          content: post.content,
          time: calculateTimeAgo(post.created_at),
          likes: post.likes?.[0]?.count || 0,
          replies: postReplies.length,
          avatar: profile.avatar_url || "https://via.placeholder.com/40",
          image_url: post.image_url,
          isLiked: likedPostIds.has(post.id),
          repliesData: []
        };
      });
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      throw error;
    }
  };

  // Query hook to fetch liked posts
  const { data: likedPosts, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["likedPosts", user?.id],
    queryFn: fetchLikedPosts,
    enabled: !!user?.id,
  });

  // Handle like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check if the post is already liked
      const { data: existingLike, error: checkError } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .is("comment_id", null)
        .maybeSingle();

      if (checkError) throw new Error(`Error checking like status: ${checkError.message}`);

      if (existingLike) {
        // Unlike post
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);

        if (error) throw new Error(`Error unliking post: ${error.message}`);
        return { action: "unlike", postId };
      } else {
        // Like post
        const { error } = await supabase.from("likes").insert({
          user_id: user.id,
          post_id: postId,
          comment_id: null,
        });

        if (error) throw new Error(`Error liking post: ${error.message}`);
        return { action: "like", postId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likedPosts", user?.id] });
    },
    onError: (error) => {
      Alert.alert("Error", `Could not update like: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  const handleLikePress = useCallback((postId: string) => {
    likeMutation.mutate(postId);
  }, [likeMutation]);

  const handleSharePost = useCallback(async (post: Post) => {
    try {
      await Share.share({
        message: `${post.content}\n\nShared from ThreadCity app`,
        title: "Share Post"
      });
    } catch (error) {
      Alert.alert("Error", "Could not share this post");
    }
  }, []);

  const handlePostPress = useCallback((postId: string) => {
    router.push(`/thread/${postId}`);
  }, [router]);

  const handleProfilePress = useCallback((userId: string) => {
    // Find the username from likedPosts
    const post = likedPosts?.find((p: Post) => p.userId === userId);
    if (post) {
      router.push(`/profile/${post.username}`);
    }
  }, [likedPosts, router]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => {
            if (username) {
              router.push({ pathname: '/profile-settings', params: { username } });
            } else {
              router.push('/profile-settings');
            }
          }}>
          <Icon name="arrow-back-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Lượt thích của bạn</Text>
        <View style={{ width: 28 }} />
      </View>      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{marginTop: 10, color: '#666'}}>Đang tải...</Text>
        </View>      ): isError ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>Đã xảy ra lỗi khi tải dữ liệu</Text>
          <Text style={styles.errorSubtext}>
            {error ? (typeof error === 'object' && error !== null && 'message' in error 
              ? String(error.message) 
              : 'Lỗi không xác định')
              : 'Không có thông tin lỗi'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : likedPosts && likedPosts.length > 0 ? (        <FlatList
          data={likedPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProfilePost
              item={item}
              onPress={handlePostPress}
              onShare={handleSharePost}
              onLike={handleLikePress}
              onProfilePress={handleProfilePress}
            />
          )}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={onRefresh}
              colors={["#000"]} 
            />
          }
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="heart-outline" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>Chưa có lượt thích nào</Text>
          <Text style={styles.emptyText}>
            Các bài viết bạn đã thích sẽ xuất hiện ở đây
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold" 
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#000",
    borderRadius: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  listContent: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#666",
  },
});
