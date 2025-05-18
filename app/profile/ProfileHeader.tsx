import React from 'react';
import { Image, Text, View } from 'react-native';
import styles from './profileStyles';

interface ProfileHeaderProps {
  username: string;
  avatar: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ username, avatar }) => (
  <View style={styles.header}>
    <Text style={styles.name}>{username}</Text>
    <Text style={styles.usernameText}>{username}</Text>
    <Image source={{ uri: avatar }} style={styles.profileImage} />
  </View>
);

export default ProfileHeader;
