import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import type { TopicType, QuestionStatus, TopicFeedMode } from '../api/topics'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/authState'
import { createAuthUrl } from '../auth/returnUrl'
import { CategoryPanel } from '../components/CategoryPanel'
import { TagPanel } from '../components/TagPanel'
import { TopicFeed } from '../components/TopicFeed'
import { ExploreNav } from '../components/home/ExploreNav'
import { HomeHero } from '../components/home/HomeHero'
import { HomeTour } from '../components/tour/HomeTour'
import { QuestionHighlightsPanel } from '../components/questions/QuestionHighlightsPanel'
import { useCategories } from '../queries/categories'
import { getErrorMessage } from '../queries/errorMessage'
import { useQuestionHighlights } from '../queries/questionHighlights'
import { isInitialLoading } from '../queries/status'
import { useTags } from '../queries/tags'
import { useTopicFeed } from '../queries/topics'

interface HomePageProps {
  fixedType?: 'Article' | 'Question'
  title?: string
  description?: string
  sort?: 'discussion'
  showTour?: boolean
}

const readPositiveInteger = (value: string | null) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export const HomePage = ({
  fixedType,
  title = 'Cùng học hỏi, chia sẻ và làm chủ công nghệ.',
  description = 'Khám phá các bài viết và câu hỏi mới nhất từ cộng đồng TechForum.',
  sort,
  showTour = false,
}: HomePageProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const { user, isLoading: isAuthLoading } = useAuth()
  const feedParam = searchParams.get('feed')
  const feed: TopicFeedMode = !sort && (feedParam === 'following' || feedParam === 'weekly') ? feedParam : 'latest'
  const page = readPositiveInteger(searchParams.get('page')) ?? 1
  const categoryId = readPositiveInteger(searchParams.get('categoryId'))
  const tagId = readPositiveInteger(searchParams.get('tagId'))
  const keyword = searchParams.get('keyword')?.trim() ?? ''
  const typeParam = searchParams.get('type')
  const selectedType = fixedType ?? (typeParam === 'Article' || typeParam === 'Question' ? typeParam : undefined)
  const statusParam = searchParams.get('questionStatus')
  const questionStatus: QuestionStatus | undefined = selectedType !== 'Article' &&
    (statusParam === 'unanswered' || statusParam === 'unsolved' || statusParam === 'solved') ? statusParam : undefined

  const [areFiltersOpen, setAreFiltersOpen] = useState(() => window.matchMedia('(min-width: 761px)').matches)

  const categoriesQuery = useCategories()
  const tagsQuery = useTags()
  const highlightsQuery = useQuestionHighlights()
  const topicsQuery = useTopicFeed(feed, {
    page,
    pageSize: 10,
    keyword: keyword || undefined,
    type: selectedType,
    categoryId,
    tagId,
    sort: feed === 'weekly' ? 'weekly' : sort,
    questionStatus,
  })

  const categories = categoriesQuery.data ?? []
  const tags = tagsQuery.data ?? []

  // The "following" feed answers 401 for a guest. That is shown as "log in", not as an error.
  const followingUnauthorized = feed === 'following' &&
    topicsQuery.error instanceof ApiError && topicsQuery.error.status === 401
  const topicError = followingUnauthorized ? null : getErrorMessage(topicsQuery.error)

  // A page number past the last page (for example after a filter) goes back to the last page.
  const lastPage = topicsQuery.data ? Math.max(1, topicsQuery.data.totalPages) : null
  const isPageOutOfRange = lastPage !== null && page > lastPage
  const topics = isPageOutOfRange ? null : topicsQuery.data ?? null
  // The "following" feed waits for the login session before it can run.
  const areTopicsLoading = isInitialLoading(topicsQuery) || isPageOutOfRange ||
    (feed === 'following' && isAuthLoading)

  useEffect(() => {
    if (lastPage === null || page <= lastPage) return
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (lastPage === 1) next.delete('page')
      else next.set('page', String(lastPage))
      return next
    }, { replace: true })
  }, [lastPage, page, setSearchParams])

  const updateSearchParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    })
    setSearchParams(next)
  }

  const handleFilter = (key: 'categoryId' | 'tagId', value: number) => {
    updateSearchParams({ [key]: value, page: undefined })
  }

  return (
    <main className="main-area" id="main-content">
      {showTour && <HomeTour />}
      <div className="page-content">
        <HomeHero title={title} description={description} />

        <div className="content-grid">
          <aside className="browse-filters" aria-label="Lọc nội dung">
            <ExploreNav currentPath={location.pathname} />
            <details open={areFiltersOpen} onToggle={(event) => setAreFiltersOpen(event.currentTarget.open)}>
              <summary>Chuyên mục và thẻ</summary>
              <div className="grid gap-4">
                <CategoryPanel categories={categories} error={getErrorMessage(categoriesQuery.error)}
                  isLoading={isInitialLoading(categoriesQuery)}
                  onRetry={() => void categoriesQuery.refetch()}
                  selectedId={categoryId}
                  onSelect={(id) => updateSearchParams({ categoryId: id, page: undefined })} />
                <TagPanel tags={tags} error={getErrorMessage(tagsQuery.error)}
                  isLoading={isInitialLoading(tagsQuery)}
                  onRetry={() => void tagsQuery.refetch()}
                  selectedId={tagId}
                  onSelect={(id) => updateSearchParams({ tagId: id === tagId ? undefined : id, page: undefined })} />
              </div>
            </details>
          </aside>
          <div className="min-w-0">
            {!sort && <nav aria-label="Bảng tin cộng đồng" className="mb-4 flex border-b border-slate-300">
              {([
                ['latest', 'Mới nhất'],
                ['following', 'Đang theo dõi'],
                ['weekly', 'Nổi bật tuần'],
              ] as const).map(([value, label]) => (
                <button
                  aria-pressed={feed === value}
                  className={`min-w-0 flex-1 border-b-2 px-2 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${feed === value ? 'border-[var(--color-primary)] text-[var(--color-heading)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]'}`}
                  key={value}
                  onClick={() => updateSearchParams({ feed: value === 'latest' ? undefined : value, page: undefined })}
                  type="button"
                >{label}</button>
              ))}
            </nav>}
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <p>{sort === 'discussion'
                ? 'Theo phản hồi mới nhất (gồm chỉnh sửa)'
                : feed === 'weekly'
                  ? 'Các bài được quan tâm qua lượt đánh giá, lưu và trả lời trong 7 ngày gần nhất. Số liệu trên bài là tổng tương tác.'
                  : feed === 'following'
                    ? 'Nội dung công khai từ tác giả bạn theo dõi; bài ghim trước, sau đó mới nhất.'
                    : 'Bài ghim trước, sau đó mới nhất'}</p>
              {!fixedType && <label className="flex items-center gap-2">
                Loại nội dung
                <select className="rounded border border-slate-300 bg-white p-2" value={selectedType ?? ''} onChange={(event) => updateSearchParams({ type: event.target.value, questionStatus: undefined, page: undefined })}>
                  <option value="">Tất cả</option>
                  <option value="Article">Bài viết</option>
                  <option value="Question">Câu hỏi</option>
                </select>
              </label>}
              {selectedType !== 'Article' && <label className="flex flex-wrap items-center gap-2">
                Trạng thái hỏi đáp
                <select className="max-w-full rounded border border-slate-300 bg-white p-2" value={questionStatus ?? ''} onChange={(event) => updateSearchParams({ questionStatus: event.target.value, page: undefined })}>
                  <option value="">Tất cả</option>
                  <option value="unanswered">Chưa có trả lời</option>
                  <option value="unsolved">Có trả lời, chưa giải quyết</option>
                  <option value="solved">Đã giải quyết</option>
                </select>
              </label>}
            </div>
            {(categoryId || tagId || keyword || questionStatus) && <div className="mb-3 flex flex-wrap items-center gap-2 text-sm" aria-label="Bộ lọc đang áp dụng">
              {keyword && <span>Từ khóa: “{keyword}”</span>}
              {categoryId && <button className="tag-filter" onClick={() => updateSearchParams({ categoryId: undefined, page: undefined })} type="button">Bỏ chuyên mục: {categories.find((item) => item.id === categoryId)?.name ?? categoryId} ×</button>}
              {tagId && <button className="tag-filter" onClick={() => updateSearchParams({ tagId: undefined, page: undefined })} type="button">Bỏ thẻ: {tags.find((item) => item.id === tagId)?.name ?? tagId} ×</button>}
              {questionStatus && <button className="tag-filter" onClick={() => updateSearchParams({ questionStatus: undefined, page: undefined })} type="button">Bỏ trạng thái hỏi đáp ×</button>}
              <button className="font-semibold text-blue-700 underline" onClick={() => {
                updateSearchParams({ keyword: undefined, categoryId: undefined, tagId: undefined, questionStatus: undefined, page: undefined })
              }} type="button">Xóa bộ lọc</button>
            </div>}
          <TopicFeed
            key={keyword}
            data={topics}
            error={topicError}
            isLoading={areTopicsLoading}
            onFilter={handleFilter}
            onPageChange={(nextPage) => updateSearchParams({ page: nextPage <= 1 ? undefined : nextPage })}
            onRetry={() => void topicsQuery.refetch()}
            selectedType={selectedType?.toLowerCase() as TopicType | undefined}
            isDiscussion={sort === 'discussion'}
            feed={feed}
            requiresLogin={feed === 'following' && !isAuthLoading && (!user || followingUnauthorized)}
            loginUrl={createAuthUrl('/login', `${location.pathname}${location.search}`)}
            onShowLatest={() => updateSearchParams({ feed: undefined, page: undefined })}
          />
          </div>

          <aside className="browse-questions" aria-label="Câu hỏi cộng đồng">
            <QuestionHighlightsPanel
              data={highlightsQuery.data ?? null}
              error={getErrorMessage(highlightsQuery.error, 'Không thể tải câu hỏi nổi bật.')}
              isLoading={isInitialLoading(highlightsQuery)}
              onRetry={() => void highlightsQuery.refetch()}
            />
          </aside>
        </div>
      </div>
    </main>
  )
}
