import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";

export default function HelpScreen() {
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
        <Text style={styles.title}>Trợ giúp</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Báo cáo sự cố</Text>
            <Icon name="chevron-forward-outline" size={22} color="#888" />
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Trung tâm trợ giúp</Text>
            <Icon name="chevron-forward-outline" size={22} color="#888" />
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Trợ giúp về bảo mật và quyền riêng tư</Text>
            <Icon name="chevron-forward-outline" size={22} color="#888" />
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Yêu cầu hỗ trợ</Text>
            <Icon name="chevron-forward-outline" size={22} color="#888" />
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listText}>Hướng dẫn về mạng xã hội phi tập trung</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  title: { fontSize: 22, fontWeight: "bold" },
  content: { flex: 1, padding: 10 },
  list: { marginTop: 2 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  listText: { fontSize: 16, color: '#222' },
});