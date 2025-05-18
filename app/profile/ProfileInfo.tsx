import React from 'react';
import { Text, View } from 'react-native';
import styles from './profileStyles';

interface ProfileInfoProps {
  bio: string;
  link: string;
  followers: number;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ bio, link, followers }) => (
  <View style={styles.info}>
    <Text style={styles.location}>{bio}</Text>
    <Text style={styles.location}>{link}</Text>
    <Text style={styles.followers}>{followers} người theo dõi</Text>
  </View>
);

export default ProfileInfo;
