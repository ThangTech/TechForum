import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { recordTopicShare, recordTopicView, type TopicEngagement } from '../../api/engagements'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { AuthRequiredDialog } from '../AuthRequiredDialog'

interface TopicEngagementBarProps {
  initial: TopicEngagement
  title: string
  topicId: number
}

export const TopicEngagementBar = ({ initial, title, topicId }: TopicEngagementBarProps) => {
  const { user } = useAuth()
  const [engagement, setEngagement] = useState(initial)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    recordTopicView(topicId, controller.signal)
      .then(setEngagement)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật lượt xem.')
      })
    return () => controller.abort()
  }, [topicId])

  const share = async () => {
    if (!user) { setIsAuthDialogOpen(true); return }
    if (isSharing) return
    setIsSharing(true); setError(null); setSuccess(null)
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        setSuccess('Đã mở chia sẻ thành công.')
      } else {
        await navigator.clipboard.writeText(url)
        setSuccess('Đã sao chép liên kết.')
      }
      setEngagement(await recordTopicShare(topicId))
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể chia sẻ hoặc sao chép liên kết.')
    } finally { setIsSharing(false) }
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span aria-label={`${engagement.viewCount} lượt xem`}>Lượt xem · {engagement.viewCount}</span>
        <span aria-label={`${engagement.shareCount} lượt chia sẻ`}>Chia sẻ · {engagement.shareCount}</span>
        <Button isDisabled={isSharing} isLoading={isSharing} label="Chia sẻ" onClick={() => void share()} variant="ghost" />
      </div>
      {success && <p className="mt-2 text-sm text-green-700" role="status">{success}</p>}
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
      <AuthRequiredDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </div>
  )
}
