---
name: TechForum
direction: light, tối giản, chính xác (tham chiếu tinh thần Linear/Vercel bản sáng, không sao chép thương hiệu)
tokens:
  color:
    page: "#f6f8fb"
    surface: "#ffffff"
    subtle: "#f8fafc"
    heading: "#111827"
    text: "#263044"
    muted: "#5b6578"
    border: "#e4e8ef"
    border-strong: "#cfd6e2"
    primary: "#1463d6"
    primary-dark: "#0f4fac"
    primary-soft: "#eaf2ff"
    question: "#b45309"
    question-soft: "#fef3c7"
    solved: "#15803d"
    solved-soft: "#dcfce7"
    danger: "#b42318"
    danger-soft: "#fff1f0"
  font:
    sans: "Inter, ui-sans-serif, system-ui, sans-serif"
    heading: "Be Vietnam Pro, Inter, ui-sans-serif, sans-serif"
    mono: "JetBrains Mono, ui-monospace, Consolas, monospace"
  radius:
    control: 6px
    card: 8px
  shadow:
    card: "0 1px 2px rgba(16, 24, 40, 0.05)"
    card-hover: "0 4px 14px rgba(16, 24, 40, 0.08)"
---

# DESIGN.md — TechForum

Tệp này mô tả giao diện để người và agent cùng làm theo. Đọc tệp này trước khi sửa UI. Khi thêm một quy tắc lặp lại, cập nhật tệp này thay vì tự nghĩ ra giá trị mới.

## 1. Tổng quan phong cách

Diễn đàn công nghệ, **nền sáng**, ưu tiên đọc nội dung dài. Giao diện không dùng nền tối, màu rực hay gradient (theo `RULE.md` mục 9). Thay vì đổi màu, tạo sự thú vị bằng:

- **Phân tầng chữ rõ:** tiêu đề đậm, tóm tắt vừa, meta mờ.
- **Độ sâu nhẹ:** thẻ trắng nổi trên nền xám xanh rất nhạt, có viền mảnh và bóng rất nhẹ; hover tăng bóng, không đổi màu mạnh.
- **Màu có chức năng:** xanh dương cho hành động chính và Bài viết, hổ phách cho Câu hỏi, xanh lá cho "Đã có lời giải". Không dùng màu trang trí.
- **Chất công nghệ:** font mono cho code và thẻ `#tag`.

Đánh đổi: giữ gọn và phẳng nên không có ảnh lớn hay hiệu ứng chuyển động phức tạp.

## 2. Vai trò màu

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `page` | `#f6f8fb` | Nền trang |
| `surface` | `#ffffff` | Thẻ, panel, header |
| `subtle` | `#f8fafc` | Nền ô tìm kiếm, mã inline, hàng hover |
| `heading` | `#111827` | Tiêu đề, tên bài |
| `text` | `#263044` | Nội dung |
| `muted` | `#5b6578` | Meta, mô tả phụ |
| `border` / `border-strong` | `#e4e8ef` / `#cfd6e2` | Viền thẻ / viền control |
| `primary` / `primary-dark` / `primary-soft` | `#1463d6` / `#0f4fac` / `#eaf2ff` | Nút chính, liên kết, trạng thái chọn |
| `question` / `question-soft` | `#b45309` / `#fef3c7` | Nhãn và vạch nhấn của Câu hỏi |
| `solved` / `solved-soft` | `#15803d` / `#dcfce7` | "Đã có lời giải" |
| `danger` / `danger-soft` | `#b42318` / `#fff1f0` | Lỗi, xóa |

Quy tắc: chữ trên `*-soft` dùng màu đậm tương ứng để đạt tương phản AA. Không thêm màu mới ngoài bảng này khi chưa cập nhật tệp.

## 3. Typography

