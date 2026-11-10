Quy tắc phát triển TechForum dành cho Codex
Đọc toàn bộ file này trước khi triển khai hoặc sửa FE/BE của TechForum. Đây là hướng dẫn dự án để người dùng đưa cho Codex đọc, không tự cài skill/plugin. Áp dụng cùng hướng dẫn repo và yêu cầu mới nhất của người dùng; nếu xung đột thì nêu rõ và tuân thủ yêu cầu mới nhất trong phạm vi được phép.
1. Mục tiêu và mức độ code
- Phát triển đồ án diễn đàn công nghệ để sinh viên năm cuối hiểu, kiểm thử, bảo trì và giải thích khi bảo vệ.
- Dùng React + TypeScript + Vite cho FE; ASP.NET Core Web API + EF Core + SQL Server cho BE. Kiểm tra phiên bản thực tế trong repo, không tự nâng cấp stack.
- Viết code rõ ràng, có cấu trúc và đúng nghiệp vụ. Không cố làm code ngắn nhất hay dùng kỹ thuật cao cấp để thể hiện kinh nghiệm.
- Ưu tiên tên biến đầy đủ, hàm có một trách nhiệm và luồng điều kiện dễ theo dõi. Dùng early return khi làm luồng rõ hơn; tránh ternary lồng nhau, chuỗi xử lý dài và biểu thức khó đọc.
- Dùng tính năng thông thường của TypeScript/C#: kiểu dữ liệu, interface, DI, async/await và truy vấn LINQ đơn giản khi cần. Không cấm kỹ thuật cần thiết cho tính đúng hoặc bảo mật chỉ vì nó mới với người học.
- Giải thích ngắn quyết định quan trọng bằng tiếng Việt. Comment giải thích lý do hoặc quy tắc nghiệp vụ; không comment lại điều mà dòng code đã nói rõ.
2. Think Before Coding — suy nghĩ trước khi viết
- Trước khi sửa, đọc git status, branch/remote, code liên quan, cấu hình, migration, contract API và hướng dẫn repo.
- Nêu giả định và phương án triển khai trước khi code. Không khẳng định chức năng đã có nếu chưa đọc hoặc chạy kiểm tra.
- Nếu có nhiều cách hiểu làm thay đổi hành vi, dữ liệu hoặc phân quyền, trình bày các cách hiểu và hỏi người dùng trước khi làm phần phụ thuộc.
- Khi có cách đơn giản hơn, nêu rõ lợi ích và chọn cách phù hợp; phản biện yêu cầu nếu nó tạo mâu thuẫn nghiệp vụ.
- Nếu thiếu thông tin chặn việc triển khai đúng, dừng phần bị chặn, nói rõ điều chưa hiểu và hỏi. Tiếp tục phần độc lập khi có thể.
- Với lựa chọn kỹ thuật nhỏ, có thể suy ra từ convention và ngữ cảnh đã chốt; không hỏi lại những quyết định đã có.
- Đặt tiêu chí hoàn thành có thể kiểm chứng và kế hoạch ngắn: bước thực hiện → cách kiểm tra.
3. Simplicity First — đơn giản trước
- Chỉ làm chức năng được giao trong milestone hiện tại.
- Không tạo abstraction cho code dùng một lần; chỉ tách component/hàm khi có trách nhiệm rõ hoặc tái sử dụng thực sự.
- Không thêm cấu hình linh hoạt, extension point, package hay tính năng dự phòng chưa được yêu cầu.
- Không thêm CQRS, MediatR, microservices, event bus, nhiều project Clean Architecture, generic repository hoặc Unit of Work riêng chỉ để dự án trông chuyên nghiệp.
- Repository theo nghiệp vụ vẫn được dùng để giữ tầng truy cập dữ liệu rõ ràng; interface phục vụ DI khi cần, không tạo interface rỗng hàng loạt.
- Xử lý lỗi có thể xảy ra: dữ liệu sai, phiên hết hạn, quyền thiếu, mạng lỗi, tài nguyên mất, xung đột và lỗi lưu. Không dựng nhánh cho kịch bản không thể xảy ra trong thiết kế.
- Nếu 200 dòng có thể thành 50 dòng mà vẫn dễ đọc và giữ đúng hành vi, đơn giản hóa. Không rút gọn bằng biểu thức khó giải thích.
4. Surgical Changes — sửa đúng phạm vi
- Mỗi dòng thay đổi phải phục vụ trực tiếp yêu cầu hoặc sửa lỗi do thay đổi đó gây ra.
- Không chỉnh format, comment, tên biến hoặc refactor code bên cạnh nếu không cần cho nhiệm vụ.
- Giữ convention hiện có. Nếu cần đổi kiến trúc, nêu phạm vi và lý do trước; không di chuyển toàn bộ repo khi chỉ thêm một chức năng.
- Không ghi đè, reset, stash hoặc xóa thay đổi chưa commit của người dùng khi chưa được yêu cầu.
- Xóa import, biến, hàm mà chính thay đổi của mình làm không còn dùng.
- Với dead code có từ trước, báo lại; không tự xóa.
- Kiểm tra diff trước stage. Không stage toàn bộ repo khi còn thay đổi ngoài phạm vi.
5. Goal-Driven Execution — thực hiện đến khi kiểm chứng
- Chuyển nhiệm vụ thành mục tiêu kiểm chứng: validation có ca dữ liệu sai; sửa bug có ca tái hiện; refactor có kiểm tra trước/sau.
- Viết test có ý nghĩa cho nghiệp vụ, phân quyền, lỗi hồi quy và thao tác dữ liệu quan trọng. Không viết test chỉ lặp lại implementation hoặc cho đổi giao diện nhỏ ít rủi ro.
- Nếu chưa có hạ tầng test, thêm tối thiểu khi cần cho ca quan trọng; không dựng cả framework để kiểm tra một thay đổi nhỏ.
- Chạy build/lint/test phù hợp. Kiểm thử FE → API → CSDL đối với chức năng tích hợp.
- Phân biệt build thành công, test tự động đạt và test thủ công đạt; không gộp thành tuyên bố “mọi thứ chạy tốt”.
- Nếu môi trường thiếu SQL Server hoặc công cụ, hoàn thành phần kiểm chứng được, báo giới hạn và lệnh người dùng cần chạy; không giả lập kết quả kiểm tra.
- Khi kiểm tra thất bại, sửa và kiểm tra lại phần liên quan. Không bỏ qua lỗi mới để chuyển chức năng khác.
6. Cấu trúc React frontend
Giữ cấu trúc đang hoạt động nếu tương đương. Chỉ tạo thư mục/file khi có code sử dụng, không scaffold hàng loạt thư mục rỗng.
Vị trí đề xuất	Trách nhiệm
frontend/src/main.tsx	Khởi tạo ứng dụng và provider cần thiết
frontend/src/App.tsx	Kết nối bố cục/router, không chứa toàn bộ nghiệp vụ
frontend/src/pages/	Trang theo route: đăng nhập, danh sách chủ đề, chi tiết, quản trị
frontend/src/components/common/	Thành phần dùng chung thực sự: nút, input, trạng thái
frontend/src/components/layout/	Header, điều hướng, layout công khai và quản trị
frontend/src/components/topics/	Các phần giao diện chủ đề khi đã có chức năng
frontend/src/services/apiClient.ts	Base URL, request, lỗi và cơ chế xác thực thống nhất
frontend/src/services/	Hàm API theo nghiệp vụ, không chứa JSX
frontend/src/types/	DTO/kiểu dữ liệu bám contract backend
frontend/src/hooks/	Custom hook có trách nhiệm rõ khi thật sự cần
frontend/src/context/	Trạng thái toàn ứng dụng cần chia sẻ, ví dụ xác thực
frontend/src/styles/	CSS chung, token màu/khoảng cách khi cần


