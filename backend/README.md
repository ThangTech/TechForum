# TechForum API

## Chạy môi trường phát triển

API dùng .NET 9, EF Core và SQL Server. Cấu hình mặc định trong
`appsettings.Development.json` dùng SQL Server mặc định trên máy với Windows
authentication và tạo cơ sở dữ liệu `TechForumDev`.

Có thể thay connection string mà không sửa file được commit:

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=DESKTOP-5J0CNUJ;Database=TechForumDev;Trusted_Connection=True;Encrypt=False"
dotnet run --launch-profile http
```

Không commit mật khẩu. Khi dùng SQL authentication, đặt connection string bằng
biến môi trường, .NET user secrets hoặc `appsettings.Local.json` (đã được ignore).
`Encrypt=False` chỉ dành cho SQL Server local phục vụ phát triển; môi trường triển
khai phải bật mã hóa và dùng chứng thư hợp lệ.

Ở môi trường Development, ứng dụng tự áp dụng migration còn thiếu và seed riêng
từng nhóm dữ liệu khi bảng `Categories` hoặc `Tags` tương ứng đang rỗng. Các môi
trường khác không tự migrate và không seed.

## Endpoint M1

- `GET /api/categories`: danh sách chuyên mục, sắp theo `displayOrder`, `name`, `id`.
- `GET /api/categories/{id}`: chi tiết hoặc Problem Details HTTP 404.

Luồng xử lý cho chức năng chuyên mục là
`CategoriesController` → `CategoryService` → `CategoryRepository` → EF Core.

## Thẻ công khai P2

- `GET /api/tags`: danh sách thẻ đang hoạt động, sắp theo `name`, `id`.
- `GET /api/tags/{id}`: chi tiết thẻ đang hoạt động hoặc Problem Details HTTP 404.

Entity `Tag` có `IsActive` để hỗ trợ ngừng sử dụng ở phần quản trị sau này, nhưng
DTO công khai không lộ cờ nội bộ này. Luồng xử lý là
`TagsController` → `TagService` → `TagRepository` → EF Core.

## Xác thực P1

Xác thực dùng ASP.NET Core Identity và cookie `TechForum.Auth` HttpOnly. Client
phải gửi cookie bằng `credentials: include`. Mọi request ghi cần lấy token từ
`GET /api/auth/antiforgery-token` rồi gửi token trong header `X-CSRF-TOKEN`.

- `POST /api/auth/register`: đăng ký thành viên và tạo phiên, trả HTTP 201.
- `POST /api/auth/login`: đăng nhập, trả HTTP 200; sai thông tin là 401; tài
  khoản bị khóa là 423.
- `GET /api/auth/me`: thông tin của chính tài khoản đang đăng nhập.
- `POST /api/auth/logout`: kết thúc phiên hiện tại, trả HTTP 204.

Đăng ký luôn gán role `Member`; client không được gửi hoặc tự chọn role. Sau 5
lần đăng nhập sai, tài khoản bị khóa 15 phút. Middleware kiểm tra trạng thái khóa
trên mỗi request có phiên nên cookie cũ không tiếp tục dùng được.

Mật khẩu phát triển phải có ít nhất 8 ký tự, chữ hoa, chữ thường, chữ số và ký
tự đặc biệt. Không ghi mật khẩu thật hoặc cookie phiên vào source/log.

## Kiểm thử backend

```powershell
cd ..\backend.Tests
dotnet test
```
