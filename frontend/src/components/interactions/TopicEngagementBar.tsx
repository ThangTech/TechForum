import Button from '@mui/material/Button'
import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { getErrorMessage } from '../../queries/errorMessage'
import { useRecordTopicShare, useRecordTopicView, useTopic } from '../../queries/topics'
import { openAuthDialog } from '../../auth/authDialogStore'

interface TopicEngagementBarProps {
  title: string
  topicId: number
}

export const TopicEngagementBar = ({ title, topicId }: TopicEngagementBarProps) => {
  const { user } = useAuth()
  // The counts are part of the cached topic. Recording a view or a share updates that cache.
  const { data: topic } = useTopic(topicId, true)
  const engagement = { viewCount: topic?.viewCount ?? 0, shareCount: topic?.shareCount ?? 0 }
  const { mutate: recordView, error: viewError } = useRecordTopicView()
  const shareMutation = useRecordTopicShare()
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const error = shareError ?? getErrorMessage(viewError, 'Không thể cập nhật lượt xem.')

  // The server counts one view per visitor and day, so asking again on the same day is safe.
  useEffect(() => {
    recordView(topicId)
  }, [recordView, topicId])

  const share = async () => {
    if (!user) { openAuthDialog(); return }
    if (isSharing) return
    setIsSharing(true); setShareError(null); setSuccess(null)
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        setSuccess('Đã mở chia sẻ thành công.')
      } else {
        await navigator.clipboard.writeText(url)
        setSuccess('Đã sao chép liên kết.')
      }
      await shareMutation.mutateAsync(topicId)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setShareError(requestError instanceof ApiError ? requestError.message : 'Không thể chia sẻ hoặc sao chép liên kết.')
    } finally { setIsSharing(false) }
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span aria-label={`${engagement.viewCount} lượt xem`}>Lượt xem · {engagement.viewCount}</span>
        <span aria-label={`${engagement.shareCount} lượt chia sẻ`}>Chia sẻ · {engagement.shareCount}</span>
        <Button disabled={isSharing} loading={isSharing} onClick={() => void share()} variant="text">Chia sẻ</Button>
      </div>
      {success && <p className="mt-2 text-sm text-green-700" role="status">{success}</p>}
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  )
}
