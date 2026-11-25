import { contactEmail } from '../../../shared/layout/footerLogic'

export interface LegalSection {
  heading: string
  paragraphs?: string[]
  items?: string[]
}

export interface LegalDocument {
  title: string
  description: string
  updatedOn: string
  sections: LegalSection[]
}

// Nội dung viết theo đúng những gì code đang làm. Đổi cách lưu dữ liệu hay thêm dịch vụ bên ngoài thì sửa cả ở đây.
export const privacyPolicy: LegalDocument = {
  title: 'Chính sách bảo mật',
  description: 'TechForum thu thập dữ liệu gì, dùng vào việc gì, lưu ở đâu và bạn có quyền gì với dữ liệu của mình.',
  updatedOn: '25/11/2026',
  sections: [
    {
      heading: '1. Dữ liệu chúng tôi thu thập',
      items: [
        'Tài khoản: email, tên hiển thị, mật khẩu (chỉ lưu dạng đã băm, không ai đọc lại được), ảnh đại diện, giới thiệu ngắn và kỹ năng nếu bạn tự điền.',
        'Đăng nhập bằng Google: Google gửi cho chúng tôi email, tên và mã định danh tài khoản Google của bạn. Chúng tôi không nhận mật khẩu Google.',
        'Nội dung bạn tạo: bài viết, câu hỏi, câu trả lời, bản nháp tự lưu, ảnh và video tải lên, bình chọn, lượt đánh dấu sao, bài đã lưu, người theo dõi và báo cáo vi phạm.',
        'Dữ liệu kỹ thuật: lượt xem bài được đếm bằng một mã ngẫu nhiên đã băm (không gắn với tên hay email của khách). Địa chỉ IP chỉ được dùng tạm trong bộ nhớ để giới hạn số lần gửi email đặt lại mật khẩu và xác minh, không lưu vào cơ sở dữ liệu.',
      ],
    },
    {
      heading: '2. Mục đích sử dụng',
      items: [
        'Tạo và duy trì tài khoản, giữ bạn đăng nhập.',
        'Hiển thị nội dung bạn đăng cho cộng đồng, gửi thông báo trong trang (có người trả lời, theo dõi...).',
        'Gửi email cần thiết: xác minh email khi đăng ký và đặt lại mật khẩu. Chúng tôi không gửi email quảng cáo.',
        'Kiểm duyệt: thay từ ngữ bị cấm bằng ký tự che, kiểm tra ảnh tải lên bằng công cụ tự động, xử lý báo cáo vi phạm và ghi lại thao tác của quản trị viên.',
        'Bảo vệ trang khỏi lạm dụng: giới hạn tần suất đăng bài, trả lời, báo cáo của mỗi tài khoản và khoá tài khoản vi phạm.',
      ],
    },
    {
      heading: '3. Cookie và bộ nhớ trình duyệt',
      items: [
        'TechForum.Refresh: giữ phiên đăng nhập. Không chọn "Duy trì đăng nhập" thì cookie mất khi bạn thoát trình duyệt (và hết hạn sau tối đa 1 ngày); có chọn thì giữ 30 ngày kể từ lần bạn quay lại gần nhất.',
        'TechForum.Visitor: mã ngẫu nhiên giúp một khách chưa đăng nhập không bị đếm nhiều lần khi xem cùng một bài, giữ 1 năm.',
        'Bộ nhớ trình duyệt (localStorage): nhớ chế độ sáng/tối và việc bạn đã xem phần hướng dẫn sử dụng.',
        'Chúng tôi không dùng cookie quảng cáo hay công cụ theo dõi của bên thứ ba.',
      ],
    },
    {
      heading: '4. Dịch vụ bên ngoài chúng tôi sử dụng',
      paragraphs: ['Để vận hành trang, một phần dữ liệu được xử lý bởi các nhà cung cấp sau, mỗi bên chỉ nhận phần cần cho việc của mình:'],
      items: [
        'Vercel: phục vụ giao diện trang web.',
        'Render: chạy máy chủ API.',
        'Microsoft Azure SQL Database: lưu cơ sở dữ liệu (tài khoản, bài viết, tương tác).',
        'Cloudinary: lưu và phát ảnh, video bạn tải lên; ảnh có thể được dịch vụ kiểm duyệt tự động của Cloudinary (Amazon Rekognition) phân tích để phát hiện nội dung không phù hợp.',
        'Mailjet: gửi email xác minh và đặt lại mật khẩu.',
        'Google: đăng nhập bằng Google (nếu bạn chọn) và phông chữ của trang (Google Fonts).',
      ],
    },
    {
      heading: '5. Thời gian lưu trữ',
      items: [
        'Tài khoản chưa xác minh email và chưa có hoạt động nào sẽ tự bị xoá sau 7 ngày.',
        'Tài khoản đã xác minh và nội dung được lưu cho tới khi bạn yêu cầu xoá hoặc tài khoản bị xoá do vi phạm.',
        'Ảnh, video tải lên nhưng không nằm trong bài nào sẽ được dọn định kỳ.',
        'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất được dọn định kỳ.',
      ],
    },
    {
      heading: '6. Quyền của bạn',
      items: [
        'Xem và sửa thông tin hồ sơ, ảnh đại diện, mật khẩu trong trang Tài khoản.',
        'Sửa hoặc xoá bài viết, câu trả lời của mình.',
        `Yêu cầu xuất dữ liệu hoặc xoá hẳn tài khoản: gửi email từ chính địa chỉ đã đăng ký tới ${contactEmail}. Chúng tôi xử lý trong vòng 30 ngày.`,
        'Rút lại việc liên kết Google bằng cách gỡ quyền của TechForum trong phần Bảo mật của tài khoản Google.',
      ],
    },
    {
      heading: '7. Bảo mật',
      paragraphs: [
        'Kết nối luôn dùng HTTPS. Mật khẩu được băm, phiên đăng nhập dùng cookie HttpOnly mà mã trên trang không đọc được, và token trong cookie chỉ được lưu dưới dạng mã băm ở máy chủ. Không hệ thống nào an toàn tuyệt đối; nếu phát hiện sự cố ảnh hưởng tới dữ liệu của bạn, chúng tôi sẽ thông báo qua email.',
      ],
    },
    {
      heading: '8. Trẻ em',
      paragraphs: ['Nếu bạn dưới 16 tuổi, hãy dùng TechForum khi có sự đồng ý của cha mẹ hoặc người giám hộ.'],
    },
    {
      heading: '9. Thay đổi và liên hệ',
      paragraphs: [
        'Khi chính sách thay đổi, ngày cập nhật ở đầu trang sẽ thay đổi theo; thay đổi quan trọng sẽ được báo trên trang.',
        `Mọi câu hỏi về dữ liệu cá nhân, gửi về ${contactEmail}.`,
      ],
    },
  ],
}

