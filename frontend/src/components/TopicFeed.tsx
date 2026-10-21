import { Button } from '@astryxdesign/core/Button'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TopicFeedMode, TopicPage, TopicType } from '../api/topics'
import { TopicSummaryItem } from './topics/TopicSummaryItem'

interface TopicFeedProps {
  data: TopicPage | null
  error: string | null
  isLoading: boolean
  keyword: string
  onSearch: (keyword: string) => void
  onPageChange: (page: number) => void
  onRetry: () => void
  onFilter: (key: 'categoryId' | 'tagId', value: number) => void
  selectedType?: TopicType
  isDiscussion?: boolean
  feed?: TopicFeedMode
  requiresLogin?: boolean
  loginUrl?: string
  onShowLatest?: () => void
}

export const TopicFeed = ({
  data,
  error,
  isLoading,
  keyword,
  onSearch,
  onPageChange,
  onRetry,
  onFilter,
  selectedType,
  isDiscussion,
  feed = 'latest',
  requiresLogin = false,
  loginUrl = '/login',
  onShowLatest,
}: TopicFeedProps) => {
  const [draftKeyword, setDraftKeyword] = useState(keyword)
  return (
  <section aria-labelledby="topic-feed-title" className="overflow-hidden border border-slate-200 bg-white" data-tour="content-feed">
    <div className="border-b border-slate-200 p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-700">{isDiscussion ? 'Đang có trao đổi' : 'Khám phá nội dung'}</p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950" id="topic-feed-title">
        {selectedType === 'article' ? 'Bài viết' : selectedType === 'question' ? 'Câu hỏi' : 'Bài viết và câu hỏi'}
      </h2>
      <form className="mt-4 flex gap-2" onSubmit={(event) => {
        event.preventDefault()
        onSearch(draftKeyword)
      }}>
        <label className="sr-only" htmlFor="topic-search">Tìm kiếm nội dung</label>
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          id="topic-search"
          onChange={(event) => {
            setDraftKeyword(event.target.value)
          }}
          placeholder="Tìm theo tiêu đề hoặc tóm tắt"
          value={draftKeyword}
        />
        <Button label="Tìm kiếm" type="submit" variant="primary" />
      </form>
    </div>

    {isLoading && <div className="p-8 text-center text-sm text-slate-500" role="status">Đang tải nội dung…</div>}
    {!isLoading && requiresLogin && <div className="space-y-3 p-6 text-center text-sm text-slate-600">
      <p>Đăng nhập để xem nội dung từ những tác giả bạn đang theo dõi.</p>
      <Link className="inline-block border border-blue-700 bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800" to={loginUrl}>Đăng nhập</Link>
    </div>}
    {!isLoading && !requiresLogin && error && (
      <div className="space-y-4 p-8 text-center" role="alert">
        <p className="text-sm text-red-700">{error}</p>
        <Button label="Thử lại" onClick={onRetry} variant="secondary" />
      </div>
    )}
    {!isLoading && !requiresLogin && !error && data?.items.length === 0 && (
      <div className="space-y-3 p-6 text-center text-sm text-slate-600">
        <p>{feed === 'following'
          ? 'Chưa có nội dung phù hợp từ những người bạn đang theo dõi. Hãy theo dõi tác giả trên trang cá nhân hoặc thử bỏ bớt bộ lọc.'
          : feed === 'weekly'
            ? 'Chưa có nội dung phù hợp nhận tương tác trong 7 ngày qua.'
            : 'Không tìm thấy nội dung phù hợp.'}</p>
        {feed !== 'latest' && <button className="font-semibold text-blue-700 underline" onClick={onShowLatest} type="button">Xem Mới nhất</button>}
        {data.totalItems > 0 && <button className="font-semibold text-blue-700 underline" onClick={() => onPageChange(Math.max(1, data.totalPages))} type="button">Về trang cuối có nội dung</button>}
      </div>
    )}
    {!isLoading && !requiresLogin && !error && data && data.items.length > 0 && (
      <>
        <ul className="divide-y divide-slate-200">
          {data.items.map((topic) => (
            <li className="p-5 sm:p-6" key={topic.id}>
              <TopicSummaryItem onFilter={onFilter} topic={topic} isDiscussion={isDiscussion} />
            </li>
          ))}
        </ul>
        <nav aria-label="Phân trang nội dung" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm text-slate-600">
          <span>Trang {data.page} / {Math.max(data.totalPages, 1)} · {data.totalItems} nội dung</span>
          <div className="flex gap-2">
            <Button isDisabled={data.page <= 1} label="Trang trước" onClick={() => onPageChange(data.page - 1)} variant="secondary" />
            <Button isDisabled={data.page >= data.totalPages} label="Trang sau" onClick={() => onPageChange(data.page + 1)} variant="secondary" />
          </div>
        </nav>
      </>
    )}
  </section>
)
}
