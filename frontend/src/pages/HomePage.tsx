import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories, type Category } from '../api/categories'
import { getTags, type Tag } from '../api/tags'
import { getTopics, type TopicPage, type TopicType } from '../api/topics'
import { CategoryPanel } from '../components/CategoryPanel'
import { TagPanel } from '../components/TagPanel'
import { TopicFeed } from '../components/TopicFeed'
import { HomeTour } from '../components/tour/HomeTour'
import { getQuestionHighlights, type QuestionHighlights } from '../api/questionHighlights'
import { QuestionHighlightsPanel } from '../components/questions/QuestionHighlightsPanel'

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
  const page = readPositiveInteger(searchParams.get('page')) ?? 1
  const categoryId = readPositiveInteger(searchParams.get('categoryId'))
  const tagId = readPositiveInteger(searchParams.get('tagId'))
  const keyword = searchParams.get('keyword')?.trim() ?? ''
  const typeParam = searchParams.get('type')
  const selectedType = fixedType ?? (typeParam === 'Article' || typeParam === 'Question' ? typeParam : undefined)

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [tags, setTags] = useState<Tag[]>([])
  const [areTagsLoading, setAreTagsLoading] = useState(true)
  const [tagError, setTagError] = useState<string | null>(null)
  const [tagRequestVersion, setTagRequestVersion] = useState(0)
  const [topics, setTopics] = useState<TopicPage | null>(null)
  const [areTopicsLoading, setAreTopicsLoading] = useState(true)
  const [topicError, setTopicError] = useState<string | null>(null)
  const [topicRequestVersion, setTopicRequestVersion] = useState(0)
  const [questionHighlights, setQuestionHighlights] = useState<QuestionHighlights | null>(null)
  const [areHighlightsLoading, setAreHighlightsLoading] = useState(true)
  const [highlightsError, setHighlightsError] = useState<string | null>(null)
  const [highlightsVersion, setHighlightsVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getQuestionHighlights(controller.signal)
      .then(setQuestionHighlights)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setHighlightsError(requestError instanceof Error ? requestError.message : 'Không thể tải câu hỏi nổi bật.')
      })
      .finally(() => { if (!controller.signal.aborted) setAreHighlightsLoading(false) })
    return () => controller.abort()
  }, [highlightsVersion])

  useEffect(() => {
    const controller = new AbortController()

    const loadCategories = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setCategories(await getCategories(controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : 'Đã xảy ra lỗi không xác định.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadCategories()
    return () => controller.abort()
  }, [requestVersion])

  useEffect(() => {
    const controller = new AbortController()

    const loadTags = async () => {
      setAreTagsLoading(true)
      setTagError(null)
      try {
        setTags(await getTags(controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setTagError(requestError instanceof Error ? requestError.message : 'Đã xảy ra lỗi không xác định.')
      } finally {
        if (!controller.signal.aborted) setAreTagsLoading(false)
      }
    }

    void loadTags()
    return () => controller.abort()
  }, [tagRequestVersion])

  useEffect(() => {
    const controller = new AbortController()

    const loadTopics = async () => {
      setAreTopicsLoading(true)
      setTopicError(null)
      try {
        setTopics(await getTopics({
          page,
          pageSize: 10,
          keyword: keyword || undefined,
          type: selectedType,
          categoryId,
          tagId,
          sort,
        }, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setTopicError(requestError instanceof Error ? requestError.message : 'Đã xảy ra lỗi không xác định.')
      } finally {
        if (!controller.signal.aborted) setAreTopicsLoading(false)
      }
    }

    void loadTopics()
    return () => controller.abort()
  }, [page, keyword, selectedType, categoryId, tagId, sort, topicRequestVersion])

  const updateSearchParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    })
    setSearchParams(next)
  }

  const handleSearch = (value: string) => {
    updateSearchParams({ keyword: value.trim() || undefined, page: undefined })
  }

  const handleFilter = (key: 'categoryId' | 'tagId', value: number) => {
    updateSearchParams({ [key]: value, page: undefined })
  }

  return (
    <main className="main-area" id="main-content">
      {showTour && <HomeTour />}
      <div className="page-content">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Cộng đồng công nghệ Việt</p>
          <h1 id="page-title">{title}</h1>
          <p className="intro__description">{description}</p>
        </section>

        <div className="content-grid">
          <aside className="browse-filters" aria-label="Lọc nội dung">
            <details open>
              <summary>Chuyên mục và thẻ</summary>
              <div className="grid gap-4">
                <CategoryPanel categories={categories} error={error} isLoading={isLoading}
                  onRetry={() => setRequestVersion((version) => version + 1)}
                  selectedId={categoryId}
                  onSelect={(id) => updateSearchParams({ categoryId: id, page: undefined })} />
                <TagPanel tags={tags} error={tagError} isLoading={areTagsLoading}
                  onRetry={() => setTagRequestVersion((version) => version + 1)}
                  selectedId={tagId}
                  onSelect={(id) => updateSearchParams({ tagId: id === tagId ? undefined : id, page: undefined })} />
              </div>
            </details>
          </aside>
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>{sort === 'discussion' ? 'Theo phản hồi mới nhất (gồm chỉnh sửa)' : 'Bài ghim trước, sau đó mới nhất'}</span>
              {!fixedType && <label className="flex items-center gap-2">
                Loại nội dung
                <select className="rounded border border-slate-300 bg-white p-2" value={selectedType ?? ''} onChange={(event) => updateSearchParams({ type: event.target.value, page: undefined })}>
                  <option value="">Tất cả</option>
                  <option value="Article">Bài viết</option>
                  <option value="Question">Câu hỏi</option>
                </select>
              </label>}
            </div>
            {(categoryId || tagId || keyword) && <div className="mb-3 flex flex-wrap items-center gap-2 text-sm" aria-label="Bộ lọc đang áp dụng">
              {keyword && <span>Từ khóa: “{keyword}”</span>}
              {categoryId && <button className="tag-filter" onClick={() => updateSearchParams({ categoryId: undefined, page: undefined })} type="button">Bỏ chuyên mục: {categories.find((item) => item.id === categoryId)?.name ?? categoryId} ×</button>}
              {tagId && <button className="tag-filter" onClick={() => updateSearchParams({ tagId: undefined, page: undefined })} type="button">Bỏ thẻ: {tags.find((item) => item.id === tagId)?.name ?? tagId} ×</button>}
              <button className="font-semibold text-blue-700 underline" onClick={() => {
                updateSearchParams({ keyword: undefined, categoryId: undefined, tagId: undefined, page: undefined })
              }} type="button">Xóa bộ lọc</button>
            </div>}
          <TopicFeed
            key={keyword}
            data={topics}
            error={topicError}
            isLoading={areTopicsLoading}
            keyword={keyword}
            onFilter={handleFilter}
            onPageChange={(nextPage) => updateSearchParams({ page: nextPage <= 1 ? undefined : nextPage })}
            onRetry={() => setTopicRequestVersion((version) => version + 1)}
            onSearch={handleSearch}
            selectedType={selectedType?.toLowerCase() as TopicType | undefined}
            isDiscussion={sort === 'discussion'}
          />
          </div>

          <aside className="browse-questions" aria-label="Câu hỏi cộng đồng">
            <QuestionHighlightsPanel
              data={questionHighlights}
              error={highlightsError}
              isLoading={areHighlightsLoading}
              onRetry={() => {
                setAreHighlightsLoading(true)
                setHighlightsError(null)
                setHighlightsVersion((version) => version + 1)
              }}
            />
          </aside>
        </div>
      </div>
    </main>
  )
}
