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
    muted: "#687386"
    border: "#e4e8ef"
    border-strong: "#cfd6e2"
    primary: "#1463d6"
    primary-dark: "#0f4fac"
    primary-soft: "#eaf2ff"
    question: "#b45309"
    question-soft: "#fef3c7"
    success: "#15803d"
    success-soft: "#dcfce7"
    danger: "#b42318"
    danger-soft: "#fff1f0"
  font:
    sans: "Roboto, ui-sans-serif, system-ui, sans-serif"
    heading: "Open Sans, Roboto, ui-sans-serif, sans-serif"
    mono: "ui-monospace, 'JetBrains Mono', Consolas, monospace"
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
| `muted` | `#687386` | Meta, mô tả phụ |
| `border` / `border-strong` | `#e4e8ef` / `#cfd6e2` | Viền thẻ / viền control |
| `primary` / `primary-dark` / `primary-soft` | `#1463d6` / `#0f4fac` / `#eaf2ff` | Nút chính, liên kết, trạng thái chọn |
| `question` / `question-soft` | `#b45309` / `#fef3c7` | Nhãn và vạch nhấn của Câu hỏi |
| `success` / `success-soft` | `#15803d` / `#dcfce7` | "Đã có lời giải" |
| `danger` / `danger-soft` | `#b42318` / `#fff1f0` | Lỗi, xóa |

Quy tắc: chữ trên `*-soft` dùng màu đậm tương ứng để đạt tương phản AA. Không thêm màu mới ngoài bảng này khi chưa cập nhật tệp.

## 3. Typography

- Tiêu đề (`h1`–`h6`, logo): Open Sans, `letter-spacing` âm nhẹ (-0.015em đến -0.03em).
- Nội dung và control: Roboto.
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

**Mục bài viết (`TopicSummaryItem`).**
- Hàng đầu: nhãn loại (Bài viết xanh, Câu hỏi hổ phách), "Đã ghim", "Đã có lời giải".
- Tên bài: 1.125rem/700, màu `heading`, hover chuyển `primary`.
- Hover cả mục: nền `subtle` và vạch nhấn 3px bên trái theo loại (xanh cho Bài viết, hổ phách cho Câu hỏi).
- Meta: tác giả đậm hơn, ngày và chuyên mục mờ; số liệu nằm hàng riêng, màu `muted`.
- Thẻ `#tag`: viên thuốc nền `subtle`, viền `border`, font mono; hover nền `primary-soft`.

**Nhãn loại (`TopicTypeBadge`).** Viên thuốc 12px/700. Bài viết: nền `primary-soft`, chữ `primary-dark`. Câu hỏi: nền `question-soft`, chữ `question`.

**Tab bảng tin.** Nền trong suốt, chữ `muted`; tab đang chọn chữ `heading`, đậm, gạch chân 2px `primary`. Không tô nền cả tab.

**Nút.** Nút chính dùng Astryx `Button variant="primary"` (màu `primary`). Nút phụ dùng `variant="secondary"`. Không tự vẽ nút bằng CSS khi Astryx đã có.

**Ô nhập.** Cao tối thiểu 38px, viền `border-strong`, bo `control`; focus: viền `primary` và vòng `focus` 25%.

**Focus.** Mọi phần tử tương tác có `outline: 2px solid primary` với `outline-offset: 3px`; không bỏ.

## 6. Responsive

- Dưới 761px: một cột, bộ lọc thu gọn thành `details`; tab bảng tin giữ ba nút ngang, cho phép co chữ.
- Vùng bấm tối thiểu 36px chiều cao.
- Không có cuộn ngang ở cấp trang; bảng và `pre` tự cuộn trong khung.

## 7. Cách làm việc với stack hiện có

- UI dùng React + Tailwind 4 (class tiện ích) + Astryx (`@astryxdesign/core`, theme neutral) + `App.css` cho các lớp dùng chung.
- Token đặt tại `frontend/src/index.css` (`:root`). Sửa giá trị ở đó, không rải mã màu hex trong component.
- Ưu tiên tái sử dụng token và lớp có sẵn; chỉ thêm lớp mới trong `App.css` khi Tailwind không diễn đạt được (ví dụ vạch nhấn bên trái khi hover).
- Cấu trúc layer CSS trong `index.css` được giữ nguyên; lớp mới của dự án nằm ở layer `components` (`App.css`).

## 8. Chưa định nghĩa (Known gaps)

Không tự bịa các mục dưới đây; hỏi người dùng trước:

- Dark mode.
- Màu biểu đồ trang quản trị.
- Hoạt ảnh chuyển trang và skeleton nâng cao.
- Giao diện in.
- Trang quản trị: mới áp dụng cho trang chủ; `admin.css` giữ nguyên cho đến khi có yêu cầu.
