import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import styles from './profileStyles';

interface Tab {
  label: string;
  value: string;
}

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS: Tab[] = [
  { label: "Thread", value: "Thread" },
  { label: "Thread trả lời", value: "Thread trả lời" },
  { label: "File phương tiện", value: "File phương tiện" },
  { label: "Bài đăng lại", value: "Bài đăng lại" },
];

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => (
  <View style={styles.tabs}>
    <FlatList
      data={TABS}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.tab, activeTab === item.value && styles.activeTab]}
          onPress={() => setActiveTab(item.value)}
        >
          <Text style={styles.tabText}>{item.label}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.value}
      horizontal
      showsHorizontalScrollIndicator={false}
    />
  </View>
);

export default ProfileTabs;
