import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

const settingsItems = [
  { icon: "person-add-outline", label: "Theo dõi & mời bạn bè" },
  { icon: "notifications-outline", label: "Thông báo" },
  { icon: "bookmark-outline", label: "Đã lưu" },
  { icon: "heart-outline", label: "Lượt thích của bạn" },
  { icon: "lock-closed-outline", label: "Quyền riêng tư" },
  { icon: "person-outline", label: "Tài khoản" },
  { icon: "shield-checkmark-outline", label: "Trạng thái tài khoản" },
  { icon: "help-circle-outline", label: "Trợ giúp" },
  { icon: "information-circle-outline", label: "Giới thiệu" },
];

const handleItemPress = (label: string) => {
  switch (label) {
    case "Theo dõi & mời bạn bè":
      // TODO: Điều hướng đến trang mời bạn bè
      break;
    case "Thông báo":
      // TODO: Điều hướng đến trang thông báo
      break;
    case "Đã lưu":
      // TODO: Điều hướng đến trang đã lưu
      break;
    case "Lượt thích của bạn":
      // TODO: Điều hướng đến trang lượt thích
      break;
    case "Quyền riêng tư":
      // TODO: Điều hướng đến trang quyền riêng tư
      break;
    case "Tài khoản":
      // TODO: Điều hướng đến trang tài khoản
      break;
    case "Trạng thái tài khoản":
      // TODO: Điều hướng đến trang trạng thái tài khoản
      break;
    case "Trợ giúp":
      // TODO: Điều hướng đến trang trợ giúp
      break;
    case "Giới thiệu":
      // TODO: Điều hướng đến trang giới thiệu
      break;
    default:
      break;
  }
};

const handleLogout = async () => {
  // Đăng xuất khỏi supabase
  try {
    await supabase.auth.signOut();
    router.replace("/Login");
  } catch (err) {
    alert("Đăng xuất thất bại!");
  }
};

export default function ProfileSettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView>
        {settingsItems.map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.item,
              item.label === "Giới thiệu" && styles.itemWithBottomBorder, // Thêm border nếu là "Giới thiệu"
            ]}
            onPress={() => handleItemPress(item.label)}
          >
            <Icon
              name={item.icon}
              size={24}
              color="#333"
              style={styles.itemIcon}
            />
            <Text style={styles.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.item, { marginTop: 30 }]}
          onPress={handleLogout}
        >
          <Icon
            name="log-out-outline"
            size={24}
            color="#e63946"
            style={styles.itemIcon}
          />
          <Text style={[styles.itemLabel, { color: "#e63946" }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  itemIcon: {
    marginRight: 18,
  },
  itemLabel: {
    fontSize: 16,
    color: "#222",
  },
  itemWithBottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
