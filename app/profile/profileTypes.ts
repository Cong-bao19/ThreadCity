// All interfaces used in the profile screen

export interface Post {
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
  actualCreatedAt?: Date;
  isLiked?: boolean;
}

export interface Reply {
  id: string;
  username: string;
  handle: string;
  content: string;
  time: string;
  likes: number;
  avatar: string;
  userId: string;
  isLiked?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  link: string;
  is_private: boolean;
  followers: number;
  created_at: string;
}

export interface Tab {
  label: string;
  value: string;
}
