import { Button } from '@astryxdesign/core/Button'
import type { FormEvent } from 'react'
import type { TopicPage, TopicType } from '../api/topics'
import { TopicSummaryItem } from './topics/TopicSummaryItem'

interface TopicFeedProps {
  data: TopicPage | null
  error: string | null
  isLoading: boolean
  keyword: string
  onKeywordChange: (value: string) => void
  onSearch: (event: FormEvent<HTMLFormElement>) => void
  onPageChange: (page: number) => void
  onRetry: () => void
  onFilter: (key: 'categoryId' | 'tagId', value: number) => void
  selectedType?: TopicType
}

export const TopicFeed = ({
  data,
  error,
  isLoading,
  keyword,
  onKeywordChange,
  onSearch,
  onPageChange,
  onRetry,
  onFilter,
  selectedType,
}: TopicFeedProps) => (
  <section aria-labelledby="topic-feed-title" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="border-b border-slate-200 p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Nội dung mới</p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950" id="topic-feed-title">
        {selectedType === 'article' ? 'Bài viết' : selectedType === 'question' ? 'Câu hỏi' : 'Bài viết và câu hỏi'}
      </h2>
      <form className="mt-4 flex gap-2" onSubmit={onSearch}>
        <label className="sr-only" htmlFor="topic-search">Tìm kiếm nội dung</label>
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          id="topic-search"
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Tìm theo tiêu đề hoặc tóm tắt"
          value={keyword}
        />
        <Button label="Tìm kiếm" type="submit" variant="primary" />
      </form>
    </div>

    {isLoading && <div className="p-8 text-center text-sm text-slate-500" role="status">Đang tải nội dung…</div>}
    {!isLoading && error && (
      <div className="space-y-4 p-8 text-center" role="alert">
        <p className="text-sm text-red-700">{error}</p>
        <Button label="Thử lại" onClick={onRetry} variant="secondary" />
      </div>
    )}
    {!isLoading && !error && data?.items.length === 0 && (
      <div className="p-8 text-center text-sm text-slate-500">Không tìm thấy nội dung phù hợp.</div>
    )}
    {!isLoading && !error && data && data.items.length > 0 && (
      <>
        <ul className="divide-y divide-slate-200">
          {data.items.map((topic) => (
            <li className="p-5 sm:p-6" key={topic.id}>
              <TopicSummaryItem onFilter={onFilter} topic={topic} />
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm text-slate-600">
          <span>Trang {data.page} / {Math.max(data.totalPages, 1)} · {data.totalItems} nội dung</span>
          <div className="flex gap-2">
            <Button isDisabled={data.page <= 1} label="Trang trước" onClick={() => onPageChange(data.page - 1)} variant="secondary" />
            <Button isDisabled={data.page >= data.totalPages} label="Trang sau" onClick={() => onPageChange(data.page + 1)} variant="secondary" />
          </div>
        </div>
      </>
    )}
  </section>
)
