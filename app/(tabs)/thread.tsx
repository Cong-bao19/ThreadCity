// app/(tabs)/thread.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
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
  likes: number;
  parent_id: string | null;
  level: number;
}

export default function Thread() {
  const { postId } = useLocalSearchParams();
  const [mainPost, setMainPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    type: "post" | "comment";
    username: string;
  } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0); // Lưu chiều cao bàn phím
  const commentInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  // Lấy userId của người dùng hiện tại
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  // Xử lý sự kiện bàn phím để lấy chiều cao và cuộn FlatList
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height); // Lưu chiều cao bàn phím
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0); // Reset chiều cao bàn phím khi bàn phím ẩn
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Lấy dữ liệu bài viết và bình luận
  const fetchPostAndComments = async () => {
    if (!postId || !userId) {
      console.error("No postId or userId provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

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

      if (postError) {
        console.error("Error fetching post:", postError);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", postData.user_id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      const { data: likeData, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postData.id)
        .eq("user_id", userId)
        .single();

      if (likeError && likeError.code !== "PGRST116") {
        console.error("Error checking like status for post:", likeError);
        return;
      }

      const formattedPost: Post = {
        id: postData.id,
        username: profileData.username || "Unknown",
        avatar: profileData.avatar_url || "https://via.placeholder.com/40",
        content: postData.content,
        image: postData.image_url,
        time: new Date(postData.created_at).toLocaleTimeString(),
        replies: postData.comments?.[0]?.count || 0,
        likes: postData.likes?.[0]?.count || 0,
        isLiked: !!likeData,
      };
      setMainPost(formattedPost);

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

      const { data: commentsLikesData, error: commentsLikesError } =
        await supabase
          .from("likes")
          .select("comment_id")
          .eq("user_id", userId)
          .in(
            "comment_id",
            commentsData.map((c: any) => c.id)
          );

      if (commentsLikesError) {
        console.error(
          "Error checking like status for comments:",
          commentsLikesError
        );
        return;
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
          time: new Date(comment.created_at).toLocaleTimeString(),
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
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeA - timeB;
      });

      setComments(formattedComments);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPostAndComments();
    }
  }, [postId, userId]);

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

  const handleLike = async (id: string, isPost: boolean) => {
    if (!id) {
      console.error("User not logged in");
      return;
    }

    if (isPost) {
      const { data: existingLike, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", id)
        .eq("user_id", userId)
        .single();

      if (likeError && likeError.code !== "PGRST116") {
        console.error("Error checking like:", likeError);
        return;
      }

      if (existingLike) {
        const { error: deleteError } = await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) {
          console.error("Error removing like:", deleteError);
          return;
        }

        setMainPost((prev) =>
          prev ? { ...prev, isLiked: false, likes: prev.likes - 1 } : null
        );
      } else {
        const { error: insertError } = await supabase
          .from("likes")
          .insert({ post_id: id, user_id: userId });

        if (insertError) {
          console.error("Error adding like:", insertError);
          return;
        }

        setMainPost((prev) =>
          prev ? { ...prev, isLiked: true, likes: prev.likes + 1 } : null
        );
      }
    } else {
      const { data: existingLike, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("comment_id", id)
        .eq("user_id", userId)
        .single();

      if (likeError && likeError.code !== "PGRST116") {
        console.error("Error checking like:", likeError);
        return;
      }

      if (existingLike) {
        const { error: deleteError } = await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) {
          console.error("Error removing like:", deleteError);
          return;
        }

        setComments((prev) =>
          prev.map((comment) =>
            comment.id === id
              ? { ...comment, isLiked: false, likes: comment.likes - 1 }
              : comment
          )
        );
      } else {
        const { error: insertError } = await supabase
          .from("likes")
          .insert({ comment_id: id, user_id: userId });

        if (insertError) {
          console.error("Error adding like:", insertError);
          return;
        }

        setComments((prev) =>
          prev.map((comment) =>
            comment.id === id
              ? { ...comment, isLiked: true, likes: comment.likes + 1 }
              : comment
          )
        );
      }
    }
  };

  const handleShare = (threadId: string) => {
    console.log("Share thread:", threadId);
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

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !userId) {
      console.error("Comment is empty or user not logged in");
      return;
    }

    try {
      const commentData: any = {
        post_id: postId,
        user_id: userId,
        content: newComment.trim(),
      };

      if (replyingTo && replyingTo.type === "comment") {
        commentData.parent_id = replyingTo.id;
      }

      const { data, error } = await supabase
        .from("comments")
        .insert(commentData)
        .select("id, user_id, content, created_at, parent_id")
        .single();

      if (error) {
        console.error("Error adding comment:", error);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return;
      }

      const newCommentData: Comment = {
        id: data.id,
        username: profileData.username || "Unknown",
        avatar: profileData.avatar_url || "https://via.placeholder.com/40",
        content: data.content,
        time: new Date(data.created_at).toLocaleTimeString(),
        isLiked: false,
        likes: 0,
        parent_id: data.parent_id,
        level:
          replyingTo && replyingTo.type === "comment"
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

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!mainPost) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <Text>Post not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 150 : 80} // Tăng offset để tránh tab bar
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
          contentContainerStyle={{ paddingBottom: keyboardHeight + 60 }} // Thêm padding dưới để tránh tab bar và bàn phím
        />

        <View
          style={[
            styles.commentInputContainer,
            { paddingBottom: keyboardHeight > 0 ? 10 : 10 }, // Điều chỉnh padding khi bàn phím hiện lên
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
});
