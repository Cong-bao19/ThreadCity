Quản lý trạng thái đăng nhập toàn cục

Sử dụng UserProvider để lưu và cung cấp thông tin user cho toàn bộ app qua context.
Khi app khởi động, UserProvider sẽ gọi supabase.auth.getSession() để lấy session hiện tại và lắng nghe sự kiện thay đổi đăng nhập (onAuthStateChange).
Luồng đăng nhập

Màn hình đăng nhập (ví dụ: screens/InstagramLogin.js) sử dụng supabase.auth.signInWithPassword để xác thực user.
Nếu đăng nhập thành công, user sẽ được lưu vào context qua setUser(data.user).
Điều hướng sau đăng nhập

Trong _layout.js, sau khi xác định trạng thái đăng nhập (session), app sẽ tự động điều hướng:
Nếu đã đăng nhập: router.replace("/(tabs)")
Nếu chưa đăng nhập: router.replace("/Login")
Sử dụng user trong các màn hình

Các màn hình sử dụng hook useUser để lấy thông tin user hiện tại (user?.id).
Nếu chưa đăng nhập, một số màn hình sẽ không cho phép thao tác hoặc hiển thị thông báo.
Đăng xuất

Khi gọi supabase.auth.signOut(), context sẽ tự động cập nhật lại user về null và app sẽ điều hướng về màn hình đăng nhập.
Tóm tắt flow:

Đăng nhập → lưu user vào context → điều hướng vào app → lấy user từ context để thao tác → đăng xuất sẽ xóa user khỏi context và điều hướng về login.
Các file chính liên quan:

UserContext.js
_layout.js
InstagramLogin.js (hoặc các màn hình login khác)
Các màn hình sử dụng useUser để lấy user hiện tại.

Thư mục app là nơi chứa các màn hình (screens/pages) của ứng dụng, theo cấu trúc của Expo Router hoặc Next.js.