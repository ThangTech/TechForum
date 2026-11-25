# Đưa TechForum lên môi trường thật

```
Trình duyệt ──► Vercel (trang React, thư mục frontend)
                 │  /api/*, /media/*   (rewrite trong frontend/vercel.json)
                 ▼
               Render (API, build từ backend/Dockerfile)
                 │                         │
                 ▼                         ▼
          Azure SQL Database          Cloudinary (ảnh, video)
```

Trình duyệt chỉ thấy địa chỉ của Vercel. Vercel chuyển `/api` và `/media` sang Render, nên không cần CORS và cookie làm
mới phiên vẫn là cookie của cùng trang, giống khi chạy bằng Docker với nginx.

Thứ tự làm: Azure SQL → Render → Vercel. Mỗi phần cần địa chỉ của phần trước.

## 1. Azure SQL Database (gói miễn phí)

1. Trên Azure Portal tạo **SQL database**, chọn ưu đãi **Apply free offer**. Gói miễn phí cho 100.000 vCore-giây và
   32 GB mỗi tháng; chọn **Auto-pause the database until next month** khi hết hạn mức để không bị tính tiền.
2. Tạo server mới với **SQL authentication** (tên đăng nhập và mật khẩu của quản trị viên).
3. Trong **Networking** của server, bật **Allow Azure services and resources to access this server** không đủ cho
   Render. Thêm luật firewall cho các địa chỉ ra ngoài của Render (trang dịch vụ trên Render → **Connect** →
   **Outbound**), hoặc tạm thời mở `0.0.0.0` – `255.255.255.255` khi thử nghiệm.
4. Chuỗi kết nối (thay phần trong `<>`):

   ```
   Server=tcp:<server>.database.windows.net,1433;Initial Catalog=<database>;User ID=<user>;Password=<password>;Encrypt=True;TrustServerCertificate=False;Connect Timeout=120;ConnectRetryCount=6;ConnectRetryInterval=10
   ```

   Gói miễn phí tự "ngủ" khi không có ai dùng, và cần khoảng một phút để thức dậy. `ConnectRetryCount` và
   `ConnectRetryInterval` cho trình điều khiển SQL thử kết nối lại trong lúc đó; `Connect Timeout` là tổng thời gian
   chờ tối đa. Không bật `EnableRetryOnFailure` của EF Core: nó không chạy được cùng các giao dịch do code tự mở
   (ví dụ trong VoteRepository).

API tự tạo bảng khi khởi động (`Database__MigrateOnStartup=true`), nên không cần chạy migration bằng tay.

## 2. Render (API)

Tạo **Web Service** từ repo GitHub, **Language: Docker**, **Root Directory: `backend`**, gói **Free**.
Đặt tên dịch vụ là `techforum-api` để địa chỉ là `https://techforum-api.onrender.com`. Nếu tên đã có người dùng,
sửa địa chỉ trong `frontend/vercel.json` cho khớp.

Biến môi trường (**Environment**). Bản có chú thích từng biến và nơi lấy giá trị: [render.env.example](render.env.example).

| Biến | Giá trị |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `PORT` | `8080` (cổng mà API lắng nghe trong image) |
| `ConnectionStrings__DefaultConnection` | Chuỗi kết nối Azure SQL ở trên |
| `Jwt__SigningKey` | Khoá ngẫu nhiên, ít nhất 32 ký tự (khác khoá ở máy) |
| `Database__MigrateOnStartup` | `true` |
| `Database__SeedDemoData` | `true` lần đầu nếu muốn dữ liệu mẫu, `false` nếu chuyển dữ liệu thật sang |
| `ReverseProxy__Enabled` | `true` |
| `ReverseProxy__ForwardLimit` | `2` (Vercel và proxy của Render: xem giải thích bên dưới) |
| `Logging__LogLevel__Microsoft.EntityFrameworkCore.Database.Command` | `Warning` |
| `Cloudinary__CloudName`, `Cloudinary__ApiKey`, `Cloudinary__ApiSecret` | Như trong `.env` |
| `Cloudinary__ImageModeration` | `aws_rek` nếu đã đăng ký add-on kiểm duyệt ảnh, để trống nếu chưa |
| `RecoveryEmail__Host` | Máy chủ SMTP, ví dụ `in-v3.mailjet.com` |
| `RecoveryEmail__Port` | `2525` (Render miễn phí chặn 25, 465 và 587) |
| `RecoveryEmail__UseTls` | `true` (cổng 2525 dùng STARTTLS) |
| `RecoveryEmail__Username`, `RecoveryEmail__Password` | Tài khoản SMTP (Mailjet: API Key và Secret Key) |
| `RecoveryEmail__FromAddress` | Email người gửi đã xác minh với nhà cung cấp |
| `RecoveryEmail__FrontendUrl` | Địa chỉ trang trên Vercel, ví dụ `https://techforum.vercel.app` |
| `GoogleAuth__ClientId` | OAuth Client ID của Google (giống `VITE_GOOGLE_CLIENT_ID`); để trống thì tắt đăng nhập Google |

