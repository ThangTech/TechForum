import Button from '@mui/material/Button'
import { Link, useSearchParams } from 'react-router-dom'
import { appRoutes } from '../appRoutes'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicTypeBadge } from '../components/topics/TopicTypeBadge'
import { useSavedTopics } from '../queries/bookmarks'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const SavedTopicsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const savedQuery = useSavedTopics(page, 10)
  const data = savedQuery.data ?? null
  const isLoading = isInitialLoading(savedQuery)
  const error = getErrorMessage(savedQuery.error, 'Không thể tải danh sách đã lưu.')

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return (
    <main className="main-area" id="main-content">
      <div className="page-content py-10 sm:py-14">
        <p className="eyebrow">Thư viện cá nhân</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Nội dung đã lưu</h1>
        <p className="mt-2 text-slate-600">Các bài viết và câu hỏi bạn muốn đọc lại.</p>
        <div className="mt-7">
          <AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải nội dung đã lưu…" onRetry={() => void savedQuery.refetch()} />
          {!isLoading && !error && data?.items.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="font-bold text-slate-900">Bạn chưa lưu nội dung nào</h2>
              <Link className="mt-3 inline-block font-bold text-blue-700 hover:underline" to={appRoutes.home}>Khám phá nội dung</Link>
            </div>
          )}
          {!isLoading && !error && data && data.items.length > 0 && (
            <>
              <div className="grid gap-4">
                {data.items.map((topic) => (
                  <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" key={topic.id}>
                    <TopicTypeBadge type={topic.type} />
                    <Link className="mt-3 block text-xl font-bold text-slate-950 hover:text-blue-700" to={appRoutes.topic(topic.id)}>{topic.title}</Link>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{topic.summary}</p>
                    <p className="mt-4 text-xs text-slate-500">{topic.author.displayName} · {topic.category.name} · Lưu {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(topic.savedAtUtc))}</p>
                  </article>
                ))}
              </div>
              {data.totalPages > 1 && (
                <nav className="mt-6 flex items-center justify-between" aria-label="Phân trang nội dung đã lưu">
                  <Button disabled={page <= 1} onClick={() => changePage(page - 1)} variant="outlined">Trang trước</Button>
                  <span className="text-sm text-slate-600">Trang {page}/{data.totalPages}</span>
                  <Button disabled={page >= data.totalPages} onClick={() => changePage(page + 1)} variant="outlined">Trang sau</Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
