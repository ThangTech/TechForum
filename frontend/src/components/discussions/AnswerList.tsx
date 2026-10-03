import { Button } from '@astryxdesign/core/Button'
import { Link } from 'react-router-dom'
import type { AnswerPage } from '../../api/answers'
import { appRoutes } from '../../appRoutes'

interface AnswerListProps {
  acceptingAnswerId: number | null
  canAcceptAnswers: boolean
  data: AnswerPage
  isLocked: boolean
  onAccept: (answerId: number) => void
  onPageChange: (page: number) => void
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
  onPageChange,
}: AnswerListProps) => {
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
      <div className="grid gap-4">
        {data.items.map((answer) => (
          <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" key={answer.id}>
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
            </header>
            <div
              className="mt-4 text-sm leading-7 text-slate-800 [&_a]:text-blue-700 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100"
              dangerouslySetInnerHTML={{ __html: answer.bodyHtml }}
            />
            {canAcceptAnswers && !answer.isAccepted && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <Button
                  isDisabled={acceptingAnswerId !== null}
                  isLoading={acceptingAnswerId === answer.id}
                  label="Chấp nhận câu trả lời"
                  onClick={() => onAccept(answer.id)}
                  variant="secondary"
                />
              </div>
            )}
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
    </>
  )
}
