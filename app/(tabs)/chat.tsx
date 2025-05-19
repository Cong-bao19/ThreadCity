import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from "react-native";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { router } from "expo-router";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const { userId: receiverId } = useLocalSearchParams(); // userId của người nhận
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [receiverProfile, setReceiverProfile] = useState<{ username: string; avatar_url: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ username: string; avatar_url: string } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Lấy userId hiện tại
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  // Lấy profile người nhận
  useEffect(() => {
    if (!receiverId) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", receiverId)
        .single();
      setReceiverProfile(data);
    };
    fetchProfile();
  }, [receiverId]);

  // Lấy profile user hiện tại
  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .single();
      setCurrentUser(data);
    };
    fetchProfile();
  }, [userId]);

  // Fetch initial messages và subscribe realtime
  useEffect(() => {
    if (!userId || !receiverId) return;
    let mounted = true;
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: true });
      if (mounted) setMessages(data || []);
    };
    fetchMessages();

    // Subscribe realtime
    const channel = supabase
      .channel('realtime:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMessage = payload.new as Message;
        if (
          (newMessage.sender_id === userId && newMessage.receiver_id === receiverId) ||
          (newMessage.sender_id === receiverId && newMessage.receiver_id === userId)
        ) {
          setMessages(prev => {
            // Tránh trùng tin nhắn
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      })
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId, receiverId]);

  const sendMessage = async () => {
    if (!input.trim() || !userId || !receiverId) return;
    await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: receiverId,
      content: input.trim(),
      created_at: new Date().toISOString(),
    });
    setInput("");
  };

  if (!receiverId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Chọn một user để bắt đầu chat</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 1, borderColor: "#eee" }}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/chatUserList')} style={{ marginRight: 10 }}>
          <Icon name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        {receiverProfile && (
          <>
            <View style={{ marginRight: 10 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
                <Image source={{ uri: receiverProfile.avatar_url || 'https://via.placeholder.com/40' }} style={{ width: 32, height: 32, borderRadius: 16 }} />
              </View>
            </View>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{receiverProfile.username}</Text>
          </>
        )}
        {!receiverProfile && <Text style={{ fontWeight: "bold", fontSize: 16 }}>Chat</Text>}
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isMe = item.sender_id === userId;
          return (
           <View
            style={{
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'center', // quan trọng để avatar và bubble nằm cùng hàng
                marginVertical: 6,
                paddingHorizontal: 10,
            }}
            >
            <Image
                source={{
                uri: isMe
                    ? currentUser?.avatar_url || 'https://via.placeholder.com/40'
                    : receiverProfile?.avatar_url || 'https://via.placeholder.com/40',
                }}
                style={{ width: 32, height: 32, borderRadius: 16, marginHorizontal: 6 }}
            />
            
            <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                <View
                style={{
                    backgroundColor: isMe ? '#d1f7c4' : '#eee',
                    borderRadius: 16,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                }}
                >
                <Text style={{ fontSize: 15 }}>{item.content}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Nhập tin nhắn..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Icon name="send" size={22} color="#3897f0" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  message: { padding: 10, margin: 5, backgroundColor: "#eee", borderRadius: 8, alignSelf: "flex-start", maxWidth: '80%' },
  myMessage: { backgroundColor: "#d1f7c4", alignSelf: "flex-end" },
  inputContainer: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderColor: "#ddd" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, padding: 8 },
  sendBtn: { marginLeft: 8, justifyContent: "center" },
});
