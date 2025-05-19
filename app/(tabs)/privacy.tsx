import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Quyền riêng tư</Text>
      <View style={styles.content}>
        <Text>Chức năng quyền riêng tư sẽ cập nhật sau.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", margin: 20 },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
});
