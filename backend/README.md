# TechForum API

## Bảng tin, gợi ý và đánh giá câu trả lời — 2026-10-21

- `GET /api/topics/following`: cùng bộ lọc/phân trang với `/api/topics`, nhưng
  chỉ lấy nội dung công khai của tác giả đang được tài khoản hiện tại theo dõi.
  Danh tính lấy từ JWT; khách nhận 401.
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
  `{ helpfulCount, isHelpful }`, yêu cầu access token. Khóa chính kép
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
30 phút, token nằm trong fragment URL và không dùng lại được. Sau reset, access
token cũ mất hiệu lực ở request tiếp theo và mọi refresh token bị thu hồi; khóa
kiểm duyệt vẫn được giữ nguyên.
Giới hạn theo IP: 5 yêu cầu gửi email và 20 lần đặt lại mật khẩu mỗi 15 phút,
hai ngân sách độc lập.

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

## Upload media (Cloudinary)

Ảnh và video được lưu trên **Cloudinary**; cơ sở dữ liệu chỉ giữ địa chỉ https mà
Cloudinary trả về (cột `PublicUrl` của `MediaAssets`) và id của tệp trên Cloudinary
(cột `RelativePath`). Avatar và ảnh banner cũng lưu cùng nơi (thư mục `avatars`,
`banners`). Backend nhận tệp, tự kiểm tra rồi mới đẩy lên Cloudinary; khóa API không
bao giờ gửi cho trình duyệt.

### Cấu hình (bắt buộc để tải tệp lên)

Lấy `Cloud name`, `API Key`, `API Secret` ở trang Dashboard của Cloudinary rồi đặt bằng
user secrets (không commit vào file):

```powershell
cd backend
dotnet user-secrets set "Cloudinary:CloudName" "<cloud name>"
dotnet user-secrets set "Cloudinary:ApiKey" "<api key>"
dotnet user-secrets set "Cloudinary:ApiSecret" "<api secret>"
```

Hoặc biến môi trường `Cloudinary__CloudName`, `Cloudinary__ApiKey`, `Cloudinary__ApiSecret`.
`Cloudinary:Folder` (mặc định `techforum`) là thư mục chứa mọi tệp của site; đặt tên khác
cho môi trường khác (ví dụ `techforum-dev`). Khi chưa cấu hình, API vẫn chạy và hiển thị
nội dung cũ, nhưng các endpoint tải tệp lên trả **503** kèm lời giải thích.

### Endpoint

- `POST /api/media/images`: multipart field `file`, hỗ trợ PNG/JPEG/GIF/WebP, tối đa 5 MB.
- `POST /api/media/videos`: multipart field `file`, hỗ trợ MP4/WebM, tối đa 50 MB.

Hai endpoint yêu cầu access token. Backend kiểm tra kích thước, MIME và magic bytes,
bỏ tên tệp của client và đặt id ngẫu nhiên `{folder}/images|videos/{guid}`. Mỗi upload
có bản ghi chủ sở hữu trong `MediaAssets`. Contract trả về:
`{ "id": "guid", "link": "https://res.cloudinary.com/{cloud}/image/upload/v123/techforum/images/{guid}.png", "path": "<cùng địa chỉ>" }`.
Với tệp cũ lưu trên đĩa (`/media/...`) `link` là địa chỉ tuyệt đối của API còn `path` là
đường dẫn nội bộ. Địa chỉ phải được gửi nguyên trong `bodyHtml` khi tạo nội dung.

- `DELETE /api/media/{id}`: chỉ chủ sở hữu được xóa media chưa gắn vào nội dung; xóa cả tệp
  trên Cloudinary. 404 nếu không tồn tại/không thuộc tài khoản, 409 nếu đã được sử dụng, 503
  nếu Cloudinary không xóa được lúc này (bản ghi được giữ để thử lại).
- Mã lỗi khi tải lên: **400** khi tệp không hợp lệ, gồm cả khi Cloudinary nhận được kết nối nhưng từ chối tệp
  (ví dụ vượt giới hạn dung lượng của gói: "Tệp vượt quá kích thước mà Cloudinary cho phép"; tệp không phải
  ảnh/video: "Cloudinary không đọc được tệp này"); **503** khi chưa cấu hình hoặc Cloudinary không phản hồi
  (người dùng thử lại sau). Giới hạn của ứng dụng (ảnh 5 MB, avatar 2 MB, video 50 MB) nhỏ hơn giới hạn của
  gói Free (ảnh 10 MB, video 100 MB), nên thường ứng dụng chặn trước; khi nâng giới hạn ứng dụng phải so với gói.

