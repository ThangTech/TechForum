import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ApiError } from '../../api/client'
import { openAuthDialog } from '../../auth/authDialogStore'
import { useAuth } from '../../auth/authState'
import { getErrorMessage } from '../../queries/errorMessage'
import { useSetTopicVote, useTopicVote } from '../../queries/votes'
import { VoteControl } from './VoteControl'
import { getNextVote, type VoteDirection } from './voteLogic'

// The vote ▲ ▼ of a post. A guest who presses an arrow is asked to sign in; the author cannot vote for their own post.
export const TopicVoteButtons = ({ topicId, authorId }: { topicId: number; authorId: string }) => {
  const { user } = useAuth()
  const voteQuery = useTopicVote(topicId)
  const setVote = useSetTopicVote(topicId)
  const state = voteQuery.data
  const error = getErrorMessage(setVote.error, 'Không thể bình chọn lúc này.')

  const vote = async (direction: VoteDirection) => {
    if (!user) {
      openAuthDialog()
      return
    }
    if (!state || setVote.isPending) return
    try {
      await setVote.mutateAsync(getNextVote(state.myVote, direction))
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) openAuthDialog()
    }
  }

  return (
    <div>
      <VoteControl
        disabledReason={user?.id === authorId ? 'Bạn không thể bình chọn bài viết của chính mình' : undefined}
        isBusy={!state || setVote.isPending}
        myVote={state?.myVote ?? 0}
        onVote={(direction) => void vote(direction)}
        score={state?.score ?? 0}
        subject="bài viết"
      />
      {error && (
        <Stack direction="row" role="alert" sx={{ mt: 1 }}>
          <Typography color="error" variant="body2">{error}</Typography>
        </Stack>
      )}
    </div>
  )
}
