import React from 'react';
import { Text, View } from 'react-native';
import { Avatar } from 'react-native-elements';
import styles from './profileStyles';

interface ProfileInfoProps {
  username: string;
  avatar: string;
  bio: string;
  link?: string;
  followers: number;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ username, avatar, bio, link, followers }) => (
  <>
    <View style={styles.profileInfo}>
      <Avatar
        rounded
        source={{ uri: avatar }}
        size="large"
        containerStyle={styles.profileAvatar}
      />
      <View style={styles.profileStats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{followers}</Text>
          <Text style={styles.statLabel}>followers</Text>
        </View>
      </View>
    </View>
    
    <View style={styles.userInfo}>
      <Text style={styles.username}>{username}</Text>
      <Text style={styles.handle}>{`@${username} • threads.net`}</Text>
      <Text style={styles.bio}>{bio}</Text>
      {link && <Text style={styles.bio}>{link}</Text>}
    </View>
  </>
);

export default ProfileInfo;
