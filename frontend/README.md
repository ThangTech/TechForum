# TechForum frontend

Giao diện React + TypeScript + Vite cho TechForum.

## Bảng tin và trang đọc — 2026-10-21

- Trang chủ, `/articles`, `/questions` có ba mục **Mới nhất**, **Đang theo dõi**,
  **Nổi bật tuần**. `feed=following|weekly` được giữ cùng bộ lọc trên URL.
  Theo dõi tác giả từ hồ sơ công khai để nhận bài trong bảng tin cá nhân.
  Khách được dẫn đăng nhập và quay lại đúng bảng tin; tài khoản chưa theo dõi
  ai có hướng dẫn riêng. Trang `/discussions` giữ thứ tự trao đổi gần nhất.
- Trang đọc tự tạo mục lục từ H2/H3: sidebar trên desktop, danh sách thu gọn
  trên mobile; đề mục trùng tên vẫn có ID riêng. Liên kết đề mục hoạt động khi
  tải trang trực tiếp, không ảnh hưởng liên kết `#answer-{id}`.
  Hiện thời gian đọc ước tính (220 từ/phút, thêm 12 giây/ảnh) và ngày cập nhật.
- Cuối trang có **Đọc tiếp** từ API công khai; có trạng thái tải/rỗng/lỗi/thử lại.
  Khung vuông/bo nhẹ, tiêu đề và danh sách trong bài có định dạng đọc rõ ràng.
- Câu trả lời có bình chọn ▲▼, nhãn đã chỉnh sửa và lựa chọn **Cũ nhất trước /
  Điểm cao nhất**. Không tự bình chọn; khách dùng hộp thoại đăng nhập chung.
  `answerSort=score` giữ trên URL (link cũ `answerSort=helpful` được hiểu là
  `score`); đổi thứ tự bắt đầu từ trang đầu, liên kết câu trả lời vẫn tìm đúng trang.

Kiểm thử thủ công: theo dõi tác giả rồi mở bảng tin; mở bài có H2/H3 và bấm
mục lục; bình chọn câu trả lời của người khác rồi tải lại; đổi cách sắp xếp
và mở liên kết tới câu trả lời ở trang sau. Đã kiểm tra trên bản production
ở desktop, 390px và 320px, không có lỗi console hoặc tràn ngang toàn trang.

## Khu quản trị và luồng mới — 2026-10-21

Khu `/admin` có bố cục riêng với sidebar desktop/menu mobile, breadcrumb và các
bảng dữ liệu. Khung vuông, nền trung tính và màu nhấn xanh; mỗi trang xử lý trạng
thái tải/rỗng/lỗi, bộ lọc và phân trang. API vẫn kiểm tra quyền quản trị ở server.

- `/admin`: số liệu thật, chọn 7/30 ngày hoặc khoảng ngày tùy chọn, biểu đồ SVG
  kèm bảng số liệu truy cập được bằng bàn phím, tình hình hỏi đáp, đóng góp theo
  chuyên mục, báo cáo chờ và nhật ký gần đây. Tổng hiện tại và đóng góp trong kỳ
  được ghi nhãn riêng; ngày tính theo Việt Nam.
- `/admin/topics`: bảng nội dung, lọc loại/trạng thái/chuyên mục, xem trước HTML
  từ API quản trị và kiểm duyệt có lý do. Bản nháp có nhãn riêng.
- `/admin/reports`: xem ngữ cảnh nội dung/câu trả lời trước khi lưu quyết định.
- `/admin/accounts`: lọc vai trò/trạng thái, khóa có lý do/thời hạn, mở khóa.
- `/admin/categories`, `/admin/tags`: bảng quản lý phân loại cùng tìm kiếm và
  trạng thái sử dụng, giữ nguyên form và quy tắc tham chiếu hiện có.
- `/admin/audit-logs`: lọc nhật ký theo người thực hiện, hành động, từ khóa và ngày.
- `/reports`: báo cáo riêng của thành viên và kết quả xử lý; có mục trong menu
  tài khoản. Thông báo kiểm duyệt có phần đọc lý do ngay tại `/notifications`.
