import type { TopicType } from '../../api/topics'

const tipsByType: Record<TopicType, { title: string; items: string[] }> = {
  article: {
    title: 'Viết bài dễ đọc',
    items: [
      'Tiêu đề nói rõ bài giải quyết vấn đề gì.',
      'Chia bài thành các mục có tiêu đề để có mục lục tự động.',
      'Dùng khối mã cho đoạn code và ghi rõ phiên bản công cụ.',
      'Ghi nguồn tham khảo nếu có.',
    ],
  },
  question: {
    title: 'Đặt câu hỏi dễ được trả lời',
    items: [
      'Mô tả vấn đề trong tiêu đề, tránh các tiêu đề như “Giúp mình với”.',
      'Nêu bạn đã thử gì và kết quả ra sao.',
      'Cho biết phiên bản, môi trường và thông báo lỗi đầy đủ.',
      'Rút gọn code thành ví dụ nhỏ nhất vẫn tái hiện được lỗi.',
    ],
  },
}

// Khung gợi ý ở cột phải, học từ trang đặt câu hỏi của SegmentFault.
export const WritingTips = ({ type }: { type: TopicType }) => {
  const tips = tipsByType[type]

  return (
    <aside aria-label={tips.title} className="writing-tips">
      <h2>{tips.title}</h2>
      <ul>
        {tips.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </aside>
  )
}