- Tiêu đề (`h1`–`h6`, logo): Be Vietnam Pro 600–700, `letter-spacing` âm nhẹ (-0.015em đến -0.03em). Be Vietnam Pro được thiết kế cho tiếng Việt nên dấu thanh rõ và cân đối.
- Nội dung và control: Inter 400–700. Nút, ô nhập và hộp thoại của MUI cũng dùng Inter và Be Vietnam Pro: font được khai báo trong `frontend/src/theme.ts`.
- Chỉ dùng đúng hai họ chữ trên (cộng font mono); không thêm font thứ ba.
- Các font được tải từ Google Fonts trong `frontend/index.html`.
- Code và thẻ `#tag`: font mono, cỡ 12–13px.
- Thang cỡ: tên trang 1.5–2rem; tên bài trong danh sách 1.125rem/700; tóm tắt 0.875rem/1.6; meta 0.75rem.
- Số liệu (lượt xem, sao, lượt lưu) dùng `tabular-nums`.
- Nhãn nhỏ viết hoa (`eyebrow`) chỉ dùng một lần trên mỗi khối, `letter-spacing` 0.1em.

## 4. Bố cục và khoảng cách

- Bề rộng nội dung tối đa 1240px, lề ngang 20px (`.page-content`).
- Trang chủ chia 3 cột: bộ lọc 210px, danh sách linh hoạt, câu hỏi nổi bật 260px; dưới 1100px còn 2 cột; dưới 761px còn 1 cột.
- Khoảng cách theo bội số của 4px; giữa các khối lớn dùng 16–20px; padding thẻ 20–24px.
- Danh sách bài dùng đường kẻ mảnh giữa các mục, không dùng khoảng trống lớn.

## 5. Component

**Thẻ / panel.** Nền `surface`, viền 1px `border`, bo `card` (8px), bóng `shadow.card`. Không lồng thẻ trong thẻ.

**Hero trang chủ (`HomeHero`).** Một dải nền đặc `primary-soft` (không gradient), viền `#d5e4fb`, bo `card`. Bên trái là nhãn nhỏ, tiêu đề và mô tả; bên phải là ba ô thống kê thật từ `GET /api/statistics` (Thành viên, Bài viết, Câu hỏi) trên nền trắng. Nếu API thống kê lỗi thì ẩn ba ô, không hiện lỗi. Không dùng số liệu giả.

**Điều hướng.** Header có 4 mục: Bài viết, Hỏi đáp, Thảo luận, Cộng đồng. Trang chủ có thêm khối "Khám phá" (`ExploreNav`) ở đầu cột trái, học từ cột icon của SegmentFault: mỗi mục là icon 18px + nhãn, mục đang xem nền `primary-soft` và chữ `primary-dark`. Khi đã đăng nhập hiện thêm nhóm "Của bạn" (Đã lưu, Hoạt động của tôi, Nội dung của tôi). Khối này ẩn từ 760px trở xuống vì header đã có điều hướng.

**Trang Cộng đồng (`/communities`).** Lưới thẻ cho mỗi thẻ công nghệ (`community-card`): `#tên` bằng font mono, mô tả, lối vào `/skills/:id`. Bảng thẻ ở cột trái trang chủ có liên kết "Xem tất cả cộng đồng".

**Danh sách bài.** Mỗi bài là một thẻ riêng (`surface-card topic-card`), cách nhau 12px; không dùng danh sách liền nhau chia bằng đường kẻ. Khối tìm kiếm và phân trang cũng là thẻ riêng.

**Mục bài viết (`TopicSummaryItem`).**
- Hàng đầu: nhãn loại (Bài viết xanh, Câu hỏi hổ phách), "Đã ghim", "Đã có lời giải".
- Bài ghim (`topic-card--pinned`): nền `#f5f9ff` và viền `#bcd3f7` để nổi hơn.
- Tên bài: 1.125rem/700, màu `heading`, hover chuyển `primary`.
- Hover cả thẻ: viền đậm hơn, bóng `card-hover` và vạch nhấn 3px bên trái theo loại (xanh cho Bài viết, hổ phách cho Câu hỏi).
- Meta: avatar tác giả 24px (chữ cái đầu khi chưa có ảnh) cạnh tên đậm hơn; ngày và chuyên mục mờ.
- Câu hỏi có thêm ô số trả lời bên trái (từ màn hình `sm` trở lên, học từ SegmentFault): viền xám khi chưa có trả lời, viền xanh lá khi đã có, nền xanh lá và chữ "đã giải" khi đã có lời giải. Màu chữ đặt trên thẻ `span`, không đặt trên `Link`, vì màu đặt trên `Link` có thể bị luật của thẻ `a` ghi đè.
- Số liệu (lượt xem, phản hồi, sao hữu ích, lượt lưu): icon 14px (`StatIcons`) + số, màu `muted`; phản hồi là liên kết màu `primary`. Mỗi số có `title` và chữ ẩn `sr-only` cho trình đọc màn hình.
- Thẻ `#tag`: viên thuốc nền `subtle`, viền `border`, font mono; hover nền `primary-soft`.