### Quy tắc địa chỉ

`MediaUrlRules` là nơi duy nhất quyết định địa chỉ nào thuộc site: đúng cloud name, đúng
thư mục, đúng loại (`image`/`video`), `https`, không query, không biến đổi. Bộ làm sạch HTML
chỉ giữ ảnh/video có địa chỉ như vậy (và địa chỉ `/media/images|videos/` của tệp cũ), nên
không thể chèn ảnh từ tài khoản Cloudinary khác vào bài viết. Việc xóa tệp cũng chỉ đụng
tới tệp nằm trong thư mục của site.

### Tệp cũ trên đĩa

Tệp lưu trước khi chuyển sang Cloudinary vẫn nằm ở `App_Data/uploads` và được phục vụ ở
`/media` để bài cũ không mất ảnh; chúng chỉ bị xóa khỏi đĩa khi gỡ/thay thế. Tệp mới không
ghi lên đĩa nữa.

Media chưa gắn vào chủ đề được dọn sau 24 giờ theo mặc định (xóa cả trên Cloudinary; tệp lỗi
được thử lại ở lần sau); cấu hình bằng `Media__OrphanRetentionHours`,
`Media__CleanupIntervalMinutes` và `Media__CleanupBatchSize`. Tệp đang được một bản nháp tự
lưu sử dụng không bị dọn.

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

Xác thực dùng ASP.NET Core Identity để quản lý tài khoản và JWT để đăng nhập.

- Access token (JWT, HS256) sống 15 phút, trả trong JSON và gửi bằng header
  `Authorization: Bearer <token>`. Token có `sub`, `role` và `stamp` (security
  stamp của tài khoản).
- Refresh token là chuỗi ngẫu nhiên nằm trong cookie `TechForum.Refresh`
  (HttpOnly, SameSite=Strict, path `/api/auth`, Secure khi chạy HTTPS). Database
  chỉ lưu giá trị băm SHA-256 trong bảng `RefreshTokens`. Sống 7 ngày khi chọn
  "duy trì đăng nhập", 1 ngày nếu không.
- Mỗi lần làm mới, refresh token được thay mới. Dùng lại token cũ sẽ thu hồi mọi
  token của tài khoản đó. Đổi mật khẩu, đặt lại mật khẩu và khóa tài khoản cũng
  thu hồi mọi refresh token.
- Middleware kiểm tra khóa tài khoản và security stamp trên mỗi request, nên
  access token của tài khoản bị khóa hoặc vừa đổi mật khẩu bị từ chối ngay.
- Cấu hình: `Jwt__SigningKey` (bắt buộc, ít nhất 32 ký tự; backend không chạy
  nếu thiếu), `Jwt__Issuer`, `Jwt__Audience`, `Jwt__AccessTokenMinutes`,
  `Jwt__RefreshTokenDays`, `Jwt__ShortRefreshTokenDays`. Key trong
  `appsettings.Development.json` chỉ dùng khi phát triển.

- `POST /api/auth/register`: đăng ký thành viên và đăng nhập luôn, trả HTTP 201
  với `{ user, accessToken, accessTokenExpiresAtUtc }` và đặt cookie refresh.
- `POST /api/auth/login`: đăng nhập, trả HTTP 200 cùng nội dung như đăng ký; sai
  thông tin là 401; tài khoản bị khóa là 423.
- `POST /api/auth/refresh`: đọc cookie refresh, trả access token mới và đặt
  cookie mới. Cookie thiếu, hết hạn hoặc đã thu hồi là 401; tài khoản bị khóa là 423.
- `GET /api/auth/me`: thông tin của chính tài khoản đang đăng nhập.
- `PUT /api/auth/profile`: cập nhật tên hiển thị và giới thiệu công khai tối đa
  500 ký tự, sau đó trả phiên người dùng mới.
- `PUT /api/auth/password`: kiểm tra mật khẩu hiện tại, đổi mật khẩu và thu hồi
  mọi refresh token; người dùng phải đăng nhập lại.
- `POST /api/auth/avatar`: multipart field `file`, chấp nhận PNG/JPEG/WebP hợp
  lệ tối đa 2 MB, lưu tên ngẫu nhiên dưới `/media/avatars` và trả
  `CurrentUserDto` mới.
