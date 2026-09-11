# 🐾 Gừng Todo - Ứng dụng Quản lý Công việc & Take Note Thông minh cho iOS

Ứng dụng Daily ToDo & Take Note chuyên biệt cho **iPhone 13 mini** (tương thích mọi thiết bị iOS & Android), thiết kế theo phong cách **Apple Human Interface Guidelines Minimalist** kết hợp nét đáng yêu của chú **Mèo Cam Trắng (Gừng Cat)**.

Hoạt động **100% Offline**, không cần đăng nhập/database, có hệ thống thông báo đánh thức sáng & chiều tan làm cực kỳ chuẩn xác, hỗ trợ sao lưu/khôi phục dữ liệu qua ứng dụng **Tệp (Files / iCloud Drive)** và tự động kiểm tra cập nhật từ GitHub Release.

---

## 🌟 Tính Năng Nổi Bật

* 🐱 **Linh vật Mèo Gừng tương tác sinh động:** Biểu cảm thay đổi theo tiến độ công việc (ngủ nướng khi chưa có việc, tập trung khi đang làm, nhảy múa ăn mừng khi hoàn thành 100%).
* ⏰ **Thông báo Hẹn giờ Offline Chuẩn xác 100%:**
  * **08:00 Sáng:** Đánh thức và nhắc nhở danh sách việc cần làm trong ngày.
  * **18:00 Chiều:** Nhắc nhở kiểm tra tiến độ trước khi tan làm / đi ngủ.
  * Nội dung thông báo thông minh (tự đếm số việc chưa xong hoặc gửi lời khen khi đã hoàn thành).
  * Tùy chỉnh giờ hẹn hoặc bật/tắt linh hoạt trong Cài đặt.
* 🔄 **Tự động Dời việc Chưa xong (Daily Rollover):** Khi sang ngày mới, các công việc chưa tick xong từ hôm trước sẽ tự động được dời sang ngày hôm nay với huy hiệu *Dời từ trước ⏰*.
* 📅 **Lật lịch Xem quá khứ (Day Selector):** Dễ dàng lật lại các ngày trước để xem nhật ký công việc đã hoàn thành.
* 💾 **Bảo toàn Dữ liệu khi Gỡ App (Xóa app cài lại vẫn còn dữ liệu):**
  * Lưu trữ cục bộ siêu tốc với schema versioning an toàn.
  * Xuất file sao lưu `GungTodo_Backup_YYYY-MM-DD.json` vào ứng dụng **Tệp (Files / iCloud Drive)** hoặc AirDrop chỉ với 1 chạm.
  * Khôi phục nhanh chóng bằng cách dán nội dung file sao lưu.
* 📳 **Phản hồi Rung Xúc giác Taptic Engine (`expo-haptics`):** Cảm giác gõ rung chân thực chuẩn Apple khi tick checkbox, gắn sao, hoặc xóa việc.
* ⭐ **Phân loại Thông minh & Gắn cờ Ưu tiên:**
  * Gắn cờ Sao (⭐) cho việc quan trọng để ghim lên đầu danh sách.
  * Bộ lọc danh mục màu pastel: *Công việc, Cá nhân, Mua sắm, Sức khỏe, Khác*.
