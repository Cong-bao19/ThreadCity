// app/(tabs)/homeUtils.ts
import { supabase } from "@/lib/supabase";
import { Post } from "../home/homeTypes";

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `${diffDays}d`;
  if (diffHr > 0) return `${diffHr}h`;
  if (diffMin > 0) return `${diffMin}m`;
  return 'now';
};

export const createNotification = async (
  userId: string,
  actorId: string,
  postId: string,
  commentId: string | null,
  type: "like" | "comment" | "follow" | "reply" | "like cmt",
  content: string
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

export const fetchPosts = async (userId: string | null): Promise<Post[]> => {
  if (!userId) return [];
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(`
      id,
      user_id,
      content,
      created_at,
      image_url,
      comments (count),
      likes (count),
      reposts (count)
    `)
    .order("created_at", { ascending: false });
  if (postsError) {
    console.error("Error fetching posts:", postsError);
    return [];
  }
  const postIds = postsData.map((post: any) => post.id);
  const { data: commentsData, error: commentsError } = await supabase
    .from("comments")
    .select(`id, user_id, post_id, content, created_at`)
    .in("post_id", postIds)
    .order("created_at", { ascending: false });
  if (commentsError) {
    console.error("Error fetching comments:", commentsError);
    return [];
  }
  const commentsByPostId: { [key: string]: any[] } = {};
  commentsData.forEach((comment: any) => {
    if (!commentsByPostId[comment.post_id]) commentsByPostId[comment.post_id] = [];
    if (commentsByPostId[comment.post_id].length < 2) commentsByPostId[comment.post_id].push(comment);
  });
  const userIds = [
    ...postsData.map((post: any) => post.user_id),
    ...commentsData.map((comment: any) => comment.user_id)
  ];
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
  const { data: likesData, error: likesError } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  if (likesError) {
    console.error("Error checking like status for posts:", likesError);
    return [];
  }
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
