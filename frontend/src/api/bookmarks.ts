import { ApiError, apiRequest } from './client'
import type { TopicAuthor, TopicCategory, TopicTag, TopicType } from './topics'

export interface BookmarkStatus { count: number; hasBookmark: boolean }
export interface SavedTopic {
  id: string
  title: string
  summary: string
  type: TopicType
  category: TopicCategory
  author: TopicAuthor
  tags: TopicTag[]
  publishedAtUtc: string
  savedAtUtc: string
}
export interface SavedTopicPage {
  items: SavedTopic[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isTag = (value: unknown): value is TopicTag =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.slug === 'string'

const parseStatus = (data: unknown): BookmarkStatus => {
  if (!isRecord(data) || typeof data.count !== 'number' || data.count < 0 || typeof data.hasBookmark !== 'boolean') {
    throw new ApiError(500, 'Dữ liệu Lưu bài từ API không đúng định dạng.')
  }
  return data as unknown as BookmarkStatus
}

const isSavedTopic = (value: unknown): value is SavedTopic =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.summary === 'string' &&
  (value.type === 'article' || value.type === 'question') &&
  isRecord(value.category) && typeof value.category.id === 'string' && typeof value.category.name === 'string' && typeof value.category.slug === 'string' &&
  isRecord(value.author) && typeof value.author.id === 'string' && typeof value.author.displayName === 'string' &&
  Array.isArray(value.tags) && value.tags.every(isTag) &&
  typeof value.publishedAtUtc === 'string' &&
  typeof value.savedAtUtc === 'string'

export const getBookmarkStatus = async (topicId: string, signal?: AbortSignal) =>
  parseStatus(await apiRequest(`/api/topics/${topicId}/bookmark`, { signal }))
export const addBookmark = async (topicId: string) =>
  parseStatus(await apiRequest(`/api/topics/${topicId}/bookmark`, { method: 'PUT' }))
export const removeBookmark = async (topicId: string) =>
  parseStatus(await apiRequest(`/api/topics/${topicId}/bookmark`, { method: 'DELETE' }))

// A page of the posts that belong to the member (the saved posts and the starred posts have the same card).
export const getPersonalTopicPage = async (path: string, errorText: string, signal?: AbortSignal): Promise<SavedTopicPage> => {
  const data: unknown = await apiRequest(path, { signal })
  if (!isRecord(data) || !Array.isArray(data.items) || !data.items.every(isSavedTopic) ||
      typeof data.page !== 'number' || typeof data.pageSize !== 'number' ||
      typeof data.totalItems !== 'number' || typeof data.totalPages !== 'number') {
    throw new ApiError(500, errorText)
  }
  return data as unknown as SavedTopicPage
}

export const getSavedTopics = (page: number, pageSize: number, signal?: AbortSignal): Promise<SavedTopicPage> =>
  getPersonalTopicPage(`/api/bookmarks?page=${page}&pageSize=${pageSize}`, 'Danh sách bài đã lưu từ API không đúng định dạng.', signal)