- `/questions?questionStatus=solved`: lọc câu hỏi theo trạng thái giải quyết;
  hỗ trợ thêm `unanswered` và `unsolved`, giữ bộ lọc khi phân trang/tìm kiếm.
- `/forgot-password`, `/reset-password`: yêu cầu email và đặt lại mật khẩu từ
  liên kết có token trong fragment. Có lỗi rõ khi thiếu token, SMTP chưa cấu
  hình hoặc vượt giới hạn. Backend README có cấu hình SMTP; giao diện không
  tự giả lập gửi email thành công.

## Mã định danh là GUID

Id của bài viết, câu trả lời, chuyên mục, thẻ, banner, thông báo và báo cáo là **chuỗi GUID**, không còn là số. Kiểu TypeScript
là `string`; `shared/utils/ids.ts` có `isGuid` (kiểm tra id trong địa chỉ như `/topics/:id`, `?categoryId=`, `#answer-…`, trang nào thấy id
sai thì báo "đường dẫn không hợp lệ" mà không gọi API) và `hashId` (số nhỏ cố định từ id, dùng chọn màu nền cho thẻ không có ảnh).
Id lấy từ địa chỉ được chuyển về chữ thường trước khi so sánh với dữ liệu từ API. Các hàm kiểm tra dữ liệu API (`typeof … === 'string'`)
cũng đã đổi theo.

## Cấu trúc thư mục `src`

Code chia theo **chức năng (module)**, không chia theo loại file. Mỗi module có cùng một khuôn, nên một chức năng nằm gọn trong một thư mục:

```
src/
  main.tsx              điểm khởi động (provider, phiên đăng nhập)
  app/                  App.tsx (router, tải lười khu quản trị), appRoutes.ts, CSS toàn trang
  shared/               chỉ những thứ nhiều module dùng
    api/                client.ts (gọi API, token, làm mới phiên), guards.ts, problemMessage.ts, fieldErrors.ts, media.ts
    types/              type của client và media
    query/              queryClient, isInitialLoading, getErrorMessage
    hooks/              usePageParam, useListParams, useActionFeedback, useDebounce
    utils/              ids (isGuid, hashId), searchParams, paginate, scrollTarget...
    components/         nút, panel, phân trang, tiêu đề trang, trạng thái rỗng...
    feedback/           AsyncStatePanel, ConfirmDialog, DialogFrame, toast, useDiscardGuard
    layout/             khung trang công khai: header, footer, ô tìm kiếm, menu Viết, ScrollManager
    theme/, styles/     giao diện sáng/tối, reset.css
  features/<module>/    auth, topics, answers, interactions, members, catalog, notifications, reports, moderation, home, admin
    api/                chỉ gọi API và kiểm tra dữ liệu trả về (không JSX, không type)
    types/              type bám theo DTO của backend
    hooks/              hook lấy/ghi dữ liệu (TanStack Query) và hook của từng trang (useXxxPage)
    components/         phần giao diện của module
    pages/              trang theo route: chỉ gọi hook của trang rồi vẽ giao diện
    utils/              hàm thuần (không React) của module, có test
    store/              (chỉ auth) store Zustand
  __tests__/            mọi file test, xếp theo đúng cây thư mục của mã (src/features/x/utils/a.ts → src/__tests__/features/x/utils/a.test.ts)
```

Quy tắc:

- **Page chỉ hiển thị.** Mọi `useState`, `useEffect`, query, mutation và xử lý sự kiện nằm trong hook của trang
  (`features/<module>/hooks/useXxxPage.ts`). Trang gọi hook đó rồi vẽ những gì hook trả về. Ví dụ trang viết bài dùng
  `useWriteTopicForm` (tải dữ liệu biểu mẫu), `useTopicEditor` (ô nhập, xem trước, gửi bài) và `useDraftAutosave` (tự lưu bản nháp).
