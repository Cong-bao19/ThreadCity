// PostItem component for HomeScreen
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './HomeScreenStyles';
import { Post } from './homeTypes';

interface PostItemProps {
  item: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onRepost: (postId: string) => void;
  onProfilePress: (username: string) => void;
  onMore: (postId: string) => void;
  renderComment: (comment: any, index: number, isLastComment: boolean) => React.ReactNode;
}

const PostItem: React.FC<PostItemProps> = ({
  item,
  onLike,
  onComment,
  onRepost,
  onProfilePress,
  onMore,
  renderComment,
}) => (
  <TouchableOpacity
    onPress={() => onComment(item.id)}
    style={styles.postItem}
    activeOpacity={0.7}
  >
    <TouchableOpacity onPress={() => onProfilePress(item.username)} style={styles.avatarContainer} activeOpacity={0.8}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.verticalLine} />
    </TouchableOpacity>
    <View style={styles.postContent}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">{item.username}</Text>
          <Text style={styles.dotSeparator}>·</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <TouchableOpacity onPress={() => onMore(item.id)} hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
          <Icon name="ellipsis-horizontal" size={16} color="#888" />
        </TouchableOpacity>
      </View>
      <Text style={styles.content}>
        {item.content.split(" ").map((word, index) =>
          word.startsWith("@") ? (
            <Text key={index} style={styles.mention}>
              {word}{" "}
            </Text>
          ) : (
            <Text key={index}>{word} </Text>
          )
        )}
      </Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onLike(item.id)} hitSlop={{top: 10, right: 5, bottom: 10, left: 5}}>
          {item.isLiked ? (
            <Icon name="heart" size={18} color="#ff3141" />
          ) : (
            <Icon name="heart-outline" size={18} color="#555" />
          )}
        </TouchableOpacity>
        {item.likes > 0 && (
          <Text style={styles.actionCount}>{item.likes}</Text>
        )}
        <TouchableOpacity onPress={() => onComment(item.id)} hitSlop={{top: 10, right: 5, bottom: 10, left: 5}}>
          <Icon name="chatbubble-outline" size={18} color="#555" />
        </TouchableOpacity>
        {item.replies > 0 && (
          <Text style={styles.actionCount}>{item.replies}</Text>
        )}
        <TouchableOpacity onPress={() => onRepost(item.id)} hitSlop={{top: 10, right: 5, bottom: 10, left: 5}}>
          {item.isReposted ? (
            <Icon name="repeat" size={18} color="#555" />
          ) : (
            <Icon name="repeat-outline" size={18} color="#555" />
          )}
        </TouchableOpacity>
        {item.reposts > 0 && (
          <Text style={styles.actionCount}>{item.reposts}</Text>
        )}
        <TouchableOpacity hitSlop={{top: 10, right: 5, bottom: 10, left: 5}}>
          <Icon name="paper-plane-outline" size={18} color="#555" />
        </TouchableOpacity>
      </View>
      {item.comments && Array.isArray(item.comments) && item.comments.length > 0 && (
        <View style={styles.commentsContainer}>
          {item.comments.map((comment, index) => 
            React.cloneElement(
              renderComment(comment, index, index === item.comments.length - 1) as React.ReactElement,
              { key: comment.id || index }
            )
          )}
        </View>
      )}
    </View>
  </TouchableOpacity>
);

export default PostItem;
