import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { addTopicStar, getTopicStar, removeTopicStar, type TopicStarStatus } from '../../api/stars'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { AuthRequiredDialog } from '../AuthRequiredDialog'

interface UsefulStarButtonProps {
  topicId: number
}

export const UsefulStarButton = ({ topicId }: UsefulStarButtonProps) => {
  const { user } = useAuth()
  const [status, setStatus] = useState<TopicStarStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const loadStatus = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setStatus(await getTopicStar(topicId, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError
          ? requestError.message
          : 'Không thể tải số Sao hữu ích.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadStatus()
    return () => controller.abort()
  }, [requestVersion, topicId, user?.id])

  const handleToggle = async () => {
    if (!user) {
      setIsAuthDialogOpen(true)
      return
    }
    if (!status || isSaving) return

    setIsSaving(true)
    setError(null)
    try {
      const nextStatus = status.hasStar
        ? await removeTopicStar(topicId)
        : await addTopicStar(topicId)
      setStatus(nextStatus)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setIsAuthDialogOpen(true)
      }
      setError(requestError instanceof ApiError
        ? requestError.message
        : 'Không thể cập nhật Sao hữu ích.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          isDisabled={isLoading || status === null || isSaving}
          isLoading={isLoading || isSaving}
          label={status?.hasStar ? `Bỏ Sao hữu ích · ${status.count}` : `Sao hữu ích · ${status?.count ?? 0}`}
          onClick={() => void handleToggle()}
          variant={status?.hasStar ? 'primary' : 'secondary'}
        />
        <span className="text-xs text-slate-500">Mỗi thành viên có tối đa một sao cho chủ đề này.</span>
      </div>
      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-3" role="alert">
          <span className="text-sm text-red-700">{error}</span>
          <Button label="Thử lại" onClick={() => setRequestVersion((version) => version + 1)} variant="ghost" />
        </div>
      )}
      <AuthRequiredDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </div>
  )
}
