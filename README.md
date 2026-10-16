# English Quest — bản tài khoản riêng

Đây là bản chuyển từ `chatgpt.site` sang **Cloudflare Workers + D1** để phụ huynh tạo tài khoản học sinh. Phụ huynh và bé có thể đăng nhập bằng tài khoản Google riêng; đăng nhập bằng mã cũ chỉ dùng cho hồ sơ đã tạo trước đó. Tiến độ được lưu trên máy chủ và đồng bộ giữa các thiết bị.

## Trang đang chạy

https://english-quest-family.snowy-fog-8e71.workers.dev/

Worker và D1 đã được triển khai trên tài khoản Cloudflare của phụ huynh. Tài khoản phụ huynh tạo bằng mã trước đây được giữ nguyên; khi phụ huynh đăng nhập Google lần đầu bằng tài khoản đã cấu hình, web nối Google vào tài khoản đó. Phụ huynh tự thêm email Google riêng của bé sau khi đăng nhập. Không đưa `SETUP_KEY` hay `AUTH_PEPPER` lên GitHub.

## Đã có

- Phụ huynh thêm tài khoản Google của bé; bé đăng nhập Google lần đầu để nối hồ sơ. Email bé được băm khi chờ nối, không lưu dạng rõ và không hiện trong danh sách hồ sơ. Phụ huynh có thể sửa lời mời trước khi bé đăng nhập.
- Bé chỉ xem và lưu tiến độ của mình. Phụ huynh xem tiến độ của các bé trong tài khoản mình tạo.
- Kiểm tra đầu vào từng kỹ năng; bài vượt cấp Từ vựng, Nghe, Đọc gồm 11–12 câu và cần đúng toàn bộ. Viết và Nói vẫn cần người lớn xem sản phẩm thật.
- Trò chơi tình huống, thẻ từ, ví dụ dùng từ, lịch sử điểm/thời gian, danh hiệu và quà ảo.
- Bài Nói có ghi âm tối đa 20 giây và chấm mức khớp câu mẫu bằng Cloudflare Workers AI Whisper; giới hạn 25 lượt/hồ sơ/ngày. Bé có thể luyện nói tự do theo gợi ý nhưng phần này cần phụ huynh nghe lại. Điểm tự động không đo chất lượng phát âm từng âm.
- Tải/nhập bản sao tiến độ JSON. Không tự chuyển dữ liệu qua hai tên miền vì trình duyệt cô lập bộ nhớ theo tên miền.

## Triển khai lại trên Cloudflare

Cần tài khoản Cloudflare do phụ huynh quản lý. Không chia sẻ mật khẩu Cloudflare hoặc mã truy cập học sinh trong chat.

Để cập nhật web trên **tài khoản Cloudflare hiện tại**, chạy `npm install`, áp dụng `migrations/001_google_auth.sql` và `migrations/002_speech_usage.sql` một lần cho D1, cấu hình Google bên dưới rồi chạy `npm run deploy`. Giữ nguyên D1, `AUTH_PEPPER` và `SETUP_KEY`; thay `AUTH_PEPPER` sẽ làm hỏng mã truy cập và lời mời Google hiện tại. Các bước sau dành cho lúc chuyển sang tài khoản Cloudflare khác:

