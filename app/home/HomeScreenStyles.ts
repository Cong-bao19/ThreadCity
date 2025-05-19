// Styles for HomeScreen (moved from index.tsx)
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  header: { 
    paddingVertical: 14, 
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee'
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  postList: { 
    flex: 1 
  },
  postItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    width: 40,
    marginRight: 4,
  },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  verticalLine: {
    position: "absolute",
    top: 42,
    bottom: -12,
    left: 18,
    width: 1.5,
    backgroundColor: "#eeeeee",
  },
  postContent: { 
    flex: 1,
    paddingLeft: 8
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: { 
    fontWeight: "600", 
    fontSize: 14
  },
  dotSeparator: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 4,
  },
  time: { 
    fontSize: 14, 
    color: "#666"
  },
  content: { 
    marginVertical: 6,
    fontSize: 15,
    lineHeight: 20,
    color: "#111"
  },
  postImage: { 
    width: "100%", 
    height: 300, 
    borderRadius: 10,
    marginBottom: 8
  },
  actions: {
    flexDirection: "row",
    marginTop: 4,
    gap: 16
  },
  mention: { 
    color: "#1C9BF0" 
  },
  likeCount: {
    fontSize: 14,
    color: "#111",
    marginTop: 6,
  },
  replyCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: "#666",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
  commentsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
  },
  commentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingLeft: 4,
  },
  commentAvatarContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 6,
  },
  commentAvatar: { 
    width: 24, 
    height: 24, 
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  commentVerticalLine: {
    position: "absolute",
    top: 26,
    bottom: -10,
    left: 12,
    width: 1,
    backgroundColor: "#eee",
  },
  commentContent: {
    flex: 1,
    paddingRight: 10,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  commentUsername: {
    fontWeight: "600",
    fontSize: 13,
  },
  commentText: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    color: "#888",
  },
  commentActions: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  actionCount: {
    fontSize: 14,
    color: "#111",
  },
});

export default styles;
