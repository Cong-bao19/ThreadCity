// (tabs)/profile.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Avatar, Button, Divider } from "react-native-elements";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

// Dữ liệu giả lập cho bài đăng
const posts = [
  {
    id: "1",
    username: "Krunal Modi",
    handle: "@kmodi21",
    content: "Hey @zuck where is my verified? 💙",
    time: "50m",
    likes: 2,
    replies: 2,
    avatar: "https://i.pinimg.com/736x/84/a7/fd/84a7fd755368a8f95263ff30f6179632.jpg",
    repliesData: [
      {
        id: "1-1",
        username: "zuck",
        handle: "@zuck",
        content: "Just a sec... 😂",
        time: "50m",
        likes: 0,
        avatar: "https://i.pinimg.com/736x/8e/31/96/8e3196dfb5ec71f62fee496fc6007a77.jpg",
      },
    ],
  },
  {
    id: "2",
    username: "Krunal Modi",
    handle: "@kmodi21",
    content: "Hey @zuck where is my verified? 💙",
    time: "50m",
    likes: 2,
    replies: 2,
    avatar: "https://i.pinimg.com/736x/84/a7/fd/84a7fd755368a8f95263ff30f6179632.jpg",
    repliesData: [
      {
        id: "2-1",
        username: "zuck",
        handle: "@zuck",
        content: "Just a sec... 😂",
        time: "50m",
        likes: 0,
        avatar: "https://i.pinimg.com/736x/8e/31/96/8e3196dfb5ec71f62fee496fc6007a77.jpg",
      },
    ],
  },
];

export default function ProfileScreen() {
  // Hàm điều hướng đến trang Thread khi bấm vào một bài đăng
  const handlePostPress = () => {
    router.push("/thread");
  };

  // Component cho mỗi bài đăng
  const renderPost = ({ item }) => (
    <TouchableOpacity onPress={handlePostPress}>
      <View style={styles.threadItem}>
        {/* Bài đăng chính */}
        <View style={styles.postHeader}>
          <Avatar
            rounded
            source={{ uri: item.avatar }}
            size="medium"
            containerStyle={styles.avatar}
          />
          <View style={styles.postContent}>
            <View style={styles.postUser}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.handle}>{item.handle}</Text>
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
                <Text style={styles.actionText}>{item.replies}</Text>
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

        {/* Phản hồi (replies) */}
        {item.repliesData.map((reply) => (
          <View key={reply.id} style={styles.replyContainer}>
            <Avatar
              rounded
              source={{ uri: reply.avatar }}
              size="medium"
              containerStyle={styles.avatar}
            />
            <View style={styles.postContent}>
              <View style={styles.postUser}>
                <Text style={styles.username}>{reply.username}</Text>
                <Text style={styles.handle}>{reply.handle}</Text>
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

  // Hàm điều hướng đến EditProfile
  const handleEditProfile = () => {
    router.push("/edit");
  };

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
          source={{ uri: "https://i.pinimg.com/736x/e9/f1/ac/e9f1ac1be3e35d62c72f2118af3da92d.jpg" }}
          size="large"
          containerStyle={styles.profileAvatar}
        />
        <View style={styles.profileStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>26</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
        </View>
      </View>

      {/* Username and Handle */}
      <Text style={styles.headerText}>Krunal Modi</Text>
      <Text style={styles.handle}>kmodi21 • threads.net</Text>

      {/* Bio */}
      <Text style={styles.bio}>
        Curious to learn something unique or challenging
      </Text>

      {/* Buttons */}
      <View style={styles.buttons}>
        <Button
          title="Edit profile"
          buttonStyle={styles.button_style}
          titleStyle={styles.buttonText}
          onPress={handleEditProfile}
        />
        <Button
          title="Share profile"
          buttonStyle={styles.button_style}
          titleStyle={styles.buttonText}
        />
      </View>

      {/* Navigation Tabs */}
      <View style={styles.navTabs}>
        <TouchableOpacity style={styles.navTab}>
          <Text style={[styles.navTabText, styles.navTabActive]}>Threads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab}>
          <Text style={styles.navTabText}>Replies</Text>
        </TouchableOpacity>
      </View>

      <Divider style={styles.divider} />

      {/* Threads/Replies Content */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        style={styles.content}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttons : {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    with : '100%'
  },

  button_style: {
    backgroundColor: "white",
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    width: '80%',
    paddingVertical: 5,
  },
  
  buttonText: {
    fontWeight: '100',
    color: 'black',
    textAlign: 'center',
  },

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
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: "#fff",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  navTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 15,
  },
  navTab: {
    marginRight: 20,
  },
  navTabText: {
    fontSize: 16,
    color: "#666",
  },
  navTabActive: {
    fontWeight: "bold",
    color: "#000",
  },
  divider: {
    marginVertical: 10,
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
  handle: {
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
});
