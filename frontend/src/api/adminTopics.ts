import { ApiError, apiRequest } from './client'
import type { TopicAuthor, TopicCategory, TopicType } from './topics'

export type TopicVisibility = '' | 'visible' | 'hidden' | 'deleted'
export type ModerationAction = 'hide' | 'restore' | 'lock' | 'unlock' | 'pin' | 'unpin' | 'move'

export interface AdminTopic {
  id: number
  title: string
  type: TopicType
  category: TopicCategory
  author: TopicAuthor
  status: 'draft' | 'published'
  createdAtUtc: string
  publishedAtUtc: string | null
  isDeleted: boolean
  isHiddenByModerator: boolean
  isDiscussionLocked: boolean
  isPinned: boolean
}

export interface AdminTopicPage {
  items: AdminTopic[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isAdminTopic = (value: unknown): value is AdminTopic =>
  isRecord(value) && typeof value.id === 'number' && typeof value.title === 'string' &&
  (value.type === 'article' || value.type === 'question') &&
  isRecord(value.category) && typeof value.category.id === 'number' && typeof value.category.name === 'string' && typeof value.category.slug === 'string' &&
  isRecord(value.author) && typeof value.author.id === 'string' && typeof value.author.displayName === 'string' &&
  (value.status === 'draft' || value.status === 'published') && typeof value.createdAtUtc === 'string' &&
  (value.publishedAtUtc === null || typeof value.publishedAtUtc === 'string') &&
  typeof value.isDeleted === 'boolean' && typeof value.isHiddenByModerator === 'boolean' &&
  typeof value.isDiscussionLocked === 'boolean' && typeof value.isPinned === 'boolean'

const parseTopic = (data: unknown): AdminTopic => {
  if (!isAdminTopic(data)) throw new ApiError(500, 'Dữ liệu kiểm duyệt từ API không đúng định dạng.')
  return data
}

export const getAdminTopics = async (filters: {
  keyword: string
  type: '' | TopicType
  visibility: TopicVisibility
  page: number
  pageSize: number
}, signal?: AbortSignal): Promise<AdminTopicPage> => {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) })
  if (filters.keyword) params.set('keyword', filters.keyword)
  if (filters.type) params.set('type', filters.type)
  if (filters.visibility) params.set('visibility', filters.visibility)
  const data: unknown = await apiRequest(`/api/admin/topics?${params.toString()}`, { signal })
  if (!isRecord(data) || !Array.isArray(data.items) || !data.items.every(isAdminTopic) ||
      typeof data.page !== 'number' || typeof data.pageSize !== 'number' ||
      typeof data.totalItems !== 'number' || typeof data.totalPages !== 'number') {
    throw new ApiError(500, 'Danh sách kiểm duyệt từ API không đúng định dạng.')
  }
  return data as unknown as AdminTopicPage
}

export const moderateTopic = async (
  topicId: number,
  action: ModerationAction,
  reason: string,
  categoryId?: number,
): Promise<AdminTopic> => parseTopic(await apiRequest(`/api/admin/topics/${topicId}/moderation`, {
  method: 'PUT',
  body: JSON.stringify({ action, reason, categoryId: categoryId ?? null }),
}))
