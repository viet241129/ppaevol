# HƯỚNG DẪN KIỂM THỬ TOÀN BỘ CHỨC NĂNG HỆ THỐNG PPAEVOL

Tài liệu này cung cấp bộ công cụ kiểm thử tự động và danh sách kịch bản kiểm thử (Test Checklist) cho toàn bộ chức năng của ứng dụng **ppaevol**.

---

## I. CÔNG CỤ TEST TỰ ĐỘNG (AUTOMATED TEST SUITE)

Hệ thống đã được tích hợp bộ script kiểm tra tự động tại `scripts/test-all.mjs`.

### 1. Cách chạy bài test tự động:
Mở terminal tại thư mục gốc của dự án và chạy một trong các lệnh sau:

```bash
# Chạy bài test sức khỏe toàn diện hệ thống:
npm.cmd test
# hoặc:
node scripts/test-all.mjs

# Chạy bài test kèm kiểm tra biên dịch Next.js (TypeScript & Production Build):
node scripts/test-all.mjs --build
```

### 2. Bất cứ khi nào bạn cần kiểm tra:
Bạn chỉ cần nhắn với Trợ lý AI:
> **"Test hộ tôi xem web có bị lỗi gì không"**

Trợ lý sẽ tự động chạy script, đối chiếu database, kiểm tra schema, storage, API và báo cáo chi tiết cho bạn!

---

## II. DANH SÁCH HẠNG MỤC TEST TỰ ĐỘNG QUÉT

Bài test tự động sẽ quét qua **10 khu vực cốt lõi** (hơn 30 tiêu chí):

1. **Khóa bảo mật & Môi trường (`.env.local`)**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
2. **Khởi tạo & Kết nối Supabase**:
   - Kiểm tra kết nối client và quyền admin.
   - Phát hiện sớm nếu dự án Supabase bị khóa (ví dụ: `exceed_egress_quota`).
3. **Database Schema Contract (Khớp 100% cột frontend gọi)**:
   - Bảng `profiles`: `id`, `role`, `display_name`, `mood`, `mood_emoji`, `status_message`, `lat`, `lng`, `is_pinged`, `pinged_by`, `location_updated_at`.
   - Bảng `couple_wishlists`: `id`, `title`, `item_name`, `price`, `estimated_price`, `link`, `url`, `owner_role`, `is_bought`.
   - Bảng `couple_todos`: `id`, `title`, `is_completed`, `created_at`, `created_by`.
   - Bảng `love_fund`: `id`, `balance`, `target_amount`, `amount`, `note`, `user_role`.
   - Bảng `special_dates`: `id`, `title`, `event_date`, `is_anniversary`.
   - Bảng `activity_logs`: `id`, `user_id`, `action`, `title`, `description`, `content`.
   - Bảng `locket_photos`: `id`, `photo_url`, `caption`, `user_role`, `is_deleted`.
   - Bảng `push_subscriptions`: `id`, `user_id`, `subscription`.
4. **Supabase Storage Bucket 'locket'**:
   - Kiểm tra sự tồn tại của bucket `locket`.
   - Kiểm tra trạng thái Public URL để ảnh hiển thị được.
5. **Kiểm thử thao tác Ghi/Đọc/Xóa (CRUD Test Simulation)**:
   - Ghi 1 bản ghi thử nghiệm vào `activity_logs`.
   - Đọc lại dữ liệu vừa ghi.
   - Xóa dọn dẹp bản ghi test (đảm bảo quyền RLS hoạt động hoàn hảo).
6. **Kiểm tra Logic dọn dẹp Locket 7 ngày**:
   - Quét truy vấn lọc ảnh cũ hơn 7 ngày (`lt('created_at', now - 7d)`).
7. **Kiểm tra Supabase Auth Admin Service**:
   - Kiểm tra API quản trị người dùng (phục vụ chức năng đổi mật khẩu bằng mã PIN `241105`).
8. **Hệ thống Web Push Notifications (VAPID)**:
   - Xác thực cặp khóa VAPID public/private.
9. **Bộ lọc chống tràn băng thông & Validator ảnh**:
   - Kiểm tra cơ chế chặn tuyệt đối chuỗi Base64 `data:image`.
   - Đảm bảo chỉ chấp nhận Public URL từ Storage.
10. **Cấu trúc File mã nguồn cốt lõi**:
    - Xác thực đầy đủ các file UI, API routes và thư viện logic.

---

## III. BẢNG KIỂM THỬ THỦ CÔNG TRÊN TRÌNH DUYỆT (MANUAL TEST PLAYBOOK)

Dưới đây là các bước để bạn hoặc người dùng trải nghiệm thực tế trên điện thoại & máy tính:

