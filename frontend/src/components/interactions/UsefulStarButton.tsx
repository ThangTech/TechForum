import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { getErrorMessage } from '../../queries/errorMessage'
import { useToggleTopicStar, useTopicStar } from '../../queries/stars'
import { isInitialLoading } from '../../queries/status'
import { openAuthDialog } from '../../auth/authDialogStore'

interface UsefulStarButtonProps {
  topicId: number
}

export const UsefulStarButton = ({ topicId }: UsefulStarButtonProps) => {
  const { user } = useAuth()
  const statusQuery = useTopicStar(topicId)
  const toggleMutation = useToggleTopicStar(topicId)

  const status = statusQuery.data ?? null
  const isLoading = isInitialLoading(statusQuery)
  const isSaving = toggleMutation.isPending
  // A failed save is more recent than a failed load, so it is shown first.
  const error = getErrorMessage(toggleMutation.error, 'Không thể cập nhật Sao hữu ích.') ??
    getErrorMessage(statusQuery.error, 'Không thể tải số Sao hữu ích.')

  const handleToggle = async () => {
    if (!user) {
      openAuthDialog()
      return
    }
    if (!status || isSaving) return

    try {
      await toggleMutation.mutateAsync(status.hasStar)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        openAuthDialog()
      }
    }
  }

  const retry = () => {
    toggleMutation.reset()
    void statusQuery.refetch()
  }

  return (
    <div>
      <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <Button disabled={isLoading || status === null || isSaving} loading={isLoading || isSaving} onClick={() => void handleToggle()} variant={status?.hasStar ? 'contained' : 'outlined'}>{status?.hasStar ? `Bỏ Sao hữu ích · ${status.count}` : `Sao hữu ích · ${status?.count ?? 0}`}</Button>
        <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>Mỗi thành viên có tối đa một sao cho chủ đề này.</Typography>
      </Stack>
      {error && (
        <Stack direction="row" role="alert" sx={{ mt: 1.5, flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <Typography color="error" variant="body2">{error}</Typography>
          <Button onClick={retry} variant="text">Thử lại</Button>
        </Stack>
      )}
    </div>
  )
}