1. Cài Node.js 24, chạy `npm install` rồi `npm run build` trong thư mục này.
2. Chạy `npx wrangler login` để kết nối tài khoản Cloudflare.
3. Chạy `npx wrangler d1 create english-quest-family` rồi thay `database_id` trong `wrangler.jsonc` bằng ID mới. Không chạy lại bước này cho cơ sở dữ liệu hiện có.
4. Chạy `npx wrangler d1 execute english-quest-family --remote --file=schema.sql`.
5. Tạo **hai chuỗi bí mật khác nhau**, mỗi chuỗi ít nhất 32 ký tự ngẫu nhiên. Có thể dùng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` hai lần. Lưu cả hai trong trình quản lý mật khẩu của phụ huynh.
6. Chạy `npx wrangler secret put AUTH_PEPPER`, nhập chuỗi thứ nhất. Chạy `npx wrangler secret put SETUP_KEY`, nhập chuỗi thứ hai.
7. Chạy `npm run deploy`. Cloudflare sẽ trả về địa chỉ HTTPS `workers.dev`; có thể gắn tên miền riêng sau.
8. Cấu hình Google và mở địa chỉ. Phụ huynh tự bấm đăng nhập Google để tạo hồ sơ quản lý, rồi nhập Google của bé ở phần thêm hồ sơ.

## Cấu hình đăng nhập Google

1. Trong Google Cloud của phụ huynh, tạo dự án và thiết lập **Google Auth Platform** cho đối tượng bên ngoài (External). Tạo **OAuth client ID** loại Web application. Chỉ yêu cầu thông tin đăng nhập cơ bản; web không cần quyền đọc Drive, Gmail hay thông tin khác.
2. Thêm `https://english-quest-family.snowy-fog-8e71.workers.dev` vào **Authorized JavaScript origins**. Nếu dùng tên miền riêng, thêm đúng origin của tên miền đó.
3. Đặt client ID vào biến công khai `GOOGLE_CLIENT_ID` trong `wrangler.jsonc`. Đặt giá trị băm SHA-256 của `${AUTH_PEPPER}:google-email:<email Google của phụ huynh>` vào secret `PARENT_GOOGLE_EMAIL_HASH`; tuyệt đối không đưa `AUTH_PEPPER` hoặc email thật của gia đình vào kho mã.
4. Chạy `npx wrangler d1 execute english-quest-family --remote --file=migrations/001_google_auth.sql --yes` một lần trên D1 đang dùng. D1 mới đã có cột Google từ `schema.sql`, không chạy migration trên D1 mới.
5. Chạy `npm run build` và `node --test scripts/test.mjs`, rồi `npm run deploy`. Kiểm tra nút Google trên trang thật. Phụ huynh là người đầu tiên bấm nút đăng nhập bằng đúng Google đã cấu hình; không có tài khoản nào được tạo tự động khi triển khai.

Nếu phụ huynh quên mã, dùng `SETUP_KEY` ở mục khôi phục trên màn hình đăng nhập. Nếu mất `AUTH_PEPPER`, các mã truy cập hiện tại không dùng được và cần quy trình khôi phục trực tiếp trong cơ sở dữ liệu; hãy sao lưu chuỗi này cẩn thận.

## Chuyển tiến độ từ trang cũ

Trên trang cũ, vào **Góc phụ huynh → Tải bản sao tiến độ**. Trên trang mới, phụ huynh mở hồ sơ bé → **Góc phụ huynh → Nhập bản sao**. Chỉ nhập vào đúng tài khoản học sinh. Hồ sơ “Bé” trên trang cũ hiện chưa có bài kiểm tra hoặc tiến độ thực tế, nên không có gì cần chuyển nếu chưa dùng thêm.

## Giới hạn cần biết

Nội dung hiện có 96 từ và 12 chặng mỗi kỹ năng. Đây là bản nền để kiểm tra luồng học, **chưa đủ thành chương trình Movers–Flyers 5 tháng**. Điểm vượt cấp được tính từ câu trả lời trong trình duyệt nên chỉ gợi ý bài học, không chứng minh trình độ theo Cambridge. Bài nói chấm độ khớp bản phiên âm, không chấm chất lượng từng âm; nhận diện từ vựng dùng khả năng của trình duyệt. Phụ huynh nên quyết định trước khi cho bé dùng micro.

Trang này không dùng công cụ theo dõi hoặc quảng cáo. Google nhận yêu cầu đăng nhập khi người dùng bấm nút Google; ứng dụng chỉ lưu mã nhận dạng Google và giá trị băm của email bé trong lúc chờ nối tài khoản. Phụ huynh chịu trách nhiệm quản lý tài khoản Google của trẻ, dữ liệu học tập và quyền riêng tư khi xuất bản cho trẻ.

