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

## Nội dung công khai P2

- `GET /api/topics`: danh sách phân trang; hỗ trợ `page`, `pageSize` (tối đa 50),
  `keyword`, `type` (`Article`/`Question`), `categoryId` và `tagId`.
- `GET /api/topics/{id}`: chi tiết nội dung công khai hoặc Problem Details 404.

Endpoint công khai chỉ đọc nội dung `Published`, có thời điểm xuất bản, chưa xóa
mềm và chưa bị kiểm duyệt ẩn. Thứ tự ổn định: ghim trước, sau đó thời điểm xuất
bản và `id` giảm dần. DTO tác giả chỉ có `id` và `displayName`, không trả email.

`Draft`/`Published` là trạng thái vòng đời; `IsDeleted`,
`IsHiddenByModerator`, `IsDiscussionLocked` và `IsPinned` là các trạng thái độc
lập. HTML seed là nội dung development tin cậy; endpoint ghi ở P3 chỉ được mở sau
khi có bước làm sạch HTML phía server.

## Upload media P3

- `POST /api/media/images`: multipart field `file`, hỗ trợ PNG/JPEG/GIF/WebP,
  tối đa 5 MB.
- `POST /api/media/videos`: multipart field `file`, hỗ trợ MP4/WebM, tối đa 50 MB.

Hai endpoint yêu cầu cookie đăng nhập và CSRF header. Backend kiểm tra cả MIME và
magic bytes, bỏ tên file client và lưu bằng GUID trong `App_Data/uploads` (đã
ignore Git). Mỗi upload có bản ghi chủ sở hữu trong `MediaAssets`. Contract trả
về có dạng
`{ "id": "guid", "link": "http://localhost:5045/media/images/{guid}.png", "path": "/media/images/{guid}.png" }`.
`link` là URL tuyệt đối để Froala hiển thị khi FE/BE khác origin; `path` là đường
dẫn nội bộ phải được gửi trong HTML khi tạo nội dung.

- `DELETE /api/media/{id}`: chỉ chủ sở hữu được xóa media chưa gắn vào nội dung;
  trả 404 nếu không tồn tại/không thuộc tài khoản và 409 nếu đã được sử dụng.

Có thể đổi giới hạn bằng `Media__MaxImageBytes` và `Media__MaxVideoBytes`; không
đặt `Media__StoragePath` ra ngoài thư mục backend. Media chưa gắn vào chủ đề được
dọn sau 24 giờ theo mặc định; cấu hình bằng `Media__OrphanRetentionHours`,
`Media__CleanupIntervalMinutes` và `Media__CleanupBatchSize`.

Editor chưa bật media cho tới khi luồng gắn ownership vào chủ đề và allowlist URL
`/media/` trong sanitizer hoàn tất.

Khi tạo chủ đề, client gửi thêm `mediaIds` chứa ID media thực sự xuất hiện trong
`bodyHtml`. Backend chỉ nhận media chưa dùng của chính tác giả, đối chiếu URL sau
khi làm sạch HTML và gắn chúng với chủ đề trong cùng lần `SaveChanges`. Media đã
gắn không còn được xóa bằng endpoint media riêng.

### Quản lý nội dung của thành viên

- `GET /api/topics/mine/{id}`: lấy nội dung chưa xóa của chính tài khoản để sửa.
- `PUT /api/topics/{id}`: cập nhật metadata, HTML, thẻ, media và trạng thái
  nháp/xuất bản; slug giữ ổn định.
- `DELETE /api/topics/{id}`: xóa mềm nội dung của chính tài khoản.

Tài nguyên không tồn tại hoặc không thuộc tài khoản đều trả 404 để không lộ dữ
liệu của người khác. Xóa chủ đề hiện là xóa mềm nên câu trả lời không bị xóa vật
lý; chính sách cho phép tác giả xóa khi đã có phản hồi vẫn cần được chốt.

## Câu trả lời P4

- `GET /api/topics/{topicId}/answers?page=1&pageSize=20`: danh sách câu trả lời
  công khai, phân trang tối đa 50 phần tử và sắp theo thời điểm tạo rồi `id` tăng
  dần để giữ đúng thứ tự hội thoại.
- `POST /api/topics/{topicId}/answers`: thành viên đã đăng nhập gửi
  `{ "bodyHtml": "<p>Nội dung trả lời</p>" }`, trả HTTP 201.
- `PUT /api/topics/{topicId}/answers/{answerId}/accepted`: tác giả của chủ đề
  loại Câu hỏi chọn hoặc thay đổi câu trả lời được chấp nhận, trả HTTP 200.

Backend làm sạch HTML trước khi lưu. Chủ đề không công khai trả 404; chủ đề đã
khóa thảo luận trả 409; dữ liệu rỗng hoặc quá 20.000 ký tự trả Validation Problem
HTTP 400. P4 chưa triển khai sửa/xóa phản hồi vì chính sách này chưa được chốt.
Trường `isAccepted` trong DTO câu trả
lời cho biết lựa chọn hiện tại; chỉ câu hỏi công khai và câu trả lời thuộc đúng
chủ đề mới được chấp nhận.

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
