import { ApiError } from '../../../shared/api/client'
import { useAuth } from '../../auth/hooks/authState'
import { useBookmarkStatus, useToggleBookmark } from '../hooks/bookmarks'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { useToast } from '../../../shared/feedback/toastState'
import { openAuthDialog } from '../../auth/store/authDialogStore'
import { StarActionIcon } from '../../../shared/components/ActionIcons'
import { RailButton } from './RailButton'

// Lưu bài để đọc lại (trang "Đã lưu"). Dùng hình ngôi sao như các trang đọc bài quen thuộc; đây là lưu bài, không phải
// một kiểu chấm điểm, nên không đổi điểm hay danh tiếng của ai.
export const BookmarkButton = ({ topicId }: { topicId: string }) => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const statusQuery = useBookmarkStatus(topicId)
  const toggleMutation = useToggleBookmark(topicId)
  const status = statusQuery.data ?? null

  const toggle = async () => {
    if (!user) { openAuthDialog(); return }
    if (!status || toggleMutation.isPending) return
    try {
      await toggleMutation.mutateAsync(status.hasBookmark)
      showToast(status.hasBookmark ? 'Đã bỏ lưu bài.' : 'Đã lưu bài. Xem lại trong mục Đã lưu.')
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) { openAuthDialog(); return }
      showToast(getErrorMessage(requestError, 'Không thể cập nhật bài đã lưu.') ?? 'Không thể cập nhật bài đã lưu.', 'error')
    }
  }

  return (
    <RailButton
      count={status?.count ?? 0}
      disabled={!status && !statusQuery.isError}
      hint={statusQuery.isError ? 'Không tải được số lượt lưu. Bấm để thử lại.' : undefined}
      icon={<StarActionIcon filled={status?.hasBookmark} size={20} />}
      label={status?.hasBookmark ? 'Bỏ lưu bài' : 'Lưu bài'}
      loading={isInitialLoading(statusQuery) || toggleMutation.isPending}
      onClick={() => statusQuery.isError ? void statusQuery.refetch() : void toggle()}
      pressed={status?.hasBookmark ?? false}
    />
  )
}
