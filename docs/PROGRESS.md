# Tiến độ phát triển TechForum

Cập nhật: 2026-10-03

Tài liệu này chỉ đánh dấu một mục **đạt** khi đã có bằng chứng build, kiểm thử tự
động hoặc kiểm thử tích hợp phù hợp. Số phần trăm không được suy ra từ số màn hình.

## P0 — Audit hiện trạng

### Đã xác nhận

- [x] Repository dùng React 19.2 + TypeScript 6 + Vite 8 ở frontend.
- [x] Backend dùng ASP.NET Core 9, EF Core 9.0.9 và SQL Server.
- [x] Luồng chuyên mục hiện tại là Controller → Service → Repository → DbContext.
- [x] Migration `InitialCategories` tạo bảng `Categories` và unique index cho slug.
- [x] API công khai `GET /api/categories` và `GET /api/categories/{id}` đã có.
- [x] Frontend M1 gọi API chuyên mục thật, có loading/empty/error/retry.
- [x] Baseline ngày 2026-10-03: backend build sạch; frontend lint và build sạch.
- [x] Branch `master` đồng bộ `origin/master` trước khi bắt đầu P1.

### Chưa có

- [x] Backend có 4 test service xác thực; frontend chưa có test tự động.
- [ ] Xác thực, phân quyền, phiên và tài khoản bị khóa.
- [ ] Bài viết/câu hỏi, thẻ, tìm kiếm và phân trang (phần đọc công khai đã có;
  phần tạo/sửa và hồ sơ công khai chưa có).
- [ ] Soạn thảo, upload media và làm sạch HTML.
- [ ] Thảo luận, câu trả lời được chấp nhận và khóa thảo luận.
- [ ] Sao hữu ích, lưu bài, chia sẻ và quy tắc lượt xem.
- [ ] Báo cáo, kiểm duyệt, quản trị tài khoản, nhật ký và thống kê.
- [ ] Hồ sơ, thông báo, tùy chỉnh và tour hướng dẫn.

### File chưa theo dõi thuộc người dùng

- `RULE.md`: hướng dẫn dự án, không tự stage nếu chưa được yêu cầu.
- `backend/TechForum.Api.sln`: solution local, chưa xác định có muốn commit.
- `backend/WeatherForecast.cs`: file demo chưa dùng, không tự xóa.

## Kế hoạch và tiêu chí nghiệm thu

### P1 — Auth và nền UI

1. **Backend đăng ký/đăng nhập/phiên/đăng xuất**
   - [x] Email duy nhất, mật khẩu được hash bởi ASP.NET Core Identity.
   - [x] Đăng ký không nhận role từ client và luôn tạo thành viên.
   - [x] Cookie phiên HttpOnly; API chỉ trả email cho chính tài khoản đang xác thực.
   - [x] `GET /api/auth/me` phản ánh phiên thật; logout làm phiên hết hiệu lực.
   - [x] Tài khoản bị khóa không tiếp tục gọi API riêng tư bằng cookie cũ.
   - [x] Có migration, 4 test service và request thật qua SQL Server.

2. **Frontend xác thực và bảo vệ route**
   - [x] Router, Auth context/service và API client dùng chung.
   - [x] Login/register dùng `background.png`, responsive, tiếng Việt.
   - [x] Loading, validation, lỗi API và chống submit lặp.
   - [x] `returnUrl` chỉ chấp nhận đường dẫn nội bộ; không tự gửi lại thao tác ghi.
   - [x] Modal yêu cầu đăng nhập dùng chung có Đăng nhập, Đăng ký, Để sau.
   - [x] Header phân biệt khách/thành viên bằng dữ liệu phiên thật.

3. **Astryx thử nghiệm trước khi áp dụng rộng**
   - [x] Core/theme/peer dependency tương thích React và build Vite.
   - [x] Dùng Button, TextInput, CheckboxInput và Dialog thật trong P1.
   - [x] Không đoán prop: đọc tài liệu CLI của phiên bản 0.6.5 đã cài.

### P2 — Nội dung công khai

- [x] Thẻ công khai có migration, seed development và endpoint danh sách/chi tiết.
- [x] Backend danh sách/chi tiết chủ đề công khai có phân trang và lọc loại,
  chuyên mục, thẻ, từ khóa.
- [x] Frontend có danh sách Bài viết/Hỏi đáp, chi tiết, loading, empty, error,
  retry; dùng contract thật, Tailwind và arrow function.
- [x] Tìm kiếm giữ từ khóa, bộ lọc và trang trên URL.
- [x] Chi tiết nội dung chỉ trả nội dung công khai.
- [ ] Hồ sơ tác giả công khai chưa có.
- Sidebar câu hỏi mới/nhiều trả lời dùng dữ liệu và khoảng thời gian thật.

### P3 — Soạn và quản lý nội dung

