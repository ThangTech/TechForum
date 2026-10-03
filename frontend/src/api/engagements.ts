import { ApiError, apiRequest } from './client'

export interface TopicEngagement { viewCount: number; shareCount: number }

const parseEngagement = (data: unknown): TopicEngagement => {
  if (typeof data !== 'object' || data === null ||
      typeof (data as Record<string, unknown>).viewCount !== 'number' ||
      typeof (data as Record<string, unknown>).shareCount !== 'number') {
    throw new ApiError(500, 'Số liệu tương tác từ API không đúng định dạng.')
  }
  return data as TopicEngagement
}

export const recordTopicView = async (topicId: number, signal?: AbortSignal): Promise<TopicEngagement> =>
  parseEngagement(await apiRequest(`/api/topics/${topicId}/view`, { method: 'POST', signal }))

export const recordTopicShare = async (topicId: number): Promise<TopicEngagement> =>
  parseEngagement(await apiRequest(`/api/topics/${topicId}/share`, { method: 'POST' }))
