// Types for HomeScreen (moved from (tabs)/homeTypes.ts)
export interface Post {
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
