import Button from '@mui/material/Button'
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
import { AuthRequiredDialog } from '../AuthRequiredDialog'
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
  const sort: AnswerSort = new URLSearchParams(location.search).get('answerSort') === 'helpful' ? 'helpful' : 'oldest'
  const answerHash = /^#answer-(\d+)$/.exec(location.hash)
  const aroundAnswerId = readPositiveInteger(answerHash?.[1] ?? null)
  const queryClient = useQueryClient()
  const { scope } = useUserScope()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
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
        setIsAuthDialogOpen(true)
      }
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể chọn câu trả lời lúc này.',
      )
    }
  }

  return (
    <section className="mt-8 scroll-mt-6" aria-labelledby="discussion-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Thảo luận</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950" id="discussion-title">
            {data ? `${data.totalItems} ${topicType === 'question' ? 'câu trả lời và phản hồi' : 'phản hồi'}` : 'Trao đổi'}
          </h2>
        </div>
        <label className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          Sắp xếp phản hồi
          <select
            className="min-h-10 border border-slate-300 bg-white px-3 py-2 text-slate-800"
            onChange={(event) => changeSort(event.target.value === 'helpful' ? 'helpful' : 'oldest')}
            value={sort}
          >
            <option value="oldest">Cũ nhất trước</option>
            <option value="helpful">Hữu ích nhất</option>
          </select>
        </label>
        {isLocked && (
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
            Đã khóa thảo luận
          </span>
        )}
      </div>

      {!isLocked && user && <AnswerForm onCreated={handleCreated} topicId={topicId} />}

      {!isLocked && !user && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <p className="text-sm leading-6 text-slate-700">Đăng nhập để đóng góp câu trả lời cho chủ đề này.</p>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => setIsAuthDialogOpen(true)} variant="contained">Viết câu trả lời</Button>
          </div>
        </div>
      )}

      {successMessage && (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {successMessage}
        </p>
      )}
      {actionError && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}

      <div className="mt-5">
        <AsyncStatePanel
          error={error}
          isLoading={isLoading}
          loadingText="Đang tải câu trả lời…"
          onRetry={() => void answersQuery.refetch()}
        />
        {!isLoading && isTargetUnavailable && (
          <div className="mt-3">
            <Button onClick={() => changePage(1)} variant="outlined">Xem các câu trả lời</Button>
          </div>
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
            onLoginRequired={() => setIsAuthDialogOpen(true)}
            onHelpfulChanged={(answerId, helpful) => {
              patchAnswers((current) => ({
                ...current,
                items: current.items.map((answer) => answer.id === answerId ? { ...answer, ...helpful } : answer),
              }))
              setSuccessMessage(helpful.isHelpful ? 'Đã đánh giá câu trả lời hữu ích.' : 'Đã bỏ đánh giá hữu ích.')
              // With the "most helpful" order, the new count can move the answer to another place.
              if (sort === 'helpful') refreshAnswers()
            }}
            onPageChange={changePage}
            onReplyCreated={handleCreated}
            onUpdated={(updated) => {
              patchAnswers((current) => ({ ...current, items: current.items.map((answer) => answer.id === updated.id ? updated : answer) }))
              setSuccessMessage('Đã cập nhật câu trả lời.')
            }}
          />
        )}
      </div>

      <AuthRequiredDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </section>
  )
}
