// (tabs)/ActivityScreen.js
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

const notifications = [
  {
    id: "1",
    username: "ma_dhoni",
    action: "followed you",
    time: "2d",
    avatar: "https://i.pinimg.com/736x/d8/97/53/d897539843e94e4a8516fb2df0177161.jpg",
    followStatus: "Follow",
  },
  {
    id: "2",
    username: "ankurwarikoo",
    action: "followed you",
    time: "2d",
    avatar: "https://i.pinimg.com/736x/bf/a7/08/bfa708caa12973ce5d3bb4859121ebbb.jpg",
    followStatus: "Follow",
  },
  {
    id: "3",
    username: "narendra_modi",
    action: "liked your photo",
    time: "3d",
    avatar: "https://i.pinimg.com/736x/81/13/11/811311b86edb1c5184c72c982023fb43.jpg",
    followStatus: "Follow",
  },
  {
    id: "4",
    username: "marendra_modi",
    action: "200k",
    time: "2d",
    avatar: "https://i.pinimg.com/736x/57/46/01/5746011f96448dcc7f915e56e4115c7c.jpg",
    followStatus: "Follow",
  },
  {
    id: "5",
    username: "zuek",
    action: "liked your photo",
    time: "2d",
    avatar: "https://i.pinimg.com/736x/a9/8e/cc/a98eccfe76055d13ce65ed89f8cdc938.jpg",
    followStatus: "Follow",
  },
  {
    id: "6",
    username: "zuek",
    action: "followed you",
    time: "2d",
    avatar: "https://i.pinimg.com/736x/a9/8e/cc/a98eccfe76055d13ce65ed89f8cdc938.jpg",
    followStatus: "Follow",
  },
  {
    id: "7",
    username: "zuek",
    action: "liked your photo",
    time: "2d",
    avatar: "https://i.pinimg.com/736x/a9/8e/cc/a98eccfe76055d13ce65ed89f8cdc938.jpg",
    followStatus: "Follow",
  },
  {
    id: "8",
    username: "elon_musk",
    action: "followed you",
    time: "2d",
    avatar: "https://i.pinimg.com/736x/ac/7e/03/ac7e03044fb7469b99a3190165ffb1c2.jpg",
    followStatus: "Follow",
  },
];

const ActivityScreen = () => {
  const renderItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.username}>{item.username}</Text> {item.action}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>{item.followStatus}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerText}>Activity</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchNotifications()}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>ALL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Replies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Mentions</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.notificationList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "bold",
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
  },
  username: {
    fontWeight: "bold",
  },
  time: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  followButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  followButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
  },
});

export default ActivityScreen;
