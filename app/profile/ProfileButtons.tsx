import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import styles from './profileStyles';

interface ProfileButtonsProps {
  isFollowing: boolean;
  isPrivate: boolean;
  isCurrentUser: boolean;
  onFollow: () => void;
  onShowQR?: () => void;
  inforUrl?: string;
}

const ProfileButtons: React.FC<ProfileButtonsProps> = ({ 
  isFollowing, 
  isPrivate, 
  isCurrentUser, 
  onFollow,
  onShowQR,
  inforUrl
}) => {
  const handleEditProfile = () => {
    router.push("/edit");
  };

  return (
    <View style={styles.buttons}>
      {isCurrentUser ? (
        // Nếu là profile của người dùng hiện tại
        <>
          <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
            <Text style={styles.buttonText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onShowQR}>
            <Text style={styles.buttonText}>Chia sẻ hồ sơ</Text>
          </TouchableOpacity>
        </>
      ) : (
        // Nếu là profile của người khác
        <>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isFollowing ? '#fff' : '#000',
                borderColor: '#000',
                flex: 1,
              },
            ]}
            onPress={onFollow}
            disabled={isPrivate && !isCurrentUser}
          >
            <Text style={[
              styles.buttonText,
              { color: isFollowing ? '#000' : '#fff' }
            ]}>
              {isFollowing ? 'Bỏ theo dõi' : 'Theo dõi'}
            </Text>
          </TouchableOpacity>
          {inforUrl && (
            <TouchableOpacity
              style={[styles.button, {backgroundColor: '#fff', borderColor: '#000', flex: 1}]}
              onPress={onShowQR}
            >
              <Text style={[styles.buttonText, {color: '#000'}]}>QR Contact</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default ProfileButtons;