Danh sách từ cấm thật không nằm trong Git. Thêm nó ở **Secret Files** với tên `banned-words.txt`, rồi đặt
`BannedWords__SeedFile=/etc/secrets/banned-words.txt`. API chỉ nạp file khi bảng từ cấm còn trống; nếu chuyển dữ liệu
thật sang thì danh sách đã có sẵn trong DB.

**Vì sao `ForwardLimit` là 2:** Vercel ghi địa chỉ của người dùng vào `X-Forwarded-For`, rồi proxy của Render thêm
địa chỉ của Vercel vào sau. Với giá trị mặc định 1, API lấy địa chỉ cuối cùng (của Vercel) và mọi người dùng chung
một giới hạn gửi email khôi phục mật khẩu. Với 2, API lùi thêm một bước và lấy đúng địa chỉ người dùng.

**Giới hạn của gói miễn phí:**

- Dịch vụ ngủ sau 15 phút không có ai truy cập; lần mở đầu tiên sau đó mất khoảng một phút.
- Ổ đĩa bị xoá mỗi lần khởi động lại. Ảnh, video nằm trên Cloudinary nên không mất. Khoá ký link trong email
  (Data Protection) nằm trong bảng `DataProtectionKeys` của database, nên link xác minh email và đặt lại mật khẩu đã
  gửi vẫn mở được sau khi dịch vụ ngủ dậy. Ai đọc được database thì cũng đọc được khoá này, nên giữ kín chuỗi kết nối.

## 3. Vercel (trang web)

Tạo project từ repo GitHub, **Root Directory: `frontend`** (Vercel tự nhận ra Vite).

| Biến | Giá trị |
|---|---|
| `VITE_API_BASE_URL` | `/` (gọi API cùng địa chỉ với trang; Vercel chuyển sang Render) |
| `VITE_FROALA_KEY` | Key Froala nếu có |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID của Google; nhớ thêm địa chỉ Vercel vào "Authorized JavaScript origins" |

`frontend/vercel.json` chuyển `/api` và `/media` sang Render, và trả `index.html` cho các đường dẫn khác để React
Router xử lý (ví dụ mở thẳng `/topics/...`).

Sau khi có địa chỉ Vercel, quay lại Render và sửa `RecoveryEmail__FrontendUrl` cho đúng.

## 4. Kiểm tra sau khi deploy

- Mở trang, đăng ký, tải lại trang vẫn còn đăng nhập (cookie làm mới phiên đi qua Vercel).
- Đăng bài có ảnh và video (tải lên Cloudinary qua Vercel → Render). Vercel không ghi rõ giới hạn dung lượng khi
  chuyển yêu cầu sang máy chủ khác, nên cần thử một video lớn.
- Mở thẳng một địa chỉ bài viết.
- Đăng ký tài khoản mới: email xác minh đến được hộp thư (xem cả Spam), bấm link thì thanh nhắc biến mất và đăng bài được.
- Quên mật khẩu: email đến được hộp thư.
- Để trang không dùng 20 phút rồi mở lại: lần đầu chậm, sau đó bình thường (Render và Azure SQL thức dậy).