- Dùng function component và TypeScript rõ kiểu. Tránh any, ép kiểu để che lỗi và non-null assertion tùy tiện.
- Với state cục bộ dùng useState; dùng Context khi cần chia sẻ. Không thêm Redux/Zustand chỉ vì danh mục skill đề xuất.
- Tách trang và phần hiển thị đủ để đọc được; không tạo hàng chục component vụn.
- Không thêm useMemo/useCallback khắp nơi khi chưa có lý do.
- Gọi API qua service; xử lý loading, empty, error, success, disabled và lỗi quyền theo chức năng.
- Xử lý response 204; hủy/bỏ qua response cũ khi chuyển trang hoặc tìm kiếm; chống gửi biểu mẫu lặp.
- Không tự retry thao tác ghi như đăng chủ đề/báo cáo nếu có thể tạo bản ghi trùng.
- Không dùng dữ liệu mock để báo hoàn thành tích hợp. Dữ liệu seed demo phải nằm trong CSDL và được đánh dấu rõ.
7. Cấu trúc ASP.NET Core backend
Ưu tiên một project API với luồng Controller → Service → Repository → DbContext → SQL Server, giống nguyên tắc tầng dữ liệu của sport-social-app. Không sao chép code thể thao sang diễn đàn.
Vị trí đề xuất	Trách nhiệm
backend/Controllers/	Nhận HTTP request, model validation, lấy danh tính, gọi service, trả HTTP
backend/Services/	Quy tắc nghiệp vụ, kiểm tra quyền tài nguyên, phối hợp thao tác
backend/Services/Interfaces/	Hợp đồng DI cần thiết cho service
backend/Repositories/	Truy vấn/lưu EF Core theo từng nghiệp vụ
backend/Repositories/Interfaces/	Hợp đồng repository cần dùng
backend/Data/	AppDbContext, cấu hình EF, seed phát triển khi cần
backend/Entities/	Thực thể lưu trữ và quan hệ
backend/DTOs/	Request/response theo nghiệp vụ
backend/Enums/	Trạng thái/vai trò có tên, tránh số magic
backend/Migrations/	Migration EF Core
backend/Program.cs	Đăng ký DI và middleware, không chứa toàn bộ nghiệp vụ


