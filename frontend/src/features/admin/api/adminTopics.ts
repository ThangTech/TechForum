import { ApiError, apiRequest } from '../../../shared/api/client'
import type { TopicType } from '../../topics/types/topics'
import { hasPaging, isRecord } from '../../../shared/api/guards'
import type { AdminTopic, AdminTopicPage, ModerationAction, TopicVisibility, AdminTopicSort } from '../types/adminTopics'

const isAdminTopic = (value: unknown): value is AdminTopic =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  (value.type === 'article' || value.type === 'question') &&
  isRecord(value.category) &&
  typeof value.category.id === 'string' &&
  typeof value.category.name === 'string' &&
  typeof value.category.slug === 'string' &&
  isRecord(value.author) &&
  typeof value.author.id === 'string' &&
  typeof value.author.displayName === 'string' &&
  (value.status === 'draft' || value.status === 'published') &&
  typeof value.createdAtUtc === 'string' &&
  (value.publishedAtUtc === null || typeof value.publishedAtUtc === 'string') &&
  typeof value.isDeleted === 'boolean' &&
  typeof value.isHiddenByModerator === 'boolean' &&
  typeof value.isDiscussionLocked === 'boolean' &&
  typeof value.isPinned === 'boolean' &&
  typeof value.isAutoHidden === 'boolean' &&
  typeof value.pendingReportCount === 'number'

const parseTopic = (data: unknown): AdminTopic => {
  if (!isAdminTopic(data)) throw new ApiError(500, 'Dữ liệu kiểm duyệt từ API không đúng định dạng.')
  return data
}

export const getAdminTopics = async (
  filters: {
    keyword: string
    type: '' | TopicType
    visibility: TopicVisibility
    categoryId?: string
    sort: AdminTopicSort
    page: number
    pageSize: number
  },
  signal?: AbortSignal,
): Promise<AdminTopicPage> => {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) })
  if (filters.keyword) params.set('keyword', filters.keyword)
  if (filters.type) params.set('type', filters.type)
  if (filters.visibility) params.set('visibility', filters.visibility)
  if (filters.categoryId) params.set('categoryId', String(filters.categoryId))
  if (filters.sort) params.set('sort', filters.sort)
  const data: unknown = await apiRequest(`/api/admin/topics?${params.toString()}`, { signal })
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isAdminTopic) ||
    !hasPaging(data)
  ) {
    throw new ApiError(500, 'Danh sách kiểm duyệt từ API không đúng định dạng.')
  }
  return data as unknown as AdminTopicPage
}

export const moderateTopic = async (
  topicId: string,
  action: ModerationAction,
  reason: string,
  categoryId?: string,
): Promise<AdminTopic> =>
  parseTopic(
    await apiRequest(`/api/admin/topics/${topicId}/moderation`, {
      method: 'PUT',
      body: JSON.stringify({ action, reason, categoryId: categoryId ?? null }),
    }),
  )

export const getAdminTopicDetail = async (
  topicId: string,
  signal?: AbortSignal,
): Promise<{ topic: AdminTopic; bodyHtml: string }> => {
  const data: unknown = await apiRequest(`/api/admin/topics/${topicId}`, { signal })
  if (!isRecord(data) || !isAdminTopic(data.topic) || typeof data.bodyHtml !== 'string') {
    throw new ApiError(500, 'Nội dung xem trước từ API không đúng định dạng.')
  }
  return { topic: data.topic, bodyHtml: data.bodyHtml }
}