- **Component không gọi thẳng `api/`**, chỉ dùng hook. Module này dùng thứ của module khác qua hook, type hoặc component của module đó.
- **Hook dùng chung** cho các trang danh sách: `usePageParam` (đọc `?page=`, giá trị sai thành trang 1), `useListParams` (bộ lọc và trang
  trong địa chỉ: gửi form lọc, xóa lọc, đổi trang) và `useActionFeedback` (một dòng thông báo thành công/lỗi sau khi lưu, xóa, khóa...;
  lỗi lấy câu tiếng Việt của API).
- `shared/api/guards.ts`: `isRecord` và `hasPaging` dùng chung để kiểm tra dữ liệu API.
- Khu quản trị (`AdminLayout`, 9 trang `Admin*Page` và thư viện biểu đồ) được **tải lười** bằng `lazy()` trong `app/App.tsx`, nên khách và
  thành viên không tải phần này; menu quản trị vẫn hiện trong lúc một trang quản trị đang tải. Gói JavaScript chính khoảng 645 kB (gzip 202 kB).
- Hook dữ liệu của khu quản trị chia theo từng khu (`categoryQueries`, `tagQueries`, `bannerQueries`, `bannedWordQueries`,
  `accountQueries`, `reportQueries`, `topicQueries`, `overviewQueries`).
- Vitest chỉ tìm test trong `src/__tests__/`. Test không vào bản build.

## Chạy môi trường phát triển

API mặc định được gọi tại `http://localhost:5045`. Có thể đổi địa chỉ bằng cách
sao chép `.env.example` thành `.env.local` và sửa `VITE_API_BASE_URL`.
Trình soạn thảo bài viết là TipTap mã nguồn mở (giấy phép MIT, không cần key hay
tài khoản): `features/topics/hooks/useRichTextEditor.ts` cấu hình editor, tải
ảnh/video qua `/api/media/*`, chế độ sửa HTML và bộ đếm từ/ký tự;
`utils/editorVideo.ts` thêm khối `<video>`. Nội dung lưu dưới dạng HTML và được
backend làm sạch như trước; bài viết cũ của Froala vẫn hiển thị trong
`.reading-content`.

```powershell
npm install
npm run dev
```

Mở `http://localhost:5173`. Backend cần chạy trước bằng launch profile `http` để
frontend tải danh sách chuyên mục thật.

Refresh token nằm trong cookie HttpOnly nên địa chỉ chạy local phải khớp origin CORS
trong backend. Không đổi `localhost` thành `127.0.0.1` nếu chưa cập nhật allowlist.

Các route chính:

- `/login`: đăng nhập, hỗ trợ `returnUrl` nội bộ.
- `/register`: đăng ký thành viên và tự tạo phiên.
- `/account`: route riêng tư, cập nhật avatar tùy chọn, tên hiển thị/giới thiệu
  công khai, đổi mật khẩu và đăng xuất. Avatar lỗi/không có ảnh dùng chữ cái đầu.
- `/notifications`: thông báo riêng của tài khoản, hiển thị số chưa đọc thật trên header.
- `/activity`: lịch sử nội dung và câu trả lời công khai của tài khoản hiện tại.
- `/skills/:tagId`: thống kê nội dung và thành viên sử dụng một kỹ năng/thẻ.
- `/search`: tìm đồng thời bài viết và câu hỏi, giữ từ khóa/bộ lọc trên URL.
- `/saved`: danh sách nội dung đã lưu của tài khoản, phân trang bằng API thật.
- `/articles`, `/questions`: duyệt, tìm kiếm và phân trang nội dung công khai.
- `/discussions`: chủ đề có phản hồi, sắp theo hoạt động thảo luận gần nhất.
- `/topics/:id`, `/members/:userId`: chi tiết, câu trả lời và hồ sơ tác giả công khai.
- `/members/:userId/followers`, `/members/:userId/following`: danh sách theo dõi
  công khai có phân trang, không hiển thị email.
- `/write`: route riêng tư dùng trình soạn thảo TipTap để lưu bản nháp hoặc xuất bản,
  hỗ trợ upload ảnh/video (nút chèn, kéo thả, dán) qua TechForum API.

