import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/client'
import { useAuth } from '../../auth/hooks/authState'
import { openAuthDialog } from '../../auth/store/authDialogStore'
import { useToast } from '../../../shared/feedback/toastState'
import { useRecordTopicShare, useRecordTopicView, useTopic } from '../../topics/hooks/topics'

// Đếm lượt xem khi mở bài và chia sẻ bài (bảng chia sẻ của máy, hoặc sao chép liên kết nếu máy không có).
// Số lượt chia sẻ nằm trong bài đã lưu ở bộ nhớ đệm; ghi lượt chia sẻ thì cập nhật luôn chỗ đó.
export const useTopicShare = (topicId: string, title: string) => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { data: topic } = useTopic(topicId, true)
  const { mutate: recordView } = useRecordTopicView()
  const shareMutation = useRecordTopicShare()
  const [isSharing, setIsSharing] = useState(false)

  // Máy chủ chỉ đếm một lượt xem mỗi người mỗi ngày, nên gọi lại trong ngày vẫn an toàn.
  useEffect(() => {
    recordView(topicId)
  }, [recordView, topicId])

  const share = async () => {
    if (!user) { openAuthDialog(); return }
    if (isSharing) return
    setIsSharing(true)
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        showToast('Đã sao chép liên kết của bài.')
      }
      await shareMutation.mutateAsync(topicId)
    } catch (requestError) {
      // Người dùng tự đóng bảng chia sẻ thì không phải lỗi.
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      showToast(requestError instanceof ApiError ? requestError.message : 'Không thể chia sẻ hoặc sao chép liên kết.', 'error')
    } finally {
      setIsSharing(false)
    }
  }

  return { shareCount: topic?.shareCount ?? 0, isSharing, share }
}
