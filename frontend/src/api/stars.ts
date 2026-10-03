import { ApiError, apiRequest } from './client'

export interface TopicStarStatus {
  count: number
  hasStar: boolean
}

const parseStarStatus = (data: unknown): TopicStarStatus => {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('count' in data) ||
    !('hasStar' in data) ||
    typeof data.count !== 'number' ||
    !Number.isInteger(data.count) ||
    data.count < 0 ||
    typeof data.hasStar !== 'boolean'
  ) {
    throw new ApiError(500, 'Dữ liệu Sao hữu ích từ API không đúng định dạng.')
  }

  return data as TopicStarStatus
}

export const getTopicStar = async (
  topicId: number,
  signal?: AbortSignal,
): Promise<TopicStarStatus> =>
  parseStarStatus(await apiRequest(`/api/topics/${topicId}/star`, { signal }))

export const addTopicStar = async (topicId: number): Promise<TopicStarStatus> =>
  parseStarStatus(await apiRequest(`/api/topics/${topicId}/star`, { method: 'PUT' }))

export const removeTopicStar = async (topicId: number): Promise<TopicStarStatus> =>
  parseStarStatus(await apiRequest(`/api/topics/${topicId}/star`, { method: 'DELETE' }))
