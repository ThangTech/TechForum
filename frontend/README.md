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
- `/account`: route riêng tư, hiển thị dữ liệu từ `GET /api/auth/me` và đăng xuất.
- `/settings`: tùy chỉnh cá nhân, hiện cho phép chạy lại tour hướng dẫn trang chủ.
- `/notifications`: thông báo riêng của tài khoản, hiển thị số chưa đọc thật trên header.
- `/saved`: danh sách nội dung đã lưu của tài khoản, phân trang bằng API thật.
- `/articles`, `/questions`: duyệt, tìm kiếm và phân trang nội dung công khai.
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

API client tự lấy antiforgery token trước request ghi và luôn gửi cookie bằng
`credentials: include`. Không lưu cookie hoặc token xác thực trong localStorage.

## Kiểm tra

```powershell
npm run lint
npm run build
```
