import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { RichHtml } from '../common/RichHtml'
import { deleteAnswer, setAnswerHelpful, type Answer, type AnswerHelpfulState, type AnswerPage } from '../../api/answers'
import { setAnswerVote, type VoteState } from '../../api/votes'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { appRoutes } from '../../appRoutes'
import { CheckCircleIcon, PencilIcon, ReplyIcon, ThumbUpIcon, TrashIcon } from '../common/ActionIcons'
import { IconActionButton } from '../common/IconActionButton'
import { VoteControl } from '../interactions/VoteControl'
import { getNextVote, type VoteDirection } from '../interactions/voteLogic'
import { ReportAction } from '../reports/ReportAction'
import { ConfirmDialog } from '../feedback/ConfirmDialog'
import { AnswerEditDialog } from './AnswerEditDialog'
import { AnswerForm } from './AnswerForm'

interface AnswerListProps {
  acceptingAnswerId: number | null
  canAcceptAnswers: boolean
  data: AnswerPage
  isLocked: boolean
  onAccept: (answerId: number) => void
  onDeleted: (answerId: number) => void
  onLoginRequired: () => void
  onHelpfulChanged: (answerId: number, helpful: AnswerHelpfulState) => void
  onVoteChanged: (answerId: number, vote: VoteState) => void
  onPageChange: (page: number) => void
  onReplyCreated: (answer: Answer) => void
  onUpdated: (answer: Answer) => void
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

// Border colour of an answer card: green when accepted, light blue for a reply, grey otherwise.
const getAnswerBorderColor = (answer: Answer) => {
  if (answer.isAccepted) return 'var(--color-solved)'
  if (answer.parentAnswerId) return 'var(--color-primary-border)'
  return 'divider'
}

// Style of the answer text. The HTML comes from the server, so its links and paragraphs are styled from here.
const answerBodySx = {
  mt: 2,
  color: 'text.primary',
  fontSize: '0.875rem',
  lineHeight: '1.75rem',
  '& a': { color: 'primary.main', textDecoration: 'underline' },
  '& p': { mb: 1.5 },
  '& p:last-child': { mb: 0 },
} as const

export const AnswerList = ({
  acceptingAnswerId,
  canAcceptAnswers,
  data,
  isLocked,
  onAccept,
  onDeleted,
  onLoginRequired,
  onHelpfulChanged,
  onVoteChanged,
  onPageChange,
  onReplyCreated,
  onUpdated,
}: AnswerListProps) => {
  const { user } = useAuth()
  const [editing, setEditing] = useState<Answer | null>(null)
  const [deleting, setDeleting] = useState<Answer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<Answer | null>(null)
  const [votingAnswerId, setVotingAnswerId] = useState<number | null>(null)
  const [scoringAnswerId, setScoringAnswerId] = useState<number | null>(null)

  // The vote ▲ ▼ for the answer (it counts for the score and the reputation of its author).
  const voteForAnswer = async (answer: Answer, direction: VoteDirection) => {
    if (!user) { onLoginRequired(); return }
    if (scoringAnswerId !== null || user.id === answer.author.id) return
    setScoringAnswerId(answer.id)
    setActionError(null)
    try {
      onVoteChanged(answer.id, await setAnswerVote(answer.topicId, answer.id, getNextVote(answer.myVote, direction)))
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) onLoginRequired()
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể bình chọn lúc này.')
    } finally {
      setScoringAnswerId(null)
    }
  }

