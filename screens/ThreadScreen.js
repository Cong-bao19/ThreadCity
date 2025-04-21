// (tabs)/Thread.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

// Dữ liệu giả lập: Bài viết chính và bình luận
const mainPost = {
  id: "1",
  username: "krunal_modi",
  content: "Hey @zuck where is my verified?",
  time: "50m",
  avatar: "https://via.placeholder.com/40",
  replies: 546,
  likes: 10700,
  isLiked: true,
};

const comments = [
  {
    id: "2",
    username: "zuck",
    content: "Just a sec... 😂",
    time: "50m",
    avatar: "https://via.placeholder.com/40",
    isLiked: true,
  },
  {
    id: "3",
    username: "narendra_modi",
    content: "Welcome Modi ji! 🙏",
    time: "50m",
    avatar: "https://via.placeholder.com/40",
    isLiked: true,
  },
  {
    id: "4",
    username: "shakira",
    content: "Welcome Krunal :-)",
    time: "50m",
    avatar: "https://via.placeholder.com/40",
    isLiked: true,
  },
  {
    id: "5",
    username: "figma",
    content: "Welcome MY FRIEND 😍",
    time: "50m",
    avatar: "https://via.placeholder.com/40",
    isLiked: true,
  },
];

export default function Thread() {
  const handleBack = () => {
    router.back(); // Quay lại trang trước
  };

  const handleLike = (threadId) => {
    console.log("Liked thread:", threadId);
  };

  const handleComment = (threadId) => {
    console.log("Comment on thread:", threadId);
  };

  const handleShare = (threadId) => {
    console.log("Share thread:", threadId);
  };

  const handleMore = (threadId) => {
    console.log("More options for thread:", threadId);
  };

  // Component hiển thị bài viết chính hoặc bình luận
  const renderThreadItem = (item, isMainPost = false) => (
    <View style={[styles.threadItem, !isMainPost && styles.commentItem]}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.threadContent}>
        <Text style={styles.username}>{item.username}</Text>
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
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleLike(item.id)}>
            <Icon
              name={item.isLiked ? "heart" : "heart-outline"}
              size={20}
              color={item.isLiked ? "#ff0000" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleComment(item.id)}>
            <Icon name="chatbubble-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item.id)}>
            <Icon name="share-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleMore(item.id)}>
            <Icon name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        {isMainPost && (
          <Text style={styles.stats}>
            {item.replies > 0 ? `${item.replies} replies` : ""}
            {item.replies > 0 && item.likes > 0 ? " • " : ""}
            {item.likes > 0 ? `${(item.likes / 1000).toFixed(1)}K likes` : ""}
          </Text>
        )}
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Thread</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={[mainPost, ...comments]} // Kết hợp bài viết chính và bình luận
        renderItem={
          ({ item, index }) => renderThreadItem(item, index === 0) // Bài đầu tiên là bài viết chính
        }
        keyExtractor={(item) => item.id}
        style={styles.threadList}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  threadList: {
    flex: 1,
  },
  threadItem: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  commentItem: {
    marginLeft: 50, // Thụt lề cho bình luận
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  threadContent: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: "bold",
  },
  content: {
    fontSize: 14,
    marginTop: 2,
  },
  mention: {
    color: "#3897f0",
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    marginTop: 5,
    gap: 15,
  },
  stats: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  time: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
  },
});
