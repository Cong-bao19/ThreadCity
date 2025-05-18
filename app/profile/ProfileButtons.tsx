import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from './profileStyles';

interface ProfileButtonsProps {
  isFollowing: boolean;
  isPrivate: boolean;
  isCurrentUser: boolean;
  onFollow: () => void;
}

const ProfileButtons: React.FC<ProfileButtonsProps> = ({ isFollowing, isPrivate, isCurrentUser, onFollow }) => (
  <View style={styles.buttons}>
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isFollowing ? "#ccc" : "#000" },
      ]}
      onPress={onFollow}
      disabled={isPrivate && !isCurrentUser}
    >
      <Text
        style={[
          styles.buttonText,
          { color: isFollowing ? "#000" : "#fff" },
        ]}
      >
        {isFollowing ? "Đang theo dõi" : "Theo dõi"}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.button, styles.messageButton]}>
      <Text style={styles.buttonText}>Nhắn tin</Text>
    </TouchableOpacity>
  </View>
);

export default ProfileButtons;
