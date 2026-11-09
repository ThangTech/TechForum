import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { getErrorMessage } from '../../queries/errorMessage'
import { useRecordTopicShare, useRecordTopicView, useTopic } from '../../queries/topics'
import { openAuthDialog } from '../../auth/authDialogStore'
import { EyeIcon, ShareIcon } from '../common/ActionIcons'
import { IconActionButton } from '../common/IconActionButton'

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
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1.5, color: 'text.secondary', fontSize: '0.875rem' }}>
        <Tooltip arrow title="Lượt xem">
          <Box aria-label={`${engagement.viewCount} lượt xem`} component="span" role="img" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontVariantNumeric: 'tabular-nums' }}>
            <EyeIcon />{engagement.viewCount}
          </Box>
        </Tooltip>
        <IconActionButton count={engagement.shareCount} icon={<ShareIcon />} label="Chia sẻ" loading={isSharing} onClick={() => void share()} variant="text" />
      </Stack>
      {success && <Typography color="success" role="status" sx={{ mt: 1 }} variant="body2">{success}</Typography>}
      {error && <Typography color="error" role="alert" sx={{ mt: 1 }} variant="body2">{error}</Typography>}
    </Box>
  )
}