Khu vực thảo luận gọi API thật tại `/api/topics/{topicId}/answers`. Khách đọc
được câu trả lời và được yêu cầu đăng nhập khi muốn phản hồi; thành viên có thể
gửi văn bản, còn chủ đề bị khóa không hiển thị form gửi. Phản hồi hiển thị tối
đa hai cấp; thao tác trả lời một phản hồi vẫn được backend gắn vào câu trả lời
gốc để tránh cây hội thoại quá sâu trên thiết bị di động.
Tác giả của Câu hỏi có thể chọn hoặc thay đổi câu trả lời được chấp nhận ngay
trong danh sách; Bài viết và phản hồi cấp hai không hiển thị thao tác này.
Trang đọc bài có **thanh hành động** (`TopicActionRail`): ▲ điểm ▼, số thảo luận (bấm để cuộn tới phần trả
lời), **Lưu bài** (hình ngôi sao, kèm số lượt lưu), Chia sẻ và Báo cáo. Trên màn hình từ 1100px, thanh là cột
nút tròn dọc bên trái bài và dính trên cùng khi cuộn suốt bài lẫn phần thảo luận; trên màn hẹp, thanh nằm ngang
ngay sau bài và dính đáy màn hình khi còn đang đọc bài. Khách bấm thì hiện hộp đăng nhập; lỗi và xác nhận hiện
bằng thông báo nhỏ ở góc. Danh sách "Đã lưu" chỉ chứa nội dung còn công khai.

Trang chủ dùng Intro.js 8.6.0 cho tour tìm kiếm, loại nội dung, viết bài và tài
khoản. Trạng thái hoàn tất được lưu riêng theo khách/tài khoản trong trình duyệt;
khách và thành viên chạy lại bằng liên kết **Hướng dẫn sử dụng** ở cuối trang (`/?tour=1`); trang Tùy chỉnh đã bỏ vì chỉ có nút này. Intro.js dùng giấy phép
AGPL-3.0; phù hợp với đồ án phi thương mại khi dự án tuân thủ điều kiện giấy
phép. Nếu triển khai thương mại, cần rà soát và mua license phù hợp từ Intro.js.

Thông báo hiện được tạo khi câu trả lời của thành viên được tác giả câu hỏi chấp
nhận và khi người khác trả lời chủ đề của thành viên. Header tải `unreadCount`
từ backend; mở một thông báo chưa đọc sẽ đánh dấu đã đọc rồi mới điều hướng đến
đúng câu trả lời.

Cột phải trang duyệt gọi `/api/question-highlights` để hiển thị câu hỏi mới và
câu hỏi nhiều phản hồi trong 30 ngày; không dùng số liệu tĩnh.

Hồ sơ công khai hiển thị người theo dõi, số bình chọn tốt nhận được, kỹ năng và danh
hiệu theo ngưỡng dữ liệu thật. Kỹ năng gồm các thẻ thành viên tự chọn (sửa/xóa
tại `/account`, ô **Kỹ năng**, chọn từ thẻ có sẵn, tối đa 12) và các thẻ dùng nhiều
nhất trong nội dung công khai. Thành viên có thể theo dõi/bỏ theo dõi người khác;
khách dùng modal đăng nhập chung.

Trang quản trị `/admin/banned-words` (mục **Từ cấm**) cho quản trị viên xem, tìm, thêm
và xóa từ cấm (xóa có hộp xác nhận). Danh sách được API dùng để thay từ cấm bằng `***`
trong bài viết và câu trả lời mới; thêm/xóa có hiệu lực ngay.

