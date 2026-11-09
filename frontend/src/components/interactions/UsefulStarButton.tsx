import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { StarActionIcon } from '../common/ActionIcons'
import { IconActionButton } from '../common/IconActionButton'
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
      <IconActionButton
        count={status?.count ?? 0}
        disabled={isLoading || status === null}
        icon={<StarActionIcon filled={status?.hasStar} />}
        label={status?.hasStar ? 'Bỏ Sao hữu ích' : 'Sao hữu ích'}
        loading={isLoading || isSaving}
        onClick={() => void handleToggle()}
        pressed={status?.hasStar ?? false}
      />
      {error && (
        <Stack direction="row" role="alert" sx={{ mt: 1.5, flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <Typography color="error" variant="body2">{error}</Typography>
          <Button onClick={retry} variant="text">Thử lại</Button>
        </Stack>
      )}
    </div>
  )
}
