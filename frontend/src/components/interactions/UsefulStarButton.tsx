import Button from '@mui/material/Button'
import { useState } from 'react'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { getErrorMessage } from '../../queries/errorMessage'
import { useToggleTopicStar, useTopicStar } from '../../queries/stars'
import { isInitialLoading } from '../../queries/status'
import { AuthRequiredDialog } from '../AuthRequiredDialog'

interface UsefulStarButtonProps {
  topicId: number
}

export const UsefulStarButton = ({ topicId }: UsefulStarButtonProps) => {
  const { user } = useAuth()
  const statusQuery = useTopicStar(topicId)
  const toggleMutation = useToggleTopicStar(topicId)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

  const status = statusQuery.data ?? null
  const isLoading = isInitialLoading(statusQuery)
  const isSaving = toggleMutation.isPending
  // A failed save is more recent than a failed load, so it is shown first.
  const error = getErrorMessage(toggleMutation.error, 'Không thể cập nhật Sao hữu ích.') ??
    getErrorMessage(statusQuery.error, 'Không thể tải số Sao hữu ích.')

  const handleToggle = async () => {
    if (!user) {
      setIsAuthDialogOpen(true)
      return
    }
    if (!status || isSaving) return

    try {
      await toggleMutation.mutateAsync(status.hasStar)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setIsAuthDialogOpen(true)
      }
    }
  }

  const retry = () => {
    toggleMutation.reset()
    void statusQuery.refetch()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={isLoading || status === null || isSaving} loading={isLoading || isSaving} onClick={() => void handleToggle()} variant={status?.hasStar ? 'contained' : 'outlined'}>{status?.hasStar ? `Bỏ Sao hữu ích · ${status.count}` : `Sao hữu ích · ${status?.count ?? 0}`}</Button>
        <span className="text-xs text-slate-500">Mỗi thành viên có tối đa một sao cho chủ đề này.</span>
      </div>
      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-3" role="alert">
          <span className="text-sm text-red-700">{error}</span>
          <Button onClick={retry} variant="text">Thử lại</Button>
        </div>
      )}
      <AuthRequiredDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </div>
  )
}
