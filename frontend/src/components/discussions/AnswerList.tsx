import { Button } from '@astryxdesign/core/Button'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { deleteAnswer, type Answer, type AnswerPage } from '../../api/answers'
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
  onPageChange: (page: number) => void
  onReplyCreated: (answer: Answer) => void
  onUpdated: (answer: Answer) => void
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

export const AnswerList = ({
  acceptingAnswerId,
  canAcceptAnswers,
  data,
  isLocked,
  onAccept,
  onDeleted,
  onLoginRequired,
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
          <article className={`scroll-mt-32 rounded-xl border bg-white p-5 sm:p-6 ${answer.parentAnswerId ? 'ml-5 border-blue-200 sm:ml-10' : 'border-slate-200'}`} id={`answer-${answer.id}`} key={answer.id}>
            <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
              <Link className="font-bold text-slate-800 hover:text-blue-700" to={appRoutes.member(answer.author.id)}>
                {answer.author.displayName}
              </Link>
              <span aria-hidden="true">·</span>
              <time dateTime={answer.createdAtUtc}>{formatDateTime(answer.createdAtUtc)}</time>
              {answer.isAccepted && (
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                  Câu trả lời được chấp nhận
                </span>
              )}
              {answer.replyingTo && <span className="text-xs text-slate-500">đang trả lời {answer.replyingTo.displayName}</span>}
            </header>
            <div
              className="fr-view mt-4 text-sm leading-7 text-slate-800 [&_a]:text-blue-700 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100"
              dangerouslySetInnerHTML={{ __html: answer.bodyHtml }}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
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
        <nav className="mt-5 flex items-center justify-between gap-4" aria-label="Phân trang câu trả lời">
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
