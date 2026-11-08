import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import type { TopicType, QuestionStatus, TopicFeedMode } from '../api/topics'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/authState'
import { createAuthUrl } from '../auth/returnUrl'
import { TagPanel } from '../components/TagPanel'
import { TopicFeed } from '../components/TopicFeed'
import { CategoryChips } from '../components/home/CategoryChips'
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

const feedTabs = [
  ['latest', 'Mới nhất'],
  ['following', 'Đang theo dõi'],
  ['weekly', 'Nổi bật tuần'],
] as const satisfies readonly (readonly [TopicFeedMode, string])[]

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
              <summary>Lọc theo thẻ</summary>
              <TagPanel tags={tags} error={getErrorMessage(tagsQuery.error)}
                isLoading={isInitialLoading(tagsQuery)}
                onRetry={() => void tagsQuery.refetch()}
                selectedId={tagId}
                onSelect={(id) => updateSearchParams({ tagId: id === tagId ? undefined : id, page: undefined })} />
            </details>
          </aside>
          <Box sx={{ minWidth: 0 }}>
            <CategoryChips
              categories={categories}
              error={getErrorMessage(categoriesQuery.error)}
              isLoading={isInitialLoading(categoriesQuery)}
              onRetry={() => void categoriesQuery.refetch()}
              onSelect={(id) => updateSearchParams({ categoryId: id, page: undefined })}
              selectedId={categoryId}
            />
            {!sort && (
              <Tabs
                aria-label="Bảng tin cộng đồng"
                onChange={(_, value: TopicFeedMode) => updateSearchParams({ feed: value === 'latest' ? undefined : value, page: undefined })}
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                value={feed}
                variant="fullWidth"
              >
                {feedTabs.map(([value, label]) => (
                  <Tab
                    key={value}
                    label={label}
                    sx={{ color: 'text.secondary', '&.Mui-selected': { color: 'primary.main' } }}
                    value={value}
                  />
                ))}
              </Tabs>
            )}
            <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
              <Typography color="text.secondary" variant="body2">{sort === 'discussion'
                ? 'Theo phản hồi mới nhất (gồm chỉnh sửa)'
                : feed === 'weekly'
                  ? 'Các bài được quan tâm qua lượt đánh giá, lưu và trả lời trong 7 ngày gần nhất. Số liệu trên bài là tổng tương tác.'
                  : feed === 'following'
                    ? 'Nội dung công khai từ tác giả bạn theo dõi; bài ghim trước, sau đó mới nhất.'
                    : 'Bài ghim trước, sau đó mới nhất'}</Typography>
              {!fixedType && (
                <TextField
                  fullWidth={false}
                  label="Loại nội dung"
                  onChange={(event) => updateSearchParams({ type: event.target.value, questionStatus: undefined, page: undefined })}
                  select
                  size="small"
                  slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                  sx={{ minWidth: 160 }}
                  value={selectedType ?? ''}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="Article">Bài viết</MenuItem>
                  <MenuItem value="Question">Câu hỏi</MenuItem>
                </TextField>
              )}
              {selectedType !== 'Article' && (
                <TextField
                  fullWidth={false}
                  label="Trạng thái hỏi đáp"
                  onChange={(event) => updateSearchParams({ questionStatus: event.target.value, page: undefined })}
                  select
                  size="small"
                  slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                  sx={{ minWidth: 230, maxWidth: '100%' }}
                  value={questionStatus ?? ''}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="unanswered">Chưa có trả lời</MenuItem>
                  <MenuItem value="unsolved">Có trả lời, chưa giải quyết</MenuItem>
                  <MenuItem value="solved">Đã giải quyết</MenuItem>
                </TextField>
              )}
            </Stack>
            {(categoryId || tagId || keyword || questionStatus) && (
              <Stack aria-label="Bộ lọc đang áp dụng" direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                {keyword && <Typography component="span" variant="body2">Từ khóa: “{keyword}”</Typography>}
                {categoryId && (
                  <Chip
                    clickable
                    label={`Bỏ chuyên mục: ${categories.find((item) => item.id === categoryId)?.name ?? categoryId}`}
                    onClick={() => updateSearchParams({ categoryId: undefined, page: undefined })}
                    onDelete={() => updateSearchParams({ categoryId: undefined, page: undefined })}
                    size="small"
                    variant="outlined"
                  />
                )}
                {tagId && (
                  <Chip
                    clickable
                    label={`Bỏ thẻ: ${tags.find((item) => item.id === tagId)?.name ?? tagId}`}
                    onClick={() => updateSearchParams({ tagId: undefined, page: undefined })}
                    onDelete={() => updateSearchParams({ tagId: undefined, page: undefined })}
                    size="small"
                    variant="outlined"
                  />
                )}
                {questionStatus && (
                  <Chip
                    clickable
                    label="Bỏ trạng thái hỏi đáp"
                    onClick={() => updateSearchParams({ questionStatus: undefined, page: undefined })}
                    onDelete={() => updateSearchParams({ questionStatus: undefined, page: undefined })}
                    size="small"
                    variant="outlined"
                  />
                )}
                <Button
                  onClick={() => updateSearchParams({ keyword: undefined, categoryId: undefined, tagId: undefined, questionStatus: undefined, page: undefined })}
                  size="small"
                  sx={{ textDecoration: 'underline' }}
                >Xóa bộ lọc</Button>
              </Stack>
            )}
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
          </Box>

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