- `DELETE /api/auth/avatar`: xóa file avatar hiện tại và trả người dùng với
  `avatarUrl: null`; giao diện dùng chữ cái đầu làm fallback.
- `POST /api/auth/logout`: thu hồi refresh token trong cookie và xóa cookie, trả
  HTTP 204. Không cần access token vì token có thể đã hết hạn.

Giới hạn avatar cấu hình bằng `Media__MaxAvatarBytes`. File được kiểm tra chữ ký
thực thay vì chỉ tin extension/MIME từ client; thay ảnh thành công mới xóa file
cũ. URL avatar được trả trong hồ sơ riêng và hồ sơ công khai, không trả email ở
endpoint công khai.

Đăng ký luôn gán role `Member`; client không được gửi hoặc tự chọn role. Sau 5
lần đăng nhập sai, tài khoản bị khóa 15 phút. Middleware kiểm tra trạng thái khóa
trên mỗi request có access token nên token cũ không tiếp tục dùng được.

Mật khẩu phát triển phải có ít nhất 8 ký tự, chữ hoa, chữ thường, chữ số và ký
tự đặc biệt. Không ghi mật khẩu thật, token hoặc khóa ký JWT vào source/log.

Hồ sơ công khai có danh sách theo dõi phân trang:

- `GET /api/profiles/{userId}/followers`
- `GET /api/profiles/{userId}/following`

Hai endpoint chỉ trả ID, tên hiển thị, giới thiệu, số nội dung công khai và thời
điểm theo dõi; không trả email hoặc dữ liệu tài khoản riêng tư.

Kỹ năng trên hồ sơ do thành viên tự chọn từ các thẻ đã có (bảng `UserSkills`,
khóa chính `UserId + TagId`, tối đa 12 kỹ năng mỗi người):

- `GET /api/profiles/me/skills` (cần đăng nhập): các kỹ năng đã chọn, chỉ gồm thẻ còn hoạt động.
- `PUT /api/profiles/me/skills` (cần đăng nhập), body `{ "tagIds": [1, 2] }`:
  thay toàn bộ danh sách; thẻ không có trong danh sách bị bỏ. Gửi `[]` để xóa hết.
  Trả `400` khi có thẻ không tồn tại hoặc đã tắt, hoặc khi vượt 12 kỹ năng; khi
  lỗi, danh sách cũ giữ nguyên. Cùng một thẻ gửi nhiều lần chỉ tính một.

Hồ sơ công khai (`GET /api/profiles/{userId}`) trả kỹ năng đã chọn trước (`isChosen: true`,
xếp theo tên), rồi mới tới các thẻ xuất hiện nhiều nhất trong nội dung công khai
của thành viên (`isChosen: false`) cho đủ 12 chỗ, nên người chưa chọn gì vẫn có kỹ năng như trước.

## Bình chọn và điểm danh tiếng

Bài viết và câu trả lời có **bình chọn** ▲ (+1) và ▼ (−1), tách riêng với sao "hữu ích" (giữ nguyên, là
lời cảm ơn/yêu thích và không đổi điểm danh tiếng):

- `GET /api/topics/{topicId}/vote`: `{ score, myVote }` (khách thấy `myVote: 0`).
- `PUT /api/topics/{topicId}/vote` và `PUT /api/topics/{topicId}/answers/{answerId}/vote`
  (cần đăng nhập), body `{ "value": 1 | -1 | 0 }` (0 là rút phiếu). Trả `{ score, myVote }`. `409` khi tự
  bình chọn nội dung của mình, `404` khi nội dung không còn công khai, `400` khi giá trị khác 1, -1, 0.
  Gửi lại cùng một giá trị không đổi gì.
- Điểm của bài (`score`) có trong chi tiết bài; mỗi câu trả lời có `score` và `myVote`. Câu trả lời sắp xếp
  được theo `sort=score` (ngoài `oldest`, `helpful`); câu được chọn vẫn đứng đầu.
- Điểm danh tiếng (`reputation`) có ở `/api/auth/me` và hồ sơ công khai.

