import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { acceptAnswer, getAnswers, type Answer, type AnswerPage } from '../../api/answers'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
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
  const answerHash = /^#answer-(\d+)$/.exec(location.hash)
  const aroundAnswerId = readPositiveInteger(answerHash?.[1] ?? null)
  const [data, setData] = useState<AnswerPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTargetUnavailable, setIsTargetUnavailable] = useState(false)
  const [requestVersion, setRequestVersion] = useState(0)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [acceptingAnswerId, setAcceptingAnswerId] = useState<number | null>(null)
  const canAcceptAnswers = user?.id === topicAuthorId && topicType === 'question'

  useEffect(() => {
    const controller = new AbortController()

    const loadAnswers = async () => {
      setIsLoading(true)
      setError(null)
      setIsTargetUnavailable(false)
      try {
        const result = await getAnswers(topicId, page, PAGE_SIZE, controller.signal, aroundAnswerId)
        if (controller.signal.aborted) return
        setData(result)
        if (result.page !== page) {
          const search = new URLSearchParams(location.search)
          search.set('answerPage', String(result.page))
          void navigate({ pathname: location.pathname, search: `?${search}`, hash: location.hash }, { replace: true })
        }
      } catch (requestError) {
        if (controller.signal.aborted) return
        setIsTargetUnavailable(aroundAnswerId !== undefined && requestError instanceof ApiError && requestError.status === 404)
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Không thể tải câu trả lời lúc này.',
        )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadAnswers()
    return () => controller.abort()
  }, [aroundAnswerId, location.hash, location.pathname, location.search, navigate, page, requestVersion, topicId])

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
    setRequestVersion((version) => version + 1)
  }

  const handleAccept = async (answerId: number) => {
    if (acceptingAnswerId !== null) return

    setActionError(null)
    setSuccessMessage(null)
    setAcceptingAnswerId(answerId)
    try {
      await acceptAnswer(topicId, answerId)
      setData((current) => {
        if (!current) return current

        return {
          ...current,
          items: current.items.map((answer) => ({
            ...answer,
            isAccepted: answer.id === answerId,
          })),
        }
      })
      setSuccessMessage('Đã cập nhật câu trả lời được chấp nhận.')
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setIsAuthDialogOpen(true)
      }
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể chọn câu trả lời lúc này.',
      )
    } finally {
      setAcceptingAnswerId(null)
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
            <Button label="Viết câu trả lời" onClick={() => setIsAuthDialogOpen(true)} variant="primary" />
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
          onRetry={() => setRequestVersion((version) => version + 1)}
        />
        {!isLoading && isTargetUnavailable && (
          <div className="mt-3">
            <Button label="Xem các câu trả lời" onClick={() => changePage(1)} variant="secondary" />
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
              setRequestVersion((version) => version + 1)
              setSuccessMessage('Đã xóa câu trả lời.')
            }}
            onLoginRequired={() => setIsAuthDialogOpen(true)}
            onPageChange={changePage}
            onReplyCreated={handleCreated}
            onUpdated={(updated) => {
              setData((current) => current ? { ...current, items: current.items.map((answer) => answer.id === updated.id ? updated : answer) } : current)
              setSuccessMessage('Đã cập nhật câu trả lời.')
            }}
          />
        )}
      </div>

      <AuthRequiredDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </section>
  )
}
