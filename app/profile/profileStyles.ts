import { StyleSheet } from 'react-native';

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
  buttons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  messageButton: {
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonText: {
    fontWeight: "bold",
  },
  tabs: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
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
  timeText: {
    fontSize: 12,
    color: "#666",
  },
  content: {
    fontSize: 14,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 120,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
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
});

export default profileStyles;
