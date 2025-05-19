import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";

export default function AccountStatusScreen() {
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
        <Text style={styles.title}>Trạng thái tài khoản</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <Text>Chức năng trạng thái tài khoản sẽ cập nhật sau.</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: { fontSize: 22, fontWeight: "bold" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
});