- Nếu repo dùng Models thay Entities hoặc đặt interface cùng implementation, giữ convention hợp lý hiện có.
- Nếu M1 đang có tầng Data, chuyển sang Repository theo phần chức năng cần làm; không đổi tên/di chuyển hàng loạt chỉ để khớp bảng trên.
- Controller không truy vấn DbContext trực tiếp. Repository không quyết định quyền nghiệp vụ hoặc trả HTTP response.
- Service nhận danh tính đáng tin cậy từ server; không tin userId/role do FE gửi để cấp quyền.
- Trả DTO, không serialize entity EF có vòng quan hệ hoặc thông tin nhạy cảm.
- Dùng async/await và DI tiêu chuẩn; không dùng Task.Run để bao truy vấn EF.
- Lấy vừa đủ dữ liệu, phân trang danh sách; dùng AsNoTracking cho truy vấn chỉ đọc khi phù hợp.
- Kiểm tra unique constraint bên DB, không chỉ kiểm tra trước trong service.
- Với nhiều thay đổi phải cùng thành công, dùng khả năng giao dịch của EF Core; không thêm lớp Unit of Work riêng khi DbContext đã đáp ứng.
- Đảm bảo package EF tương thích với project; không lấy phiên bản trong ví dụ skill làm phiên bản repo.
8. Nghiệp vụ TechForum và contract FE/BE
- Khách xem nội dung công khai. Thành viên quản lý nội dung của mình, thảo luận, thích/lưu và báo cáo. Quản trị viên quản lý và kiểm duyệt theo quyền đã chốt.
- Chủ đề thuộc một chuyên mục; thẻ và chủ đề là nhiều–nhiều; câu trả lời thuộc đúng một chủ đề.
- Mô hình lớp TaiKhoan/ThanhVien/QuanTriVien và NoiDung/ChuDe/CauTraLoi là mô hình nghiệp vụ. Chọn ánh xạ EF/CSDL có giải thích; không bắt buộc tạo một bảng cho mỗi lớp UML.
- Kiểm tra quyền tác giả khi sửa/xóa; chủ đề bị khóa không nhận trả lời mới; nội dung bị ẩn/xóa không lộ qua endpoint công khai.
- Mọi thao tác quản trị phải được kiểm tra ở backend, không chỉ ẩn nút FE.
- Không cho đăng ký tự chọn quyền quản trị. Không trả mật khẩu/hash, token hoặc bí mật trong log và DTO công khai.
- Xác thực bằng cơ chế đã triển khai; không tự đổi cách lưu token/phiên, đăng xuất hoặc refresh giữa milestone.
- Trước làm FE, đọc DTO, endpoint, mã HTTP và mẫu JSON thực tế từ BE.
- Chốt đồng bộ tên trường, kiểu ID, enum, dữ liệu nullable, phân trang, ngày giờ và contract lỗi.
- Xóa mềm, giới hạn phản hồi, accepted answer, chống báo cáo trùng và quyền quản trị viên dùng tính năng thành viên phải dựa quyết định đã chốt. Nếu chưa rõ thì nêu giả định, hỏi trước phần phụ thuộc.
9. Giao diện gọn và dễ tiếp cận
- Thiết kế diễn đàn lấy nội dung làm trung tâm: header, tìm kiếm, chuyên mục, danh sách và chi tiết.
- Dùng nền trung tính, màu nhấn nhất quán, chữ dễ đọc, khoảng trắng hợp lý và layout responsive.
- Không thêm gradient, glassmorphism, animation thừa, banner lớn hoặc số liệu giả để làm trang trông đầy.
- Dùng label cho form, focus nhìn thấy được, thông báo lỗi cụ thể, độ tương phản đủ và thao tác bàn phím.
- Tham khảo bố cục duyệt nội dung của Viblo khi hữu ích; giữ nhận diện và nghiệp vụ TechForum.
- Đọc DESIGN.md ở thư mục gốc trước khi sửa UI; dùng token và quy tắc component trong đó, cập nhật tệp khi có quy tắc mới lặp lại. DESIGN.md không được mâu thuẫn với mục này.
- Kiểm tra giao diện thật ở màn hình hẹp và rộng; không coi ảnh mockup là sản phẩm hoàn thành.

