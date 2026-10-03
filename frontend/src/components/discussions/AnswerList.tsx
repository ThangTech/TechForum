import { Button } from '@astryxdesign/core/Button'
import { Link } from 'react-router-dom'
import type { AnswerPage } from '../../api/answers'
import { appRoutes } from '../../appRoutes'

interface AnswerListProps {
  data: AnswerPage
  isLocked: boolean
  onPageChange: (page: number) => void
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

export const AnswerList = ({ data, isLocked, onPageChange }: AnswerListProps) => {
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
            </header>
            <div
              className="mt-4 text-sm leading-7 text-slate-800 [&_a]:text-blue-700 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100"
              dangerouslySetInnerHTML={{ __html: answer.bodyHtml }}
            />
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
