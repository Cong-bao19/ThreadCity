import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

// Di chuyển hàm calculateTimeAgo ra ngoài để tái sử dụng
export const calculateTimeAgo = (createdAt: string): string => {
  const now = new Date();
  const createdDate = new Date(createdAt);
  if (isNaN(createdDate.getTime())) return "Invalid date";
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `${diffDays}d ago` : "today";
};

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
  likes: number;
  parent_id: string | null;
  level: number;
}

interface ThreadData {
  mainPost: Post;
  comments: Comment[];
}

export const fetchPostAndComments = async (
  postId: string,
  userId: string
): Promise<ThreadData> => {
  const { data: postData, error: postError } = await supabase
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
    .eq("id", postId)
    .single();

  if (postError) throw new Error(`Error fetching post: ${postError.message}`);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", postData.user_id)
    .single();

  if (profileError)
    throw new Error(`Error fetching profile: ${profileError.message}`);

  const { data: likeData, error: likeError } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postData.id)
    .eq("user_id", userId)
    .single();

  if (likeError && likeError.code !== "PGRST116") {
    throw new Error(
      `Error checking like status for post: ${likeError.message}`
    );
  }

  const formattedPost: Post = {
    id: postData.id,
    username: profileData.username || "Unknown",
    avatar: profileData.avatar_url || "https://via.placeholder.com/40",
    content: postData.content,
    image: postData.image_url,
    time: calculateTimeAgo(postData.created_at),
    replies: postData.comments?.[0]?.count || 0,
    likes: postData.likes?.[0]?.count || 0,
    isLiked: !!likeData,
  };

  const { data: commentsData, error: commentsError } = await supabase
    .from("comments")
    .select(
      `
      id,
      user_id,
      content,
      created_at,
      parent_id,
      likes (count)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (commentsError)
    throw new Error(`Error fetching comments: ${commentsError.message}`);
  const userIds = commentsData.map((comment: any) => comment.user_id);
  
  let profilesData = [];
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    if (profilesError)
      throw new Error(
        `Error fetching profiles for comments: ${profilesError.message}`
      );
    
    profilesData = profiles || [];
  }

  const profilesMap = profilesData.reduce((acc: any, profile: any) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

  const { data: commentsLikesData, error: commentsLikesError } = await supabase
    .from("likes")
    .select("comment_id")
    .eq("user_id", userId)
    .in(
      "comment_id",
      commentsData.map((c: any) => c.id)
    );

  if (commentsLikesError) {
    throw new Error(
      `Error checking like status for comments: ${commentsLikesError.message}`
    );
  }

  const likedCommentIds = new Set(
    commentsLikesData.map((like: any) => like.comment_id)
  );

  const formattedComments: Comment[] = [];
  const commentMap: { [key: string]: Comment } = {};

  commentsData.forEach((comment: any) => {
    const profile = profilesMap[comment.user_id] || {};
    const formattedComment: Comment = {
      id: comment.id,
      username: profile.username || "Unknown",
      avatar: profile.avatar_url || "https://via.placeholder.com/40",
      content: comment.content,
      time: calculateTimeAgo(comment.created_at),
      isLiked: likedCommentIds.has(comment.id),
      likes: comment.likes?.[0]?.count || 0,
      parent_id: comment.parent_id,
      level: 0,
    };
    commentMap[comment.id] = formattedComment;
  });

  const calculateLevel = (
    commentId: string,
    visited: Set<string> = new Set()
  ): number => {
    const comment = commentMap[commentId];
    if (!comment || !comment.parent_id) return 0;
    if (visited.has(commentId)) return 0;
    visited.add(commentId);
    return 1 + calculateLevel(comment.parent_id, visited);
  };

  commentsData.forEach((comment: any) => {
    const formattedComment = commentMap[comment.id];
    formattedComment.level = calculateLevel(comment.id);
    formattedComments.push(formattedComment);
  });

  formattedComments.sort((a, b) => {
    const timeA = new Date(a.time.replace("d ago", "")).getTime() || 0;
    const timeB = new Date(b.time.replace("d ago", "")).getTime() || 0;
    return timeA - timeB;
  });

  return { mainPost: formattedPost, comments: formattedComments };
};

// Hàm tạo thông báo
const createNotification = async (
  userId: string,
  actorId: string,
  postId: string,
  commentId: string | null,
  type: "like" | "comment" | "share" | "reply",
  content: string
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

// Hàm xóa thông báo
const deleteNotification = async (
  actorId: string,
  postId: string,
  type: string
) => {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("actor_id", actorId)
    .eq("post_id", postId)
    .eq("type", type);

  if (error) {
    console.error(`Error deleting ${type} notification:`, error);
  }
};

export default function Thread() {
  const { postId } = useLocalSearchParams();
  console.log("Thread screen loaded, postId:", postId);

  const { user } = useUser();
  const userId = user?.id || null;

  // Xử lý postId để đảm bảo là string
  const safePostId = Array.isArray(postId)
    ? postId[0]
    : (postId as string) || "";

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    type: "post" | "comment";
    username: string;
  } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const commentInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  const queryClient = useQueryClient();

  // Query để fetch dữ liệu bài viết và bình luận
  const { data, isLoading, isError, refetch } = useQuery<ThreadData, Error>({
    queryKey: ["thread", safePostId, userId],
    queryFn: () => fetchPostAndComments(safePostId, userId!),
    enabled: !!safePostId && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [mainPost, setMainPost] = useState<Post | null>(data?.mainPost || null);
  const [comments, setComments] = useState<Comment[]>(data?.comments || []);

  useEffect(() => {
    if (data) {
      setMainPost(data.mainPost);
      setComments(data.comments);
    }
  }, [data]);

  // Mutation cho like
  const likeMutation = useMutation({
    mutationFn: async ({ id, isPost }: { id: string; isPost: boolean }) => {
      if (!userId) throw new Error("User not logged in");

      const column = isPost ? "post_id" : "comment_id";

      const { data: existingLike, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq(column, id)
        .eq("user_id", userId)
        .single();

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
          .insert({ [column]: id, user_id: userId });
        if (insertError)
          throw new Error(`Error adding like: ${insertError.message}`);
        actionPerformed = "like";
      }

      if (isPost && mainPost) {
        setMainPost({
          ...mainPost,
          isLiked: !mainPost.isLiked,
          likes: mainPost.isLiked ? mainPost.likes - 1 : mainPost.likes + 1,
        });
      } else if (!isPost) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === id
              ? {
                  ...comment,
                  isLiked: !comment.isLiked,
                  likes: comment.isLiked
                    ? comment.likes - 1
                    : comment.likes + 1,
                }
              : comment
          )
        );
      }

      if (isPost && actionPerformed === "like" && mainPost) {
        const { data: actorProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single();

        const actorUsername = actorProfile?.username || "Someone";
        const notificationContent = `${actorUsername} liked your post`;

        await createNotification(
          mainPost.username,
          userId,
          safePostId,
          null,
          "like",
          notificationContent
        );
      } else if (isPost && actionPerformed === "unlike" && mainPost) {
        await deleteNotification(userId, safePostId, "like");
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Mutation cho thêm comment
  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!newComment.trim() || !userId)
        throw new Error("Comment is empty or user not logged in");

      const commentData = {
        post_id: safePostId,
        user_id: userId,
        content: newComment.trim(),
        parent_id: replyingTo?.type === "comment" ? replyingTo.id : null,
      };

      const { data, error } = await supabase
        .from("comments")
        .insert(commentData)
        .select("id, user_id, content, created_at, parent_id")
        .single();

      if (error) throw new Error(`Error adding comment: ${error.message}`);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .single();

      if (profileError)
        throw new Error(`Error fetching user profile: ${profileError.message}`);

      const newCommentData: Comment = {
        id: data.id,
        username: profileData.username || "Unknown",
        avatar: profileData.avatar_url || "https://via.placeholder.com/40",
        content: data.content,
        time: calculateTimeAgo(data.created_at),
        isLiked: false,
        likes: 0,
        parent_id: data.parent_id,
        level:
          replyingTo?.type === "comment"
            ? (comments.find((c) => c.id === replyingTo.id)?.level || 0) + 1
            : 0,
      };

      setComments((prev) => [...prev, newCommentData]);
      setNewComment("");
      setReplyingTo(null);

      if (!replyingTo || replyingTo.type === "post") {
        setMainPost((prev) =>
          prev ? { ...prev, replies: prev.replies + 1 } : null
        );
      }

      if (replyingTo?.type === "comment" && data.parent_id) {
        const { data: parentComment } = await supabase
          .from("comments")
          .select("user_id")
          .eq("id", data.parent_id)
          .single();

        const commentOwnerId = parentComment?.user_id;
        if (userId && commentOwnerId && userId !== commentOwnerId) {
          const { data: actorProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", userId)
            .single();

          const actorUsername = actorProfile?.username || "Someone";
          const notificationContent = `${actorUsername} replied to your comment`;

          await createNotification(
            commentOwnerId,
            userId,
            safePostId,
            data.parent_id,
            "reply",
            notificationContent
          );
        }
      }

      await queryClient.refetchQueries({
        queryKey: ["thread", safePostId, userId],
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/Login");
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out");
    }
  };

  const handleLike = (id: string, isPost: boolean) => {
    likeMutation.mutate({ id, isPost });
  };

  const handleShare = async (threadId: string) => {
    if (!mainPost) return;
    try {
      await Share.share({
        message: `${mainPost.content} - Shared from ${mainPost.username} (Post ID: ${mainPost.id})`,
        url: `https://yourapp.com/thread/${mainPost.id}`, // Thay bằng URL thực tế
      });
      const { data: actorProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId!)
        .single();
      const actorUsername = actorProfile?.username || "Someone";
      const notificationContent = `${actorUsername} shared your post`;
      await createNotification(
        mainPost.username,
        userId!,
        safePostId,
        null,
        "share",
        notificationContent
      );
    } catch (error) {
      console.error("Error sharing:", error);
      setError("Failed to share");
    }
  };

  const handleMore = (threadId: string) => {
    console.log("More options for thread:", threadId);
  };

  const handleComment = (id: string, isPost: boolean, username: string) => {
    setReplyingTo({ id, type: isPost ? "post" : "comment", username });
    commentInputRef.current?.focus();
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSubmitComment = () => {
    commentMutation.mutate();
  };

  const renderThreadItem = (item: Post | Comment, isMainPost = false) => {
    const isPost = (i: Post | Comment): i is Post =>
      "replies" in i && "likes" in i;
    return (
      <View
        style={[
          styles.threadItem,
          !isMainPost && { marginLeft: (item as Comment).level * 50 },
        ]}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.threadContent}>
          <Text style={styles.username}>
            {item.username}
            {!isMainPost && (item as Comment).parent_id && (
              <Text style={styles.replyTo}>
                {" replying to @" +
                  comments.find((c) => c.id === (item as Comment).parent_id)
                    ?.username}
              </Text>
            )}
          </Text>
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
            <TouchableOpacity
              onPress={() => handleLike(item.id, isMainPost)}
              style={styles.actionButton}
            >
              <Icon
                name={item.isLiked ? "heart" : "heart-outline"}
                size={20}
                color={item.isLiked ? "#ff0000" : "#666"}
              />
              {item.likes > 0 && (
                <Text style={styles.actionText}>{item.likes}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleComment(item.id, isMainPost, item.username)}
            >
              <Icon name="chatbubble-outline" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare(item.id)}>
              <Icon name="share-outline" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMore(item.id)}>
              <Icon name="ellipsis-horizontal" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {isMainPost && isPost(item) && (
            <Text style={styles.stats}>
              {item.replies > 0 ? `${item.replies} replies` : ""}
              {item.replies > 0 && item.likes > 0 ? " • " : ""}
              {item.likes > 0
                ? item.likes < 1000
                  ? `${item.likes} likes`
                  : `${(item.likes / 1000).toFixed(1)}K likes`
                : ""}
            </Text>
          )}
        </View>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Error: {typeof error === "string"
              ? error
              : error && typeof error === "object" && "message" in error
              ? (error as Error).message
              : "An error occurred"}
          </Text>
        </View>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 150 : 80}
    >
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
          ref={flatListRef}
          data={[mainPost, ...comments]}
          renderItem={({ item, index }) => renderThreadItem(item, index === 0)}
          keyExtractor={(item) => item.id}
          style={styles.threadList}
          contentContainerStyle={{ paddingBottom: keyboardHeight + 60 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refetch()}
            />
          }
        />

        <View
          style={[
            styles.commentInputContainer,
            { paddingBottom: keyboardHeight > 0 ? 10 : 10 },
          ]}
        >
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            placeholder={
              replyingTo
                ? `Replying to @${replyingTo.username}...`
                : "Add a comment..."
            }
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            style={styles.sendButton}
          >
            <Icon name="send" size={24} color="#3897f0" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  replyTo: {
    fontSize: 12,
    color: "#666",
    fontWeight: "normal",
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
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
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
  commentInputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
    backgroundColor: "#fff",
  },
  sendButton: {
    marginLeft: 10,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red" },
});