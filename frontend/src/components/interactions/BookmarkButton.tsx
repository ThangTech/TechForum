import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { useBookmarkStatus, useToggleBookmark } from '../../queries/bookmarks'
import { getErrorMessage } from '../../queries/errorMessage'
import { isInitialLoading } from '../../queries/status'
import { openAuthDialog } from '../../auth/authDialogStore'

export const BookmarkButton = ({ topicId }: { topicId: number }) => {
  const { user } = useAuth()
  const statusQuery = useBookmarkStatus(topicId)
  const toggleMutation = useToggleBookmark(topicId)

  const status = statusQuery.data ?? null
  const isLoading = isInitialLoading(statusQuery)
  const isSaving = toggleMutation.isPending
  // A failed save is more recent than a failed load, so it is shown first.
  const error = getErrorMessage(toggleMutation.error, 'Không thể cập nhật bài đã lưu.') ??
    getErrorMessage(statusQuery.error, 'Không thể tải số lượt lưu.')

  const toggle = async () => {
    if (!user) { openAuthDialog(); return }
    if (!status || isSaving) return
    try {
      await toggleMutation.mutateAsync(status.hasBookmark)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) openAuthDialog()
    }
  }

  const retry = () => {
    toggleMutation.reset()
    void statusQuery.refetch()
  }

  return (
    <div>
      <Button disabled={isLoading || !status || isSaving} loading={isLoading || isSaving} onClick={() => void toggle()} variant={status?.hasBookmark ? 'contained' : 'outlined'}>{status?.hasBookmark ? `Bỏ lưu · ${status.count}` : `Lưu bài · ${status?.count ?? 0}`}</Button>
      {error && (
        <Typography color="error" role="alert" sx={{ mt: 1 }} variant="body2">
          {error} <MuiLink component="button" onClick={retry} sx={{ fontSize: 'inherit', fontWeight: 700, verticalAlign: 'baseline' }} type="button" underline="always">Thử lại</MuiLink>
        </Typography>
      )}
    </div>
  )
}
