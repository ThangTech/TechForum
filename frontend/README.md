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

API client tự lấy antiforgery token trước request ghi và luôn gửi cookie bằng
`credentials: include`. Không lưu cookie hoặc token xác thực trong localStorage.

## Kiểm tra

```powershell
npm run lint
npm run build
```