Bài viết và câu trả lời có nút bình chọn **▲ điểm ▼** (thanh hành động của bài, `VoteControl` ở câu trả lời);
đây là cách đánh giá duy nhất. Bấm ▲ hoặc ▼ đang sáng thì rút phiếu, bấm mũi tên còn lại thì
đổi phiếu; khách bấm thì hiện hộp đăng nhập, tác giả không tự bình chọn được (nút mờ kèm lý do). Rê chuột vào ▼ báo trước: tốn 1 điểm danh tiếng (hoàn lại khi bỏ
phiếu) và cần tài khoản từ 7 ngày hoặc 50 điểm danh tiếng; không đủ điều kiện thì hiện lý do cụ thể. Câu trả lời
sắp xếp thêm được theo **Điểm cao nhất** (`?answerSort=score`; câu được chọn vẫn đứng đầu). Hồ sơ công khai hiện
**điểm danh tiếng**. Bảng tin trang chủ có các tab **Mới nhất, Hot, Top, Nổi bật tuần, Đang theo dõi** (`?feed=`). **Hot** đưa bài được bình chọn nhiều
trong thời gian ngắn lên đầu rồi hạ dần; **Top** xếp theo điểm cao nhất và có ô chọn khoảng thời gian (Hôm nay, Tuần này, Tháng
này, Mọi thời đại; `?range=`, mặc định Tuần này). Thẻ bài ở hai tab này hiện `▲ điểm`. Điểm của bài mới được **ẩn trong 2 giờ
đầu**: nút ▲▼, thẻ bài và câu trả lời hiện dấu `•` thay cho số (rê chuột để đọc lý do); phiếu của chính bạn vẫn hiện.
Trang `/starred` cũ chuyển thẳng sang `/saved` ("Đã lưu").

Đầu trang bài, hồ sơ và danh sách theo dõi có đường dẫn `PageBreadcrumbs` (Trang chủ › Bài viết › chuyên mục › tên
bài) thay cho link "← Quay lại"; mục cuối là trang đang xem, tên dài bị cắt bằng "…" để luôn nằm trên một dòng.

