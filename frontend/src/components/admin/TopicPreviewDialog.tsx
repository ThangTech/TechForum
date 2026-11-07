import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../appRoutes'
import { useAdminTopicDetail } from '../../queries/admin'
import { getErrorMessage } from '../../queries/errorMessage'
import { isInitialLoading } from '../../queries/status'
import { AsyncStatePanel } from '../feedback/AsyncStatePanel'
import { StatusBadge } from './StatusBadge'

export const TopicPreviewDialog = ({ topicId, onClose }: { topicId: number; onClose: () => void }) => {
  const detailQuery = useAdminTopicDetail(topicId)
  const data = detailQuery.data ?? null
  const isLoading = isInitialLoading(detailQuery)
  const error = getErrorMessage(detailQuery.error, 'Không thể tải nội dung xem trước.')
  return (
    <Dialog open onClose={() => onClose()} maxWidth={false} slotProps={{ paper: { 'aria-label': "Xem trước nội dung", sx: { width: 850, maxWidth: 'calc(100% - 32px)' } } }}>
      <div className="p-5 sm:p-7">
        <h2 className="text-xl font-extrabold">Xem trước nội dung #{topicId}</h2>
        <div className="mt-5">
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải nội dung…"
            onRetry={() => void detailQuery.refetch()}
          />
        </div>
        {!isLoading && !error && data && (
          <>
            <h3 className="mt-4 text-lg font-bold">{data.topic.title}</h3>
            <p className="mt-2 text-xs text-slate-500">
              {data.topic.author.displayName} · {data.topic.category.name} ·{' '}
              {new Date(data.topic.createdAtUtc).toLocaleString('vi-VN')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge>{data.topic.type === 'article' ? 'Bài viết' : 'Câu hỏi'}</StatusBadge>
              {data.topic.isDeleted && <StatusBadge tone="red">Tác giả đã xóa</StatusBadge>}
              {data.topic.isHiddenByModerator && (
                <StatusBadge tone="amber">Đang bị ẩn</StatusBadge>
              )}
            </div>
            <div
              className="admin-preview fr-view reading-content mt-5"
              dangerouslySetInnerHTML={{ __html: data.bodyHtml }}
            />
          </>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {data &&
            data.topic.status === 'published' &&
            !data.topic.isDeleted &&
            !data.topic.isHiddenByModerator && (
              <Button component={Link} to={appRoutes.topic(topicId)} variant="text">
                Mở trên diễn đàn ↗
              </Button>
            )}
          <Button onClick={onClose} variant="outlined">Đóng xem trước</Button>
        </div>
      </div>
    </Dialog>
  )
}
