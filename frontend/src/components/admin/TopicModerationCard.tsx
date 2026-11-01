import type { AdminTopic, ModerationAction } from '../../api/adminTopics'
import { StatusBadge, type BadgeTone } from './StatusBadge'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'

const getTopicStatusLabel = (topic: AdminTopic) => {
  if (topic.isDeleted) return 'Tác giả đã xóa'
  if (topic.status === 'draft') return 'Bản nháp'
  if (topic.isHiddenByModerator) return 'Đang bị ẩn'
  return 'Công khai'
}

const getTopicStatusTone = (topic: AdminTopic): BadgeTone => {
  if (topic.isDeleted) return 'red'
  if (topic.status === 'draft' || topic.isHiddenByModerator) return 'amber'
  return 'green'
}

export const TopicModerationCard = ({
  topic,
  onAction,
  onPreview,
}: {
  topic: AdminTopic
  onAction: (action: ModerationAction) => void
  onPreview: () => void
}) => (
  <TableRow>
    <TableCell>
      <button className="admin-table-primary text-left hover:text-blue-700" onClick={onPreview} type="button">
        {topic.title}
      </button>
      <span className="admin-table-secondary">
        #{topic.id} · {topic.category.name}
      </span>
    </TableCell>
    <TableCell>
      <StatusBadge tone={topic.type === 'article' ? 'blue' : 'neutral'}>
        {topic.type === 'article' ? 'Bài viết' : 'Câu hỏi'}
      </StatusBadge>
    </TableCell>
    <TableCell className="whitespace-nowrap">{topic.author.displayName}</TableCell>
    <TableCell>
      <div className="flex flex-wrap gap-1 min-w-28">
        <StatusBadge tone={getTopicStatusTone(topic)}>
          {getTopicStatusLabel(topic)}
        </StatusBadge>
        {topic.isDiscussionLocked && <StatusBadge>Khóa thảo luận</StatusBadge>}
        {topic.isPinned && <StatusBadge tone="blue">Đã ghim</StatusBadge>}
      </div>
    </TableCell>
    <TableCell className="whitespace-nowrap">
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
    </TableCell>
    <TableCell>
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
    </TableCell>
  </TableRow>
)
