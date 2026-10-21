import { Button } from '@astryxdesign/core/Button'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { deleteAnswer, setAnswerHelpful, type Answer, type AnswerHelpfulState, type AnswerPage } from '../../api/answers'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { appRoutes } from '../../appRoutes'
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
  onPageChange: (page: number) => void
  onReplyCreated: (answer: Answer) => void
  onUpdated: (answer: Answer) => void
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

const answerBorderClass = (answer: Answer) => {
  if (answer.isAccepted) return 'border-green-400'
  if (answer.parentAnswerId) return 'border-blue-200'
  return 'border-slate-200'
}

export const AnswerList = ({
  acceptingAnswerId,
  canAcceptAnswers,
  data,
  isLocked,
  onAccept,
  onDeleted,
  onLoginRequired,
  onHelpfulChanged,
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
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <h3 className="font-bold text-slate-900">Chưa có câu trả lời</h3>
        <p className="mt-2 text-sm text-slate-500">
          {isLocked
            ? 'Thảo luận này đã khóa trước khi có phản hồi.'
            : 'Hãy là người đầu tiên đóng góp cho thảo luận này.'}
        </p>
      </div>
    )
  }

  return (
    <>
      {actionError && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}
      <div className="grid gap-4">
        {data.items.map((answer) => (
          <article className={`min-w-0 scroll-mt-32 rounded-xl border bg-white p-5 sm:p-6 ${answerBorderClass(answer)} ${answer.parentAnswerId ? 'ml-3 sm:ml-8' : ''}`} id={`answer-${answer.id}`} key={answer.id}>
            <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
              <Link className="font-bold text-slate-800 hover:text-blue-700" to={appRoutes.member(answer.author.id)}>
                {answer.author.displayName}
              </Link>
              <span aria-hidden="true">·</span>
              <time dateTime={answer.createdAtUtc}>{formatDateTime(answer.createdAtUtc)}</time>
              {answer.updatedAtUtc && <span className="text-xs" title={formatDateTime(answer.updatedAtUtc)}>· Đã chỉnh sửa</span>}
              {answer.isAccepted && (
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                  Câu trả lời được chấp nhận
                </span>
              )}
              {answer.replyingTo && <span className="text-xs text-slate-500">đang trả lời {answer.replyingTo.displayName}</span>}
            </header>
            <div
              className="fr-view reading-content mt-4 text-sm leading-7 text-slate-800 [&_a]:text-blue-700 [&_a]:underline [&_p]:mb-3 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: answer.bodyHtml }}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <button
                aria-label={`${answer.isHelpful ? 'Bỏ đánh giá hữu ích' : 'Đánh giá hữu ích'}: ${answer.helpfulCount} lượt`}
                aria-pressed={answer.isHelpful}
                className={`inline-flex min-h-10 items-center gap-2 border px-3 py-2 text-sm font-semibold disabled:cursor-default disabled:opacity-60 ${answer.isHelpful ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'}`}
                disabled={votingAnswerId !== null || user?.id === answer.author.id}
                onClick={() => void toggleHelpful(answer)}
                title={user?.id === answer.author.id ? 'Bạn không thể tự đánh giá câu trả lời của mình.' : undefined}
                type="button"
              >
                <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width="16"><path d="M7 10v11H3V10h4Zm0 0 5-7c1.8 0 2.5 1.2 2 3l-1 4h5a3 3 0 0 1 3 3l-1 6a2 2 0 0 1-2 2H7" /></svg>
                {votingAnswerId === answer.id ? 'Đang lưu…' : `Hữu ích · ${answer.helpfulCount}`}
              </button>
              {canAcceptAnswers && answer.parentAnswerId === null && !answer.isAccepted && (
                <Button
                  isDisabled={acceptingAnswerId !== null}
                  isLoading={acceptingAnswerId === answer.id}
                  label="Chấp nhận câu trả lời"
                  onClick={() => onAccept(answer.id)}
                  variant="secondary"
                />
              )}
              {!isLocked && <Button label="Phản hồi" onClick={() => user ? setReplyingTo(answer) : onLoginRequired()} variant="ghost" />}
              <ReportAction targetId={answer.id} targetType="answer" />
              {user?.id === answer.author.id && <>
                <Button label="Sửa" onClick={() => setEditing(answer)} variant="ghost" />
                <Button label="Xóa" onClick={() => setDeleting(answer)} variant="ghost" />
              </>}
            </div>
            {replyingTo?.id === answer.id && <div className="mt-4"><AnswerForm parentAnswer={answer} topicId={answer.topicId} onCancel={() => setReplyingTo(null)} onCreated={(created) => { setReplyingTo(null); onReplyCreated(created) }} /></div>}
          </article>
        ))}
      </div>

      {data.totalPages > 1 && (
        <nav className="mt-5 flex flex-wrap items-center justify-between gap-4" aria-label="Phân trang câu trả lời">
          <Button
            isDisabled={data.page <= 1}
            label="Trang trước"
            onClick={() => onPageChange(data.page - 1)}
            variant="secondary"
          />
          <span className="text-sm text-slate-600">Trang {data.page}/{data.totalPages}</span>
          <Button
            isDisabled={data.page >= data.totalPages}
            label="Trang sau"
            onClick={() => onPageChange(data.page + 1)}
            variant="secondary"
          />
        </nav>
      )}
      {editing && <AnswerEditDialog answer={editing} onClose={() => setEditing(null)} onUpdated={(answer) => { onUpdated(answer); setEditing(null) }} />}
      <ConfirmDialog confirmLabel="Xóa câu trả lời" description="Câu trả lời sẽ không còn hiển thị công khai. Nếu đang được chấp nhận, trạng thái chấp nhận cũng sẽ được gỡ." isBusy={isDeleting} isOpen={deleting !== null} onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} title="Xóa câu trả lời?" />
    </>
  )
}
