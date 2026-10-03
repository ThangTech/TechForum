# TechForum frontend

Giao diện React + TypeScript + Vite cho TechForum.

## Chạy môi trường phát triển

API mặc định được gọi tại `http://localhost:5045`. Có thể đổi địa chỉ bằng cách
sao chép `.env.example` thành `.env.local` và sửa `VITE_API_BASE_URL`.

```powershell
npm install
npm run dev
```

Mở `http://localhost:5173`. Backend cần chạy trước bằng launch profile `http` để
frontend tải danh sách chuyên mục thật.

Frontend dùng cookie phiên HttpOnly nên địa chỉ chạy local phải khớp origin CORS
trong backend. Không đổi `localhost` thành `127.0.0.1` nếu chưa cập nhật allowlist.

Các route P1:

- `/dang-nhap`: đăng nhập, hỗ trợ `returnUrl` nội bộ.
- `/dang-ky`: đăng ký thành viên và tự tạo phiên.
- `/tai-khoan`: route riêng tư, hiển thị dữ liệu từ `GET /api/auth/me` và đăng xuất.

API client tự lấy antiforgery token trước request ghi và luôn gửi cookie bằng
`credentials: include`. Không lưu cookie hoặc token xác thực trong localStorage.

## Kiểm tra

```powershell
npm run lint
npm run build
```
