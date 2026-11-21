import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { TopicType, TopicFeedMode } from '../../topics/types/topics'
import { useHomePage } from '../hooks/useHomePage'
import { TagPanel } from '../components/TagPanel'
import { TopicFeed } from '../../topics/components/TopicFeed'
import { BannerSlider } from '../components/BannerSlider'
import { CategoryChips } from '../components/CategoryChips'
import { ExploreNav } from '../components/ExploreNav'
import { HomeHero } from '../components/HomeHero'
import { TechNewsSection } from '../components/TechNewsSection'
import { HomeTour } from '../components/HomeTour'
import { QuestionHighlightsPanel } from '../../topics/components/QuestionHighlightsPanel'
import { describeFeed, feedTabs, parseRange, topRanges } from '../utils/feedLogic'

interface HomePageProps {
  fixedType?: 'Article' | 'Question'
  title?: string
  description?: string
  sort?: 'discussion'
  showTour?: boolean
  // Shows the banner slider and the technology news above the list (only on the first page without filters).
  showHighlights?: boolean
}

export const HomePage = ({
  fixedType,
  title = 'Cùng học hỏi, chia sẻ và làm chủ công nghệ.',
  description = 'Khám phá các bài viết và câu hỏi mới nhất từ cộng đồng TechForum.',
  sort,
  showTour = false,
  showHighlights = false,
}: HomePageProps) => {
  const {
    currentPath,
    feed,
    range,
    categoryId,
    tagId,
    keyword,
    selectedType,
    questionStatus,
    areHighlightsShown,
    areFiltersOpen,
    setAreFiltersOpen,
    categories,
    tags,
    tagsPanel,
    categoriesPanel,
    highlights,
    topics,
    topicError,
    areTopicsLoading,
    retryTopics,
    requiresLogin,
    loginUrl,
    updateSearchParams,
    handleFilter,
  } = useHomePage({ fixedType, sort, showHighlights })

  return (
    <main className="main-area" id="main-content">
      {showTour && <HomeTour />}
      <div className="page-content">
        <HomeHero title={title} description={description} />

        <div className="content-grid">
          <aside className="browse-filters" aria-label="Lọc nội dung">
            <ExploreNav currentPath={currentPath} />
            <details open={areFiltersOpen} onToggle={(event) => setAreFiltersOpen(event.currentTarget.open)}>
              <summary>Lọc theo thẻ</summary>
              <TagPanel tags={tags} error={tagsPanel.error}
                isLoading={tagsPanel.isLoading}
                onRetry={tagsPanel.retry}
                selectedId={tagId}
                onSelect={(id) => updateSearchParams({ tagId: id === tagId ? undefined : id, page: undefined })} />
            </details>
          </aside>
          <Box sx={{ minWidth: 0 }}>
            {areHighlightsShown && (
              <>
                <BannerSlider />
                <TechNewsSection />
              </>
            )}
            {/* The anchor of the list: footer links such as "/articles?categoryId=1#topic-list" scroll here. */}
            <Box id="topic-list" sx={{ scrollMarginTop: '16px' }} />
            <CategoryChips
              categories={categories}
              error={categoriesPanel.error}
              isLoading={categoriesPanel.isLoading}
              onRetry={categoriesPanel.retry}
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
                : describeFeed(feed, range)}</Typography>
              {feed === 'top' && (
                <TextField
                  fullWidth={false}
                  label="Khoảng thời gian"
                  onChange={(event) => updateSearchParams({ range: parseRange(event.target.value), page: undefined })}
                  select
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ minWidth: 170 }}
                  value={range}
                >
                  {topRanges.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </TextField>
              )}
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
            onRetry={retryTopics}
            selectedType={selectedType?.toLowerCase() as TopicType | undefined}
            isDiscussion={sort === 'discussion'}
            feed={feed}
            requiresLogin={requiresLogin}
            loginUrl={loginUrl}
            onShowLatest={() => updateSearchParams({ feed: undefined, page: undefined })}
          />
          </Box>

          <aside className="browse-questions" aria-label="Câu hỏi cộng đồng">
            <QuestionHighlightsPanel
              data={highlights.data}
              error={highlights.error}
              isLoading={highlights.isLoading}
              onRetry={highlights.retry}
            />
          </aside>
        </div>
      </div>
    </main>
  )
}
