import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function AccountStatusScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Trạng thái tài khoản</Text>
      <View style={styles.content}>
        <Text>Chức năng trạng thái tài khoản sẽ cập nhật sau.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", margin: 20 },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
});