Không kích hoạt tất cả skill cho mọi nhiệm vụ. Chọn phần có liên quan, giữ chỉ dẫn của dự án ưu tiên hơn ví dụ tham khảo.
11. Chia phase, commit và push
Quy tắc mới nhất: hoàn tất chức năng đã kiểm tra thì commit và push. Quy tắc này thay thế “không push” ở trao đổi trước.
- Phase là nhóm chức năng; mỗi phase chia thành milestone và chức năng nhỏ có tiêu chí hoàn thành.
- Làm từng chức năng; BE/contract trước, FE sau. Có thể chia commit BE và FE khi từng phần độc lập, kiểm chứng được và không phá build.
- Không gom cả phase thành một commit lớn. Khi diff gần 300 dòng thêm/xóa, xem lại phạm vi và tìm điểm hoàn thành để commit. Đây là mốc nhắc chia việc, không giới hạn cứng hoặc lý do commit code đang lỗi.
- Tách chức năng lớn từ đầu thành các phần kết thúc hợp lý. Không chia ngẫu nhiên theo số dòng làm lịch sử khó hiểu.
- Không tính lockfile hoặc migration sinh tự động như code viết tay để ép commit; vẫn kiểm tra và lưu file sinh cần thiết cùng thay đổi liên quan.
- Sau mỗi chức năng đạt: xem git diff, git diff --check, stage file liên quan, commit rồi push đúng remote/branch của dự án.
- Trước push kiểm tra branch, remote và thay đổi staged; không force-push, không sửa lịch sử hay vượt bảo vệ branch.
- Nếu push lỗi, giữ commit local, báo lỗi cụ thể và trạng thái; không báo đã push thành công.
- Khi phase hoàn tất, cập nhật tiến độ/tài liệu/test còn thiếu, commit và push các thay đổi đó nếu có. Không tạo commit rỗng chỉ để đánh dấu phase.
- Bảo vệ thay đổi chưa commit của người dùng. Không commit bí mật, dữ liệu cá nhân hoặc file ngoài yêu cầu.
- Commit message có tiêu đề nêu hành vi và body mô tả việc làm, lý do, kiểm tra, giới hạn. Dùng cùng ngôn ngữ/convention của repo.
Ví dụ commit:
feat(auth): implement member registration and login

- Add account DTOs, service and repository
- Validate unique email and hash passwords
- Return current-user data without sensitive fields
- Connect registration and login forms to real endpoints

Validation: backend build, frontend build/lint, auth cases
Limitation: describe only checks not yet performed
12. Tiến độ và bàn giao
- Roadmap: M0 rà soát; M1 nền tảng/chuyên mục; M2 tài khoản; M3 chủ đề/tra cứu; M4 thảo luận; M5 tương tác; M6 báo cáo/kiểm duyệt; M7 quản trị/thống kê; M8 hoàn thiện đồ án.
- M1 đã được người dùng xác nhận test thành công trong cuộc trò chuyện. M2.1 đã có prompt; không mặc định đã làm hoặc test. Đọc code/commit và hỏi khi cần xác định mốc mới nhất.
- Kết thúc chức năng, báo việc đã làm và lý do; file đổi; contract liên quan; lệnh kiểm tra và kết quả; test chưa chạy; commit/branch và kết quả push; bước test thủ công tiếp theo.
- Nếu có lỗi cũ, phân biệt với lỗi do thay đổi mới. Nếu kiểm tra chưa đạt, ghi rõ chưa hoàn thành.
- Không tự chuyển chức năng khác chỉ để né lỗi đang chặn. Nếu người dùng giao cả phase, tiếp tục các chức năng trong phạm vi sau kiểm tra; nếu chỉ giao một milestone, dừng ở milestone đó.
Câu giao việc mẫu
Đọc TechForum_Codex_Rules.md và hướng dẫn repo trước. Kiểm tra trạng thái FE/BE local, thực hiện đúng chức năng được giao trong phase hiện tại. Nêu giả định và tiêu chí hoàn thành, code dễ đọc theo cấu trúc đã chốt, kiểm tra, commit và push từng phần hoàn tất. Cuối lượt báo bằng chứng kiểm tra và việc còn thiếu.