Bảng `UserVotes` có khóa chính (`UserId`, `TargetType`, `TargetId`) nên một người chỉ có một phiếu cho mỗi bài hoặc
câu trả lời, và ràng buộc `Value IN (-1, 1)`. Cột `Score` của `Topics`/`Answers` và `Reputation` của người dùng
được giữ khớp với bảng phiếu bằng **một transaction** (`VoteRepository`, mức cô lập Serializable): thêm/đổi/xóa
phiếu, cộng `Score` và cộng `Reputation` của tác giả thành công cả ba hoặc hoàn tác cả ba. Điểm được cộng
trực tiếp trong SQL (`Score = Score + @thay_đổi`) nên hai người bình chọn cùng lúc không ghi đè nhau. Nhiều yêu cầu
của cùng một người đến cùng lúc gặp deadlock hoặc khóa chính thì được đọc lại và thử tối đa 4 lần, nên kết quả
chỉ là một phiếu. Bảng điểm (`ReputationRules`): upvote câu trả lời +10, upvote bài viết +5, downvote −2, câu trả
lời được chọn là đúng +15 (người chọn không tự nhận điểm khi chọn câu của chính mình; đổi hoặc xóa câu đã chọn thì
trừ lại). Người bấm ▼ cũng mất 1 điểm (xem giới hạn bên dưới). Rút phiếu hoặc đổi phiếu tự hoàn lại và tính lại điểm. **Điểm hiển thị không bao giờ dưới 0**: điểm của bài, của
câu trả lời và điểm danh tiếng đều được cắt về 0 ở mọi chỗ trả ra (`ReputationRules.ForDisplay`), để vài lượt
downvote không hiện số âm hay kéo theo "ném đá" hàng loạt. CSDL vẫn giữ số thật (có thể âm) nên rút hoặc đổi
phiếu luôn hoàn lại chính xác: ví dụ bài mới bị downvote có điểm thật −1 (hiện 0), đổi sang upvote thì thành +1.

Giới hạn chống bình chọn gian lận (cấu hình `VoteLimits` trong `appsettings.json`, đọc bằng `VoteLimitOptions`):

- **Tài khoản phải tồn tại ít nhất 3 ngày** (`MinAccountAgeDays`) mới được bình chọn, để một tài khoản tạo ra
  chỉ nhằm đẩy hoặc dìm điểm không bình chọn được ngay. Dưới 3 ngày, `PUT` với `1` hoặc `-1` trả `403` kèm số ngày
  còn lại. Rút phiếu (`0`) luôn được phép.
- **Downvote khắt khe hơn upvote** vì đây là phiếu dễ bị dùng để gây hại: ngoài 3 ngày tuổi, tài khoản phải tồn tại **ít nhất
  7 ngày hoặc có từ 50 điểm danh tiếng** (`DownvoteMinAccountAgeDays`, `DownvoteMinReputation`) mới được bình chọn
  ▼ (kể cả đổi từ ▲ sang ▼). Không đủ thì `403` kèm số ngày còn lại hoặc số điểm còn thiếu. Điểm thật được so với 50
  (điểm hiển thị không bao giờ dưới 0 nhưng điểm thật có thể âm). Rút phiếu luôn được phép.
- **Phí downvote:** người bấm ▼ bị trừ **1 điểm danh tiếng** (`ReputationRules.DownvoteCost`), cộng thêm việc tác giả
  bị trừ 2. Điểm này được hoàn lại khi họ rút phiếu hoặc đổi sang ▲; việc trừ và hoàn nằm trong cùng transaction với
  phiếu nên mười lăm yêu cầu ▼ cùng lúc chỉ trừ một lần. Phí áp dụng cho cả bài viết và câu trả lời.
- **Giới hạn tốc độ** cho mỗi thành viên: tối đa 30 lượt mỗi phút (`PerMinute`) và 200 lượt mỗi ngày (`PerDay`),
  quá thì `429` kèm header `Retry-After` (số giây chờ thật, vì cửa sổ cố định biết chính xác khi nào bắt đầu lại)
  và câu thông báo tiếng Việt ("thử lại sau 45 giây", "sau 6 giờ"). Mọi yêu cầu bình chọn đều được tính, kể cả
  rút phiếu và yêu cầu bị từ chối vì tài khoản mới; yêu cầu có giá trị sai (không phải 1, -1, 0) thì không tính.
  Giới hạn ngắn được hỏi trước để một đợt gửi dồn không làm mất lượt trong cả ngày. Bộ đếm nằm trong bộ nhớ
  (`VoteRateLimiter`, mỗi người một bộ đếm) nên về 0 khi khởi động lại ứng dụng, đủ để chặn script. Chưa
  phát hiện hai tài khoản bình chọn qua lại cho nhau (có thể làm sau).

