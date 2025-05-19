import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from './profileStyles';

interface Tab {
  label: string;
  value: string;
}

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Chỉ hiển thị 2 tab giống như trong profile.tsx
const TABS: Tab[] = [
  { label: "Threads", value: "Threads" },
  { label: "Replies", value: "Replies" },
];

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => (
  <View style={styles.navTabs}>
    {TABS.map((item) => (
      <TouchableOpacity
        key={item.value}
        style={styles.navTab}
        onPress={() => setActiveTab(item.value)}
      >
        <Text
          style={[
            styles.navTabText,
            activeTab === item.value && styles.navTabActive,
          ]}
        >
          {item.label}
        </Text>
        {activeTab === item.value && <View style={styles.underline} />}
      </TouchableOpacity>
    ))}
  </View>
);

export default ProfileTabs;