Khi đang viết bài (`/write`), trả lời hoặc sửa câu trả lời, trang gửi nội dung tới
`POST /api/moderation/check` sau khi ngừng gõ khoảng 1 giây (`useContentCheck`) và hiện cảnh báo
vàng `ProfanityNotice` nếu có từ sẽ bị thay bằng `***` ("Phần tiêu đề và nội dung có từ ngữ không
phù hợp…"). Tab **Xem trước** hiển thị tiêu đề, tóm tắt và nội dung đã lọc, đúng như người đọc sẽ thấy.
Cảnh báo chỉ để nhắc, không chặn việc đăng (backend vẫn tự lọc); lỗi của lần kiểm tra bị bỏ qua. Trang
không chứa danh sách từ cấm nào và không dùng thư viện npm lọc từ: mọi quy tắc nằm ở backend, nên
người ngoài không đọc được danh sách trong mã frontend.

Trang `/account` chia hai cột độc lập (Avatar + Hồ sơ | Kỹ năng + Đổi mật khẩu +
Phiên đăng nhập) để thẻ ngắn không bị kéo giãn theo thẻ bên cạnh. Kết quả lưu
(hồ sơ, avatar, kỹ năng) hiện bằng thông báo nổi `ToastProvider` (MUI Snackbar + Alert,
tự tắt sau 4 giây); danh sách rỗng dùng biểu tượng hòm thư (`EmptyStateIcon`).

Slider banner trang chủ tự chuyển sau 5 giây, kể cả khi hệ điều hành bật "giảm
chuyển động" (khi đó chỉ bỏ hiệu ứng trượt); có nút tạm dừng/tiếp tục. Ảnh banner
luôn phủ kín khung tỉ lệ 3:1 (`object-fit: cover`, ảnh đặt tuyệt đối nên kích thước
gốc không làm phình khung). Ảnh và video trong bài viết, bản xem trước và editor có
cỡ tối đa cố định (video 640×360, ảnh cao tối đa 480px). Bài không có ảnh (ví dụ chỉ
có video) hiện nền theo thẻ đầu tiên ở mục "Tin công nghệ" (`TagCover`).

Header desktop đặt Bài viết/Hỏi đáp/Thảo luận cạnh logo, sau đó mới tới tìm kiếm.
Nút bút dùng menu MUI với hai lựa chọn `Viết bài` và `Đặt câu hỏi`. Trang `/`
là danh sách Bài viết; không còn mục Trang chủ trùng nghĩa. Giao diện dùng Roboto
cho nội dung và Open Sans cho tiêu đề; font được tải từ Google Fonts nên khi máy
không có mạng sẽ dùng fallback hệ thống.

Phiên đăng nhập dùng JWT, được giữ trong store Zustand (`src/features/auth/store/authStore.ts`):

- Access token chỉ nằm trong bộ nhớ, không lưu trong localStorage. API client gửi
  nó bằng header `Authorization: Bearer`.
- Refresh token nằm trong cookie HttpOnly mà JavaScript không đọc được. Khi tải
  lại trang, `initializeSession()` gọi `POST /api/auth/refresh` để khôi phục phiên.
- Khi gặp 401, API client làm mới token một lần rồi gửi lại request. Nhiều request
  lỗi cùng lúc dùng chung một lần làm mới, và Web Lock giúp các tab không gửi cùng
  một refresh token.
- Đổi mật khẩu đăng xuất mọi thiết bị, nên giao diện đưa người dùng về `/login`.

Dữ liệu từ API được tải bằng TanStack React Query (các file `features/<module>/hooks/`):

- Mỗi nhóm dữ liệu có một file hook (`useCategories`, `useTopic`, `useNotifications`...).
  Trang chỉ gọi hook, không tự viết `useEffect`, `AbortController` hay đếm số lần thử lại.
  Hàm API đã nhận `signal`, nên React Query tự hủy request cũ khi đổi trang hoặc bộ lọc.
- Dữ liệu được coi là mới trong 30 giây và không tải lại khi chuyển cửa sổ. Lỗi đọc được
  thử lại một lần, trừ lỗi 4xx. Thao tác ghi không bao giờ tự thử lại, nên không tạo bản ghi trùng.
- Dữ liệu phụ thuộc người đăng nhập (thông báo, nội dung của tôi, trạng thái lưu, phiếu bình
  chọn, trang quản trị) có khóa bắt đầu bằng `['user', userId, ...]` và chỉ chạy sau khi
  phiên được khôi phục. Khi đăng xuất hoặc đổi người dùng, dữ liệu của người cũ bị xóa khỏi cache.
  Dữ liệu công khai (chuyên mục, thẻ, danh sách chủ đề) được giữ.
- Thao tác ghi dùng `useMutation`. Sau khi ghi, hook cập nhật cache hoặc đánh dấu dữ liệu liên quan
  là cũ để tải lại. Ví dụ: đánh dấu thông báo đã đọc làm số thông báo trên header tự cập nhật.
- Các form (đăng câu trả lời, sửa câu trả lời, báo cáo...) vẫn giữ trạng thái gửi riêng.

Trạng thái giao diện dùng chung nằm trong store Zustand:

- `src/features/auth/store/authStore.ts`: người dùng hiện tại và access token.
- `src/features/auth/store/authDialogStore.ts`: hộp thoại "Bạn cần đăng nhập". Chỉ có một hộp thoại, gắn một lần ở
  `app/App.tsx` (`AuthRequiredDialogHost`). Component nào cần cũng gọi `openAuthDialog()`, không tự giữ
  trạng thái mở/đóng. Hộp thoại tự đóng khi chuyển trang. `ProtectedRoute` vẫn dùng hộp thoại riêng vì
  khi đóng nó phải đưa người dùng về trang chủ.
- Trạng thái chỉ một component dùng (menu đang mở, nội dung ô tìm kiếm, tour hướng dẫn) vẫn dùng
  `useState`/`useRef` tại chỗ, không đưa vào store.

## Kiểm tra

```powershell
npm run lint
npm run build
npm test
```

Đợt kiểm chứng ngày 2026-10-21 đạt lint và 23 test. Build production kiểm chứng
bằng `npm run build -- --outDir dist/verify-member-ready`; thư mục riêng tránh
lỗi quyền xóa file cũ trong `dist` đã ghi nhận ở đợt trước. Không thay đổi ACL.
Cảnh báo bundle Froala lớn vẫn còn.
