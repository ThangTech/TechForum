# TechForum frontend

Giao diện React + TypeScript + Vite cho TechForum.

## Chạy môi trường phát triển

API mặc định được gọi tại `http://localhost:5045`. Có thể đổi địa chỉ bằng cách
sao chép `.env.example` thành `.env.local` và sửa `VITE_API_BASE_URL`.
Nếu có license Froala hợp lệ, đặt activation key trong `VITE_FROALA_KEY` của
`.env.local`; không commit key. Khi để trống, trang soạn chạy chế độ đánh giá và
giữ nguyên attribution của Froala.

```powershell
npm install
npm run dev
```

Mở `http://localhost:5173`. Backend cần chạy trước bằng launch profile `http` để
frontend tải danh sách chuyên mục thật.

Frontend dùng cookie phiên HttpOnly nên địa chỉ chạy local phải khớp origin CORS
trong backend. Không đổi `localhost` thành `127.0.0.1` nếu chưa cập nhật allowlist.

Các route chính:

- `/login`: đăng nhập, hỗ trợ `returnUrl` nội bộ.
- `/register`: đăng ký thành viên và tự tạo phiên.
- `/account`: route riêng tư, cập nhật tên hiển thị, đổi mật khẩu và đăng xuất.
- `/settings`: tùy chỉnh cá nhân, hiện cho phép chạy lại tour hướng dẫn trang Bài viết.
- `/notifications`: thông báo riêng của tài khoản, hiển thị số chưa đọc thật trên header.
- `/activity`: lịch sử nội dung và câu trả lời công khai của tài khoản hiện tại.
- `/skills/:tagId`: thống kê nội dung và thành viên sử dụng một kỹ năng/thẻ.
- `/search`: tìm đồng thời bài viết và câu hỏi, giữ từ khóa/bộ lọc trên URL.
- `/saved`: danh sách nội dung đã lưu của tài khoản, phân trang bằng API thật.
- `/articles`, `/questions`: duyệt, tìm kiếm và phân trang nội dung công khai.
- `/discussions`: chủ đề có phản hồi, sắp theo hoạt động thảo luận gần nhất.
- `/topics/:id`, `/members/:userId`: chi tiết, câu trả lời và hồ sơ tác giả công khai.
- `/write`: route riêng tư dùng Froala để lưu bản nháp hoặc xuất bản, hỗ trợ
  upload ảnh/video qua TechForum API.

Khu vực thảo luận gọi API thật tại `/api/topics/{topicId}/answers`. Khách đọc
được câu trả lời và được yêu cầu đăng nhập khi muốn phản hồi; thành viên có thể
gửi văn bản, còn chủ đề bị khóa không hiển thị form gửi.
Tác giả của Câu hỏi có thể chọn hoặc thay đổi câu trả lời được chấp nhận ngay
trong danh sách; Bài viết không hiển thị thao tác này.
Chi tiết nội dung hiển thị số Sao hữu ích từ API. Thành viên có thể thêm/bỏ một
sao; khách bấm thao tác này sẽ nhận modal yêu cầu đăng nhập dùng chung.
Lưu bài dùng trạng thái riêng với Sao hữu ích; số lượt lưu hiển thị trên chi tiết
và danh sách cá nhân chỉ chứa nội dung còn công khai.

Trang chủ dùng Intro.js 8.6.0 cho tour tìm kiếm, loại nội dung, viết bài và tài
khoản. Trạng thái hoàn tất được lưu riêng theo khách/tài khoản trong trình duyệt;
thành viên có thể chạy lại từ menu **Tùy chỉnh**. Intro.js dùng giấy phép
AGPL-3.0; phù hợp với đồ án phi thương mại khi dự án tuân thủ điều kiện giấy
phép. Nếu triển khai thương mại, cần rà soát và mua license phù hợp từ Intro.js.

Thông báo hiện được tạo khi câu trả lời của thành viên được tác giả câu hỏi chấp
nhận. Header tải `unreadCount` từ backend; mở một thông báo chưa đọc sẽ đánh dấu
đã đọc rồi mới điều hướng đến đúng câu trả lời.

Cột phải trang duyệt gọi `/api/question-highlights` để hiển thị câu hỏi mới và
câu hỏi nhiều phản hồi trong 30 ngày; không dùng số liệu tĩnh.

Hồ sơ công khai hiển thị người theo dõi, Sao hữu ích nhận được, kỹ năng suy ra
từ thẻ của nội dung công khai và danh hiệu theo ngưỡng dữ liệu thật. Thành viên
có thể theo dõi/bỏ theo dõi người khác; khách dùng modal đăng nhập chung.

Header desktop đặt Bài viết/Hỏi đáp/Thảo luận cạnh logo, sau đó mới tới tìm kiếm.
Nút bút dùng menu Astryx với hai lựa chọn `Viết bài` và `Đặt câu hỏi`. Trang `/`
là danh sách Bài viết; không còn mục Trang chủ trùng nghĩa. Giao diện dùng Roboto
cho nội dung và Open Sans cho tiêu đề; font được tải từ Google Fonts nên khi máy
không có mạng sẽ dùng fallback hệ thống.

API client tự lấy antiforgery token trước request ghi và luôn gửi cookie bằng
`credentials: include`. Không lưu cookie hoặc token xác thực trong localStorage.

## Kiểm tra

```powershell
npm run lint
npm run build
```
