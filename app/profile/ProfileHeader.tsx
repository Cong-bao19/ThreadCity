import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { router } from 'expo-router';
import styles from './profileStyles';

interface ProfileHeaderProps {
  username: string;
  avatar: string;
  isCurrentUserProfile: boolean;
  currentUserId?: string | null;
  onMenuPress?: () => void; // Thêm prop để xử lý sự kiện nhấn vào menu
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  username, 
  avatar, 
  isCurrentUserProfile,
  currentUserId,
  onMenuPress
}) => (
  <View style={styles.customHeader}>
    {!isCurrentUserProfile ? (
      <TouchableOpacity 
        onPress={() => {
          router.back();
        }}
      >
        <Icon name="arrow-back-outline" size={24} color="#000" />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity>
        <Icon name="globe-outline" size={24} color="#000" />
      </TouchableOpacity>
    )}
    <Text style={styles.headerTitle}>{username}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity
        onPress={onMenuPress}
        style={{
          backgroundColor: '#eee',
          borderRadius: 16,
          width: 26,
          height: 26,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon name="ellipsis-horizontal" size={18} color="#222" />
      </TouchableOpacity>
    </View>
  </View>
);

export default ProfileHeader;
