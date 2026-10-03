import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { acceptAnswer, getAnswers, type AnswerPage } from '../../api/answers'
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

export const DiscussionSection = ({
  isLocked,
  topicAuthorId,
  topicId,
  topicType,
}: DiscussionSectionProps) => {
  const { user } = useAuth()
  const [data, setData] = useState<AnswerPage | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      try {
        setData(await getAnswers(topicId, page, PAGE_SIZE, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
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
  }, [page, requestVersion, topicId])

  const handleCreated = () => {
    const nextTotalItems = (data?.totalItems ?? 0) + 1
    const lastPage = Math.max(1, Math.ceil(nextTotalItems / PAGE_SIZE))
    setSuccessMessage('Câu trả lời đã được đăng.')
    setPage(lastPage)
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
    <section className="mt-8" aria-labelledby="discussion-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Thảo luận</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950" id="discussion-title">
            {data ? `${data.totalItems} câu trả lời` : 'Câu trả lời'}
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
        {!isLoading && !error && data && (
          <AnswerList
            acceptingAnswerId={acceptingAnswerId}
            canAcceptAnswers={canAcceptAnswers}
            data={data}
            isLocked={isLocked}
            onAccept={(answerId) => void handleAccept(answerId)}
            onDeleted={(answerId) => {
              setData((current) => current ? { ...current, items: current.items.filter((answer) => answer.id !== answerId), totalItems: Math.max(0, current.totalItems - 1) } : current)
              setSuccessMessage('Đã xóa câu trả lời.')
            }}
            onPageChange={setPage}
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