export const termsOfUse: LegalDocument = {
  title: 'Điều khoản sử dụng',
  description: 'Những điều bạn đồng ý khi tạo tài khoản và đăng nội dung trên TechForum.',
  updatedOn: '25/11/2026',
  sections: [
    {
      heading: '1. Chấp nhận điều khoản',
      paragraphs: [
        'Khi tạo tài khoản hoặc đăng nội dung, bạn đồng ý với điều khoản này và Chính sách bảo mật. Khách chỉ đọc nội dung công khai cũng nên tuân theo các quy định chung dưới đây.',
      ],
    },
    {
      heading: '2. Tài khoản',
      items: [
        'Dùng email thật mà bạn có quyền truy cập; tài khoản phải xác minh email mới được đăng bài, trả lời, bình chọn và báo cáo.',
        'Mỗi người tự giữ bí mật mật khẩu và chịu trách nhiệm cho hoạt động trên tài khoản của mình.',
        'Không mạo danh người khác, không tạo nhiều tài khoản để lách giới hạn hay thao túng bình chọn.',
      ],
    },
    {
      heading: '3. Nội dung được phép',
      paragraphs: ['TechForum là nơi chia sẻ kiến thức công nghệ. Không đăng:'],
      items: [
        'Nội dung vi phạm pháp luật Việt Nam, kích động bạo lực, thù ghét, phân biệt đối xử.',
        'Nội dung khiêu dâm, máu me, hoặc ảnh, video không phù hợp.',
        'Thư rác, quảng cáo không liên quan, lừa đảo, mã độc hay đường dẫn nguy hiểm.',
        'Thông tin cá nhân của người khác khi chưa được họ cho phép.',
        'Nội dung sao chép vi phạm bản quyền; trích dẫn thì ghi rõ nguồn.',
      ],
    },
    {
      heading: '4. Quyền với nội dung bạn đăng',
      paragraphs: [
        'Bạn vẫn là chủ sở hữu nội dung của mình. Khi đăng, bạn cho phép TechForum lưu trữ, hiển thị công khai và phân phối nội dung đó trên trang để cộng đồng đọc. Bạn có thể sửa hoặc xoá nội dung của mình bất cứ lúc nào; bản đã được người khác trích dẫn trong câu trả lời của họ có thể vẫn còn.',
      ],
    },
    {
      heading: '5. Kiểm duyệt',
      items: [
        'Từ ngữ bị cấm trong tiêu đề, tóm tắt và nội dung được báo trước khi đăng và tự thay bằng ký tự che khi lưu; ảnh tải lên có thể bị từ chối nếu công cụ kiểm duyệt tự động đánh giá là không phù hợp.',
        'Thành viên có thể báo cáo nội dung vi phạm. Nội dung bị nhiều người báo cáo có thể tự ẩn trong lúc chờ quản trị viên xem xét.',
        'Quản trị viên có quyền ẩn, xoá nội dung, khoá thảo luận hoặc khoá tài khoản vi phạm. Mọi thao tác quản trị đều được ghi lại.',
      ],
    },
    {
      heading: '6. Giới hạn trách nhiệm',
      paragraphs: [
        'Nội dung trên TechForum do thành viên đóng góp và chỉ mang tính tham khảo; hãy tự kiểm tra trước khi áp dụng vào hệ thống thật. Trang được cung cấp "như hiện có", có thể tạm gián đoạn để bảo trì hoặc do nhà cung cấp hạ tầng.',
      ],
    },
    {
      heading: '7. Thay đổi và liên hệ',
      paragraphs: [
        'Điều khoản có thể được cập nhật; ngày cập nhật ở đầu trang sẽ thay đổi theo. Tiếp tục sử dụng sau khi cập nhật nghĩa là bạn đồng ý với bản mới.',
        `Góp ý, khiếu nại về kiểm duyệt hoặc báo vi phạm bản quyền, gửi về ${contactEmail}.`,
      ],
    },
  ],
}