`GET /api/stars` (cần đăng nhập, `page`, `pageSize` 1-50) liệt kê các bài người dùng đã thả sao ⭐, sao mới nhất
trước, chỉ gồm bài còn công khai (cùng dạng với `GET /api/bookmarks`).

## Câu trả lời được chấp nhận

Tác giả của một Câu hỏi chọn (hoặc đổi) câu trả lời đúng bằng `PUT /api/topics/{id}/answers/{answerId}/accepted`
(người khác nhận `404`; chỉ chọn được câu trả lời gốc). Câu được chọn luôn đứng **đầu danh sách**
ở cả hai kiểu sắp xếp (cũ nhất, hữu ích nhất); các câu còn lại giữ nguyên thứ tự. Việc ghim nằm trong
`AnswerRepository`, và tham số `aroundAnswerId` vẫn tìm đúng trang khi có câu được ghim. Câu bị xóa hoặc bị
ẩn thì không được ghim; Bài viết (không phải Câu hỏi) không có câu được chọn.

## Thông báo lỗi bằng tiếng Việt

Mọi lỗi mà API trả cho người dùng đều bằng tiếng Việt, kể cả những lỗi ASP.NET tự sinh (`ApiErrorMessages`):

- lỗi kiểm tra dữ liệu của body (trước khi action chạy) trả `400` với `title` "Dữ liệu chưa hợp lệ", `detail` là
  câu lỗi đầu tiên và `errors` theo từng trường; câu mặc định của framework như "The Title field is required." hay
  "The JSON value could not be converted..." được thay bằng câu tiếng Việt;
- `ValidationProblemMessageFilter` làm điều tương tự cho các lỗi controller tự tạo bằng `new ValidationProblemDetails(...)`,
  nên tiêu đề "One or more validation errors occurred." không còn xuất hiện;
- phản hồi không có body (404, 401, 403, 409, 429...) có `title` tiếng Việt qua `ClientErrorMapping`.

Phía frontend, `getProblemMessage` chọn câu hiện cho người dùng theo thứ tự: `detail`, câu lỗi đầu tiên của một trường,
`title` (nếu không phải tiêu đề tiếng Anh mặc định), rồi câu theo mã trạng thái.

## Lọc từ ngữ không phù hợp

Bảng `BannedWords` (migration `AddBannedWords`, tạo bảng trống) lưu các từ hoặc cụm từ bị
cấm. **Danh sách từ thật không nằm trong Git.** Nó ở file `backend/Data/Seed/banned-words.txt`
(có trong `.gitignore`); repo chỉ có file mẫu `banned-words.example.txt` với từ giả.

Khi ứng dụng khởi động, `BannedWordWarmupService` làm hai việc:

1. Nếu bảng `BannedWords` còn **trống** và file `banned-words.txt` có trên máy, nạp các từ trong
   file vào bảng (mỗi dòng một từ hoặc cụm từ; dòng bắt đầu bằng `#` là ghi chú). Khi bảng đã
   có dữ liệu thì không đọc lại, nên từ mà quản trị viên đã xóa không quay lại. Có thể đổi đường
   dẫn file bằng cấu hình `BannedWords:SeedFile`. Máy mới cần chép file này sang, hoặc nhập từ
   ở trang quản trị.
2. Nạp bảng vào `IMemoryCache` (`ProfanityFilter`, singleton). Cache hết hạn sau 10 phút và được
   nạp lại ngay sau mỗi thay đổi của quản trị viên. Nếu SQL Server chưa sẵn sàng, bộ lọc ghi log
   lỗi, cho nội dung đi qua và thử lại sau 1 phút; hai bước này không bao giờ làm ứng dụng không khởi động được.

`[ProfanityFilter]` (`ActionFilterAttribute`) gắn trên `TopicsController` và
`AnswersController`. Trước khi action chạy, nó đọc body request và thay từ cấm bằng
`***` ở các thuộc tính đánh dấu `[property: FilterProfanity]`: tiêu đề, tóm tắt, nội
dung bài viết (tạo và sửa) và nội dung câu trả lời (tạo và sửa). Bộ lọc làm hai bước
(`ProfanityFilterSet`):

1. **Từ viết đúng như trong danh sách:** chỉ khớp nguyên từ ("category" không bị coi là "cat"),
   không phân biệt chữ hoa/thường, **có phân biệt dấu** (bỏ dấu sẽ biến từ thường như "cáp"
   thành từ cấm "cặp"; muốn chặn cả dạng không dấu thì thêm riêng dạng đó). Cụm từ khớp cả khi
   có nhiều khoảng trắng và từ dài nhất được ưu tiên ("dịp này" trước "dịp").
