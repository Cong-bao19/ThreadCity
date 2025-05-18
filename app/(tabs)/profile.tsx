import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar, Divider } from "react-native-elements";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";

// Định nghĩa interface cho bài đăng và bình luận
interface Post {
  id: string;
  username: string;
  handle: string;
  content: string;
  time: string;
  likes: number;
  replies: number;
  avatar: string;
  userId: string;
  repliesData: Reply[];
  image_url?: string;
  isRepost?: boolean;
  repostedBy?: string;
  repostedTime?: string;
  repostedId?: string;
  actualCreatedAt: Date; // Thời gian thực tế để sắp xếp (thời gian repost hoặc thời gian đăng bài)
}

interface Reply {
  id: string;
  username: string;
  handle: string;
  content: string;
  time: string;
  likes: number;
  avatar: string;
  userId: string;
}

interface ProfileData {
  id: string; // Thêm id để xác định chủ tài khoản
  username: string;
  avatar_url: string;
  bio: string;
  followersCount: number;
  infor_url: string; // Đường dẫn QR code
}

export default function ProfileScreen() {
  const { userId: targetUserId } = useLocalSearchParams();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Threads" | "Replies">("Threads");
  const [loading, setLoading] = useState(true);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false); // State để điều khiển modal QR
  const [isDeleting, setIsDeleting] = useState(false); // State để kiểm soát trạng thái xóa
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState(false); // State để kiểm soát trạng thái follow

  // Always get the logged-in userId on mount
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // console.log('Current logged in userId:', user.id);
      }
    };
    fetchUser();
  }, []);


  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  useEffect(() => {
    if (targetUserId) {
      setProfileUserId(targetUserId as string);
    } else if (userId) {
      setProfileUserId(userId);
    }
  }, [targetUserId, userId]);

  // Tải thông tin hồ sơ và số lượng followers
  const fetchProfileData = async () => {
    if (!profileUserId) {
      console.error("No profileUserId provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, infor_url") // Thêm id vào select
        .eq("id", profileUserId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      const { count: followersCount, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileUserId);

      if (followersError) {
        console.error("Error fetching followers count:", followersError);
        return;
      }
      
      setProfileData({
        id: profileData.id,
        username: profileData.username || "Unknown",
        avatar_url: profileData.avatar_url || "https://via.placeholder.com/80",
        bio: profileData.bio || "No bio available",
        followersCount: followersCount || 0,
        infor_url: profileData.infor_url || "",
      });

      // Kiểm tra trạng thái follow sau khi tải xong dữ liệu hồ sơ
      if (userId && profileData.id) {
        const { data: follow, error } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', userId)
          .eq('following_id', profileData.id)
          .single();
        setIsFollowing(!!follow);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Tải danh sách bài đăng
  const fetchPosts = async () => {
    if (!profileUserId) return;

    try {
      setRefreshing(true);
      
      // Lấy bài đăng của người dùng
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
        .eq("user_id", profileUserId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        return;
      }

      // Lấy thông tin repost của người dùng
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
        .eq("user_id", profileUserId)
        .order("created_at", { ascending: false });

      if (repostsError) {
        console.error("Error fetching reposts:", repostsError);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", profileUserId)
        .single();

      if (profileError) {
        console.error("Error fetching profile for posts:", profileError);
        return;
      }

      // Lấy tất cả id bài viết để truy vấn comments
      const ownPostIds = postsData.map((post: any) => post.id);
      const repostPostIds = repostsData
        .filter((repost: any) => repost.posts)
        .map((repost: any) => repost.posts.id);

      const allPostIds = [...ownPostIds, ...repostPostIds];

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
      
      if (repostedProfilesError) {
        console.error("Error fetching profiles for reposts:", repostedProfilesError);
        return;
      }

      const repostedProfilesMap = repostedProfiles.reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Lấy comments cho tất cả các bài viết
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

      const now = new Date(); // Sử dụng thời gian hiện tại

      // Format bài đăng của người dùng
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
          image_url: post.image_url || undefined,
          isRepost: false,
          actualCreatedAt: createdAt, // Thời gian đăng bài thực tế
          repliesData: postComments.map((comment: any) => {
            const profile = profilesMap[comment.user_id] || {};
            const commentTime = new Date(comment.created_at);
            const diffInMsComment = now.getTime() - commentTime.getTime();
            const diffInMinutesComment = Math.floor(
              diffInMsComment / (1000 * 60)
            );
            const diffInHoursComment = Math.floor(
              diffInMsComment / (1000 * 60 * 60)
            );
            const diffInDaysComment = Math.floor(
              diffInMsComment / (1000 * 60 * 60 * 24)
            );

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
            };
          }),
        };
      });

      // Format bài repost của người dùng
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
            image_url: post.image_url || undefined,
            isRepost: true,
            repostedBy: profileData.username || "Unknown",
            repostedTime,
            repostedId: repost.id,
            actualCreatedAt: repostCreatedAt, // Thời gian repost thực tế (không phải thời gian đăng bài gốc)
            repliesData: postComments.map((comment: any) => {
              const profile = profilesMap[comment.user_id] || {};
              const commentTime = new Date(comment.created_at);
              const diffInMsComment = now.getTime() - commentTime.getTime();
              const diffInMinutesComment = Math.floor(
                diffInMsComment / (1000 * 60)
              );
              const diffInHoursComment = Math.floor(
                diffInMsComment / (1000 * 60 * 60)
              );
              const diffInDaysComment = Math.floor(
                diffInMsComment / (1000 * 60 * 60 * 24)
              );

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
              };
            }),
          };
        });

      // Kết hợp và sắp xếp tất cả bài viết theo thời gian thực tế (actualCreatedAt)
      const allPosts = [...formattedOwnPosts, ...formattedReposts].sort((a, b) => {
        return b.actualCreatedAt.getTime() - a.actualCreatedAt.getTime();
      });

      setPosts(allPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Tải danh sách bình luận của người dùng (cho tab Replies)
  const fetchReplies = async () => {
    if (!userId) return;

    try {
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

      if (commentsError) {
        console.error("Error fetching replies:", commentsError);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile for replies:", profileError);
        return;
      }

      const now = new Date(); // Sử dụng thời gian hiện tại

      const formattedReplies: Reply[] = commentsData.map((comment: any) => {
        const createdAt = new Date(comment.created_at);
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

      setReplies(formattedReplies);
    } catch (error) {
      console.error("Error fetching replies:", error);
    } finally {
      setLoading(false);
    }
  };

  // In useEffect, fetch profile by profileUserId
  useEffect(() => {
    if (profileUserId) {
      fetchProfileData();
      fetchPosts();
      fetchReplies();
    }
  }, [profileUserId]);

  const handlePostPress = (postId: string) => {
    router.push(`/thread/${postId}`);
  };

  const handleProfilePress = (targetUserId: string) => {
    router.push({
      pathname: "/(tabs)/profile",
      params: { userId: targetUserId },
    });
  };

  const handleShareProfile = () => {
    if (!profileData || !profileData.infor_url) {
      console.error("No QR code URL available");
      return;
    }
    setIsQrModalVisible(true); // Hiển thị modal khi bấm Share profile
  };

  // Hàm xử lý xóa bài viết
  const handleDeletePost = async (postId: string, isRepost: boolean = false, repostId?: string) => {
    if (!userId) return;
    
    try {
      setIsDeleting(true);
      
      if (isRepost && repostId) {
        // Nếu là repost thì chỉ xóa repost không xóa bài gốc
        const { error: deleteRepostError } = await supabase
          .from("reposts")
          .delete()
          .eq("id", repostId);
        
        if (deleteRepostError) {
          console.error("Error deleting repost:", deleteRepostError);
          Alert.alert("Lỗi", "Không thể xóa repost");
          return;
        }
      } else {
        // Nếu là bài đăng gốc
        // Xóa tất cả comments liên quan đến bài viết
        const { error: commentsError } = await supabase
          .from("comments")
          .delete()
          .eq("post_id", postId);
        
        if (commentsError) {
          console.error("Error deleting comments:", commentsError);
          Alert.alert("Lỗi", "Không thể xóa các bình luận của bài viết");
          return;
        }
        
        // Xóa tất cả likes liên quan đến bài viết
        const { error: likesError } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId);
        
        if (likesError) {
          console.error("Error deleting likes:", likesError);
          Alert.alert("Lỗi", "Không thể xóa các lượt thích của bài viết");
          return;
        }

        // Xóa tất cả reposts liên quan đến bài viết
        const { error: repostsError } = await supabase
          .from("reposts")
          .delete()
          .eq("post_id", postId);
        
        if (repostsError) {
          console.error("Error deleting reposts:", repostsError);
          Alert.alert("Lỗi", "Không thể xóa các lượt repost của bài viết");
          return;
        }
        
        // Xóa bài viết
        const { error: postError } = await supabase
          .from("posts")
          .delete()
          .eq("id", postId);
        
        if (postError) {
          console.error("Error deleting post:", postError);
          Alert.alert("Lỗi", "Không thể xóa bài viết");
          return;
        }
      }
      
      // Cập nhật lại danh sách bài viết
      setPosts(posts.filter(post => {
        if (isRepost && repostId) {
          return post.repostedId !== repostId;
        } else {
          return post.id !== postId;
        }
      }));
      
      Alert.alert("Thành công", isRepost ? "Đã bỏ repost bài viết" : "Bài viết đã được xóa");
      
    } catch (error) {
      console.error("Error deleting post:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi xóa bài viết");
    } finally {
      setIsDeleting(false);
    }
  };

  // Hàm xử lý hiển thị dialog xác nhận xóa
  const showDeleteConfirmation = (post: Post) => {
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
          onPress: () => handleDeletePost(post.id, post.isRepost, post.repostedId),
          style: "destructive"
        }
      ]
    );
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => handlePostPress(item.id)}>
      <View style={styles.threadItem}>
        {item.isRepost && (
          <View style={styles.repostHeader}>
            <Icon name="repeat" size={14} color="#666" style={{marginRight: 5}} />
            <Text style={styles.repostText}>{item.repostedBy} reposted</Text>
            <Text style={styles.repostTime}> • {item.repostedTime}</Text>
          </View>
        )}
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => handleProfilePress(item.userId)}>
            <Avatar
              rounded
              source={{ uri: item.avatar }}
              size="medium"
              containerStyle={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.postContent}>
            <View style={styles.postUser}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.postHandle}>{item.handle}</Text>
              <Text style={styles.time}> • {item.time}</Text>
              <TouchableOpacity
                onPress={() => showDeleteConfirmation(item)}
                disabled={isDeleting}
              >
                <Icon
                  name="ellipsis-horizontal"
                  size={16}
                  color="#666"
                  style={styles.postMenu}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.threadText}>{item.content}</Text>
            
            {/* Hiển thị ảnh nếu có */}
            {item.image_url && (
              <Image 
                source={{ uri: item.image_url }} 
                style={styles.postImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="heart-outline" size={20} color="#000" />
                <Text style={styles.actionText}>{item.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="chatbubble-outline" size={20} color="#000" />
                <Text style={styles.actionText}>{item.replies}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name={item.isRepost ? "repeat" : "repeat-outline"} size={20} color={item.isRepost ? "#00aa00" : "#000"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="share-outline" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {item.repliesData.map((reply) => (
          <View key={reply.id} style={styles.replyContainer}>
            <TouchableOpacity onPress={() => handleProfilePress(reply.userId)}>
              <Avatar
                rounded
                source={{ uri: reply.avatar }}
                size="medium"
                containerStyle={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.postContent}>
              <View style={styles.postUser}>
                <Text style={styles.username}>{reply.username}</Text>
                <Text style={styles.postHandle}>{reply.handle}</Text>
                <Text style={styles.time}> • {reply.time}</Text>
                <TouchableOpacity>
                  <Icon
                    name="ellipsis-horizontal"
                    size={16}
                    color="#666"
                    style={styles.postMenu}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.threadText}>{reply.content}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="heart-outline" size={20} color="#000" />
                  <Text style={styles.actionText}>{reply.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="chatbubble-outline" size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="repeat-outline" size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="share-outline" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderReply = ({ item }: { item: Reply }) => (
    <View style={styles.threadItem}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => handleProfilePress(item.userId)}>
          <Avatar
            rounded
            source={{ uri: item.avatar }}
            size="medium"
            containerStyle={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.postContent}>
          <View style={styles.postUser}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.postHandle}>{item.handle}</Text>
            <Text style={styles.time}> • {item.time}</Text>
            <TouchableOpacity>
              <Icon
                name="ellipsis-horizontal"
                size={16}
                color="#666"
                style={styles.postMenu}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.threadText}>{item.content}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="heart-outline" size={20} color="#000" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="chatbubble-outline" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="repeat-outline" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="share-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const handleEditProfile = () => {
    router.push("/edit");
  };

  // Handle refresh when pulling down the FlatList
  const handleRefresh = () => {
    setRefreshing(true);
    if (userId) {
      fetchProfileData();
      fetchPosts();
      fetchReplies();
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // console.log("profileData: " , profileData);
  if (!profileData) {
    
    return (
      <SafeAreaView style={styles.container}>
        <Text>Profile not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="globe-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="menu-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Avatar
          rounded
          source={{ uri: profileData.avatar_url }}
          size="large"
          containerStyle={styles.profileAvatar}
        />
        <View style={styles.profileStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profileData.followersCount}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
        </View>
      </View>

      {/* Username and Handle */}
      <Text style={styles.headerText}>{profileData.username}</Text>
      <Text
        style={styles.handle}
      >{`@${profileData.username} • threads.net`}</Text>

      {/* Bio */}
      <Text style={styles.bio}>{profileData.bio}</Text>

      {/* Buttons */}
      {userId === profileData.id ? (
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
            <Text style={styles.buttonText}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleShareProfile}>
            <Text style={styles.buttonText}>Share profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 15, gap: 10}}>
          <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isFollowing ? '#fff' : '#000', // Đã follow: nền trắng, chưa follow: nền đen
                  borderColor: '#000',
                  flex: 1,
                },
              ]}
            onPress={async () => {
              if (!userId || !profileData?.id) {
                console.log('Thiếu userId hoặc profileData.id', { userId, profileId: profileData?.id });
                return;
              }
              try {
                console.log('Bấm nút Follow/Unfollow:', { isFollowing, userId, profileId: profileData.id });
                // Optimistic update
                setIsFollowing((prev) => !prev);
                setProfileData((prev) => prev ? {
                  ...prev,
                  followersCount: prev.followersCount + (isFollowing ? -1 : 1)
                } : prev);
                let apiError = null;
                if (isFollowing) {
                  // Unfollow
                  const { data: existingFollow, error: selectErr } = await supabase
                    .from('follows')
                    .select('id')
                    .eq('follower_id', userId)
                    .eq('following_id', profileData.id)
                    .single();
                  console.log('Kết quả kiểm tra follow:', existingFollow, selectErr);
                  if (existingFollow) {
                    const { error: deleteErr } = await supabase.from('follows').delete().eq('id', existingFollow.id);
                    console.log('Kết quả xoá follow:', deleteErr);
                    apiError = deleteErr;
                  }
                } else {
                  // Follow
                  const { error: insertErr } = await supabase
                    .from('follows')
                    .insert({ follower_id: userId, following_id: profileData.id });
                  console.log('Kết quả insert follow:', insertErr);
                  apiError = insertErr;
                }
                if (apiError) {
                  // Revert optimistic update
                  setIsFollowing((prev) => !prev);
                  setProfileData((prev) => prev ? {
                    ...prev,
                    followersCount: prev.followersCount + (isFollowing ? 1 : -1)
                  } : prev);
                  Alert.alert('Error', 'Follow error: ' + apiError.message);
                }
              } catch (err) {
                // Revert optimistic update
                setIsFollowing((prev) => !prev);
                setProfileData((prev) => prev ? {
                  ...prev,
                  followersCount: prev.followersCount + (isFollowing ? 1 : -1)
                } : prev);
                console.error('Follow error:', err);
                Alert.alert('Error', 'Follow error: ' + err);
              }
            }}
          >
             <Text style={[
            styles.buttonText,
            { color: isFollowing ? '#000' : '#fff' } // Đã follow: chữ đen, chưa follow: chữ trắng
          ]}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Text>
          </TouchableOpacity>
 <TouchableOpacity
  style={[styles.button, {backgroundColor: '#fff', borderColor: '#000', flex: 1}]}
  onPress={() => {
    if (!profileData?.infor_url) return;
    setIsQrModalVisible(true); // Hiển thị modal QR code
  }}
>
  <Text style={[styles.buttonText, {color: '#000'}]}>QR Contact</Text>
</TouchableOpacity>
        </View>
      )}

      {/* Navigation Tabs */}
      <View style={styles.navTabs}>
  <TouchableOpacity
    style={styles.navTab}
    onPress={() => setActiveTab("Threads")}
  >
    <Text
      style={[
        styles.navTabText,
        activeTab === "Threads" && styles.navTabActive,
      ]}
    >
      Threads
    </Text>
    {activeTab === "Threads" && <View style={styles.underline} />}
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.navTab}
    onPress={() => setActiveTab("Replies")}
  >
    <Text
      style={[
        styles.navTabText,
        activeTab === "Replies" && styles.navTabActive,
      ]}
    >
      Replies
    </Text>
    {activeTab === "Replies" && <View style={styles.underline} />}
  </TouchableOpacity>
</View>

      <Divider style={styles.divider} />

      {/* Threads/Replies Content */}
      {activeTab === "Threads" ? (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => (item.isRepost ? `repost-${item.repostedId}` : item.id)}
          style={styles.content}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No threads yet</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={replies}
          renderItem={renderReply}
          keyExtractor={(item) => item.id}
          style={styles.content}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No replies yet</Text>
            </View>
          }
        />
      )}

      {/* Modal hiển thị QR code */}
      <Modal
        visible={isQrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsQrModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile QR Code</Text>
            {profileData.infor_url ? (
              <Image
                source={{ uri: profileData.infor_url }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.errorText}>QR code not available</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsQrModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 16,
  },
  handle: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 16,
    marginTop: 5,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
    justifyContent: "space-between",
  },
  profileAvatar: {
    width: 80,
    height: 80,
  },
  profileStats: {
    flexDirection: "row",
  },
  stat: {
    alignItems: "center",
    marginRight: 16,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  bio: {
    fontSize: 16,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 15,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  navTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "flex-end",
    height: 38,
    marginTop: 0,
    justifyContent: "center",
  },
  navTab: {
    marginRight: 70, 
    alignItems: "center",
    justifyContent: "flex-end",
    height: 38, // giống navTabs
  },
  navTabText: {
    margin:10,
    fontSize: 16,
    color: "#666",
  },
  navTabActive: {
    fontWeight: "thin",
    color: "#000",
  },
  underline: {
    height: 3,
    backgroundColor: "#000",
    borderRadius: 2,
    width: 70,
    marginTop: 0,
    marginBottom: -1,
    alignSelf: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 1,
  },
  content: {
    flex: 1,
  },
  threadItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  postHeader: {
    flexDirection: "row",
  },
  avatar: {
    width: 50,
    height: 50,
  },
  postContent: {
    flex: 1,
    marginLeft: 10,
  },
  postUser: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  postHandle: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  time: {
    fontSize: 14,
    color: "#666",
  },
  postMenu: {
    marginLeft: 5,
  },
  threadText: {
    fontSize: 16,
    marginTop: 5,
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#666",
  },
  replyContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginLeft: 60,
  },
  // Styles cho modal QR code
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#3897f0",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  repostHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 58,
  },
  repostText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  repostTime: {
    fontSize: 12,
    color: "#888",
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
