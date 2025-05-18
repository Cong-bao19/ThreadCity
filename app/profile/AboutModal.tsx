// import { BlurView } from 'expo-blur';
// import React from 'react';
// import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// interface AboutModalProps {
//   visible: boolean;
//   onClose: () => void;
//   username: string;
//   joinedDate: string;
// }

// const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose, username, joinedDate }) => {
//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
//         <View style={styles.modalContent}>
//           <Text style={styles.title}>Giới thiệu về trang cá nhân</Text>
//           <Text style={styles.label}>Tên người dùng:</Text>
//           <Text style={styles.value}>{username}</Text>
//           <Text style={styles.label}>Ngày tham gia:</Text>
//           <Text style={styles.value}>{joinedDate}</Text>
//           <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
//             <Text style={styles.closeText}>Đóng</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalContent: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 28,
//     alignItems: 'center',
//     elevation: 10,
//     minWidth: 280,
//   },
//   title: {
//     fontWeight: 'bold',
//     fontSize: 18,
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 15,
//     color: '#666',
//     marginTop: 8,
//   },
//   value: {
//     fontSize: 16,
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   closeBtn: {
//     marginTop: 18,
//     paddingVertical: 8,
//     paddingHorizontal: 24,
//     backgroundColor: '#eee',
//     borderRadius: 8,
//   },
//   closeText: {
//     color: '#007AFF',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
// });

// export default AboutModal;
