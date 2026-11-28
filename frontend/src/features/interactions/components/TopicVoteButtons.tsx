import { ApiError } from '../../../shared/api/client'
import { openAuthDialog } from '../../auth/store/authDialogStore'
import { useAuth } from '../../auth/hooks/authState'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { useToast } from '../../../shared/feedback/toastState'
import { useSetTopicVote, useTopicVote } from '../hooks/votes'
import { RailButton } from './RailButton'
import { formatScore, getNextVote, type VoteDirection } from '../utils/voteLogic'

const Arrow = ({ direction }: { direction: VoteDirection }) => (
  <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
    <path d={direction === 1 ? 'M12 5 3 17h18z' : 'M12 19 21 7H3z'} />
  </svg>
)

// ▲ điểm ▼ của bài, trong thanh hành động. Khách bấm thì được mời đăng nhập; tác giả không tự bình chọn được.
export const TopicVoteButtons = ({ topicId, authorId }: { topicId: string; authorId: string }) => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const voteQuery = useTopicVote(topicId)
  const setVote = useSetTopicVote(topicId)
  const state = voteQuery.data
  const myVote = state?.myVote ?? 0
  const ownReason = user?.id === authorId ? 'Bạn không thể bình chọn bài viết của chính mình' : undefined

  const vote = async (direction: VoteDirection) => {
    if (!user) { openAuthDialog(); return }
    if (!state || setVote.isPending) return
    try {
      await setVote.mutateAsync(getNextVote(state.myVote, direction))
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) { openAuthDialog(); return }
      showToast(getErrorMessage(requestError, 'Không thể bình chọn lúc này.') ?? 'Không thể bình chọn lúc này.', 'error')
    }
  }

  const arrow = (direction: VoteDirection) => {
    const isOn = myVote === direction
    const label = direction === 1
      ? (isOn ? 'Bỏ bình chọn tốt' : 'Bình chọn tốt')
      : (isOn ? 'Bỏ bình chọn chưa tốt' : 'Bình chọn chưa tốt')
    // Phiếu chưa tốt tốn 1 điểm danh tiếng và cần tài khoản đủ ngày hoặc đủ điểm: nói trước khi bấm.
    const hint = direction === -1 && !isOn
      ? `${label}. Tốn 1 điểm danh tiếng của bạn (hoàn lại khi bỏ phiếu). Cần tài khoản từ 7 ngày hoặc có từ 50 điểm danh tiếng.`
      : label
    return (
      <RailButton
        disabled={Boolean(ownReason) || !state}
        hint={ownReason ?? hint}
        icon={<Arrow direction={direction} />}
        label={`${label} cho bài viết`}
        loading={setVote.isPending}
        onClick={() => void vote(direction)}
        pressed={isOn}
        tone={direction === 1 ? 'up' : 'down'}
      />
    )
  }

  return (
    <div aria-label="Bình chọn cho bài viết" className="topic-rail__vote" role="group">
      {arrow(1)}
      <span
        aria-live="polite"
        className="topic-rail__score"
        data-vote={myVote === 1 ? 'up' : myVote === -1 ? 'down' : undefined}
        title={state?.scoreHidden ? 'Điểm được ẩn trong 2 giờ đầu sau khi đăng để mọi người đánh giá khách quan' : `Điểm: ${state?.score ?? 0}`}
      >
        {state?.scoreHidden ? 'Mới' : formatScore(state?.score ?? 0)}
      </span>
      {arrow(-1)}
    </div>
  )
}