2. **Chống lách luật** (`EvasionPattern`): tìm từ bị che giấu như chữ tách rời (`f.o.o.b.a.r`,
   `f o o b a r`), chữ lặp (`foooobar`), ký tự thay chữ (`f0ob4r`, `b@zqux`) và dấu `*` thay chữ
   (`fo*bar`, `f**bar`). Chỉ tính là lách luật khi có gì đó bị che: chữ thuần không dấu ("cap" cho
   "cặp") hoặc từ hai chữ cái lặp chữ ("đỏỏỏ", vì "do" không dấu là từ rất thường) thì để nguyên;
   từ hai chữ cái chỉ bị bắt khi có dấu chấm, gạch ngang hoặc gạch dưới xen giữa. `***` và biểu
   thức như `a * b` không bị coi là từ cấm. Hạn chế đã biết: chữ tách rời mà lại lặp
   (`f.o.o.o.b.a.r`) và cách viết bằng phím dấu của Telex (thêm riêng dạng đó vào danh sách).

Với HTML chỉ đổi phần chữ giữa các thẻ, không đổi thẻ, thuộc tính hay thực thể (`&nbsp;`):
địa chỉ liên kết và `alt` của ảnh giữ nguyên. Một văn bản quá dài khiến regex quá 1 giây
được để nguyên thay vì chặn việc đăng.

Quản trị viên (role `Administrator`) quản lý danh sách:

- `GET /api/admin/banned-words`
- `POST /api/admin/banned-words`, body `{ "word": "..." }`: lưu dạng chữ thường, một khoảng
  trắng giữa các từ; `400` khi dưới 2 hoặc trên 60 ký tự, không có chữ/số hoặc có `<` `>`;
  `409` khi từ đã có (không phân biệt hoa/thường).
- `DELETE /api/admin/banned-words/{id}`: `204`, hoặc `404` khi không có.

Thêm và xóa đều ghi nhật ký quản trị (`banned-word-added`, `banned-word-removed`).

Thành viên đã đăng nhập hỏi trước xem bộ lọc sẽ đổi gì, để cảnh báo ngay khi đang viết:

- `POST /api/moderation/check` (cần đăng nhập), body `{ "title": "...", "summary": "...", "bodyHtml": "..." }`
  (trường nào cũng có thể bỏ). Trả `{ hasProfanity, title, summary, bodyHtml }`: mỗi trường chỉ có
  giá trị (văn bản đã thay bằng `***`) khi bị đổi, còn lại là `null`. Dùng đúng bộ lọc lúc lưu bài nên
  kết quả khớp với những gì sẽ xảy ra khi đăng. Không lưu gì. Giới hạn: tiêu đề 300, tóm tắt 1.000,
  nội dung 100.000 ký tự (quá thì `400`); chưa đăng nhập thì `401`. Endpoint không gắn
  `[ProfanityFilter]` vì attribute đó sẽ làm sạch request trước và kết quả không bao giờ thấy thay đổi.
  Frontend không chứa danh sách từ cấm nào: nó chỉ hỏi endpoint này.
Bộ lọc chỉ áp dụng cho nội dung mới; nội dung đã đăng không bị đổi. Bản nháp tự lưu
cũng chưa lọc, nhưng khi xuất bản bản nháp đi qua API tạo/sửa bài nên vẫn bị lọc.
Danh sách thật có thể gộp thêm từ các nguồn mở (ví dụ kho `blue-eyes-vn/vietnamese-offensive-words`, giấy phép MIT,
ghi nguồn trong báo cáo); mục có số/ký hiệu, chỉ 1-2 chữ cái hoặc không dấu và rất ngắn nên được duyệt tay
(`banned-words.review.txt`, cũng không lên Git) vì dễ trùng chữ thường.
Các test dùng từ giả; một test đọc file danh sách thật khi nó có trên máy để kiểm tra từng
từ trong đó (và để câu tiếng Việt bình thường không bị chặn nhầm).

## Kiểm thử backend

Thông báo được tạo khi người khác trả lời chủ đề và khi câu trả lời được chấp
nhận. `SourceKey` có unique index theo người nhận để tránh tạo trùng; tác giả tự
trả lời chủ đề của mình không nhận thông báo.

```powershell
cd ..\backend.Tests
dotnet test
```
