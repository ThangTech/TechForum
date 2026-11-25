import { Link } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import { ActionMenu } from '../../../shared/components/ActionMenu'
import type { AdminTopic, ModerationAction } from '../types/adminTopics'
import { StatusBadge, type BadgeTone } from './StatusBadge'
import Stack from '@mui/material/Stack'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'

const getTopicStatusLabel = (topic: AdminTopic) => {
  if (topic.isDeleted) return 'Tác giả đã xóa'
  if (topic.status === 'draft') return 'Bản nháp'
  if (topic.isAutoHidden) return 'Tạm ẩn vì báo cáo'
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
      <button className="admin-table-primary admin-table-link" onClick={onPreview} type="button">
        {topic.title}
      </button>
      <span className="admin-table-secondary">{topic.category.name}</span>
      {topic.pendingReportCount > 0 && (
        <Link to={appRoutes.adminReports}>
          <StatusBadge tone="amber">{topic.pendingReportCount} báo cáo đang chờ</StatusBadge>
        </Link>
      )}
    </TableCell>
    <TableCell>
      <StatusBadge tone={topic.type === 'article' ? 'blue' : 'neutral'}>
        {topic.type === 'article' ? 'Bài viết' : 'Câu hỏi'}
      </StatusBadge>
    </TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{topic.author.displayName}</TableCell>
    <TableCell>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, minWidth: 112 }}>
        <StatusBadge tone={getTopicStatusTone(topic)}>
          {getTopicStatusLabel(topic)}
        </StatusBadge>
        {topic.isDiscussionLocked && <StatusBadge>Khóa thảo luận</StatusBadge>}
        {topic.isPinned && <StatusBadge tone="blue">Đã ghim</StatusBadge>}
      </Stack>
    </TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>
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
      <div className="admin-table-actions admin-table-actions--wide">
        <button onClick={onPreview} type="button">
          Xem trước
        </button>
        {!topic.isDeleted && (
          <button onClick={() => onAction(topic.isHiddenByModerator ? 'restore' : 'hide')} type="button">
            {topic.isHiddenByModerator ? 'Khôi phục' : 'Ẩn'}
          </button>
        )}
        {/* Thao tác ít dùng gom vào menu để mỗi dòng gọn hơn. */}
        <ActionMenu
          isIconOnly
          icon={<span aria-hidden="true" style={{ fontSize: '1.1rem', lineHeight: 1 }}>⋯</span>}
          items={[
            { id: 'lock', label: topic.isDiscussionLocked ? 'Mở thảo luận' : 'Khóa thảo luận', onClick: () => onAction(topic.isDiscussionLocked ? 'unlock' : 'lock') },
            ...(topic.isDeleted ? [] : [
              { id: 'pin', label: topic.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu', onClick: () => onAction(topic.isPinned ? 'unpin' : 'pin') },
              { id: 'move', label: 'Chuyển chuyên mục', onClick: () => onAction('move') },
            ]),
          ]}
          label={`Thao tác khác cho “${topic.title}”`}
          menuWidth={200}
        />
      </div>
    </TableCell>
  </TableRow>
)
