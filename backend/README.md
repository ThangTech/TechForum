# TechForum API

## Bảng tin, gợi ý và đánh giá câu trả lời — 2026-10-21

- `GET /api/topics/following`: cùng bộ lọc/phân trang với `/api/topics`, nhưng
  chỉ lấy nội dung công khai của tác giả đang được tài khoản hiện tại theo dõi.
  Danh tính lấy từ cookie/claims; khách nhận 401.
- `GET /api/topics?sort=weekly`: xếp hoạt động trong 7 ngày gần nhất, kể cả bài
  đăng từ trước. Điểm = sao × 2 + lượt lưu × 2 + trả lời cấp một công khai × 3.
  Không tính hoạt động của tác giả chủ đề, bản ghi tương lai hoặc phản hồi ẩn/xóa;
  chỉ trả chủ đề có điểm. Thứ tự: điểm, ngày đăng, ID giảm dần; bài ghim không
  thay đổi thứ hạng tuần. Bộ lọc chuyên mục/thẻ/loại/trạng thái vẫn áp dụng.
  Đây là quy tắc xếp hạng cố định, không phải mô hình AI.
- `GET /api/topics/{topicId}/related`: tối đa 4 preview công khai, loại chính
  chủ đề nguồn; ưu tiên số thẻ chung, cùng chuyên mục, ngày đăng rồi ID giảm dần.
  Chỉ chọn ứng viên chung thẻ hoặc chuyên mục. Nguồn không công khai trả 404.
- `GET /api/topics/{topicId}/answers?sort=oldest|helpful`: mặc định `oldest`;
  `helpful` xếp số bình chọn giảm dần, rồi thời điểm tạo/ID tăng dần.
  `aroundAnswerId` tìm đúng trang trong cả hai thứ tự. DTO thêm `helpfulCount`
  và `isHelpful` của người đang xem; khách luôn nhận `isHelpful=false`.
- `PUT`/`DELETE /api/topics/{topicId}/answers/{answerId}/helpful`: trả
  `{ helpfulCount, isHelpful }`, yêu cầu cookie và CSRF. Khóa chính kép
  `(AnswerId, UserId)` chống bình chọn trùng, kể cả hai request đồng thời.
  PUT tự bình chọn trả 409; tài nguyên không công khai/sai chủ đề trả 404.
  Thêm/bỏ lặp lại idempotent và không thay đổi đáp án được chấp nhận.

Migration `20261021022005_AddAnswerHelpfulVotes` chỉ thêm bảng và chỉ mục;
đã áp dụng trên SQL Server local. Phản hồi con chỉ công khai khi cha còn tồn tại,
cùng chủ đề, là trả lời gốc và chưa bị ẩn/xóa. Quy tắc này được áp dụng đồng bộ
cho danh sách, số đếm, hoạt động, hồ sơ, dashboard và liên kết báo cáo cá nhân.

## Quản trị và báo cáo — cập nhật 2026-10-21

- `GET /api/admin/dashboard?startDate=2026-10-01&endDate=2026-10-21`:
  khoảng ngày bao gồm hai đầu, theo giờ Việt Nam, mặc định 30 ngày và tối đa
  366 ngày. `totals` là tổng hiện tại; `period`, `activitySeries`, `categories`
  và `questions` áp dụng khoảng ngày. Chuỗi ngày có cả những ngày bằng 0.
  Bài/câu hỏi tính theo ngày xuất bản; câu trả lời và thành viên theo ngày tạo.
  Chỉ số nội dung chỉ tính bản ghi còn công khai, không tính nháp, ẩn hoặc xóa.
  Báo cáo chờ và nhật ký gần đây thể hiện công việc hiện tại, không giới hạn theo kỳ.
- `GET /api/admin/audit-logs`: phân trang cùng `keyword`, `administratorId`,
  `action`, `from`, `to`; ngày lọc theo giờ Việt Nam.
- `GET /api/admin/topics/{id}`: xem trước HTML được làm sạch, chỉ quản trị viên.
  Danh sách nội dung thêm `visibility=draft`; `visible` chỉ gồm nội dung công khai.
- `PUT /api/admin/accounts/{id}/lock`: `{ isLocked, reason, lockoutEndUtc }`.
  Khóa phải có lý do; thời hạn phải ở tương lai hoặc `null` để khóa vô thời hạn.
  Danh sách hỗ trợ `status=locked|unlocked`, `role=administrator|member`.
  Không cho tự khóa hoặc khóa tài khoản quản trị. Thay đổi và nhật ký cùng transaction.
- `GET /api/reports/mine`: chỉ báo cáo của tài khoản hiện tại, phân trang và lọc
  `status=pending|accepted|rejected`. Không trả tiêu đề/liên kết nội dung đã mất
  tính công khai. Xử lý báo cáo lưu kết quả, thông báo và nhật ký cùng transaction;
  xử lý lặp trả 409. Chấp nhận báo cáo ghi nhận kết quả xem xét; thao tác ẩn/khóa
  chủ đề được thực hiện riêng trong quản lý nội dung.
