// app/(tabs)/index.tsx
import React from 'react';
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import styles from "../home/HomeScreenStyles";
import { Post } from "../home/homeTypes";
import { fetchPosts, createNotification, formatTimeAgo } from "../home/homeUtils";
import PostItem from "../home/PostItem";
import CommentItem from "../home/CommentItem";

export default function HomeScreen() {
  const { user } = useUser();
  const userId = user?.id || null;
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const [repostModalVisible, setRepostModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

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
      // Find the post and check its current liked state
      const post = newPosts.find((p) => p.id === postId);
      if (!post) return null;
      const postOwnerId = post.userId;
      const isCurrentlyLiked = post.isLiked;

      // Immediately update UI optimistically
      setNewPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked ? p.likes - 1 : p.likes + 1,
              }
            : p
        )
      );

      try {
        const { data: existingLike, error: likeError } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", userId)
          .single();

        if (likeError && likeError.code !== "PGRST116") {
          throw new Error(`Error checking like: ${likeError.message}`);
        }

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

        // Create notification if action is like and post is not by current user
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
        
        return { postId, success: true };
      } catch (error) {
        // If there was an error, revert the optimistic update
        setNewPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: isCurrentlyLiked,
                  likes: isCurrentlyLiked ? p.likes + 1 : p.likes - 1,
                }
              : p
          )
        );
        throw error;
      }
    },
    onError: (err) => {
      console.error("Like error:", err);
      Alert.alert("Error", "Failed to update like status");
    },
  });

  // Mutation cho repost
  const repostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data: existingRepost, error: repostError } = await supabase
        .from("reposts")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (repostError && repostError.code !== "PGRST116") {
        throw new Error(`Error checking repost: ${repostError.message}`);
      }

      // Tìm bài viết để lấy thông tin userId (chủ bài viết)
      const post = newPosts.find((p) => p.id === postId);
      const postOwnerId = post?.userId;

      let actionPerformed = "";
      if (existingRepost) {
        const { error: deleteError } = await supabase
          .from("reposts")
          .delete()
          .eq("id", existingRepost.id);
        if (deleteError)
          throw new Error(`Error removing repost: ${deleteError.message}`);
        actionPerformed = "unrepost";
      } else {
        const { error: insertError } = await supabase
          .from("reposts")
          .insert({ post_id: postId, user_id: userId });
        if (insertError)
          throw new Error(`Error adding repost: ${insertError.message}`);
        actionPerformed = "repost";
      }

      // Refetch dữ liệu sau khi repost/unrepost
      await queryClient.refetchQueries({ queryKey: ["posts", userId] });

      // Tạo thông báo nếu hành động là "repost" và bài viết không phải của người dùng hiện tại
      if (
        actionPerformed === "repost" &&
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
        const notificationContent = `${actorUsername} reposted your post`;

        // Sử dụng loại "comment" thay vì "repost" vì "repost" không được hỗ trợ
        await createNotification(
          postOwnerId,
          userId,
          postId,
          null,
          "comment", // Thay đổi từ "repost" sang "comment" hoặc một loại được hỗ trợ khác
          notificationContent
        );
      }
    },
    onError: (err) => {
      console.error("Repost error:", err);
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

  const handleRepost = (postId: string) => {
    if (!user) {
      Alert.alert("Please log in to repost.");
      return;
    }
    
    setSelectedPostId(postId);
    setRepostModalVisible(true);
  };
  
  const confirmRepost = () => {
    if (selectedPostId) {
      repostMutation.mutate(selectedPostId);
      setRepostModalVisible(false);
      setSelectedPostId(null);
    }
  };
  
  const cancelRepost = () => {
    setRepostModalVisible(false);
    setSelectedPostId(null);
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

  const renderComment = (comment: any, index: number, isLastComment: boolean) => (
    <CommentItem
      comment={comment}
      index={index}
      isLastComment={isLastComment}
      onProfilePress={handleProfilePress}
    />
  );

  const renderPostItem = (item: Post) => (
    <PostItem
      item={item}
      onLike={handleLike}
      onComment={handleComment}
      onRepost={handleRepost}
      onProfilePress={handleProfilePress}
      onMore={handleMore}
      renderComment={renderComment}
    />
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
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.headerLogo} 
          resizeMode="contain" 
        />
      </View>
      <FlatList
        data={newPosts}
        renderItem={({ item }) => renderPostItem(item)}
        keyExtractor={(item) => item.id}
        style={styles.postList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
      />
      
      {/* Repost Modal */}
      <Modal
        visible={repostModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelRepost}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Repost</Text>
            <Text style={styles.modalText}>
              This post will be shared with your followers.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelRepost}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmRepost}>
                <Text style={styles.confirmButtonText}>Repost</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}