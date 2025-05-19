import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './profileStyles';

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
  repliesData: any[];
  image_url?: string;
  isRepost?: boolean;
  repostedBy?: string;
  repostedTime?: string;
  repostedId?: string;
  isLiked?: boolean;
}

interface ProfilePostProps {
  item: Post;
  onPress: (id: string) => void;
  onShare: (post: Post) => void;
  onLike?: (id: string) => void;
  onProfilePress?: (userId: string) => void;
  onDeletePost?: (post: Post) => void;
}

// Helper component for action buttons with labels
const IconWithLabel = ({ 
  name, 
  label, 
  color = "#000", 
  onPress, 
  accessibilityLabel 
}: { 
  name: string; 
  label: string | number; 
  color?: string; 
  onPress?: () => void; 
  accessibilityLabel: string;
}) => (  <TouchableOpacity 
    style={styles.actionButton} 
    onPress={onPress} 
    accessibilityLabel={accessibilityLabel}
    disabled={!onPress}
  >
    <Icon name={name} size={20} color={color} />
    <Text style={styles.actionText}>{typeof label === 'number' ? String(label) : label}</Text>
  </TouchableOpacity>
);

const ProfilePost: React.FC<ProfilePostProps> = ({ 
  item, 
  onPress, 
  onShare,
  onLike,
  onProfilePress,
  onDeletePost
}) => {
  // Ensure all values are strings or have defaults
  const username = item.username || '';
  const handle = item.handle || '';
  const time = item.time || '';
  const content = item.content || '';
  const likes = item.likes || 0;
  const replies = item.replies || 0;
  const avatar = item.avatar || 'https://via.placeholder.com/40';
  const repostedBy = item.repostedBy || '';
  const repostedTime = item.repostedTime || '';
  
  return (
    <TouchableOpacity onPress={() => onPress(item.id)}>
      <View style={styles.threadItem}>
        {item.isRepost && (
          <View style={styles.repostHeader}>
            <Icon name="repeat" size={14} color="#666" style={{marginRight: 5}} />
            <Text style={styles.repostText}>
              {repostedBy} <Text>reposted</Text>
            </Text>
            <Text style={styles.repostTime}> • {repostedTime}</Text>
          </View>
        )}
        
        <View style={styles.postHeader}>
          <TouchableOpacity 
            onPress={() => onProfilePress && onProfilePress(item.userId)}
            accessibilityLabel={`${username}'s profile picture`}
          >
            <Avatar
              rounded
              source={{ uri: avatar }}
              size="medium"
              containerStyle={styles.avatar}
            />
          </TouchableOpacity>
          
          <View style={styles.postContent}>
            <View style={styles.postUser}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.postHandle}>{handle}</Text>
              <Text style={styles.time}> • {time}</Text>
              <TouchableOpacity 
                onPress={() => onDeletePost && onDeletePost(item)}
                accessibilityLabel="Post options"
              >
                <Icon
                  name="ellipsis-horizontal"
                  size={16}
                  color="#666"
                  style={styles.postMenu}
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.threadText}>{content}</Text>
            
            {item.image_url && (
              <Image 
                source={{ uri: item.image_url }} 
                style={styles.postImage}
                resizeMode="cover"
                accessibilityLabel="Post image"
              />
            )}

            <View style={styles.actions}>
              <IconWithLabel 
                name={item.isLiked ? "heart" : "heart-outline"}
                label={likes}
                color={item.isLiked ? "#e63946" : "#000"}
                onPress={() => onLike && onLike(item.id)}
                accessibilityLabel="Like post"
              />
              
              <IconWithLabel 
                name="chatbubble-outline"
                label={replies}
                accessibilityLabel="View replies"
              />
              
              <IconWithLabel 
                name={item.isRepost ? "repeat" : "repeat-outline"}
                label="Repost"
                color={item.isRepost ? "#00aa00" : "#000"}
                accessibilityLabel="Repost"
              />
                <IconWithLabel 
                name="share-outline"
                label="Share"
                onPress={() => onShare(item)}
                accessibilityLabel="Share post"
              />
            </View>
        </View>
      </View>

      {item.repliesData && item.repliesData.length > 0 && item.repliesData.map((reply) => {
        // Ensure all reply values are strings or have defaults
        const replyUsername = reply.username || '';
        const replyHandle = reply.handle || '';
        const replyTime = reply.time || '';
        const replyContent = reply.content || '';
        const replyLikes = reply.likes || 0;
        const replyAvatar = reply.avatar || 'https://via.placeholder.com/40';
        
        return (
          <View key={reply.id} style={styles.replyContainer}>
            <TouchableOpacity 
              onPress={() => onProfilePress && onProfilePress(reply.userId)}
              accessibilityLabel={`${replyUsername}'s profile picture`}
            >
              <Avatar
                rounded
                source={{ uri: replyAvatar }}
                size="medium"
                containerStyle={styles.avatar}
              />
            </TouchableOpacity>
            
            <View style={styles.postContent}>
              <View style={styles.postUser}>
                <Text style={styles.username}>{replyUsername}</Text>
                <Text style={styles.postHandle}>{replyHandle}</Text>
                <Text style={styles.time}> • {replyTime}</Text>
                <TouchableOpacity accessibilityLabel="Reply options">
                  <Icon
                    name="ellipsis-horizontal"
                    size={16}
                    color="#666"
                    style={styles.postMenu}
                  />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.threadText}>{replyContent}</Text>
              
              <View style={styles.actions}>
                <IconWithLabel 
                  name="heart-outline"
                  label={replyLikes}
                  accessibilityLabel="Like reply"
                />
                
                <IconWithLabel 
                  name="chatbubble-outline"
                  label="Reply"
                  accessibilityLabel="Reply to comment"
                />
                
                <IconWithLabel 
                  name="repeat-outline"
                  label="Repost"
                  accessibilityLabel="Repost reply"
                />
                
                <IconWithLabel 
                  name="share-outline"
                  label="Share"
                  accessibilityLabel="Share reply"
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  </TouchableOpacity>
  );
};

export default ProfilePost;
