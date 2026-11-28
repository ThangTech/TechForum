import { ApiError, apiRequest } from '../../../shared/api/client'
import { hasPaging, isRecord } from '../../../shared/api/guards'
import type { CreateTopicInput, OwnTopic, OwnTopicPage, OwnTopicSummary, TopicDetail, TopicFilters, TopicMedia, TopicPage, TopicSummary, TopicTag } from '../types/topics'

const isTopicTag = (value: unknown): value is TopicTag =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.slug === 'string'

export const isTopicSummary = (value: unknown): value is TopicSummary => {
  if (!isRecord(value) || !isRecord(value.category) || !isRecord(value.author)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.summary === 'string' &&
    (value.type === 'article' || value.type === 'question') &&
    typeof value.category.id === 'string' &&
    typeof value.category.name === 'string' &&
    typeof value.category.slug === 'string' &&
    typeof value.author.id === 'string' &&
    typeof value.author.displayName === 'string' &&
    Array.isArray(value.tags) &&
    value.tags.every(isTopicTag) &&
    typeof value.publishedAtUtc === 'string' &&
    typeof value.isPinned === 'boolean' &&
    typeof value.isDiscussionLocked === 'boolean' &&
    typeof value.viewCount === 'number' &&
    typeof value.shareCount === 'number' &&
    (value.coverImageUrl == null || typeof value.coverImageUrl === 'string') &&
    (value.score === undefined || typeof value.score === 'number') &&
    (value.scoreHidden === undefined || typeof value.scoreHidden === 'boolean') &&
    (value.discussion == null || (
      isRecord(value.discussion) &&
      Number.isInteger(value.discussion.answerCount) && Number(value.discussion.answerCount) >= 0 &&
      typeof value.discussion.hasAcceptedAnswer === 'boolean' &&
      (value.discussion.lastActivityAtUtc === null || typeof value.discussion.lastActivityAtUtc === 'string') &&
      Number.isInteger(value.discussion.bookmarkCount) && Number(value.discussion.bookmarkCount) >= 0
    ))
  )
}

export const getTopics = async (
  filters: TopicFilters,
  signal?: AbortSignal,
): Promise<TopicPage> => getTopicPage('/api/topics', filters, signal)

export const getFollowingTopics = async (
  filters: TopicFilters,
  signal?: AbortSignal,
): Promise<TopicPage> => getTopicPage('/api/topics/following', filters, signal)

const getTopicPage = async (
  path: string,
  filters: TopicFilters,
  signal?: AbortSignal,
): Promise<TopicPage> => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const data: unknown = await apiRequest(`${path}?${params.toString()}`, { signal })
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isTopicSummary) ||
    !hasPaging(data)
  ) {
    throw new ApiError(500, 'Dữ liệu chủ đề từ API không đúng định dạng.')
  }
  return data as unknown as TopicPage
}

export const getTopic = async (id: string, signal?: AbortSignal): Promise<TopicDetail> => {
  const data: unknown = await apiRequest(`/api/topics/${id}`, { signal })
  if (
    !isTopicSummary(data) ||
    !isRecord(data) ||
    typeof data.bodyHtml !== 'string' ||
    typeof data.createdAtUtc !== 'string' ||
    (data.updatedAtUtc !== null && typeof data.updatedAtUtc !== 'string')
  ) {
    throw new ApiError(500, 'Chi tiết nội dung từ API không đúng định dạng.')
  }
  return data as unknown as TopicDetail
}

const isTopicMedia = (value: unknown): value is TopicMedia =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.path === 'string' &&
  typeof value.contentType === 'string'

const parseOwnTopic = (data: unknown): OwnTopic => {
  if (
    !isRecord(data) ||
    typeof data.id !== 'string' ||
    typeof data.title !== 'string' ||
    typeof data.slug !== 'string' ||
    typeof data.summary !== 'string' ||
    typeof data.bodyHtml !== 'string' ||
    (data.type !== 'article' && data.type !== 'question') ||
    (data.status !== 'draft' && data.status !== 'published') ||
    !isRecord(data.category) ||
    typeof data.category.id !== 'string' ||
    typeof data.category.name !== 'string' ||
    typeof data.category.slug !== 'string' ||
    !Array.isArray(data.tags) ||
    !data.tags.every(isTopicTag) ||
    !Array.isArray(data.media) ||
    !data.media.every(isTopicMedia) ||
    typeof data.createdAtUtc !== 'string' ||
    (data.publishedAtUtc !== null && typeof data.publishedAtUtc !== 'string')
  ) {
    throw new ApiError(500, 'Dữ liệu nội dung cá nhân từ API không đúng định dạng.')
  }
  return data as unknown as OwnTopic
}

export const createTopic = async (input: CreateTopicInput): Promise<OwnTopic> =>
  parseOwnTopic(await apiRequest('/api/topics', {
    method: 'POST',
    body: JSON.stringify(input),
  }))

export const getMyTopic = async (id: string, signal?: AbortSignal): Promise<OwnTopic> =>
  parseOwnTopic(await apiRequest(`/api/topics/mine/${id}`, { signal }))

export const updateTopic = async (id: string, input: CreateTopicInput): Promise<OwnTopic> =>
  parseOwnTopic(await apiRequest(`/api/topics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }))

export const deleteTopic = async (id: string): Promise<void> => {
  await apiRequest(`/api/topics/${id}`, { method: 'DELETE' })
}

const isOwnTopicSummary = (value: unknown): value is OwnTopicSummary =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.summary === 'string' &&
  (value.type === 'article' || value.type === 'question') &&
  (value.status === 'draft' || value.status === 'published') &&
  isRecord(value.category) &&
  typeof value.category.id === 'string' &&
  typeof value.category.name === 'string' &&
  typeof value.category.slug === 'string' &&
  Array.isArray(value.tags) &&
  value.tags.every(isTopicTag) &&
  typeof value.createdAtUtc === 'string' &&
  (value.updatedAtUtc === null || typeof value.updatedAtUtc === 'string') &&
  (value.publishedAtUtc === null || typeof value.publishedAtUtc === 'string') &&
  typeof value.isHiddenByModerator === 'boolean' &&
  typeof value.isDiscussionLocked === 'boolean'

export const getMyTopics = async (
  filters: TopicFilters,
  signal?: AbortSignal,
): Promise<OwnTopicPage> => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const data: unknown = await apiRequest(`/api/topics/mine?${params.toString()}`, { signal })
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isOwnTopicSummary) ||
    !hasPaging(data)
  ) {
    throw new ApiError(500, 'Dữ liệu nội dung cá nhân từ API không đúng định dạng.')
  }

  return data as unknown as OwnTopicPage
}
