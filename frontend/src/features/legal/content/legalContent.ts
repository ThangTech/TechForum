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

// Viết theo nhóm mục đích, không nêu tên công nghệ hay chi tiết cài đặt. Nội dung vẫn phải đúng với những gì
// trang thật sự làm: thêm loại dữ liệu mới hoặc thêm nhóm dịch vụ bên ngoài thì sửa cả ở đây.
export const privacyPolicy: LegalDocument = {
  title: 'Chính sách bảo mật',
  description: 'Cách TechForum thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.',
  updatedOn: '25/11/2026',
  sections: [
    {
      heading: '1. Phạm vi áp dụng',
      paragraphs: [
        'Chính sách này áp dụng khi bạn truy cập, đăng ký tài khoản hoặc đăng nội dung trên TechForum. Bằng việc sử dụng trang, bạn đồng ý với cách chúng tôi xử lý thông tin được mô tả dưới đây.',
      ],
    },
    {
      heading: '2. Thông tin chúng tôi thu thập',
      items: [
        'Thông tin bạn cung cấp: email, tên hiển thị, mật khẩu, ảnh đại diện và các thông tin hồ sơ bạn tự điền.',
        'Thông tin từ tài khoản liên kết: khi bạn đăng nhập bằng Google, chúng tôi nhận email và tên của bạn từ Google. Chúng tôi không nhận mật khẩu Google.',
        'Nội dung bạn tạo: bài viết, câu hỏi, câu trả lời, bản nháp, hình ảnh, video và các tương tác như bình chọn, lưu bài, theo dõi, báo cáo.',
        'Thông tin kỹ thuật cần cho việc vận hành: dữ liệu phiên đăng nhập, lượt xem bài và thông tin kết nối dùng để chống lạm dụng.',
      ],
    },
    {
      heading: '3. Mục đích sử dụng',
      items: [
        'Cung cấp và duy trì tài khoản, giữ bạn đăng nhập.',
        'Hiển thị nội dung bạn đăng cho cộng đồng và gửi thông báo liên quan tới hoạt động của bạn.',
        'Gửi email cần thiết như xác minh tài khoản và đặt lại mật khẩu. Chúng tôi không gửi email quảng cáo.',
        'Kiểm duyệt nội dung, xử lý báo cáo vi phạm và giữ an toàn cho cộng đồng.',
        'Phát hiện, ngăn chặn gian lận, thư rác và các hành vi lạm dụng.',
        'Cải thiện chất lượng và trải nghiệm của trang.',
      ],
    },
    {
      heading: '4. Cookie',
      paragraphs: [
        'Chúng tôi chỉ dùng cookie và bộ nhớ trình duyệt cần thiết cho việc vận hành: giữ phiên đăng nhập, ghi nhớ lựa chọn của bạn (như giao diện sáng/tối) và thống kê lượt xem bài. Chúng tôi không dùng cookie quảng cáo hay theo dõi bạn trên trang web khác.',
        'Bạn có thể xoá hoặc chặn cookie trong cài đặt trình duyệt, nhưng khi đó một số chức năng như đăng nhập sẽ không hoạt động.',
      ],
    },
    {
      heading: '5. Chia sẻ thông tin',
      paragraphs: [
        'Chúng tôi không bán hay cho thuê thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ trong các trường hợp sau:',
      ],
      items: [
        'Nội dung công khai: bài viết, câu trả lời, tên hiển thị, ảnh đại diện và hồ sơ công khai được mọi người xem. Email của bạn không bao giờ được hiển thị công khai.',
        'Nhà cung cấp dịch vụ: các đối tác giúp chúng tôi lưu trữ dữ liệu, lưu trữ hình ảnh và video, gửi email, xác thực đăng nhập và kiểm duyệt nội dung tự động. Họ chỉ được xử lý thông tin theo yêu cầu của chúng tôi và cho đúng mục đích đó.',
        'Yêu cầu pháp lý: khi cơ quan nhà nước có thẩm quyền yêu cầu theo quy định của pháp luật.',
      ],
    },
    {
      heading: '6. Thời gian lưu trữ',
      items: [
        'Thông tin tài khoản và nội dung được lưu trong thời gian tài khoản còn hoạt động, hoặc cho tới khi bạn yêu cầu xoá.',
        'Tài khoản đăng ký nhưng không xác minh email sẽ tự động bị xoá sau 7 ngày.',
        'Dữ liệu không còn cần thiết, như tệp tải lên nhưng không dùng hay phiên đăng nhập đã hết hạn, được dọn định kỳ.',
      ],
    },
    {
      heading: '7. Quyền của bạn',
      paragraphs: ['Theo quy định pháp luật về bảo vệ dữ liệu cá nhân, bạn có quyền:'],
      items: [
        'Xem, chỉnh sửa thông tin hồ sơ và nội dung của mình ngay trên trang.',
        'Yêu cầu cung cấp bản sao dữ liệu cá nhân của bạn.',
        'Yêu cầu xoá tài khoản và dữ liệu cá nhân.',
        'Rút lại sự đồng ý, ví dụ ngừng liên kết tài khoản Google.',
        `Gửi yêu cầu hoặc khiếu nại về ${contactEmail} từ chính email đã đăng ký. Chúng tôi phản hồi trong vòng 30 ngày.`,
      ],
    },
    {
      heading: '8. Bảo mật thông tin',
      paragraphs: [
        'Chúng tôi áp dụng các biện pháp kỹ thuật và quản lý phù hợp để bảo vệ thông tin, như mã hoá kết nối, không lưu mật khẩu ở dạng đọc được và giới hạn quyền truy cập dữ liệu. Tuy vậy, không có hệ thống nào an toàn tuyệt đối. Hãy giữ bí mật mật khẩu và báo cho chúng tôi ngay nếu nghi ngờ tài khoản bị truy cập trái phép. Nếu xảy ra sự cố ảnh hưởng tới dữ liệu của bạn, chúng tôi sẽ thông báo qua email.',
      ],
    },
    {
      heading: '9. Người dùng chưa thành niên',
      paragraphs: ['Nếu bạn dưới 16 tuổi, vui lòng sử dụng TechForum khi có sự đồng ý của cha mẹ hoặc người giám hộ.'],
    },
    {
      heading: '10. Thay đổi chính sách',
      paragraphs: [
        'Chính sách có thể được cập nhật theo thời gian. Ngày cập nhật ở đầu trang sẽ thay đổi theo, và những thay đổi quan trọng sẽ được thông báo trên trang.',
      ],
    },
    {
      heading: '11. Liên hệ',
      paragraphs: [`Mọi câu hỏi về chính sách này, vui lòng gửi về ${contactEmail}.`],
    },
  ],
}

