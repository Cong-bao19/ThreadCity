import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";

export default function AboutScreen() {
  const params = useLocalSearchParams();
  const username = params.username as string | undefined;

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
        <Text style={styles.title}>Giới thiệu</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.listItem}>
          <Text style={styles.listText}>Giới thiệu về trang cá nhân</Text>
        </View>
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Chính sách quyền riêng tư của Meta</Text>
            <Icon name="chevron-forward-outline" size={22} color="#888" />
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Điều khoản sử dụng của Meta</Text>
            <Icon name="chevron-forward-outline" size={22} color="#888" />
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Chính sách quyền riêng tư của Threads</Text>
            <Icon name="chevron-forward-outline" size={22} color="#888" />
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Điều khoản sử dụng của Threads</Text>
            <Icon name="chevron-forward-outline" size={22} color="#888" />
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Thông báo của bên thứ ba</Text>
            <Icon name="chevron-forward-outline" size={22} color="#888" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    elevation: 3,
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: "bold" },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  sectionDesc: { color: '#444', fontSize: 14 },
  list: { borderTopWidth: 1, borderTopColor: '#eee' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listText: { fontSize: 15, color: '#222' },
});