**Nhãn loại (`TopicTypeBadge`).** Viên thuốc 12px/700. Bài viết: nền `primary-soft`, chữ `primary-dark`. Câu hỏi: nền `question-soft`, chữ `question`.

**Tab bảng tin.** Nền trong suốt, chữ `muted`; tab đang chọn chữ `heading`, đậm, gạch chân 2px `primary`. Không tô nền cả tab.

**Nút.** Dùng `Button` của MUI: nút chính `variant="contained"` (màu `primary`), nút phụ `variant="outlined"`, nút nhẹ `variant="text"`. Trạng thái đang gửi dùng prop `loading`. Không tự vẽ nút bằng CSS khi MUI đã có.

**Form.** Dùng React Hook Form cho trạng thái và kiểm tra dữ liệu, kết hợp `TextField` của MUI qua `FormTextField` (`components/common/FormTextField.tsx`). Thông báo lỗi kiểm tra bằng tiếng Việt đặt trong `rules`; lỗi trả về từ API truyền qua `serverError`. Menu thả xuống dùng `ActionMenu` (`components/common/ActionMenu.tsx`), hộp thoại dùng `Dialog` của MUI.

**Ô nhập.** Cao tối thiểu 38px, viền `border-strong`, bo `control`; focus: viền `primary` và vòng `focus` 25%.

**Trang chi tiết bài.** Thẻ bài bo `card` với bóng `card`; đầu bài có avatar 36px cạnh tên tác giả, dòng lượt xem kèm icon, thẻ `#tag` dùng cùng kiểu `topic-tag` như danh sách.

**Trang đăng nhập và đăng ký.** Nền phần form là `page`; form nằm trong một thẻ trắng 460px, bo `card`, bóng `card-hover`. Phần minh họa bên trái giữ nền xanh nhạt.

**Tìm kiếm.** Chỉ có một ô tìm kiếm ở header (`HeaderSearch`). Nhấn Enter hoặc bấm biểu tượng kính lúp để tìm; kết quả ở `/search?keyword=...` và ô nhập hiện lại từ khóa. Danh sách bài không có ô tìm kiếm riêng.

**Trang quản trị.** Dùng MUI cho mọi control: bộ lọc là `TextField` (ô chọn dùng `select` kiểu native để gửi bằng `FormData`), nhãn trạng thái là `StatusBadge` (MUI `Chip` với 5 tông: neutral, blue, green, amber, red), bảng là `Table`, phân trang là `Pagination`, điều hướng bên trái là `List` kèm icon. Khung `admin-panel` và `admin-stat` bo `card` và dùng bóng `card` như trang công khai.

**Biểu đồ (MUI X Charts).** Trang tổng quan dùng `@mui/x-charts`: `SparkLineChart` trong từng ô thống kê, `LineChart` cho hoạt động theo ngày, `PieChart` dạng vòng cho tình hình hỏi đáp, `BarChart` ngang xếp chồng cho đóng góp theo chuyên mục. Màu biểu đồ: bài viết `#1463d6`, câu hỏi `#b45309`, câu trả lời `#15803d`, thành viên mới `#7c3aed`. Không dùng gradient.

**Trang soạn bài (học từ Juejin và SegmentFault).** Thanh thao tác dính ở trên: chọn loại (Bài viết / Câu hỏi), Xem trước, Lưu bản nháp, Xuất bản. Cột chính có ô tiêu đề lớn không viền và trình soạn thảo; cột phải có thẻ "Cài đặt" (chuyên mục, thẻ chọn bằng `Autocomplete` tối đa 5, tóm tắt) và khung mẹo viết bài hoặc mẹo đặt câu hỏi (`WritingTips`) theo loại nội dung. Dưới 960px cột phải xuống dưới nội dung.