export const termsOfUse: LegalDocument = {
  title: 'Điều khoản sử dụng',
  description: 'Các quy định khi bạn sử dụng TechForum và đóng góp nội dung cho cộng đồng.',
  updatedOn: '25/11/2026',
  sections: [
    {
      heading: '1. Chấp nhận điều khoản',
      paragraphs: [
        'Khi truy cập hoặc tạo tài khoản trên TechForum, bạn đồng ý tuân thủ Điều khoản sử dụng này và Chính sách bảo mật. Nếu không đồng ý, vui lòng không sử dụng trang.',
      ],
    },
    {
      heading: '2. Tài khoản',
      items: [
        'Bạn cần cung cấp email hợp lệ và xác minh email để đăng nội dung và tương tác với cộng đồng.',
        'Bạn chịu trách nhiệm giữ bí mật mật khẩu và mọi hoạt động diễn ra trên tài khoản của mình.',
        'Không mạo danh người khác, không mua bán hay chuyển nhượng tài khoản, không tạo nhiều tài khoản để thao túng bình chọn hoặc né tránh xử lý vi phạm.',
      ],
    },
    {
      heading: '3. Quy tắc nội dung',
      paragraphs: ['TechForum là nơi chia sẻ kiến thức công nghệ. Bạn không được đăng hoặc chia sẻ:'],
      items: [
        'Nội dung vi phạm pháp luật Việt Nam, xúc phạm, kích động bạo lực, thù ghét hoặc phân biệt đối xử.',
        'Nội dung khiêu dâm, bạo lực, gây sốc hoặc không phù hợp với cộng đồng.',
        'Thư rác, quảng cáo trái phép, lừa đảo, phần mềm độc hại hoặc đường dẫn nguy hiểm.',
        'Thông tin cá nhân của người khác khi chưa được cho phép.',
        'Nội dung vi phạm quyền sở hữu trí tuệ. Khi trích dẫn, hãy ghi rõ nguồn.',
      ],
    },
    {
      heading: '4. Quyền sở hữu nội dung',
      paragraphs: [
        'Bạn giữ quyền sở hữu với nội dung mình đăng. Khi đăng, bạn cho phép TechForum lưu trữ, hiển thị và phân phối nội dung đó trên trang để phục vụ cộng đồng. Bạn có thể chỉnh sửa hoặc xoá nội dung của mình bất cứ lúc nào.',
      ],
    },
    {
      heading: '5. Kiểm duyệt và xử lý vi phạm',
      items: [
        'Nội dung có thể được kiểm tra tự động trước khi đăng; từ ngữ không phù hợp có thể bị che và tệp không phù hợp có thể bị từ chối.',
        'Thành viên có thể báo cáo nội dung vi phạm. Nội dung bị báo cáo có thể tạm thời bị ẩn trong lúc chờ xem xét.',
        'Tuỳ mức độ, quản trị viên có quyền ẩn hoặc xoá nội dung, khoá thảo luận, tạm khoá hoặc khoá vĩnh viễn tài khoản vi phạm.',
        `Nếu cho rằng nội dung của mình bị xử lý nhầm, bạn có thể khiếu nại qua ${contactEmail}.`,
      ],
    },
    {
      heading: '6. Giới hạn trách nhiệm',
      paragraphs: [
        'Nội dung trên TechForum do thành viên đóng góp và chỉ mang tính tham khảo. Hãy tự kiểm tra trước khi áp dụng vào công việc hay hệ thống thực tế. Chúng tôi cung cấp dịch vụ theo hiện trạng và không bảo đảm trang luôn hoạt động liên tục, không gián đoạn.',
      ],
    },
    {
      heading: '7. Thay đổi điều khoản',
      paragraphs: [
        'Điều khoản có thể được cập nhật theo thời gian. Ngày cập nhật ở đầu trang sẽ thay đổi theo. Việc bạn tiếp tục sử dụng trang sau khi cập nhật đồng nghĩa với việc bạn chấp nhận điều khoản mới.',
      ],
    },
    {
      heading: '8. Liên hệ',
      paragraphs: [`Góp ý, khiếu nại hoặc báo cáo vi phạm bản quyền, vui lòng gửi về ${contactEmail}.`],
    },
  ],
}
