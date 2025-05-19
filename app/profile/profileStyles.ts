import { StyleSheet } from 'react-native';

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Header cũ
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 8,
  },
  usernameText: {
    color: "#666",
    marginRight: "auto",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Header mới (giống với profile.tsx)
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  // Thông tin profile
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
    justifyContent: "space-between",
  },
  profileAvatar: {
    width: 80,
    height: 80,
  },
  profileStats: {
    flexDirection: "row",
  },
  stat: {
    alignItems: "center",
    marginRight: 16,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  info: {
    padding: 16,
  },
  location: {
    fontSize: 16,
  },
  followers: {
    fontSize: 14,
    color: "#666",
  },
  userInfo: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  navTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "flex-end",
    height: 38,
    marginTop: 0,
    justifyContent: "space-between", 
  },
  navTab: {
    flex: 1, 
    alignItems: "center",
    justifyContent: "flex-end",
    height: 38,
    marginRight: 0,
  },
  navTabText: {
    margin: 10,
    fontSize: 16,
    color: "#666",
  },
  navTabActive: {
    fontWeight: "thin",
    color: "#000",
  },
  underline: {
    height: 3,
    backgroundColor: "#000",
    borderRadius: 2,
    width: 70,
    marginTop: 0,
    marginBottom: -1,
    alignSelf: "center",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 15,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  messageButton: {
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 1,
  },
  content: {
    flex: 1,
  },
  postList: {
    flex: 1,
  },
  postItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  postContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  username: {
    fontWeight: "bold",
  },
  handle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
  },
  postContentText: {
    fontSize: 14,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#666",
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
  },
  bio: {
    fontSize: 16,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Styles cho modal QR code
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#3897f0",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  repostHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 58,
  },
  repostText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  repostTime: {
    fontSize: 12,
    color: "#888",
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  // Styles bổ sung cho ProfilePost.tsx
  threadItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  postHeader: {
    flexDirection: "row",
  },
  postUser: {
    flexDirection: "row",
    alignItems: "center",
  },
  postHandle: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  time: {
    fontSize: 14,
    color: "#666",
  },
  postMenu: {
    marginLeft: 5,
  },
  threadText: {
    fontSize: 16,
    marginTop: 5,
  },
  replyContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginLeft: 60,
  },
});

export default profileStyles;
