import type { AdminTopic, ModerationAction } from '../../api/adminTopics'

export const TopicModerationCard = ({
  topic,
  onAction,
  onPreview,
}: {
  topic: AdminTopic
  onAction: (action: ModerationAction) => void
  onPreview: () => void
}) => (
  <tr>
    <td>
      <button className="admin-table-primary text-left hover:text-blue-700" onClick={onPreview} type="button">
        {topic.title}
      </button>
      <span className="admin-table-secondary">
        #{topic.id} · {topic.category.name}
      </span>
    </td>
    <td>
      <span className={`admin-badge ${topic.type === 'article' ? 'admin-badge-blue' : ''}`}>
        {topic.type === 'article' ? 'Bài viết' : 'Câu hỏi'}
      </span>
    </td>
    <td className="whitespace-nowrap">{topic.author.displayName}</td>
    <td>
      <div className="flex flex-wrap gap-1 min-w-28">
        <span
          className={`admin-badge ${topic.isDeleted ? 'admin-badge-red' : topic.status === 'draft' || topic.isHiddenByModerator ? 'admin-badge-amber' : 'admin-badge-green'}`}
        >
          {topic.isDeleted
            ? 'Tác giả đã xóa'
            : topic.status === 'draft'
              ? 'Bản nháp'
              : topic.isHiddenByModerator
                ? 'Đang bị ẩn'
                : 'Công khai'}
        </span>
        {topic.isDiscussionLocked && <span className="admin-badge">Khóa thảo luận</span>}
        {topic.isPinned && <span className="admin-badge admin-badge-blue">Đã ghim</span>}
      </div>
    </td>
    <td className="whitespace-nowrap">
      {topic.publishedAtUtc ? (
        new Date(topic.publishedAtUtc).toLocaleDateString('vi-VN')
      ) : (
        <>
          <span>Chưa xuất bản</span>
          <span className="admin-table-secondary">
            Tạo {new Date(topic.createdAtUtc).toLocaleDateString('vi-VN')}
          </span>
        </>
      )}
    </td>
    <td>
      <div className="admin-table-actions min-w-56">
        <button onClick={onPreview} type="button">
          Xem trước
        </button>
        {!topic.isDeleted && (
          <button onClick={() => onAction(topic.isHiddenByModerator ? 'restore' : 'hide')} type="button">
            {topic.isHiddenByModerator ? 'Khôi phục' : 'Ẩn'}
          </button>
        )}
        <button onClick={() => onAction(topic.isDiscussionLocked ? 'unlock' : 'lock')} type="button">
          {topic.isDiscussionLocked ? 'Mở thảo luận' : 'Khóa thảo luận'}
        </button>
        {!topic.isDeleted && (
          <>
            <button onClick={() => onAction(topic.isPinned ? 'unpin' : 'pin')} type="button">
              {topic.isPinned ? 'Bỏ ghim' : 'Ghim'}
            </button>
            <button onClick={() => onAction('move')} type="button">
              Chuyển mục
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
)
