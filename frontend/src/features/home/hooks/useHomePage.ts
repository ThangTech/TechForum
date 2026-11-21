import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/client'
import { usePageParam } from '../../../shared/hooks/usePageParam'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { isGuid } from '../../../shared/utils/ids'
import { useAuth } from '../../auth/hooks/authState'
import { createAuthUrl } from '../../auth/utils/returnUrl'
import { useCategories } from '../../catalog/hooks/categories'
import { useTags } from '../../catalog/hooks/tags'
import { useQuestionHighlights } from '../../topics/hooks/questionHighlights'
import { useTopicFeed } from '../../topics/hooks/topics'
import type { QuestionStatus, TopicFeedMode } from '../../topics/types/topics'
import { getFeedSort, parseFeed, parseRange } from '../utils/feedLogic'

// A category or a tag in the address (?categoryId=, ?tagId=) is a GUID; anything else is ignored.
const readId = (value: string | null) => (isGuid(value) ? value.toLowerCase() : undefined)

export interface HomePageOptions {
  fixedType?: 'Article' | 'Question'
  sort?: 'discussion'
  showHighlights?: boolean
}

// The lists of posts (home, articles, questions, discussions, search): the tab, the filters of the address, the list
// itself, the categories and tags of the filters, and the highlights shown above the first page.
export const useHomePage = ({ fixedType, sort, showHighlights = false }: HomePageOptions) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const currentPath = location.pathname
  const { user, isLoading: isAuthLoading } = useAuth()
  const feedParam = searchParams.get('feed')
  const feed: TopicFeedMode = sort ? 'latest' : parseFeed(feedParam)
  const range = parseRange(searchParams.get('range'))
  const page = usePageParam()
  const categoryId = readId(searchParams.get('categoryId'))
  const tagId = readId(searchParams.get('tagId'))
  const keyword = searchParams.get('keyword')?.trim() ?? ''
  const typeParam = searchParams.get('type')
  const selectedType = fixedType ?? (typeParam === 'Article' || typeParam === 'Question' ? typeParam : undefined)
  const statusParam = searchParams.get('questionStatus')
  const questionStatus: QuestionStatus | undefined = selectedType !== 'Article' &&
    (statusParam === 'unanswered' || statusParam === 'unsolved' || statusParam === 'solved') ? statusParam : undefined

  const areHighlightsShown = showHighlights && feed === 'latest' && page === 1 &&
    !categoryId && !tagId && !keyword && !questionStatus

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
    sort: getFeedSort(feed, sort),
    range: feed === 'top' ? range : undefined,
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

  const handleFilter = (key: 'categoryId' | 'tagId', value: string) => {
    updateSearchParams({ [key]: value, page: undefined })
  }

  // The state of a side panel (tags, categories, question highlights): loading, error and how to try again.
  const panelOf = (query: { error: unknown; refetch: () => unknown; isFetching: boolean; data: unknown }, fallback?: string) => ({
    error: getErrorMessage(query.error, fallback),
    isLoading: isInitialLoading(query),
    retry: () => void query.refetch(),
  })

  return {
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
    tagsPanel: panelOf(tagsQuery),
    categoriesPanel: panelOf(categoriesQuery),
    highlights: { data: highlightsQuery.data ?? null, ...panelOf(highlightsQuery, 'Không thể tải câu hỏi nổi bật.') },
    topics,
    topicError,
    areTopicsLoading,
    retryTopics: () => void topicsQuery.refetch(),
    // A guest (or a session that ran out) on the "following" tab is asked to log in instead of seeing an error.
    requiresLogin: feed === 'following' && !isAuthLoading && (!user || followingUnauthorized),
    loginUrl: createAuthUrl('/login', `${location.pathname}${location.search}`),
    updateSearchParams,
    handleFilter,
  }
}
