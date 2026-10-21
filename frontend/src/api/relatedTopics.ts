import { ApiError, apiRequest } from './client'
import type { TopicAuthor, TopicCategory, TopicType } from './topics'

export interface RelatedTopic {
  id: number
  title: string
  summary: string
  type: TopicType
  category: TopicCategory
  author: TopicAuthor
  publishedAtUtc: string
  sharedTagCount: number
  isSameCategory: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isRelatedTopic = (value: unknown): value is RelatedTopic =>
  isRecord(value) &&
  Number.isInteger(value.id) && Number(value.id) > 0 &&
  typeof value.title === 'string' &&
  typeof value.summary === 'string' &&
  (value.type === 'article' || value.type === 'question') &&
  isRecord(value.category) &&
  typeof value.category.id === 'number' &&
  typeof value.category.name === 'string' &&
  typeof value.category.slug === 'string' &&
  isRecord(value.author) &&
  typeof value.author.id === 'string' &&
  typeof value.author.displayName === 'string' &&
  typeof value.publishedAtUtc === 'string' &&
  Number.isInteger(value.sharedTagCount) && Number(value.sharedTagCount) >= 0 &&
  typeof value.isSameCategory === 'boolean'

export const getRelatedTopics = async (topicId: number, signal?: AbortSignal): Promise<RelatedTopic[]> => {
  const data: unknown = await apiRequest(`/api/topics/${topicId}/related`, { signal })
  if (!Array.isArray(data) || data.length > 4 || !data.every(isRelatedTopic)) {
    throw new ApiError(500, 'Danh sách nội dung liên quan từ API không đúng định dạng.')
  }

  return data
}