  const toggleHelpful = async (answer: Answer) => {
    if (!user) { onLoginRequired(); return }
    if (votingAnswerId !== null || user.id === answer.author.id) return
    setVotingAnswerId(answer.id)
    setActionError(null)
    try {
      const helpful = await setAnswerHelpful(answer.topicId, answer.id, !answer.isHelpful)
      onHelpfulChanged(answer.id, helpful)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) onLoginRequired()
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật đánh giá hữu ích.')
    } finally {
      setVotingAnswerId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting || isDeleting) return
    setIsDeleting(true); setActionError(null)
    try { await deleteAnswer(deleting.topicId, deleting.id); onDeleted(deleting.id); setDeleting(null) }
    catch (requestError) { setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể xóa câu trả lời.'); setDeleting(null) }
    finally { setIsDeleting(false) }
  }
  if (data.items.length === 0) {
    return (
      <Box sx={{ px: 3, py: 5, textAlign: 'center', border: 1, borderStyle: 'dashed', borderColor: 'var(--color-border-strong)', borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography component="h3" sx={{ color: 'text.primary', fontWeight: 700 }}>Chưa có câu trả lời</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          {isLocked
            ? 'Thảo luận này đã khóa trước khi có phản hồi.'
            : 'Hãy là người đầu tiên đóng góp cho thảo luận này.'}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {actionError && <Alert role="alert" severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
      <Box sx={{ display: 'grid', gap: 2 }}>
        {data.items.map((answer) => (
          <Box
            component="article"
            id={`answer-${answer.id}`}
            key={answer.id}
            sx={{
              minWidth: 0,
              scrollMarginTop: '128px',
              p: { xs: 2.5, sm: 3 },
              border: 1,
              borderColor: getAnswerBorderColor(answer),
              borderRadius: 2,
              bgcolor: 'background.paper',
              ml: answer.parentAnswerId ? { xs: 1.5, sm: 4 } : 0,
            }}
          >
            <Stack component="header" direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', columnGap: 1, rowGap: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
              <MuiLink
                component={Link}
                sx={{ color: 'text.primary', fontWeight: 700, '&:hover': { color: 'primary.main' } }}
                to={appRoutes.member(answer.author.id)}
                underline="none"
              >
                {answer.author.displayName}
              </MuiLink>
              <span aria-hidden="true">·</span>
              <time dateTime={answer.createdAtUtc}>{formatDateTime(answer.createdAtUtc)}</time>
              {answer.updatedAtUtc && <Typography component="span" sx={{ fontSize: '0.75rem' }} title={formatDateTime(answer.updatedAtUtc)}>· Đã chỉnh sửa</Typography>}
              {answer.isAccepted && (
                <Chip label="Câu trả lời được chấp nhận" size="small" sx={{ bgcolor: 'success.light', color: 'success.main', fontWeight: 700 }} />
              )}
              {answer.replyingTo && <Typography component="span" sx={{ fontSize: '0.75rem' }}>đang trả lời {answer.replyingTo.displayName}</Typography>}
            </Stack>
            <RichHtml
              className="fr-view reading-content"
              html={answer.bodyHtml}
              sx={answerBodySx}
            />
            <Stack direction="row" sx={{ mt: 2, pt: 2, flexWrap: 'wrap', alignItems: 'center', gap: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <VoteControl
                disabledReason={user?.id === answer.author.id ? 'Bạn không thể bình chọn câu trả lời của chính mình' : undefined}
                isBusy={scoringAnswerId === answer.id}
                myVote={answer.myVote}
                onVote={(direction) => void voteForAnswer(answer, direction)}
                score={answer.score}
                subject="câu trả lời"
              />
              <IconActionButton
                count={answer.helpfulCount}
                disabled={votingAnswerId !== null || user?.id === answer.author.id}
                icon={<ThumbUpIcon filled={answer.isHelpful} />}
                label={user?.id === answer.author.id
                  ? 'Bạn không thể tự đánh giá câu trả lời của mình'
                  : answer.isHelpful ? 'Bỏ đánh giá hữu ích' : 'Đánh giá hữu ích'}
                loading={votingAnswerId === answer.id}
                onClick={() => void toggleHelpful(answer)}
                pressed={answer.isHelpful}
              />
              {canAcceptAnswers && answer.parentAnswerId === null && !answer.isAccepted && (
                <IconActionButton disabled={acceptingAnswerId !== null} icon={<CheckCircleIcon />} label="Chấp nhận câu trả lời" loading={acceptingAnswerId === answer.id} onClick={() => onAccept(answer.id)} />
              )}
              {!isLocked && <IconActionButton icon={<ReplyIcon />} label="Phản hồi" onClick={() => user ? setReplyingTo(answer) : onLoginRequired()} variant="text" />}
              <ReportAction targetId={answer.id} targetType="answer" />
              {user?.id === answer.author.id && <>
                <IconActionButton icon={<PencilIcon />} label="Sửa câu trả lời" onClick={() => setEditing(answer)} variant="text" />
                <IconActionButton icon={<TrashIcon />} label="Xóa câu trả lời" onClick={() => setDeleting(answer)} tone="danger" variant="text" />
              </>}
            </Stack>
            {replyingTo?.id === answer.id && <Box sx={{ mt: 2 }}><AnswerForm parentAnswer={answer} topicId={answer.topicId} onCancel={() => setReplyingTo(null)} onCreated={(created) => { setReplyingTo(null); onReplyCreated(created) }} /></Box>}
          </Box>
        ))}
      </Box>

      {data.totalPages > 1 && (
        <Stack aria-label="Phân trang câu trả lời" component="nav" direction="row" sx={{ mt: 2.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Button disabled={data.page <= 1} onClick={() => onPageChange(data.page - 1)} variant="outlined">Trang trước</Button>
          <Typography color="text.secondary" component="span" variant="body2">Trang {data.page}/{data.totalPages}</Typography>
          <Button disabled={data.page >= data.totalPages} onClick={() => onPageChange(data.page + 1)} variant="outlined">Trang sau</Button>
        </Stack>
      )}
      {editing && <AnswerEditDialog answer={editing} onClose={() => setEditing(null)} onUpdated={(answer) => { onUpdated(answer); setEditing(null) }} />}
      <ConfirmDialog confirmLabel="Xóa câu trả lời" description="Câu trả lời sẽ không còn hiển thị công khai. Nếu đang được chấp nhận, trạng thái chấp nhận cũng sẽ được gỡ." isBusy={isDeleting} isOpen={deleting !== null} onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} title="Xóa câu trả lời?" />
    </>
  )
}
