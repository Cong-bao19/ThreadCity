// CommentItem component for HomeScreen
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import styles from './HomeScreenStyles';

interface CommentItemProps {
  comment: any;
  index: number;
  isLastComment: boolean;
  onProfilePress: (username: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, index, isLastComment, onProfilePress }) => (
  <View key={comment.id} style={styles.commentContainer}>
    <TouchableOpacity onPress={() => onProfilePress(comment.username)} style={styles.commentAvatarContainer}>
      <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
      {!isLastComment && <View style={styles.commentVerticalLine} />}
    </TouchableOpacity>
    <View style={styles.commentContent}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentUsername} numberOfLines={1} ellipsizeMode="tail">
          {comment.username}
        </Text>
        <Text style={styles.commentTime}>{comment.time}</Text>
      </View>
      <Text style={styles.commentText} numberOfLines={2} ellipsizeMode="tail">
        {comment.content}
      </Text>
      <View style={styles.commentActions}>
        <Text>{/* Like icon placeholder */}</Text>
      </View>
    </View>
  </View>
);

export default CommentItem;
