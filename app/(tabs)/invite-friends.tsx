import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Linking,
  Share,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";

const SUGGESTED_USERS = [
  {
    id: "1",
    name: "Cristiano Ronaldo",
    username: "cristiano",
    avatar:
      "https://i.pinimg.com/736x/97/8d/fe/978dfe2eed24660a344f07c8784065c8.jpg",
    isFollowing: false,
  },
  {
    id: "2",
    name: "Taylor Swift",
    username: "taylorswift",
    avatar:
      "https://i.pinimg.com/736x/4f/53/1e/4f531e49e7b13c576ab4e30b8e4ba702.jpg",
    isFollowing: false,
  },
  {
    id: "3",
    name: "Lionel Messi",
    username: "lionelmessi",
    avatar:
      "https://i.pinimg.com/736x/84/a7/fd/84a7fd755368a8f95263ff30f6179632.jpg",
    isFollowing: false,
  },
];

const CONTACTS = [
  {
    id: "4",
    name: "Hai Vo Dinh",
    username: "HaiVoDinh",
    avatar:
      "https://i.pinimg.com/736x/51/56/6b/51566bee5e751cfdf8a818afb6a8ce97.jpg",
    isFollowing: false,
  },
  {
    id: "5",
    name: "Quoc Huy",
    username: "QuocHuy",
    avatar:
      "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/05/anh-cho-hai-74.jpg",
    isFollowing: true,
  },
  {
    id: "6",
    name: "Anh Khoa",
    username: "AnhKhoa",
    avatar: "https://i.pinimg.com/736x/27/b5/08/27b508d831529e55c86b40ac3153222d.jpg",
  },
];

export default function InviteFriendsScreen() {
  const params = useLocalSearchParams();
  const username = params.username as string || 'yourusername';

  const [suggested, setSuggested] = useState(SUGGESTED_USERS);
  const [contacts, setContacts] = useState(CONTACTS);
  // const [following, setFollowing] = useState(FOLLOWING);

  const handleFollow = (id: string, type: "suggested" | "contacts") => {
    if (type === "suggested") {
      setSuggested((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );
    } else {
      setContacts((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );
    }
  };

const handleShareProfile = async () => {
  try {
    const message = `Xem trang cá nhân của tôi trên ThreadCity: https://threadcity.app/u/${username}`;
    await Share.share({ message });
  } catch (error) {
    console.error('Lỗi chia sẻ:', error);
  }
};

const handleSendSMS = () => {
  const message = `Xem trang cá nhân của tôi trên ThreadCity: https://threadcity.app/u/${username}`;
  const url = `sms:&body=${encodeURIComponent(message)}`;
  Linking.openURL(url).catch((err) => console.error('Lỗi mở SMS:', err));
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
    if (username) {
      router.push({ pathname: '/profile-settings', params: { username } });
    } else {
      router.push('/profile-settings');
    }
  }}>
          <Icon name="arrow-back-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mời bạn bè</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gợi ý theo dõi</Text>
          {suggested.map((user) => (
            <View key={user.id} style={styles.userRow}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.username}>@{user.username}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  {
                    backgroundColor: user.isFollowing ? "#fff" : "#000",
                    borderColor: "#000",
                  },
                ]}
                onPress={() => handleFollow(user.id, "suggested")}
              >
                <Text
                  style={{
                    color: user.isFollowing ? "#000" : "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {user.isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Người liên hệ</Text>
          {contacts.map((user) => (
            <View key={user.id} style={styles.userRow}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.username}>@{user.username}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  {
                    backgroundColor: user.isFollowing ? "#fff" : "#000",
                    borderColor: "#000",
                  },
                ]}
                onPress={() => handleFollow(user.id, "contacts")}
              >
                <Text
                  style={{
                    color: user.isFollowing ? "#000" : "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {user.isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Người đã theo dõi</Text>
          {following.map((user) => (
            <View key={user.id} style={styles.userRow}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.username}>@{user.username}</Text>
              </View>
              <Text style={{ color: '#888', fontWeight: 'bold' }}>Đang theo dõi</Text>
            </View>
          ))}
        </View> */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chia sẻ trang cá nhân</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleSendSMS}>
              <Icon name="chatbubble-outline" size={20} color="#000" />
              <Text style={styles.shareBtnText}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareProfile}
            >
              <Icon name="share-outline" size={20} color="#000" />
              <Text style={styles.shareBtnText}>Chia sẻ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    color: "#222",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  name: {
    fontWeight: "bold",
    fontSize: 15,
  },
  username: {
    color: "#888",
    fontSize: 13,
  },
  followBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  shareBtnText: {
    marginLeft: 6,
    color: "#000",
    fontWeight: "bold",
  },
});
