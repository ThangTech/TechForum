# TechForum API

## Chạy môi trường phát triển

API dùng .NET 9, EF Core và SQL Server. Cấu hình mặc định trong
`appsettings.Development.json` dùng SQL Server mặc định trên máy với Windows
authentication và tạo cơ sở dữ liệu `TechForumDev`.

Có thể thay connection string mà không sửa file được commit:

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=localhost;Database=TechForumDev;Trusted_Connection=True;Encrypt=False"
dotnet run --launch-profile http
```

Không commit mật khẩu. Khi dùng SQL authentication, đặt connection string bằng
biến môi trường, .NET user secrets hoặc `appsettings.Local.json` (đã được ignore).
`Encrypt=False` chỉ dành cho SQL Server local phục vụ phát triển; môi trường triển
khai phải bật mã hóa và dùng chứng thư hợp lệ.

Ở môi trường Development, ứng dụng tự áp dụng migration còn thiếu và chỉ thêm dữ
liệu mẫu khi bảng `Categories` đang rỗng. Các môi trường khác không tự migrate và
không seed.

## Endpoint M1

- `GET /api/categories`: danh sách chuyên mục, sắp theo `displayOrder`, `name`, `id`.
- `GET /api/categories/{id}`: chi tiết hoặc Problem Details HTTP 404.

Luồng xử lý cho chức năng chuyên mục là
`CategoriesController` → `CategoryService` → `CategoryRepository` → EF Core.
