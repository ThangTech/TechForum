import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { RichHtml } from '../common/RichHtml'
import { appRoutes } from '../../appRoutes'
import { useAdminTopicDetail } from '../../queries/admin'
import { getErrorMessage } from '../../queries/errorMessage'
import { isInitialLoading } from '../../queries/status'
import { AsyncStatePanel } from '../feedback/AsyncStatePanel'
import { DialogFrame } from '../feedback/DialogFrame'
import { StatusBadge } from './StatusBadge'

export const TopicPreviewDialog = ({ topicId, onClose }: { topicId: number; onClose: () => void }) => {
  const detailQuery = useAdminTopicDetail(topicId)
  const data = detailQuery.data ?? null
  const isLoading = isInitialLoading(detailQuery)
  const error = getErrorMessage(detailQuery.error, 'Không thể tải nội dung xem trước.')
  return (
    <DialogFrame
      actions={
        <>
          {data &&
            data.topic.status === 'published' &&
            !data.topic.isDeleted &&
            !data.topic.isHiddenByModerator && (
              <Button component={Link} to={appRoutes.topic(topicId)} variant="text">
                Mở trên diễn đàn ↗
              </Button>
            )}
          <Button onClick={onClose} variant="outlined">Đóng xem trước</Button>
        </>
      }
      closeOnBackdropClick
      onClose={onClose}
      title={`Xem trước nội dung #${topicId}`}
      width={850}
    >
      <AsyncStatePanel
        error={error}
        isLoading={isLoading}
        loadingText="Đang tải nội dung…"
        onRetry={() => void detailQuery.refetch()}
      />
      {!isLoading && !error && data && (
        <>
          <Typography component="h3" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>{data.topic.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
            {data.topic.author.displayName} · {data.topic.category.name} ·{' '}
            {new Date(data.topic.createdAtUtc).toLocaleString('vi-VN')}
          </Typography>
          <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <StatusBadge>{data.topic.type === 'article' ? 'Bài viết' : 'Câu hỏi'}</StatusBadge>
            {data.topic.isDeleted && <StatusBadge tone="red">Tác giả đã xóa</StatusBadge>}
            {data.topic.isHiddenByModerator && (
              <StatusBadge tone="amber">Đang bị ẩn</StatusBadge>
            )}
          </Stack>
          <RichHtml
            className="admin-preview fr-view reading-content"
            html={data.bodyHtml}
            sx={{ mt: 2.5 }}
          />
        </>
      )}
    </DialogFrame>
  )
}
