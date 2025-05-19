import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Image } from "react-native";
import { supabase } from "@/lib/supabase";
import { router, useNavigation } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from '@react-navigation/native';

// Thêm lastSenderId vào interface
interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
}

interface ChatUser extends UserProfile {
  lastMessage?: string;
  lastTime?: string;
  lastSenderId?: string;
}

export default function ChatUserListScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<ChatUser[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Lấy profile user hiện tại
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", user.id)
          .single();
        setCurrentUser(profile);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    // Lấy tất cả user đã từng nhắn tin với mình
    const fetchChatUsers = async () => {
      // Lấy tất cả messages liên quan đến user hiện tại
      const { data: messages } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (!messages || messages.length === 0) {
        setChatUsers([]);
        setFilteredUsers([]);
        return;
      }
      // Lấy userId đối thoại (không phải mình)
      const userMap: { [id: string]: { lastMessage: string; lastTime: string; lastSenderId: string } } = {};
      messages.forEach((msg: any) => {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        if (!userMap[otherId]) {
          userMap[otherId] = { lastMessage: msg.content, lastTime: msg.created_at, lastSenderId: msg.sender_id };
        }
      });
      const chatUserIds = Object.keys(userMap);
      if (chatUserIds.length === 0) {
        setChatUsers([]);
        setFilteredUsers([]);
        return;
      }
      // Lấy profile các user đã chat
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", chatUserIds);
      // Gắn lastMessage vào từng user
      const chatList = (profiles || []).map((u: any) => ({
        ...u,
        lastMessage: userMap[u.id]?.lastMessage || "",
        lastTime: userMap[u.id]?.lastTime || "",
        lastSenderId: userMap[u.id]?.lastSenderId || "",
      }));
      // Sắp xếp theo thời gian tin nhắn mới nhất
      chatList.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
      setChatUsers(chatList);
      setFilteredUsers(chatList);
    };
    fetchChatUsers();
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      if (!userId) return;
      const fetchChatUsers = async () => {
        const { data: messages } = await supabase
          .from("messages")
          .select("id, sender_id, receiver_id, content, created_at")
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order("created_at", { ascending: false });
        if (!messages || messages.length === 0) {
          setChatUsers([]);
          setFilteredUsers([]);
          return;
        }
        const userMap: { [id: string]: { lastMessage: string; lastTime: string; lastSenderId: string } } = {};
        messages.forEach((msg: any) => {
          const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
          if (!userMap[otherId]) {
            userMap[otherId] = { lastMessage: msg.content, lastTime: msg.created_at, lastSenderId: msg.sender_id };
          }
        });
        const chatUserIds = Object.keys(userMap);
        if (chatUserIds.length === 0) {
          setChatUsers([]);
          setFilteredUsers([]);
          return;
        }
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", chatUserIds);
        const chatList = (profiles || []).map((u: any) => ({
          ...u,
          lastMessage: userMap[u.id]?.lastMessage || "",
          lastTime: userMap[u.id]?.lastTime || "",
          lastSenderId: userMap[u.id]?.lastSenderId || "",
        }));
        chatList.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
        setChatUsers(chatList);
        setFilteredUsers(chatList);
      };
      fetchChatUsers();
    }, [userId])
  );

  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(chatUsers);
    } else {
      setFilteredUsers(chatUsers.filter(u => u.username.toLowerCase().includes(search.toLowerCase())));
    }
  }, [search, chatUsers]);

  const handleUserPress = (user: UserProfile) => {
    router.push({ pathname: "/(tabs)/chat", params: { userId: user.id } });
  };

  return (
    <View style={styles.container}>
      {/* Custom Header Instagram style */}
<View style={styles.igHeader}>
  <TouchableOpacity onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : router.back())} style={styles.headerBackBtn}>
    <Ionicons name="chevron-back" size={28} color="#222" />
  </TouchableOpacity>

  <Text style={styles.igHeaderTitleLeft}>{currentUser?.username || "Tin nhắn"}</Text>

  <TouchableOpacity style={styles.headerAddBtn} onPress={() => {}}>
    <Ionicons name="create-outline" size={24} color="#222" />
  </TouchableOpacity>
</View>
      {/* Tab bar under header */}
      <TextInput
        style={styles.searchInput}
        placeholder="Hỏi Meta AI hoặc tìm kiếm..."
        value={search}
        onChangeText={setSearch}
      />
      {/* Avatar + Danh sách phát của bạn */}
      {currentUser && (
        <View style={styles.playlistRow}>
          <Image source={{ uri: currentUser.avatar_url || "https://via.placeholder.com/40" }} style={styles.playlistAvatar} />
          <View style={styles.playlistBubbleWrapper}>
            <View style={styles.playlistBubble}>
              <Text style={styles.playlistTitle}>Danh sách phát của bạn</Text>
              <Text style={styles.playlistDesc}>Chưa có gì trong danh sách phát</Text>
            </View>
            {/* Bubble tail */}
            <View style={styles.bubbleTail} />
          </View>
        </View>
      )}
      <View style={styles.igTabBar}>
        <Text style={styles.igTabActive}>Tin nhắn</Text>
        <Text style={styles.igTabInactive}>Tin nhắn đang chờ</Text>
      </View>
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const lastMsg = item.lastMessage ? (item.lastSenderId === userId ? `Bạn: ${item.lastMessage}` : item.lastMessage) : "";
          return (
            <TouchableOpacity style={styles.igUserItem} onPress={() => handleUserPress(item)}>
              <Image source={{ uri: item.avatar_url || "https://via.placeholder.com/40" }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>{lastMsg}</Text>
              </View>
              {item.lastTime && (
                <Text style={styles.time}>{new Date(item.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>Không có cuộc trò chuyện nào</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  igHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start", // Cập nhật từ "flex-start" thành "space-between"
  paddingHorizontal: 10,
  paddingTop: 18,
  paddingBottom: 8,
  backgroundColor: "#fff"
},
  igHeaderTitleLeft: { fontSize: 22, fontWeight: "bold", color: "#222", marginLeft: 4, flex: 1 },
  headerBackBtn: { padding: 4, marginRight: 8 },
  headerAddBtn: { padding: 4, marginLeft: 20 },
  igTabBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 4, marginBottom: 2 },
  igTabActive: { fontWeight: "bold", fontSize: 16, color: "#222" },
  igTabInactive: { fontWeight: "500", fontSize: 16, color: "#aaa" },
  searchInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 20, padding: 10, margin: 10 , backgroundColor: "#f5f5f5"},
  igUserItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 , marginLeft: 10},
  username: { fontSize: 16, fontWeight: "bold" },
  lastMessage: { fontSize: 14, color: '#666', marginTop: 2 },
  time: { fontSize: 12, color: '#999', marginLeft: 8 },
  currentUserCard: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#f7fafd",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e6ed",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  currentUsername: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#222",
    marginRight: 8,
  },
  badgeBan: {
    backgroundColor: '#2e90fa',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  badgeBanText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playlistRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginTop: 25,
    marginBottom: 8,
    marginRight: 90,
  },
  playlistAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 0,
  },
  playlistBubbleWrapper: {
    position: "relative",
    marginRight: 10,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    bottom: 40,
    right: 20
  },
  playlistBubble: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: 200,
  },
  playlistTitle: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  playlistDesc: {
    fontSize: 11,
    color: "#555",
  },
  bubbleTail: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: "#f0f0f0",
    transform: [{ rotate: "45deg" }],
    borderBottomLeftRadius: 2,
  },
});
