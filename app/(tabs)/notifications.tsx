import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, FlatList } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function NotificationsScreen() {
  const params = useLocalSearchParams();
  const username = params.username as string | undefined;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!username) return;
      setLoading(true);
      setError(null);
      try {
        // Lấy userId và avatar_url từ username
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .eq('username', username)
          .single();
        if (userError || !user) {
          setError('Không tìm thấy user');
          setLoading(false);
          return;
        }
        setUserAvatar(user.avatar_url || null);
        // Lấy thông báo
        const { data, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (notifError) {
          setError('Lỗi khi tải thông báo');
        } else {
          setNotifications(data || []);
        }
      } catch (e) {
        setError('Lỗi không xác định');
      }
      setLoading(false);
    };
    fetchNotifications();
  }, [username]);

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
        <Text style={styles.title}>Thông báo</Text>
        <View style={{ width: 28 }} />
      </View>
      {/* Notification List */}
      <FlatList
        data={notifications}
        keyExtractor={n => n.id?.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        showsVerticalScrollIndicator={true}
        onRefresh={() => {
          if (!loading) {
            setLoading(true);
            setError(null);
            // Gọi lại fetchNotifications
            (async () => {
              try {
                // ...fetch logic lặp lại ở đây nếu muốn pull-to-refresh...
              } finally {
                setLoading(false);
              }
            })();
          }
        }}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loadingText}>Đang tải...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.emptyText}>Không có thông báo nào.</Text>
          )
        }
        renderItem={({ item: n }) => (
          <View style={styles.notificationItem}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            <View style={styles.notificationContent}>
              <Text style={styles.notificationText}>{n.content || n.title || 'Thông báo'}</Text>
              <Text style={styles.notificationTime}>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginVertical: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 7,
    paddingBottom: 20, // Thêm padding dưới cho đẹp và scroll tốt
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#888',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 30,
    color: 'red',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#888',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
});