- Tác giả nhận thông báo kèm lý do khi nội dung bị ẩn/khôi phục hoặc khóa/mở
  thảo luận. Thông báo có thể đọc ngay cả khi nội dung không còn công khai.
- `GET /api/topics?questionStatus=unanswered|unsolved|solved`: ba nhóm câu hỏi
  lần lượt là chưa có trả lời cấp một công khai, có trả lời nhưng chưa có đáp án
  hợp lệ được chấp nhận, và có đáp án cấp một công khai được chấp nhận.
  Không kết hợp bộ lọc này với loại Bài viết.

## Khôi phục mật khẩu qua email

`POST /api/auth/forgot-password` nhận `{ email }`, trả 202 với thông báo giống
nhau cho tài khoản tồn tại hoặc không tồn tại. Khi chưa cấu hình email/URL tin
cậy, API trả 503 cho mọi email. Lỗi SMTP được ghi bằng thông báo chung, không
ghi địa chỉ hay token vào log. Không bật ghi nội dung request cho hai endpoint này.

`POST /api/auth/reset-password` nhận `{ email, token, newPassword }`, trả 204
khi thành công hoặc 400 khi token/mật khẩu không hợp lệ. Liên kết có hiệu lực
30 phút, token nằm trong fragment URL và không dùng lại được. Sau reset, các
cookie cũ mất hiệu lực ở request tiếp theo; khóa kiểm duyệt vẫn được giữ nguyên.
Giới hạn theo IP: 5 yêu cầu gửi email và 20 lần đặt lại mật khẩu mỗi 15 phút,
hai ngân sách độc lập. Hai endpoint vẫn yêu cầu cookie/token CSRF.

Cấu hình bằng biến môi trường của tiến trình backend, không commit thông tin SMTP:

```powershell
$env:RecoveryEmail__Host = 'smtp.example.com'
$env:RecoveryEmail__Port = '587'
$env:RecoveryEmail__UseTls = 'true'
$env:RecoveryEmail__Username = '<tai-khoan-SMTP>'
$env:RecoveryEmail__Password = '<mat-khau-SMTP>'
$env:RecoveryEmail__FromAddress = 'forum@example.com'
$env:RecoveryEmail__FrontendUrl = 'http://localhost:5173'
```

Máy triển khai phải dùng `FrontendUrl` HTTPS. Cổng 587 dùng STARTTLS, cổng 465
dùng TLS ngay khi kết nối; MailKit xác minh chứng thư mặc định. Chỉ môi trường
Development mới cho SMTP không TLS trên loopback để kiểm thử bằng máy nhận thư
local. Kiểm thử hiện đã đi qua SMTP local; gửi tới hộp thư ngoài cần cấu hình
nhà cung cấp thật.

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
liệu của người khác. Xóa chủ đề là xóa mềm. Để giữ đóng góp cộng đồng, tác giả
chỉ được xóa chủ đề khi chưa có câu trả lời công khai; quản trị viên vẫn dùng
luồng kiểm duyệt ẩn/khôi phục riêng và không thay đổi cờ xóa của tác giả.

## Câu trả lời P4

- `GET /api/topics/{topicId}/answers?page=1&pageSize=20`: danh sách câu trả lời
  công khai, phân trang tối đa 50 phần tử; mặc định sắp theo thời điểm tạo rồi
  `id` tăng dần. Có thể chọn `sort=helpful` như contract ở đầu tài liệu.
- `POST /api/topics/{topicId}/answers`: thành viên đã đăng nhập gửi câu trả lời
  cấp một bằng `{ "bodyHtml": "<p>Nội dung trả lời</p>" }`, hoặc phản hồi bằng
  `{ "bodyHtml": "<p>Nội dung phản hồi</p>", "parentAnswerId": 12 }`, trả HTTP
  201. Nếu trả lời một phản hồi, backend chuẩn hóa về câu trả lời gốc để giới
  hạn giao diện ở hai cấp.
- `PUT /api/topics/{topicId}/answers/{answerId}/accepted`: tác giả của chủ đề
  loại Câu hỏi chọn hoặc thay đổi câu trả lời được chấp nhận, trả HTTP 200.

Backend làm sạch HTML trước khi lưu. Chủ đề không công khai trả 404; chủ đề đã
khóa thảo luận trả 409; dữ liệu rỗng hoặc quá 20.000 ký tự trả Validation Problem
HTTP 400. Thành viên có thể sửa/xóa phản hồi của mình; xóa câu trả lời đang được
chấp nhận đồng thời bỏ liên kết accepted answer. Trường `isAccepted` trong DTO câu trả
lời cho biết lựa chọn hiện tại; chỉ câu hỏi công khai và câu trả lời cấp một
thuộc đúng chủ đề mới được chấp nhận. DTO trả `parentAnswerId` và `replyingTo`
để frontend trình bày quan hệ hội thoại mà không trả entity EF trực tiếp.

## Sao hữu ích P5

- `GET /api/topics/{topicId}/star`: công khai, trả số sao và trạng thái của tài
  khoản hiện tại dưới dạng `{ "count": 3, "hasStar": true }`.
