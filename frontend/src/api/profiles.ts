import { ApiError, apiRequest } from './client'
import { isTopicSummary, type TopicSummary } from './topics'

export interface PublicProfile {
  id: string
  displayName: string
  joinedAtUtc: string
  publishedTopicCount: number
  recentTopics: TopicSummary[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const getPublicProfile = async (
  userId: string,
  signal?: AbortSignal,
): Promise<PublicProfile> => {
  const data: unknown = await apiRequest(`/api/profiles/${encodeURIComponent(userId)}`, { signal })
  if (
    !isRecord(data) ||
    typeof data.id !== 'string' ||
    typeof data.displayName !== 'string' ||
    typeof data.joinedAtUtc !== 'string' ||
    typeof data.publishedTopicCount !== 'number' ||
    !Array.isArray(data.recentTopics) ||
    !data.recentTopics.every(isTopicSummary)
  ) {
    throw new ApiError(500, 'Dữ liệu hồ sơ từ API không đúng định dạng.')
  }

  return data as unknown as PublicProfile
}
