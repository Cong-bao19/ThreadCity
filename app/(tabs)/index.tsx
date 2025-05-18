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
  Alert,
  Modal,
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
  reposts: number;
  isReposted: boolean;
  comments: {
    id: string;
    userId: string;
    username: string;
    avatar: string;
    content: string;
    time: string;
  }[];
}

const fetchPosts = async (userId: string | null): Promise<Post[]> => {
  if (!userId) {
    return [];
  }

  // Lấy tất cả bài posts gốc
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
      likes (count),
      reposts (count)
    `
    )
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    return [];
  }

  // Lấy tất cả các ID của posts để lấy thông tin chi tiết
  const postIds = postsData.map((post: any) => post.id);

  // Lấy top comment cho mỗi bài viết
  const { data: commentsData, error: commentsError } = await supabase
    .from("comments")
    .select(`
      id,
      user_id,
      post_id,
      content,
      created_at
    `)
    .in("post_id", postIds)
    .order("created_at", { ascending: false });

  if (commentsError) {
    console.error("Error fetching comments:", commentsError);
    return [];
  }

  // Nhóm comments theo post_id
  const commentsByPostId: { [key: string]: any[] } = {};
  commentsData.forEach((comment: any) => {
    if (!commentsByPostId[comment.post_id]) {
      commentsByPostId[comment.post_id] = [];
    }
    if (commentsByPostId[comment.post_id].length < 2) { // Chỉ lấy 2 comment mới nhất
      commentsByPostId[comment.post_id].push(comment);
    }
  });

  const userIds = [
    ...postsData.map((post: any) => post.user_id),
    ...commentsData.map((comment: any) => comment.user_id)
  ];
  // Loại bỏ các ID trùng lặp
  const uniqueUserIds = [...new Set(userIds)];

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", uniqueUserIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }

  const profilesMap = profilesData.reduce((acc: any, profile: any) => {
    acc[profile.id] = profile;
    return acc;
  }, {});
  
  // Kiểm tra likes
  const { data: likesData, error: likesError } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (likesError) {
    console.error("Error checking like status for posts:", likesError);
    return [];
  }

  // Kiểm tra reposts
  const { data: repostsData, error: repostsError } = await supabase
    .from("reposts")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (repostsError) {
    console.error("Error checking repost status for posts:", repostsError);
    return [];
  }

  const likedPostIds = new Set(likesData.map((like: any) => like.post_id));
  const repostedPostIds = new Set(repostsData.map((repost: any) => repost.post_id));

  const formattedPosts: Post[] = postsData.map((post: any) => {
    const profile = profilesMap[post.user_id] || {};
    const postComments = commentsByPostId[post.id] || [];
    
    // Format comments
    const formattedComments = postComments.map((comment: any) => {
      const commentUserProfile = profilesMap[comment.user_id] || {};
      return {
        id: comment.id,
        userId: comment.user_id,
        username: commentUserProfile.username || "Unknown",
        avatar: commentUserProfile.avatar_url || "https://via.placeholder.com/40",
        content: comment.content,
        time: formatTimeAgo(new Date(comment.created_at))
      };
    });

    return {
      id: post.id,
      userId: post.user_id,
      username: profile.username || "Unknown",
      avatar: profile.avatar_url || "https://via.placeholder.com/40",
      content: post.content,
      image: post.image_url,
      time: formatTimeAgo(new Date(post.created_at)),
      replies: post.comments?.[0]?.count || 0,
      likes: post.likes?.[0]?.count || 0,
      isLiked: likedPostIds.has(post.id),
      reposts: post.reposts?.[0]?.count || 0,
      isReposted: repostedPostIds.has(post.id),
      comments: formattedComments
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
  type: "like" | "comment" | "follow" | "reply" | "like cmt", // Loại hành động hỗ trợ trong bảng notifications
  content: string // Nội dung thông báo
) => {
  try {
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
  } catch (error) {
    console.error("Unexpected error creating notification:", error);
  }
};

// Format time to show like in the reference image (2h, 1m, etc.)
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Convert to minutes, hours, days
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return `${diffDays}d`;
  } else if (diffHr > 0) {
    return `${diffHr}h`;
  } else if (diffMin > 0) {
    return `${diffMin}m`;
  } else {
    return 'now';
  }
};

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

  const renderPostItem = (item: Post) => (
    <TouchableOpacity
      onPress={() => handleComment(item.id)}
      style={styles.postItem}
      activeOpacity={0.7}
    >
      <TouchableOpacity onPress={() => handleProfilePress(item.username)} style={styles.avatarContainer} activeOpacity={0.8}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.verticalLine} />
      </TouchableOpacity>
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">{item.username}</Text>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <TouchableOpacity onPress={() => handleMore(item.id)} hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
            <Icon name="ellipsis-horizontal" size={16} color="#888" />
          </TouchableOpacity>
        </View>
        
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
          <TouchableOpacity onPress={() => handleLike(item.id)} hitSlop={{top: 10, right: 5, bottom: 10, left: 5}}>
            {item.isLiked ? (
              <Icon name="heart" size={18} color="#ff3141" />
            ) : (
              <Icon name="heart-outline" size={18} color="#555" />
            )}
          </TouchableOpacity>
          {item.likes > 0 && (
            <Text style={styles.actionCount}>
              {item.likes}
            </Text>
          )}
          <TouchableOpacity onPress={() => handleComment(item.id)} hitSlop={{top: 10, right: 5, bottom: 10, left: 5}}>
            <Icon name="chatbubble-outline" size={18} color="#555" />
          </TouchableOpacity>
          {item.replies > 0 && (
            <Text style={styles.actionCount}>
              {item.replies}
            </Text>
          )}
          <TouchableOpacity onPress={() => handleRepost(item.id)} hitSlop={{top: 10, right: 5, bottom: 10, left: 5}}>
            {item.isReposted ? (
              <Icon name="repeat" size={18} color="#555" />
            ) : (
              <Icon name="repeat-outline" size={18} color="#555" />
            )}
          </TouchableOpacity>
          {item.reposts > 0 && (
            <Text style={styles.actionCount}>
              {item.reposts}
            </Text>
          )}
          <TouchableOpacity hitSlop={{top: 10, right: 5, bottom: 10, left: 5}}>
            <Icon name="paper-plane-outline" size={18} color="#555" />
          </TouchableOpacity>
        </View>
        
        {item.comments && Array.isArray(item.comments) && item.comments.length > 0 && (
          <View style={styles.commentsContainer}>
            {item.comments.map((comment, index) => 
              renderComment(comment, index, index === item.comments.length - 1)
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderComment = (comment: any, index: number, isLastComment: boolean) => (
    <View key={comment.id} style={styles.commentContainer}>
      <TouchableOpacity onPress={() => handleProfilePress(comment.username)} style={styles.commentAvatarContainer}>
        <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
        {!isLastComment && <View style={styles.commentVerticalLine} />}
      </TouchableOpacity>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername} numberOfLines={1} ellipsizeMode="tail">
            {comment.username}
          </Text>
          <Text style={styles.commentTime}>{comment.time}</Text>
        </View>
        <Text style={styles.commentText} numberOfLines={2} ellipsizeMode="tail">
          {comment.content}
        </Text>
        <View style={styles.commentActions}>
          <Icon name="heart-outline" size={14} color="#888" />
        </View>
      </View>
    </View>
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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  header: { 
    paddingVertical: 14, 
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee'
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  postList: { 
    flex: 1 
  },
  postItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    width: 40,
    marginRight: 4,
  },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  verticalLine: {
    position: "absolute",
    top: 42,
    bottom: -12,
    left: 18,
    width: 1.5,
    backgroundColor: "#eeeeee",
  },
  postContent: { 
    flex: 1,
    paddingLeft: 8
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: { 
    fontWeight: "600", 
    fontSize: 14
  },
  dotSeparator: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 4,
  },
  time: { 
    fontSize: 14, 
    color: "#666"
  },
  content: { 
    marginVertical: 6,
    fontSize: 15,
    lineHeight: 20,
    color: "#111"
  },
  postImage: { 
    width: "100%", 
    height: 300, 
    borderRadius: 10,
    marginBottom: 8
  },
  actions: {
    flexDirection: "row",
    marginTop: 4,
    gap: 16
  },
  mention: { 
    color: "#1C9BF0" 
  },
  likeCount: {
    fontSize: 14,
    color: "#111",
    marginTop: 6,
  },
  replyCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: "#666",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
  commentsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
  },
  commentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingLeft: 4,
  },
  commentAvatarContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 6,
  },
  commentAvatar: { 
    width: 24, 
    height: 24, 
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  commentVerticalLine: {
    position: "absolute",
    top: 26,
    bottom: -10,
    left: 12,
    width: 1,
    backgroundColor: "#eee",
  },
  commentContent: {
    flex: 1,
    paddingRight: 10,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  commentUsername: {
    fontWeight: "600",
    fontSize: 13,
  },
  commentText: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    color: "#888",
  },
  commentActions: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  actionCount: {
    fontSize: 14,
    color: "#111",
  },
});