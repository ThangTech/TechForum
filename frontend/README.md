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

- `/dang-nhap`: đăng nhập, hỗ trợ `returnUrl` nội bộ.
- `/dang-ky`: đăng ký thành viên và tự tạo phiên.
- `/tai-khoan`: route riêng tư, hiển thị dữ liệu từ `GET /api/auth/me` và đăng xuất.
- `/bai-viet`, `/hoi-dap`: duyệt, tìm kiếm và phân trang nội dung công khai.
- `/noi-dung/:id`, `/thanh-vien/:userId`: chi tiết và hồ sơ tác giả công khai.
- `/viet-bai`: route riêng tư dùng Froala để lưu bản nháp hoặc xuất bản. Ảnh/video
  chưa bật cho tới khi endpoint upload backend hoàn tất.

API client tự lấy antiforgery token trước request ghi và luôn gửi cookie bằng
`credentials: include`. Không lưu cookie hoặc token xác thực trong localStorage.

## Kiểm tra

```powershell
npm run lint
npm run build
```
