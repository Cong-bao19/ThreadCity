import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
} from "react-native";
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

// Fetch danh sách bài đăng của user từ Supabase
export const fetchUserPosts = async (userId: string): Promise<Post[]> => {
  if (!userId) return [];

  const now = new Date();

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(
      `
      id,
      user_id,
      content,
      created_at,
      likes (count),
      comments (count)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (postsError)
    throw new Error(`Error fetching posts: ${postsError.message}`);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .single();

  if (profileError)
    throw new Error(`Error fetching profile: ${profileError.message}`);

  const postIds = postsData.map((post: any) => post.id);
  const { data: commentsData, error: commentsError } = await supabase
    .from("comments")
    .select(
      `
      id,
      post_id,
      user_id,
      content,
      created_at,
      likes (count)
    `
    )
    .in("post_id", postIds)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (commentsError)
    throw new Error(`Error fetching comments: ${commentsError.message}`);

  const commentUserIds = commentsData.map((comment: any) => comment.user_id);
  const { data: commentProfilesData, error: commentProfilesError } =
    await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", commentUserIds);

  if (commentProfilesError)
    throw new Error(
      `Error fetching profiles for comments: ${commentProfilesError.message}`
    );

  const profilesMap = commentProfilesData.reduce((acc: any, profile: any) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

  const formattedPosts: Post[] = postsData.map((post: any) => {
    const createdAt = new Date(post.created_at);
    const diffInMs = now.getTime() - createdAt.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    let time;
    if (diffInDays > 0) {
      time = `${diffInDays} Days`;
    } else if (diffInHours > 0) {
      time = `${diffInHours} Hours`;
    } else if (diffInMinutes > 0) {
      time = `${diffInMinutes} Minutes`;
    } else {
      time = "Just now";
    }

    const postComments = commentsData.filter(
      (comment: any) => comment.post_id === post.id
    );

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
      repliesData: postComments.map((comment: any) => {
        const profile = profilesMap[comment.user_id] || {};
        const commentTime = new Date(comment.created_at);
        const diffInMsComment = now.getTime() - commentTime.getTime();
        const diffInMinutesComment = Math.floor(diffInMsComment / (1000 * 60));
        const diffInHoursComment = Math.floor(
          diffInMsComment / (1000 * 60 * 60)
        );
        const diffInDaysComment = Math.floor(
          diffInMsComment / (1000 * 60 * 60 * 24)
        );

        let timeComment;
        if (diffInDaysComment > 0) {
          timeComment = `${diffInDaysComment}D`;
        } else if (diffInHoursComment > 0) {
          timeComment = `${diffInHoursComment}H`;
        } else if (diffInMinutesComment > 0) {
          timeComment = `${diffInMinutesComment}M`;
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
        };
      }),
    };
  });

  return formattedPosts;
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
const checkFollowing = async (
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

  useEffect(() => {
    if (userProfile?.username) {
      navigation.setOptions({
        title: "Quay lại",
        headerTitleStyle: {
          marginLeft: 0,
          fontSize: 18,
          fontWeight: "bold",
          color: "#222",
        },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 6 }}>
            <TouchableOpacity onPress={() => {/* TODO: Mở Instagram */}}>
              <Image source={require("../../assets/images/instagram-logo.png")} style={{ width: 30, height: 24 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {/* TODO: Xử lý thông báo */}}>
              <Icon name="notifications-outline" size={22} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              style={{
                backgroundColor: '#eee',
                borderRadius: 16,
                width: 26,
                height: 26,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="ellipsis-horizontal" size={18} color="#222" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [userProfile?.username, navigation]);


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
    // Optionally show a toast or alert
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

  if (isUserLoading || isPostsLoading || isRepliesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (isUserError || isPostsError || isRepliesError) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Error: {(userError || postsError || repliesError)?.message}</Text>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>User not found</Text>
      </SafeAreaView>
    );
  }

  const profileLink = `https://thread.com/profile/${userProfile?.username}`;

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader username={userProfile.username} avatar={userProfile.avatar} />
      <ProfileInfo bio={userProfile.bio} link={userProfile.link} followers={userProfile.followers} />
      <ProfileButtons
        isFollowing={isFollowing}
        isPrivate={userProfile.is_private}
        isCurrentUser={userProfile.id === currentUserId}
        onFollow={handleFollow}
      />
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <FlatList
        data={
          activeTab === "Thread"
            ? posts
            : activeTab === "Thread trả lời"
            ? replies
            : []
        }
        renderItem={({ item }: { item: Post }) => (
          <ProfilePost item={item} onPress={handlePostPress} onShare={handleShare} />
        )}
        keyExtractor={(item) => item.id}
        style={styles.postList}
      />
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
            <TouchableOpacity style={styles.settingItem} onPress={() => setShowQR(true)}>
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
            <TouchableOpacity style={styles.settingItem} onPress={() => { setSettingsVisible(false); /* TODO: Đăng xuất */ }}>
              <Icon name="log-out-outline" size={22} color="red" style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: 'red' }]}>Đăng xuất</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => { setSettingsVisible(false); /* TODO: About/giới thiệu */ }}>
              <Icon name="information-circle-outline" size={22} color="#222" style={{ marginRight: 12 }} />
              <Text style={styles.settingText}>Giới thiệu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => setSettingsVisible(false)}>
              <Icon name="close-outline" size={22} color="#222" style={{ marginRight: 12 }} />
              <Text style={styles.settingText}>Đóng</Text>
            </TouchableOpacity>
          </View>
          {/* QR Code Modal */}
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
        </View>
      </Modal>
      {/* Đặt About Modal song song, không lồng trong Modal settings */}
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