### 1. Module Xác thực & Đổi mật khẩu
- [ ] **Đăng nhập**: Mở `/login`, đăng nhập bằng email tài khoản Bạn Trai hoặc Bạn Gái.
- [ ] **Chuyển vai trò**: Kiểm tra vai trò hiển thị đúng (`boyfriend` hoặc `girlfriend`).
- [ ] **Quên/Đổi mật khẩu**: Bấm "Quên mật khẩu", nhập email, mã PIN `241105`, mật khẩu mới -> Thông báo đổi thành công và đăng nhập được với mật khẩu mới.

### 2. Module Hồ sơ & Trạng thái (Mood & Status)
- [ ] **Đổi tâm trạng**: Chọn một emoji/tâm trạng bất kỳ và lưu.
- [ ] **Trạng thái chữ**: Nhập câu trạng thái (Status message) và lưu.
- [ ] **Đồng bộ Realtime**: Mở 2 tab (1 Bạn Trai, 1 Bạn Gái) -> Bên này đổi thì bên kia tự cập nhật ngay.

### 3. Module Vị trí tự động ngầm (Silent Geolocation)
- [ ] **Tự động lấy vị trí khi mở web**: Khi mở app, trình duyệt xin quyền (nếu lần đầu) và cập nhật tọa độ không có popup gián đoạn.
- [ ] **Tự động cập nhật khi mở lại tab**: Chuyển sang tab khác rồi quay lại -> Dòng "Cập nhật lúc HH:mm" cập nhật giờ mới.
- [ ] **Làm mới thủ công**: Bấm nút icon xoay tròn nhỏ ở góc thẻ vị trí -> Tọa độ được làm mới.

### 4. Module Khoảng cách & Ping đối phương
- [ ] **Tính khoảng cách**: Hiển thị số km chính xác giữa 2 người.
- [ ] **Bấm Ping**: Bấm nút Ping -> Thẻ đối phương rung/nhấp nháy thông báo đối phương đang nhớ bạn.
- [ ] **Web Push**: Nếu đã bật thông báo, thiết bị đối phương nhận thông báo đẩy.

### 5. Module Khoảnh khắc Locket
- [ ] **Chọn ảnh từ Thư viện (iPhone/Android)**: Bấm chọn ảnh -> Hiển thị tùy chọn mở Thư viện ảnh hoặc Chụp ảnh mượt mà.
- [ ] **Nén ảnh Canvas**: Ảnh nặng được nén tự động về < 150KB (chiều dài tối đa 1080px).
- [ ] **Đăng ảnh**: Ảnh tải lên bucket 'locket' và lưu URL ngắn vào database (không lưu Base64).
- [ ] **Giới hạn 7 ngày**: Chỉ các ảnh trong vòng 7 ngày gần nhất hiển thị trên màn hình chính và Album.
- [ ] **Xóa mềm (Soft Delete)**: Bấm nút Xóa -> Ảnh chuyển sang trạng thái `is_deleted = true`, ẩn khỏi album chính.
- [ ] **Thùng rác (Chỉ Bạn Trai thấy)**:
  - Tài khoản Bạn Trai mở Album -> Thấy tab "Thùng rác (X ảnh trong 7 ngày)".
  - Tài khoản Bạn Gái -> Hoàn toàn không thấy tab này.
  - Bạn Trai có thể bấm "Khôi phục" -> Ảnh quay lại Album chính.

### 6. Module Danh sách việc cần làm (Todo List)
- [ ] **Thêm việc**: Nhập tên việc cần làm cùng nhau và thêm.
- [ ] **Tích hoàn thành**: Bấm dấu check -> Việc được gạch ngang hoàn thành.
- [ ] **Xóa việc**: Bấm xóa việc khỏi danh sách.

### 7. Module Danh sách mong ước (Wishlist)
- [ ] **Thêm món quà mong ước**: Nhập tên món đồ, giá dự kiến, link mua -> Dữ liệu lưu cả 2 trường `item_name` và `title`.
- [ ] **Đánh dấu đã mua**: Bấm hoàn thành món quà.
- [ ] **Xóa món đồ**: Xóa khỏi danh sách.

### 8. Module Quỹ tình yêu (Love Fund)
- [ ] **Nạp tiền vào quỹ**: Nhập số tiền và ghi chú -> Số dư quỹ tự động cộng dồn.
- [ ] **Xem tiến độ**: Thanh phần trăm tiến độ so với mục tiêu hiển thị trực quan.

### 9. Module Ngày kỷ niệm & Đếm ngày yêu
- [ ] **Bộ đếm ngày yêu**: Hiển thị chính xác số ngày yêu nhau từ mốc ban đầu.
- [ ] **Danh sách ngày đặc biệt**: Hiển thị các sự kiện/ngày kỷ niệm sắp tới.

### 10. Module Nhật ký hoạt động (Activity Logs)
- [ ] **Tự động ghi nhận**: Khi đổi mood, nạp quỹ, thêm việc... hệ thống tự ghi 1 dòng log.
- [ ] **Xem lịch sử**: Bấm icon Lịch sử/Nhật ký -> Danh sách hiển thị theo thứ tự thời gian mới nhất lên đầu.