- `PUT /api/topics/{topicId}/star`: thêm sao của tài khoản đang đăng nhập.
- `DELETE /api/topics/{topicId}/star`: bỏ sao của tài khoản đang đăng nhập.

Khóa chính kép `(TopicId, UserId)` bảo đảm mỗi tài khoản chỉ có tối đa một sao
hiện hành trên mỗi chủ đề. Thêm hoặc bỏ lặp lại là thao tác idempotent; chủ đề
không còn công khai trả 404. Sao hữu ích không phải thang điểm và không dùng làm
bookmark.

## Lưu bài P5

- `GET /api/topics/{topicId}/bookmark`: số lượt lưu công khai và trạng thái của
  tài khoản hiện tại.
- `PUT`/`DELETE /api/topics/{topicId}/bookmark`: thêm hoặc bỏ lưu, yêu cầu đăng nhập.
- `GET /api/bookmarks?page=1&pageSize=10`: danh sách nội dung đã lưu của tài
  khoản, mới lưu trước và chỉ gồm chủ đề còn công khai.

Bookmark dùng khóa chính kép `(TopicId, UserId)`, độc lập với Sao hữu ích và các
thao tác thêm/bỏ được xử lý idempotent.

## Báo cáo nội dung P6

- `POST /api/reports`: báo cáo một `topic` hoặc `answer` với `targetId`, `reason`
  và mô tả tùy chọn tối đa 1.000 ký tự.
- Lý do hợp lệ: `spam`, `harassment`, `misinformation`, `copyright`, `other`;
  lý do `other` bắt buộc có mô tả.

Mỗi tài khoản chỉ có một báo cáo `Pending` trên cùng nội dung. Constraint lọc ở
SQL Server và xử lý unique conflict bảo vệ cả trường hợp request đồng thời. Bản
ghi đã có sẵn trạng thái, người/thời gian xử lý và ghi chú để dùng cho quản trị.

## Xác thực P1

Xác thực dùng ASP.NET Core Identity và cookie `TechForum.Auth` HttpOnly. Client
phải gửi cookie bằng `credentials: include`. Mọi request ghi cần lấy token từ
`GET /api/auth/antiforgery-token` rồi gửi token trong header `X-CSRF-TOKEN`.

- `POST /api/auth/register`: đăng ký thành viên và tạo phiên, trả HTTP 201.
- `POST /api/auth/login`: đăng nhập, trả HTTP 200; sai thông tin là 401; tài
  khoản bị khóa là 423.
- `GET /api/auth/me`: thông tin của chính tài khoản đang đăng nhập.
- `PUT /api/auth/profile`: cập nhật tên hiển thị và giới thiệu công khai tối đa
  500 ký tự, sau đó trả phiên người dùng mới.
- `PUT /api/auth/password`: kiểm tra mật khẩu hiện tại, đổi mật khẩu và làm mới
  cookie của phiên đang dùng.
- `POST /api/auth/avatar`: multipart field `file`, chấp nhận PNG/JPEG/WebP hợp
  lệ tối đa 2 MB, lưu tên ngẫu nhiên dưới `/media/avatars` và trả
  `CurrentUserDto` mới.
- `DELETE /api/auth/avatar`: xóa file avatar hiện tại và trả người dùng với
  `avatarUrl: null`; giao diện dùng chữ cái đầu làm fallback.
- `POST /api/auth/logout`: kết thúc phiên hiện tại, trả HTTP 204.

Giới hạn avatar cấu hình bằng `Media__MaxAvatarBytes`. File được kiểm tra chữ ký
thực thay vì chỉ tin extension/MIME từ client; thay ảnh thành công mới xóa file
cũ. URL avatar được trả trong hồ sơ riêng và hồ sơ công khai, không trả email ở
endpoint công khai.

Đăng ký luôn gán role `Member`; client không được gửi hoặc tự chọn role. Sau 5
lần đăng nhập sai, tài khoản bị khóa 15 phút. Middleware kiểm tra trạng thái khóa
trên mỗi request có phiên nên cookie cũ không tiếp tục dùng được.

Mật khẩu phát triển phải có ít nhất 8 ký tự, chữ hoa, chữ thường, chữ số và ký
tự đặc biệt. Không ghi mật khẩu thật hoặc cookie phiên vào source/log.

Hồ sơ công khai có danh sách theo dõi phân trang:

- `GET /api/profiles/{userId}/followers`
- `GET /api/profiles/{userId}/following`

Hai endpoint chỉ trả ID, tên hiển thị, giới thiệu, số nội dung công khai và thời
điểm theo dõi; không trả email hoặc dữ liệu tài khoản riêng tư.

## Kiểm thử backend

Thông báo được tạo khi người khác trả lời chủ đề và khi câu trả lời được chấp
nhận. `SourceKey` có unique index theo người nhận để tránh tạo trùng; tác giả tự
trả lời chủ đề của mình không nhận thông báo.

```powershell
cd ..\backend.Tests
dotnet test
```
