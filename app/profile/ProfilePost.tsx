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

const ProfilePost: React.FC<ProfilePostProps> = ({ 
  item, 
  onPress, 
  onShare,
  onLike,
  onProfilePress,
  onDeletePost
}) => (
  <TouchableOpacity onPress={() => onPress(item.id)}>
    <View style={styles.threadItem}>
      {item.isRepost && (
        <View style={styles.repostHeader}>
          <Icon name="repeat" size={14} color="#666" style={{marginRight: 5}} />
          <Text style={styles.repostText}>{item.repostedBy} reposted</Text>
          <Text style={styles.repostTime}> • {item.repostedTime}</Text>
        </View>
      )}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onProfilePress && onProfilePress(item.userId)}>
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
            <TouchableOpacity onPress={() => onDeletePost && onDeletePost(item)}>
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
            <TouchableOpacity style={styles.actionButton} onPress={() => onLike && onLike(item.id)}>
              <Icon name={item.isLiked ? "heart" : "heart-outline"} size={20} color={item.isLiked ? "#e63946" : "#000"} />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="chatbubble-outline" size={20} color="#000" />
              <Text style={styles.actionText}>{item.replies}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name={item.isRepost ? "repeat" : "repeat-outline"} size={20} color={item.isRepost ? "#00aa00" : "#000"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => onShare(item)}>
              <Icon name="share-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {item.repliesData && item.repliesData.length > 0 && item.repliesData.map((reply) => (
        <View key={reply.id} style={styles.replyContainer}>
          <TouchableOpacity onPress={() => onProfilePress && onProfilePress(reply.userId)}>
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

export default ProfilePost;
