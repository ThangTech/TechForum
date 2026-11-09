import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { acceptAnswer, type Answer, type AnswerPage, type AnswerSort } from '../../api/answers'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { answerKeys, useAnswers } from '../../queries/answers'
import { isInitialLoading } from '../../queries/status'
import { topicKeys } from '../../queries/topics'
import { useUserScope } from '../../queries/userScope'
import { openAuthDialog } from '../../auth/authDialogStore'
import { AsyncStatePanel } from '../feedback/AsyncStatePanel'
import { AnswerForm } from './AnswerForm'
import { AnswerList } from './AnswerList'

interface DiscussionSectionProps {
  isLocked: boolean
  topicAuthorId: string
  topicId: number
  topicType: 'article' | 'question'
}

const PAGE_SIZE = 20

const readPositiveInteger = (value: string | null) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 && number <= 2147483647 ? number : undefined
}

// The order of the answers is in the address (?answerSort=). Anything unknown gives the default order.
const readSort = (value: string | null): AnswerSort => (value === 'helpful' || value === 'score' ? value : 'oldest')

export const DiscussionSection = ({
  isLocked,
  topicAuthorId,
  topicId,
  topicType,
}: DiscussionSectionProps) => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const page = readPositiveInteger(new URLSearchParams(location.search).get('answerPage')) ?? 1
  const sort = readSort(new URLSearchParams(location.search).get('answerSort'))
  const answerHash = /^#answer-(\d+)$/.exec(location.hash)
  const aroundAnswerId = readPositiveInteger(answerHash?.[1] ?? null)
  const queryClient = useQueryClient()
  const { scope } = useUserScope()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const canAcceptAnswers = user?.id === topicAuthorId && topicType === 'question'

  const pageParams = { page, pageSize: PAGE_SIZE, aroundAnswerId, sort }
  const answersQuery = useAnswers(topicId, pageParams)
  const data = answersQuery.data ?? null
  const isLoading = isInitialLoading(answersQuery)
  const requestError = answersQuery.error
  const isTargetUnavailable = aroundAnswerId !== undefined &&
    requestError instanceof ApiError && requestError.status === 404
  const error = requestError === null
    ? null
    : requestError instanceof ApiError ? requestError.message : 'Không thể tải câu trả lời lúc này.'

  // Change the answers on the page that is shown, without asking the server again.
  const patchAnswers = (update: (current: AnswerPage) => AnswerPage) => {
    queryClient.setQueryData<AnswerPage>(
      answerKeys.page(scope, topicId, pageParams),
      (current) => current ? update(current) : current,
    )
  }

  // Load every page of these answers again, for example after a new answer or a delete.
  const refreshAnswers = () => {
    void queryClient.invalidateQueries({ queryKey: answerKeys.all(scope, topicId) })
    // Topic lists show the number of answers of each topic.
    void queryClient.invalidateQueries({ queryKey: topicKeys.lists })
  }

  const acceptMutation = useMutation({
    mutationFn: (answerId: number) => acceptAnswer(topicId, answerId),
    onSuccess: (_answer, answerId) => {
      patchAnswers((current) => ({
        ...current,
        items: current.items.map((answer) => ({ ...answer, isAccepted: answer.id === answerId })),
      }))
      setSuccessMessage('Đã cập nhật câu trả lời được chấp nhận.')
    },
  })
  const acceptingAnswerId = acceptMutation.isPending ? acceptMutation.variables : null

  // The server can answer with another page than the one asked for, for example when the
  // page number is too high or a linked answer is on a different page. The address follows it.
  useEffect(() => {
    if (!data) return
    if (!aroundAnswerId && data.totalPages > 0 && data.page > data.totalPages) {
      const search = new URLSearchParams(location.search)
      search.set('answerPage', String(data.totalPages))
      void navigate({ pathname: location.pathname, search: `?${search}` }, { replace: true })
      return
    }
    if (data.page !== page) {
      const search = new URLSearchParams(location.search)
      search.set('answerPage', String(data.page))
      void navigate({ pathname: location.pathname, search: `?${search}`, hash: aroundAnswerId ? `#answer-${aroundAnswerId}` : undefined }, { replace: true })
    }
  }, [aroundAnswerId, data, location.pathname, location.search, navigate, page])

  useEffect(() => {
    if (isLoading || error || !aroundAnswerId || !data?.items.some((answer) => answer.id === aroundAnswerId)) return
    document.getElementById(`answer-${aroundAnswerId}`)?.scrollIntoView({ block: 'start' })
  }, [aroundAnswerId, data, error, isLoading])

  const changePage = (nextPage: number, answerId?: number) => {
    const search = new URLSearchParams(location.search)
    if (nextPage === 1) search.delete('answerPage')
    else search.set('answerPage', String(nextPage))
    let hash = location.hash
    if (answerId !== undefined) hash = `#answer-${answerId}`
    else if (answerHash) hash = ''
    void navigate({ pathname: location.pathname, search: search.toString(), hash })
  }

  const handleCreated = (answer: Answer) => {
    const nextTotalItems = (data?.totalItems ?? 0) + 1
    const lastPage = Math.max(1, Math.ceil(nextTotalItems / PAGE_SIZE))
    setSuccessMessage(answer.parentAnswerId ? 'Phản hồi đã được đăng.' : 'Câu trả lời đã được đăng.')
    changePage(lastPage, answer.id)
    refreshAnswers()
  }

  const changeSort = (nextSort: AnswerSort) => {
    const search = new URLSearchParams(location.search)
    search.delete('answerPage')
    if (nextSort === 'oldest') search.delete('answerSort')
    else search.set('answerSort', nextSort)
    void navigate({ pathname: location.pathname, search: search.toString(), hash: answerHash ? '' : location.hash })
  }

  const handleAccept = async (answerId: number) => {
    if (acceptingAnswerId !== null) return

    setActionError(null)
    setSuccessMessage(null)
    try {
      await acceptMutation.mutateAsync(answerId)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        openAuthDialog()
      }
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể chọn câu trả lời lúc này.',
      )
    }
  }

  return (
    <Box aria-labelledby="discussion-title" component="section" sx={{ mt: 4, scrollMarginTop: '24px' }}>
      <Stack direction="row" sx={{ mb: 2.5, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Thảo luận</Typography>
          <Typography component="h2" id="discussion-title" sx={{ mt: 0.5, color: 'var(--color-heading)', fontSize: '1.5rem', fontWeight: 800 }}>
            {data ? `${data.totalItems} ${topicType === 'question' ? 'câu trả lời và phản hồi' : 'phản hồi'}` : 'Trao đổi'}
          </Typography>
        </Box>
        <TextField
          fullWidth={false}
          label="Sắp xếp phản hồi"
          onChange={(event) => changeSort(readSort(event.target.value))}
          select
          size="small"
          sx={{ minWidth: 190 }}
          value={sort}
        >
          <MenuItem value="oldest">Cũ nhất trước</MenuItem>
          <MenuItem value="helpful">Hữu ích nhất</MenuItem>
          <MenuItem value="score">Điểm cao nhất</MenuItem>
        </TextField>
        {isLocked && (
          <Chip label="Đã khóa thảo luận" size="small" sx={{ bgcolor: 'var(--color-loading)', color: 'text.secondary', fontWeight: 700 }} />
        )}
      </Stack>

      {!isLocked && user && <AnswerForm onCreated={handleCreated} topicId={topicId} />}

      {!isLocked && !user && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ p: 2.5, gap: 2.5, alignItems: { sm: 'center' }, justifyContent: 'space-between', border: 1, borderColor: 'var(--color-primary-border)', borderRadius: 2, bgcolor: 'primary.light' }}
        >
          <Typography sx={{ color: 'text.primary', fontSize: '0.875rem', lineHeight: '1.5rem' }}>Đăng nhập để đóng góp câu trả lời cho chủ đề này.</Typography>
          <Box>
            <Button onClick={() => openAuthDialog()} variant="contained">Viết câu trả lời</Button>
          </Box>
        </Stack>
      )}

      {successMessage && <Alert role="status" severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}
      {actionError && <Alert role="alert" severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}

      <Box sx={{ mt: 2.5 }}>
        <AsyncStatePanel
          error={error}
          isLoading={isLoading}
          loadingText="Đang tải câu trả lời…"
          onRetry={() => void answersQuery.refetch()}
        />
        {!isLoading && isTargetUnavailable && (
          <Box sx={{ mt: 1.5 }}>
            <Button onClick={() => changePage(1)} variant="outlined">Xem các câu trả lời</Button>
          </Box>
        )}
        {!isLoading && !error && data && (
          <AnswerList
            acceptingAnswerId={acceptingAnswerId}
            canAcceptAnswers={canAcceptAnswers}
            data={data}
            isLocked={isLocked}
            onAccept={(answerId) => void handleAccept(answerId)}
            onDeleted={() => {
              const lastPage = Math.max(1, Math.ceil((data.totalItems - 1) / PAGE_SIZE))
              changePage(Math.min(data.page, lastPage))
              refreshAnswers()
              setSuccessMessage('Đã xóa câu trả lời.')
            }}
            onLoginRequired={() => openAuthDialog()}
            onHelpfulChanged={(answerId, helpful) => {
              patchAnswers((current) => ({
                ...current,
                items: current.items.map((answer) => answer.id === answerId ? { ...answer, ...helpful } : answer),
              }))
              setSuccessMessage(helpful.isHelpful ? 'Đã đánh giá câu trả lời hữu ích.' : 'Đã bỏ đánh giá hữu ích.')
              // With the "most helpful" order, the new count can move the answer to another place.
              if (sort === 'helpful') refreshAnswers()
            }}
            onVoteChanged={(answerId, vote) => {
              patchAnswers((current) => ({
                ...current,
                items: current.items.map((answer) => answer.id === answerId ? { ...answer, ...vote } : answer),
              }))
              // With the "highest score" order, the new score can move the answer to another place.
              if (sort === 'score') refreshAnswers()
            }}
            onPageChange={changePage}
            onReplyCreated={handleCreated}
            onUpdated={(updated) => {
              patchAnswers((current) => ({ ...current, items: current.items.map((answer) => answer.id === updated.id ? updated : answer) }))
              setSuccessMessage('Đã cập nhật câu trả lời.')
            }}
          />
        )}
      </Box>
    </Box>
  )
}
