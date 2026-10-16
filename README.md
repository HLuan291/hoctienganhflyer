# English Quest — bản tài khoản riêng

Đây là bản chuyển từ `chatgpt.site` sang **Cloudflare Workers + D1** để phụ huynh tạo tài khoản học sinh. Bé đăng nhập bằng tên và mã truy cập riêng; không dùng tài khoản ChatGPT hoặc email của trẻ. Tiến độ được lưu trên máy chủ và đồng bộ giữa các thiết bị.

## Đã có

- Phụ huynh tạo tài khoản bé, nhận mã truy cập một lần, có thể tạo mã mới khi bé quên hoặc xóa tài khoản và tiến độ.
- Bé chỉ xem và lưu tiến độ của mình. Phụ huynh xem tiến độ của các bé trong tài khoản mình tạo.
- Kiểm tra đầu vào từng kỹ năng; bài vượt cấp Từ vựng, Nghe, Đọc gồm 11–12 câu và cần đúng toàn bộ. Viết và Nói vẫn cần người lớn xem sản phẩm thật.
- Trò chơi tình huống, thẻ từ, ví dụ dùng từ, lịch sử điểm/thời gian, danh hiệu và quà ảo.
- Tải/nhập bản sao tiến độ JSON. Không tự chuyển dữ liệu qua hai tên miền vì trình duyệt cô lập bộ nhớ theo tên miền.

## Triển khai trên Cloudflare

Cần tài khoản Cloudflare do phụ huynh quản lý. Không chia sẻ mật khẩu Cloudflare hoặc mã truy cập học sinh trong chat.

1. Cài Node.js 24, chạy `npm install` rồi `npm run build` trong thư mục này.
2. Chạy `npx wrangler login` để kết nối tài khoản Cloudflare.
3. Chạy `npx wrangler d1 create english-quest-family`. Chép `database_id` được trả về vào `wrangler.jsonc` thay cho `REPLACE_WITH_CLOUDFLARE_D1_ID`.
4. Chạy `npx wrangler d1 execute english-quest-family --remote --file=schema.sql`.
5. Tạo **hai chuỗi bí mật khác nhau**, mỗi chuỗi ít nhất 32 ký tự ngẫu nhiên. Có thể dùng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` hai lần. Lưu cả hai trong trình quản lý mật khẩu của phụ huynh.
6. Chạy `npx wrangler secret put AUTH_PEPPER`, nhập chuỗi thứ nhất. Chạy `npx wrangler secret put SETUP_KEY`, nhập chuỗi thứ hai.
7. Chạy `npm run deploy`. Cloudflare sẽ trả về địa chỉ HTTPS `workers.dev`; có thể gắn tên miền riêng sau.
8. Mở địa chỉ, nhập `SETUP_KEY` ở mục thiết lập ban đầu. Trang sẽ tạo mã truy cập phụ huynh và **chỉ hiện một lần**. Đăng nhập, tạo tài khoản của bé rồi lưu mã của bé.

Nếu phụ huynh quên mã, dùng `SETUP_KEY` ở mục khôi phục trên màn hình đăng nhập. Nếu mất `AUTH_PEPPER`, các mã truy cập hiện tại không dùng được và cần quy trình khôi phục trực tiếp trong cơ sở dữ liệu; hãy sao lưu chuỗi này cẩn thận.

## Chuyển tiến độ từ trang cũ

Trên trang cũ, vào **Góc phụ huynh → Tải bản sao tiến độ**. Trên trang mới, phụ huynh mở hồ sơ bé → **Góc phụ huynh → Nhập bản sao**. Chỉ nhập vào đúng tài khoản học sinh. Hồ sơ “Bé” trên trang cũ hiện chưa có bài kiểm tra hoặc tiến độ thực tế, nên không có gì cần chuyển nếu chưa dùng thêm.

## Giới hạn cần biết

Nội dung hiện có 96 từ và 12 chặng mỗi kỹ năng. Đây là bản nền để kiểm tra luồng học, **chưa đủ thành chương trình Movers–Flyers 5 tháng**. Điểm vượt cấp được tính từ câu trả lời trong trình duyệt nên chỉ gợi ý bài học, không chứng minh trình độ theo Cambridge. Nhận diện lời đọc dùng khả năng của trình duyệt, có thể gửi âm thanh tới dịch vụ của trình duyệt; phụ huynh nên quyết định trước khi cho bé dùng micro. Bản này chưa được triển khai trên Cloudflare; cần tài khoản Cloudflare của phụ huynh để xuất bản.

Trang này không dùng công cụ theo dõi, quảng cáo hay email của bé. Phụ huynh chịu trách nhiệm quản lý mã truy cập, dữ liệu học tập và quyền riêng tư khi xuất bản cho trẻ.

