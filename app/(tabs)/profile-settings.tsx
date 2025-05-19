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
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

const settingsItems = [
  { icon: "person-add-outline", label: "Theo dõi & mời bạn bè" },
  { icon: "notifications-outline", label: "Thông báo" },
  { icon: "bookmark-outline", label: "Đã lưu" },
  { icon: "heart-outline", label: "Lượt thích của bạn" },
  { icon: "lock-closed-outline", label: "Quyền riêng tư" },
  { icon: "shield-checkmark-outline", label: "Trạng thái tài khoản" },
  { icon: "help-circle-outline", label: "Trợ giúp" },
  { icon: "information-circle-outline", label: "Giới thiệu" },
];

export default function ProfileSettingsScreen() {
  const params = useLocalSearchParams();
  const username = params.username as string | undefined;

  const handleItemPress = (label: string) => {
    switch (label) {
      case "Theo dõi & mời bạn bè":
        if (username) {
          router.push({ pathname: '/invite-friends', params: { username } });
        } else {
          router.push('/invite-friends');
        }
        break;
      case "Thông báo":
        if (username) {
          router.push({ pathname: '/(tabs)/notifications', params: { username } });
        } else {
          router.push('/(tabs)/notifications');
        }
        break;
      case "Đã lưu":
        if (username) {
          router.push({ pathname: '/(tabs)/saved', params: { username } });
        } else {
          router.push('/(tabs)/saved');
        }
        break;
      case "Lượt thích của bạn":
        if (username) {
          router.push({ pathname: '/(tabs)/likes', params: { username } });
        } else {
          router.push('/(tabs)/likes');
        }
        break;
      case "Quyền riêng tư":
        if (username) {
          router.push({ pathname: '/(tabs)/privacy', params: { username } });
        } else {
          router.push('/(tabs)/privacy');
        }
        break;
      case "Trạng thái tài khoản":
        if (username) {
          router.push({ pathname: '/(tabs)/account-status', params: { username } });
        } else {
          router.push('/(tabs)/account-status');
        }
        break;
      case "Trợ giúp":
        if (username) {
          router.push({ pathname: '/(tabs)/help', params: { username } });
        } else {
          router.push('/(tabs)/help');
        }
        break;
      case "Giới thiệu":
        if (username) {
          router.push({ pathname: '/(tabs)/about', params: { username } });
        } else {
          router.push('/(tabs)/about');
        }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (username) {
            router.push({ pathname: '/profile', params: { userId: undefined, username } });
          } else {
            router.push('/profile');
          }
        }}>
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
