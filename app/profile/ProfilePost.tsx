import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
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
}

interface ProfilePostProps {
  item: Post;
  onPress: (id: string) => void;
  onShare: (post: Post) => void;
}

const ProfilePost: React.FC<ProfilePostProps> = ({ item, onPress, onShare }) => (
  <TouchableOpacity onPress={() => onPress(item.id)}>
    <View style={styles.postItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.postContent}>
        <View style={styles.headerRow}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Text style={styles.content}>{item.content}</Text>
        <View style={styles.actions}>
          <TouchableOpacity>
            <Icon name="heart-outline" size={20} color="#666" />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.actionText}>{item.replies}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onShare(item)}>
            <Icon name="share-outline" size={20} color="#666" />
            <Text style={styles.actionText}>0</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

export default ProfilePost;
