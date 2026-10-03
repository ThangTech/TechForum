import { ApiError, apiRequest } from './client'

export type TopicType = 'article' | 'question'

export interface TopicCategory { id: number; name: string; slug: string }
export interface TopicAuthor { id: string; displayName: string }
export interface TopicTag { id: number; name: string; slug: string }

export interface TopicSummary {
  id: number
  title: string
  slug: string
  summary: string
  type: TopicType
  category: TopicCategory
  author: TopicAuthor
  tags: TopicTag[]
  publishedAtUtc: string
  isPinned: boolean
  isDiscussionLocked: boolean
}

export interface TopicDetail extends TopicSummary {
  bodyHtml: string
  createdAtUtc: string
  updatedAtUtc: string | null
}

export interface TopicPage {
  items: TopicSummary[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface TopicFilters {
  page?: number
  pageSize?: number
  keyword?: string
  type?: 'Article' | 'Question'
  categoryId?: number
  tagId?: number
}

export interface CreateTopicInput {
  title: string
  summary: string
  bodyHtml: string
  type: TopicType
  categoryId: number
  tagIds: number[]
  mediaIds: string[]
  publish: boolean
}

export interface OwnTopic {
  id: number
  title: string
  slug: string
  summary: string
  bodyHtml: string
  type: TopicType
  status: 'draft' | 'published'
  category: TopicCategory
  tags: TopicTag[]
  createdAtUtc: string
  publishedAtUtc: string | null
}

export interface OwnTopicSummary {
  id: number
  title: string
  summary: string
  type: TopicType
  status: 'draft' | 'published'
  category: TopicCategory
  tags: TopicTag[]
  createdAtUtc: string
  updatedAtUtc: string | null
  publishedAtUtc: string | null
  isHiddenByModerator: boolean
  isDiscussionLocked: boolean
}

export interface OwnTopicPage {
  items: OwnTopicSummary[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isTopicTag = (value: unknown): value is TopicTag =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.name === 'string' &&
  typeof value.slug === 'string'

export const isTopicSummary = (value: unknown): value is TopicSummary => {
  if (!isRecord(value) || !isRecord(value.category) || !isRecord(value.author)) return false
  return (
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.summary === 'string' &&
    (value.type === 'article' || value.type === 'question') &&
    typeof value.category.id === 'number' &&
    typeof value.category.name === 'string' &&
    typeof value.category.slug === 'string' &&
    typeof value.author.id === 'string' &&
    typeof value.author.displayName === 'string' &&
    Array.isArray(value.tags) &&
    value.tags.every(isTopicTag) &&
    typeof value.publishedAtUtc === 'string' &&
    typeof value.isPinned === 'boolean' &&
    typeof value.isDiscussionLocked === 'boolean'
  )
}

export const getTopics = async (
  filters: TopicFilters,
  signal?: AbortSignal,
): Promise<TopicPage> => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const data: unknown = await apiRequest(`/api/topics?${params.toString()}`, { signal })
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isTopicSummary) ||
    typeof data.page !== 'number' ||
    typeof data.pageSize !== 'number' ||
    typeof data.totalItems !== 'number' ||
    typeof data.totalPages !== 'number'
  ) {
    throw new ApiError(500, 'Dữ liệu chủ đề từ API không đúng định dạng.')
  }
  return data as unknown as TopicPage
}

export const getTopic = async (id: number, signal?: AbortSignal): Promise<TopicDetail> => {
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

export const createTopic = async (input: CreateTopicInput): Promise<OwnTopic> => {
  const data: unknown = await apiRequest('/api/topics', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (
    !isRecord(data) ||
    typeof data.id !== 'number' ||
    typeof data.title !== 'string' ||
    typeof data.slug !== 'string' ||
    typeof data.summary !== 'string' ||
    typeof data.bodyHtml !== 'string' ||
    (data.type !== 'article' && data.type !== 'question') ||
    (data.status !== 'draft' && data.status !== 'published') ||
    !isRecord(data.category) ||
    typeof data.category.id !== 'number' ||
    typeof data.category.name !== 'string' ||
    typeof data.category.slug !== 'string' ||
    !Array.isArray(data.tags) ||
    !data.tags.every(isTopicTag) ||
    typeof data.createdAtUtc !== 'string' ||
    (data.publishedAtUtc !== null && typeof data.publishedAtUtc !== 'string')
  ) {
    throw new ApiError(500, 'Dữ liệu nội dung vừa tạo từ API không đúng định dạng.')
  }

  return data as unknown as OwnTopic
}

const isOwnTopicSummary = (value: unknown): value is OwnTopicSummary =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.title === 'string' &&
  typeof value.summary === 'string' &&
  (value.type === 'article' || value.type === 'question') &&
  (value.status === 'draft' || value.status === 'published') &&
  isRecord(value.category) &&
  typeof value.category.id === 'number' &&
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
    typeof data.page !== 'number' ||
    typeof data.pageSize !== 'number' ||
    typeof data.totalItems !== 'number' ||
    typeof data.totalPages !== 'number'
  ) {
    throw new ApiError(500, 'Dữ liệu nội dung cá nhân từ API không đúng định dạng.')
  }

  return data as unknown as OwnTopicPage
}