**Focus.** Mọi phần tử tương tác có `outline: 2px solid primary` với `outline-offset: 3px`; không bỏ.

## 6. Responsive

- Dưới 761px: một cột, bộ lọc thu gọn thành `details`; tab bảng tin giữ ba nút ngang, cho phép co chữ.
- Vùng bấm tối thiểu 36px chiều cao.
- Không có cuộn ngang ở cấp trang; bảng và `pre` tự cuộn trong khung.

## 7. Cách làm việc với stack hiện có

- UI dùng React + MUI (`@mui/material`, theme trong `frontend/src/theme.ts`, kiểu dáng viết bằng `sx`) + React Hook Form + `App.css` cho các lớp dùng chung. Tailwind và thư viện Astryx cũ đã được gỡ; bộ reset trình duyệt nằm ở `frontend/src/styles/reset.css`.
- Token đặt tại `frontend/src/index.css` (`:root`). Sửa giá trị ở đó, không rải mã màu hex trong component.
- Ưu tiên tái sử dụng token và lớp có sẵn; chỉ thêm lớp mới trong `App.css` khi `sx` hoặc theme của MUI không diễn đạt được (ví dụ vạch nhấn bên trái khi hover).
- Thứ tự layer CSS: `base, mui, components`. MUI nằm trong layer `mui` (bật bằng `StyledEngineProvider enableCssLayer` ở `main.tsx`), nên `App.css` (layer `components`) ghi đè được MUI; `reset.css` và các luật toàn cục nằm ở layer `base`. Mọi luật toàn cục trong `index.css` phải nằm trong `@layer base`; luật ngoài layer sẽ thắng MUI và phá kiểu dáng (đã từng làm ô nhập bị xẹp và link bị chữ đen).
- Màu, font, bo góc của MUI chỉ khai báo ở `theme.ts`; khi đổi token trong `index.css` phải đổi cả `theme.ts`.

## 8. Ý tưởng từ diễn đàn Trung Quốc (chưa làm)

Rút ra khi xem V2EX, Juejin và SegmentFault. Chỉ lấy ý tưởng, không sao chép giao diện hay nhận diện.

- **Hàng chuyên mục ngang trên cùng** (V2EX, Juejin): một dải chuyên mục, bên dưới là dải con; nhấn là lọc ngay. Có thể thay cột chuyên mục bên trái để danh sách rộng hơn.
- **Điều hướng toàn site bằng cột icon bên trái** (SegmentFault): đã làm cho trang chủ (`ExploreNav`) và trang Cộng đồng. Chưa có trang danh sách Thành viên vì backend chưa có API liệt kê thành viên; cột icon chưa xuất hiện trên các trang ngoài trang chủ.
- **"Trả lời gần nhất bởi ai"** (V2EX): mỗi dòng cho thấy người trả lời cuối và thời gian. Cần backend trả thêm dữ liệu.
- **Tab theo dạng xem** (SegmentFault): Mới nhất, Chưa trả lời, Xếp hạng tuần, Xếp hạng tháng.
- **Khối "Hôm nay nổi bật Top 10"** (V2EX) và **bảng tác giả nổi bật** (Juejin) ở cột bên.
- **Danh sách gọn** (Juejin): tiêu đề, một dòng tóm tắt, hàng meta gọn, tag ở cuối; hiện được nhiều bài hơn trên một màn hình.
- Không học: quảng cáo, banner và thông tin pháp lý chiếm chỗ.

## 9. Chưa định nghĩa (Known gaps)

Không tự bịa các mục dưới đây; hỏi người dùng trước:

- Dark mode.
- Màu biểu đồ trang quản trị.
- Hoạt ảnh chuyển trang và skeleton nâng cao.
- Giao diện in.
- Trang quản trị: chưa áp dụng; `admin.css` giữ nguyên cho đến khi có yêu cầu.
- Ảnh đại diện tác giả thật trong danh sách và trang chi tiết: API chủ đề chưa trả `avatarUrl`, nên đang hiển thị chữ cái đầu.
