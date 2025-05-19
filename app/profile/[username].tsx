import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import React from "react";
import {
  Clipboard,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert, // Thêm Alert để hiển thị thông báo
} from "react-native";
import { Divider } from "react-native-elements";
import QRCode from 'react-native-qrcode-svg';
import Icon from "react-native-vector-icons/Ionicons";
import ProfileButtons from './ProfileButtons';
import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';
import ProfilePost from './ProfilePost';
import ProfileTabs from './ProfileTabs';
import styles from './profileStyles';
import type { Post, UserProfile } from './profileTypes';

// Fetch thông tin user từ Supabase
export const fetchUserProfile = async (username: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, link, is_private, created_at")
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
    created_at: data.created_at,
  };
};

// Fetch danh sách bài đăng của user từ Supabase, bao gồm repost và trạng thái like
export const fetchUserPosts = async (userId: string): Promise<Post[]> => {
  if (!userId) return [];

  const now = new Date();
  const currentUser = await supabase.auth.getUser();
  const currentUserId = currentUser?.data?.user?.id;
  
  // Fetch posts của user
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(
      `
      id,
      user_id,
      content,
      created_at,
      image_url,
      likes (count),
      comments (count)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (postsError)
    throw new Error(`Error fetching posts: ${postsError.message}`);

  // Fetch reposts của user
  const { data: repostsData, error: repostsError } = await supabase
    .from("reposts")
    .select(
      `
      id,
      post_id,
      created_at,
      posts (
        id,
        user_id,
        content,
        created_at,
        image_url,
        comments (count),
        likes (count)
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (repostsError)
    throw new Error(`Error fetching reposts: ${repostsError.message}`);
    
  // Fetch profile của user
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .single();

  if (profileError)
    throw new Error(`Error fetching profile: ${profileError.message}`);

  // Lấy ID của các bài viết đã repost
  const repostedPostIds = repostsData
    .filter((repost: any) => repost.posts)
    .map((repost: any) => repost.posts.id);
    
  // Kết hợp ID bài đăng gốc và repost
  const ownPostIds = postsData.map((post: any) => post.id);
  const allPostIds = [...ownPostIds, ...repostedPostIds];

  // Kiểm tra like status cho người dùng hiện tại (nếu đã đăng nhập)
  let likedPostIds = new Set();
  if (currentUserId) {
    const { data: userLikes, error: likesError } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", allPostIds);

    if (!likesError && userLikes) {
      likedPostIds = new Set(userLikes.map((like: any) => like.post_id));
    }
  }

  // Lấy ID của người dùng đã đăng bài repost
  const repostedUserIds = repostsData
    .filter((repost: any) => repost.posts)
    .map((repost: any) => repost.posts.user_id);
    
  // Lấy profile của những người đã đăng bài repost
  const { data: repostedProfiles, error: repostedProfilesError } = 
    await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", repostedUserIds);

  if (repostedProfilesError)
    throw new Error(`Error fetching profiles for reposts: ${repostedProfilesError.message}`);

  const repostedProfilesMap = repostedProfiles.reduce((acc: any, profile: any) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

  // Fetch comments cho bài đăng
  const { data: commentsData, error: commentsError } = await supabase
    .from("comments")
    .select(
      `
      id,
      post_id,
      user_id,
      content,
      created_at,
      parent_id,
      likes (count)
    `
    )
    .in("post_id", allPostIds)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (commentsError)
    throw new Error(`Error fetching comments: ${commentsError.message}`);

  // Fetch profiles cho comment
  const commentUserIds = commentsData.map((comment: any) => comment.user_id);
  const { data: commentProfilesData, error: commentProfilesError } =
    await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", commentUserIds);

  if (commentProfilesError)
    throw new Error(`Error fetching profiles for comments: ${commentProfilesError.message}`);

  const profilesMap = commentProfilesData.reduce((acc: any, profile: any) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

  // Format bài viết gốc của user
  const formattedOwnPosts: Post[] = postsData.map((post: any) => {
    const createdAt = new Date(post.created_at);
    const diffInMs = now.getTime() - createdAt.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    let time;
    if (diffInDays > 0) {
      time = `${diffInDays} Days ago`;
    } else if (diffInHours > 0) {
      time = `${diffInHours} Hours ago`;
    } else if (diffInMinutes > 0) {
      time = `${diffInMinutes} Minutes ago`;
    } else {
      time = "Just now";
    }

    const postComments = commentsData.filter(
      (comment: any) => comment.post_id === post.id
    );

    // Kiểm tra xem bài đăng đã được like bởi người dùng hiện tại hay chưa
    const isLiked = likedPostIds.has(post.id);

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
      image_url: post.image_url,
      isRepost: false,
      actualCreatedAt: createdAt,
      isLiked,
      repliesData: postComments.map((comment: any) => {
        const profile = profilesMap[comment.user_id] || {};
        const commentTime = new Date(comment.created_at);
        const diffInMsComment = now.getTime() - commentTime.getTime();
        const diffInMinutesComment = Math.floor(diffInMsComment / (1000 * 60));
        const diffInHoursComment = Math.floor(diffInMsComment / (1000 * 60 * 60));
        const diffInDaysComment = Math.floor(diffInMsComment / (1000 * 60 * 60 * 24));

        let timeComment;
        if (diffInDaysComment > 0) {
          timeComment = `${diffInDaysComment} Days ago`;
        } else if (diffInHoursComment > 0) {
          timeComment = `${diffInHoursComment} Hours ago`;
        } else if (diffInMinutesComment > 0) {
          timeComment = `${diffInMinutesComment} Minutes ago`;
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
          isLiked: false, // Không cần kiểm tra like cho comment
        };
      }),
    };
  });

  // Format reposts của user
  const formattedReposts: Post[] = repostsData
    .filter((repost: any) => repost.posts) // Lọc các repost có dữ liệu bài viết
    .map((repost: any) => {
      const post = repost.posts;
      const repostedUserId = post.user_id;
      const repostedProfile = repostedProfilesMap[repostedUserId] || {};

      const createdAt = new Date(post.created_at);
      const diffInMs = now.getTime() - createdAt.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      let time;
      if (diffInDays > 0) {
        time = `${diffInDays} Days ago`;
      } else if (diffInHours > 0) {
        time = `${diffInHours} Hours ago`;
      } else if (diffInMinutes > 0) {
        time = `${diffInMinutes} Minutes ago`;
      } else {
        time = "Just now";
      }

      // Thời gian repost
      const repostCreatedAt = new Date(repost.created_at);
      const repostDiffInMs = now.getTime() - repostCreatedAt.getTime();
      const repostDiffInMinutes = Math.floor(repostDiffInMs / (1000 * 60));
      const repostDiffInHours = Math.floor(repostDiffInMs / (1000 * 60 * 60));
      const repostDiffInDays = Math.floor(repostDiffInMs / (1000 * 60 * 60 * 24));

      let repostedTime;
      if (repostDiffInDays > 0) {
        repostedTime = `${repostDiffInDays} Days ago`;
      } else if (repostDiffInHours > 0) {
        repostedTime = `${repostDiffInHours} Hours ago`;
      } else if (repostDiffInMinutes > 0) {
        repostedTime = `${repostDiffInMinutes} Minutes ago`;
      } else {
        repostedTime = "Just now";
      }

      const postComments = commentsData.filter(
        (comment: any) => comment.post_id === post.id
      );

      // Kiểm tra xem bài đăng đã được like bởi người dùng hiện tại hay chưa
      const isLiked = likedPostIds.has(post.id);

      return {
        id: post.id,
        userId: post.user_id,
        username: repostedProfile.username || "Unknown",
        handle: `@${repostedProfile.username || "unknown"}`,
        content: post.content,
        time,
        likes: post.likes?.[0]?.count || 0,
        replies: post.comments?.[0]?.count || 0,
        avatar: repostedProfile.avatar_url || "https://via.placeholder.com/50",
        image_url: post.image_url,
        isRepost: true,
        repostedBy: profileData.username || "Unknown",
        repostedTime,
        repostedId: repost.id,
        actualCreatedAt: repostCreatedAt,
        isLiked,
        repliesData: postComments.map((comment: any) => {
          const profile = profilesMap[comment.user_id] || {};
          const commentTime = new Date(comment.created_at);
          const diffInMsComment = now.getTime() - commentTime.getTime();
          const diffInMinutesComment = Math.floor(diffInMsComment / (1000 * 60));
          const diffInHoursComment = Math.floor(diffInMsComment / (1000 * 60 * 60));
          const diffInDaysComment = Math.floor(diffInMsComment / (1000 * 60 * 60 * 24));

          let timeComment;
          if (diffInDaysComment > 0) {
            timeComment = `${diffInDaysComment} Days ago`;
          } else if (diffInHoursComment > 0) {
            timeComment = `${diffInHoursComment} Hours ago`;
          } else if (diffInMinutesComment > 0) {
            timeComment = `${diffInMinutesComment} Minutes ago`;
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
            isLiked: false, // Không cần kiểm tra like cho comment
          };
        }),
      };
    });

  // Kết hợp và sắp xếp tất cả bài viết theo thời gian thực tế
  const allPosts = [...formattedOwnPosts, ...formattedReposts].sort((a, b) => {
    return (b.actualCreatedAt?.getTime() || 0) - (a.actualCreatedAt?.getTime() || 0);
  });

  return allPosts;
};

// Fetch danh sách bình luận của user (cho tab Replies)
export const fetchUserReplies = async (userId: string): Promise<any[]> => {
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
export const checkFollowing = async (
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
  const navigation = useNavigation();
  const { username: rawUsername } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const currentUserId = user?.id || null;
  const queryClient = useQueryClient();

  // Xử lý username để đảm bảo là string
  const username = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("Thread");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

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

  const {
    data: posts,
    isLoading: isPostsLoading,
    isError: isPostsError,
    error: postsError,
    refetch: refetchPosts
  } = useQuery<Post[], Error>({
    queryKey: ["userPosts", userProfile?.id],
    queryFn: () => fetchUserPosts(userProfile?.id as string),
    enabled: !!userProfile?.id,
  });

  const {
    data: replies,
    isLoading: isRepliesLoading,
    isError: isRepliesError,
    error: repliesError,
    refetch: refetchReplies
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

  // Re-fetch data when tab changes 
  useEffect(() => {
    if (activeTab === "Thread") {
      refetchPosts();
    } else if (activeTab === "Replies") {
      refetchReplies();
    }
  }, [activeTab]);

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
        url: `https://thread.com/thread/${post.id}`, // Thay bằng URL thực tế của ứng dụng
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCopyLink = () => {
    Clipboard.setString(profileLink);
    setSettingsVisible(false);
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out this profile: ${profileLink}`,
        url: profileLink,
      });
    } catch (error) {
      // Optionally handle error
    }
    setSettingsVisible(false);
  };

  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      console.error("User not logged in");
      return;
    }

    try {
      // Optimistic update - Update UI immediately
      const updatedPosts = activeTab === "Thread" 
        ? posts?.map(p => p.id === postId ? { 
            ...p, 
            isLiked: !p.isLiked, 
            likes: p.isLiked ? p.likes - 1 : p.likes + 1 
          } : p) 
        : posts;

      const updatedReplies = activeTab === "Replies" 
        ? replies?.map(r => r.id === postId ? { 
            ...r, 
            isLiked: !r.isLiked, 
            likes: r.isLiked ? r.likes - 1 : r.likes + 1 
          } : r) 
        : replies;

      // Use ReactQuery's setQueryData to update the cache
      if (activeTab === "Thread" && updatedPosts) {
        queryClient.setQueryData(["userPosts", userProfile?.id], updatedPosts);
      } else if (activeTab === "Replies" && updatedReplies) {
        queryClient.setQueryData(["userReplies", userProfile?.id], updatedReplies);
      }

      // Check if the post was already liked
      const { data: existingLike, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .single();

      if (likeError && likeError.code !== "PGRST116") {
        console.error("Error checking like:", likeError);
        return;
      }

      if (existingLike) {
        // Unlike the post if it was already liked
        const { error: deleteError } = await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);
          
        if (deleteError) {
          console.error("Error removing like:", deleteError);
          return;
        }
      } else {
        // Like the post if it wasn't already liked
        const { error: insertError } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: currentUserId });
          
        if (insertError) {
          console.error("Error adding like:", insertError);
          return;
        }
      }

      // Refresh the data
      if (activeTab === "Thread") {
        refetchPosts();
      } else {
        refetchReplies();
      }
      
    } catch (error) {
      console.error("Error handling like:", error);
    }
  };

  const handleProfilePress = (targetUserId: string) => {
    if (targetUserId) {
      router.push(`/profile/${targetUserId}`);
    }
  };

  const showDeleteConfirmation = (post: Post) => {
    const isCurrentUserPost = currentUserId === post.userId;
    
    if (!isCurrentUserPost) {
      return; // Only allow deletion of own posts
    }
    
    const message = post.isRepost 
      ? "Bạn có chắc chắn muốn bỏ repost bài viết này không?"
      : "Bạn có chắc chắn muốn xóa bài viết này không?";
      
    const actionText = post.isRepost ? "Bỏ repost" : "Xóa";
    
    Alert.alert(
      "Xác nhận",
      message,
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: actionText,
          onPress: () => handleDeletePost(post),
          style: "destructive"
        }
      ]
    );
  };
  
  const handleDeletePost = async (post: Post) => {
    if (!currentUserId) return;
    
    try {
      if (post.isRepost && post.repostedId) {
        // Delete repost
        const { error: deleteRepostError } = await supabase
          .from("reposts")
          .delete()
          .eq("id", post.repostedId);
        
        if (deleteRepostError) {
          console.error("Error deleting repost:", deleteRepostError);
          Alert.alert("Lỗi", "Không thể xóa repost");
          return;
        }
      } else {
        // Delete original post (with comments, likes, etc.)
        const { error: postError } = await supabase
          .from("posts")
          .delete()
          .eq("id", post.id)
          .eq("user_id", currentUserId); // Ensure only owner can delete
        
        if (postError) {
          console.error("Error deleting post:", postError);
          Alert.alert("Lỗi", "Không thể xóa bài viết");
          return;
        }
      }
      
      // Refresh posts after deletion
      if (activeTab === "Thread") {
        refetchPosts();
      } else {
        refetchReplies();
      }
      
      Alert.alert(
        "Thành công", 
        post.isRepost ? "Đã bỏ repost bài viết" : "Bài viết đã được xóa"
      );
      
    } catch (error) {
      console.error("Error deleting post:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi xóa bài viết");
    }
  };

  if (isUserLoading || isPostsLoading || isRepliesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Ẩn header mặc định của navigation */}
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isUserError || isPostsError || isRepliesError) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Ẩn header mặc định của navigation */}
        <Stack.Screen options={{ headerShown: false }} />
        <Text>Error: {(userError || postsError || repliesError)?.message}</Text>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Ẩn header mặc định của navigation */}
        <Stack.Screen options={{ headerShown: false }} />
        <Text>User not found</Text>
      </SafeAreaView>
    );
  }

  const profileLink = `https://thread.com/profile/${userProfile?.username}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Ẩn header mặc định của navigation */}
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Sử dụng ProfileHeader với prop onMenuPress */}
      <ProfileHeader 
        username={userProfile.username} 
        avatar={userProfile.avatar}
        isCurrentUserProfile={userProfile.id === currentUserId}
        currentUserId={currentUserId}
        onMenuPress={() => setSettingsVisible(true)}
      />

      <ProfileInfo 
        username={userProfile.username}
        avatar={userProfile.avatar}
        bio={userProfile.bio} 
        link={userProfile.link} 
        followers={userProfile.followers} 
      />

      <ProfileButtons
        isFollowing={isFollowing}
        isPrivate={userProfile.is_private}
        isCurrentUser={userProfile.id === currentUserId}
        onFollow={handleFollow}
        onShowQR={() => setShowQR(true)}
        inforUrl={profileLink}
      />

      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <Divider style={styles.divider} />

      {/* Phần nội dung - cập nhật để hiển thị đúng dữ liệu dựa vào activeTab */}
      <FlatList
        data={activeTab === "Thread" ? posts : replies}
        renderItem={({ item }: { item: Post }) => (
          <ProfilePost 
            item={item} 
            onPress={handlePostPress} 
            onShare={handleShare} 
            onLike={(postId) => handleLike(postId)}
            onProfilePress={(userId) => handleProfilePress(userId)}
            onDeletePost={(post) => showDeleteConfirmation(post)}
          />
        )}
        keyExtractor={(item) => item.id}
        style={styles.content}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === "Thread" ? "No threads yet" : "No replies yet"}
            </Text>
          </View>
        }
      />
      
      {/* Modals - giữ nguyên */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Blur/dim background */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSettingsVisible(false)}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' }} />
          </Pressable>
          {/* Bottom sheet modal */}
          <View style={{
            height: '60%',
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 24,
            elevation: 10,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, marginBottom: 12 }} />
              <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Cài đặt hồ sơ</Text>
            </View>
            <TouchableOpacity style={styles.settingItem} onPress={() => {
              setSettingsVisible(false); // Close settings modal first
              setTimeout(() => setShowQR(true), 300); // Then show QR modal
            }}>
              <Icon name="qr-code-outline" size={22} color="#222" style={{ marginRight: 12 }} />
              <Text style={styles.settingText}>Mã QR hồ sơ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={handleCopyLink}>
              <Icon name="link-outline" size={22} color="#222" style={{ marginRight: 12 }} />
              <Text style={styles.settingText}>Sao chép liên kết hồ sơ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={handleShareProfile}>
              <Icon name="share-social-outline" size={22} color="#222" style={{ marginRight: 12 }} />
              <Text style={styles.settingText}>Chia sẻ hồ sơ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                setSettingsVisible(false);
                setTimeout(() => setAboutVisible(true), 300);
              }}
            >
              <Icon name="settings-outline" size={22} color="#222" style={{ marginRight: 12 }} />
              <Text style={styles.settingText}>Giới thiệu về trang cá nhân này</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => { setSettingsVisible(false);  }}>
              <Icon name="information-circle-outline" size={22} color="#222" style={{ marginRight: 12 }} />
              <Text style={styles.settingText}>Giới thiệu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => setSettingsVisible(false)}>
              <Icon name="close-outline" size={22} color="#222" style={{ marginRight: 12 }} />
              <Text style={styles.settingText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal - moved outside of settings modal */}
      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowQR(false)}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        </Pressable>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', elevation: 10 }}>
            <QRCode value={profileLink} size={180} />
            <Text style={{ marginTop: 16, fontWeight: 'bold', fontSize: 16 }}>{userProfile.username}</Text>
            <Text style={{ color: '#666', marginBottom: 12 }}>{profileLink}</Text>
            <TouchableOpacity onPress={() => setShowQR(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setAboutVisible(false)}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        </Pressable>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', elevation: 10 }}>
            <Icon name="information-circle-outline" size={40} color="#222" style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{userProfile.username}</Text>
            <Text style={{ color: '#666', marginBottom: 8 }}>
              Ngày tham gia: {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Không rõ'}
            </Text>
            <TouchableOpacity onPress={() => setAboutVisible(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