* 🚀 **Tự động Kiểm tra Cập nhật GitHub:**
  * Kiểm tra ngầm khi mở app từ repo [vuducmynh/gung-todo](https://github.com/vuducmynh/gung-todo).
  * Hiển thị popup changelog khi có tag bản phát hành mới.

---

## 📲 Cách Chạy Thử Ngay Trên iPhone 13 mini (Từ Máy Tính Windows)

Bạn không cần máy tính Mac, không cần cài Xcode, chỉ cần làm theo 2 bước đơn giản sau:

### Bước 1: Cài ứng dụng Expo Go trên iPhone
* Mở **App Store** trên iPhone 13 mini, tìm kiếm và cài đặt ứng dụng miễn phí: **[Expo Go](https://apps.apple.com/app/expo-go/id982107779)**.

### Bước 2: Khởi chạy Dev Server trên Windows
Mở terminal trong thư mục dự án trên Windows và gõ:
```bash
npm start
```
* Trên màn hình terminal sẽ xuất hiện một **Mã QR**.
* Mở ứng dụng **Camera** trên iPhone 13 mini và hướng vào mã QR trên màn hình máy tính -> Nhấn vào thông báo *"Mở trong Expo Go"*.
* Ứng dụng **Gừng Todo** sẽ được nạp ngay lập tức lên iPhone của bạn với đầy đủ tính năng rung Haptic, giao diện Retina, và thông báo offline!

> **Mẹo nếu dùng khác mạng Wi-Fi:** Chạy lệnh `npx expo start --tunnel` để kết nối xuyên mạng thông qua đường hầm an toàn.

---

## 📦 Hướng Dẫn Đóng Gói File Cài Đặt Cho iPhone (EAS Build Cloud)

Để đóng gói thành app độc lập không cần chạy server dev:

1. Cài đặt công cụ EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Đăng nhập tài khoản Expo (miễn phí):
   ```bash
   eas login
   ```
3. Chạy lệnh build file cài đặt cho iOS:
   ```bash
   eas build --platform ios --profile preview
   ```
   * Hệ thống đám mây của Expo (EAS Build) sẽ tự động biên dịch trên máy chủ macOS của Expo và trả về link tải app hoặc mã QR cài đặt trực tiếp lên iPhone 13 mini của bạn!

---

## 🛠️ Đẩy Code lên GitHub & Kích Hoạt Release Tag

Dự án đã được cấu hình sẵn GitHub Actions tại `.github/workflows/release.yml`.

### 1. Khởi tạo Git và đẩy lên GitHub:
```bash
git init
git add .
git commit -m "feat: initial commit Gừng Todo for iPhone 13 mini"
git branch -M main
git remote add origin https://github.com/vuducmynh/gung-todo.git
git push -u origin main
```

### 2. Tạo bản phát hành mới bằng Release Tag:
Mỗi khi bạn muốn tung ra một bản cập nhật:
```bash
git tag v1.0.1
git push origin v1.0.1
```
* **GitHub Actions** sẽ tự động kích hoạt, kiểm tra code TypeScript, và tự động tạo một **GitHub Release** hoàn chỉnh với changelog và tag version.
* Khi người dùng mở app **Gừng Todo** trên iPhone, app sẽ tự nhận diện phiên bản `v1.0.1` mới và hiển thị thông báo cập nhật!

---

## 🎨 Cấu Trúc Dự Án

```
Todo Gung/
├── App.tsx                     # Màn hình chính Gừng Todo
├── src/
│   ├── components/
│   │   ├── CatMascot.tsx       # Linh vật Mèo Gừng vector SVG tương tác
│   │   ├── TodoItem.tsx        # Card việc chuẩn Apple HIG cho iPhone 13 mini
│   │   ├── DaySelector.tsx     # Thanh chuyển ngày xem nhật ký
│   │   ├── CategoryFilter.tsx  # Bộ lọc danh mục pastel
│   │   ├── ProgressBar.tsx     # Thanh tiến độ và câu khích lệ đáng yêu
│   │   ├── AddTodoModal.tsx    # Modal tạo/sửa việc + ghi chú chi tiết
│   │   ├── SettingsModal.tsx   # Cài đặt giờ thông báo, sao lưu, update
│   │   ├── UpdateModal.tsx     # Popup thông báo bản mới từ GitHub
│   │   └── PermissionModal.tsx # Xin quyền thông báo lịch sự (Permission Priming)
│   ├── services/
│   │   ├── storage.ts          # Lưu trữ Offline & Logic Rollover
│   │   ├── backup.ts           # Xuất/Nhập file sao lưu ra Files / iCloud
│   │   ├── notifications.ts    # Lên lịch thông báo sáng 08:00 / chiều 18:00
│   │   └── updater.ts          # Check GitHub Release tag API
│   ├── types/
│   │   └── todo.ts             # TypeScript definitions
│   ├── constants/
│   │   └── theme.ts            # Bảng màu Apple Minimalist Cute
│   └── utils/
│       └── haptics.ts          # Rung phản hồi Taptic Engine iOS
├── .github/
│   └── workflows/
│       └── release.yml         # CI/CD tự động build khi push tag
├── app.json                    # Cấu hình iOS (Notch, bundle identifier, icon)
├── eas.json                    # Cấu hình EAS Build
└── package.json
```

---

*Phát triển với tất cả tình yêu dành cho người dùng iPhone 13 mini và các "sen" yêu mèo! 🐱🧡*
