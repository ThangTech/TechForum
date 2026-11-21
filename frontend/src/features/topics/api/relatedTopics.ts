import { ApiError, apiRequest } from '../../../shared/api/client'

import { isRecord } from '../../../shared/api/guards'
import type { RelatedTopic } from '../types/relatedTopics'

const isRelatedTopic = (value: unknown): value is RelatedTopic =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.summary === 'string' &&
  (value.type === 'article' || value.type === 'question') &&
  isRecord(value.category) &&
  typeof value.category.id === 'string' &&
  typeof value.category.name === 'string' &&
  typeof value.category.slug === 'string' &&
  isRecord(value.author) &&
  typeof value.author.id === 'string' &&
  typeof value.author.displayName === 'string' &&
  typeof value.publishedAtUtc === 'string' &&
  Number.isInteger(value.sharedTagCount) && Number(value.sharedTagCount) >= 0 &&
  typeof value.isSameCategory === 'boolean'

export const getRelatedTopics = async (topicId: string, signal?: AbortSignal): Promise<RelatedTopic[]> => {
  const data: unknown = await apiRequest(`/api/topics/${topicId}/related`, { signal })
  if (!Array.isArray(data) || data.length > 4 || !data.every(isRelatedTopic)) {
    throw new ApiError(500, 'Danh sách nội dung liên quan từ API không đúng định dạng.')
  }

  return data
}