- Froala được xác minh license trước khi dùng; không dùng key giả.
- Thành viên đăng/sửa/xóa mềm nội dung của mình; backend kiểm tra ownership.
- Upload ảnh/video có xác thực, validation và cleanup file mồ côi.
- HTML được làm sạch ở server trước khi lưu/hiển thị.

### P4 — Thảo luận và tương tác

- Trả lời/phản hồi, khóa thảo luận và accepted answer đúng quyền.
- Một sao hữu ích và một bookmark hiện hành cho mỗi tài khoản/chủ đề.
- Chia sẻ chỉ tăng sau Web Share/copy thành công; lượt xem chống đếm lặp ngắn hạn.
- Trang Thảo luận sắp theo hoạt động phản hồi gần nhất.

### P5 — Quản trị

- API và route riêng cho Admin; kiểm tra quyền ở server.
- CRUD/ngừng sử dụng chuyên mục và thẻ có quy tắc dữ liệu tham chiếu.
- Ẩn/khôi phục, khóa/mở, ghim/bỏ ghim, chuyển chuyên mục.
- Xử lý báo cáo một lần, có lý do/người/thời điểm.
- Khóa/mở tài khoản, ngăn tự khóa và vô hiệu phiên cũ.
- Thống kê CSDL thật và nhật ký thao tác quản trị.

### P6 — Hoàn thiện trải nghiệm

- Hồ sơ cá nhân, nội dung đã lưu, lịch sử và tùy chỉnh có tác dụng thật.
- Thông báo với số chưa đọc từ backend.
- Intro.js được xác minh license/tương thích, không lặp ngoài ý muốn.
- Kiểm thử tổng hợp Khách, Thành viên A/B và Quản trị viên.

## Quyết định còn cần xác nhận khi đến phase phụ thuộc

- Chính sách xóa nội dung khi đã có phản hồi.
- Số tầng phản hồi và giới hạn phản hồi.
- Admin có được dùng đầy đủ chức năng thành viên hay chỉ quản trị.
- Chu kỳ/định nghĩa khoảng thời gian cho “câu hỏi nhiều câu trả lời”.
- License/key Froala và điều kiện license Intro.js.

Các mục này không chặn P1 và phần công khai độc lập của P2.

## Kiểm chứng P0

```text
dotnet build backend/TechForum.Api.csproj --no-restore
Build succeeded, 0 warnings, 0 errors.

npm run lint
eslint: passed.

npm run build
TypeScript + Vite build: passed.
```

Astryx 0.6.5 được xác minh từ registry chính thức: yêu cầu React/ReactDOM >=19,
`@stylexjs/stylex` ^0.19.0 và Node >=22.13; repo hiện đáp ứng React 19.2 và
Node 22.19. Tài liệu chính thức: <https://astryx.atmeta.com/components>.

## Kiểm chứng P1

```text
dotnet build backend/TechForum.Api.csproj --no-restore
Build succeeded, 0 warnings, 0 errors.

dotnet test backend.Tests/TechForum.Api.Tests.csproj --no-restore
Passed: 4, Failed: 0, Skipped: 0.

dotnet format backend/TechForum.Api.csproj --verify-no-changes --no-restore
Passed, không có file cần format.

npm run lint
eslint: passed.

npm run build
TypeScript + Vite build: passed, 2106 modules transformed.
```

Kiểm thử tích hợp trình duyệt với API và SQL Server thật:

- Khách tải được 3 chuyên mục; khi API dừng thấy lỗi kết nối và `Thử lại` tải lại thành công.
- Route `/tai-khoan` mở modal đăng nhập; đăng ký giữ `returnUrl=/tai-khoan`.
- Đăng nhập thành công về `/tai-khoan`, hiển thị đúng tên/email/role từ `/api/auth/me`.
- Đăng xuất xóa phiên và về trang chủ; lỗi thứ tự authentication/CSRF được phát hiện và sửa.
- Đăng ký trùng email hiển thị nội dung tiếng Việt từ `application/problem+json`.
- Trang đăng nhập được kiểm tra trực quan ở desktop và viewport mobile 390×844.

## Kiểm chứng P2 đang thực hiện

```text
dotnet build backend/TechForum.Api.csproj --no-restore
Build succeeded, 0 warnings, 0 errors.

dotnet test backend.Tests/TechForum.Api.Tests.csproj --no-restore
Passed: 6, Failed: 0, Skipped: 0.

npm run lint
eslint: passed.

npm run build
TypeScript + Vite build: passed, 2111 modules transformed.
```

API danh sách, lọc, chi tiết và lỗi query đã được gọi trực tiếp với SQL Server
trước khi nối frontend. Luồng frontend mới chưa kiểm thử thủ công trên trình duyệt
theo yêu cầu tạm hoãn kiểm thử của người dùng.
