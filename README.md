# English Quest — hành trình Movers đến Flyers

Web học tiếng Anh cho một học sinh lớp 5. Trang chạy trên Cloudflare Workers, lưu tiến độ trong D1 và đồng bộ giữa các thiết bị qua một **liên kết riêng**. Giao diện học không có màn hình đăng nhập. Người có liên kết riêng có thể xem và sửa tiến độ; không đưa liên kết vào GitHub hoặc nơi công khai.

Trang đang chạy: https://english-quest-family.snowy-fog-8e71.workers.dev/

## Chức năng

- Năm lộ trình Từ vựng, Nghe, Đọc, Viết và Nói, mỗi lộ trình 12 cấp nhỏ từ Movers đến Flyers.
- Kiểm tra đầu vào và bài vượt cấp; 312 câu nghe/đọc biên soạn riêng được xoay vòng qua các lượt học.
- Thẻ từ, ví dụ dùng từ, trò chơi tình huống, điểm trên thang 10, thời gian, danh hiệu và quà ảo.
- Bài nói có thể dùng Cloudflare Workers AI để nhận diện nội dung câu đọc; không chấm chính xác từng âm. Tối đa 25 lượt chấm mỗi ngày cho hồ sơ.
- Tải và nhập bản sao tiến độ trong Góc phụ huynh.

## Dữ liệu và triển khai

Tiến độ hiện có nằm trong bảng `progress` và được giữ nguyên khi chuyển từ tài khoản Google sang liên kết riêng. Bảng `solo_links` chỉ giữ **giá trị băm** của khóa trong liên kết. Trình duyệt giữ khóa trong cookie `HttpOnly` để đồng bộ, và giữ bản tạm trong `localStorage` khi có thay đổi chưa gửi được. Nếu hai thiết bị sửa cùng lúc, máy chủ yêu cầu hợp nhất thay vì ghi đè im lặng.

Trước khi triển khai bản này trên D1 cũ, áp dụng `migrations/003_solo_links.sql` một lần. Với D1 mới, `schema.sql` đã gồm bảng đó. Người quản lý tạo khóa ngẫu nhiên 32 byte, lưu bản gốc ở nơi riêng tư, rồi chèn giá trị SHA-256 của khóa và ID hồ sơ học sinh vào `solo_links`. Liên kết có dạng `https://<host>/start/<khóa 64 ký tự hex>`. Không đưa khóa gốc vào mã nguồn hay biến công khai. Giữ nguyên D1 và các secret máy chủ khi triển khai lại.

Chạy `npm run build`, `node --test scripts/test.mjs scripts/test-questions.mjs`, rồi `npx wrangler deploy` trên tài khoản Cloudflare đang sở hữu Worker. Cấu hình đăng nhập cũ được giữ trong mã để có thể khôi phục dữ liệu, nhưng các API tài khoản trả lỗi `410` ở bản chạy hiện tại. Không bật `LEGACY_AUTH_ENABLED` trên bản dành cho bé.

## Giới hạn

Nội dung hiện có 96 từ và 12 chặng mỗi kỹ năng; chưa đủ thay thế toàn bộ chương trình Movers–Flyers kéo dài 5 tháng. Điểm vượt cấp là gợi ý học tập, không phải điểm thi Cambridge. Phụ huynh cần xem bài nói tự do và bài viết mở.

