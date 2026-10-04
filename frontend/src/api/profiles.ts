import { ApiError, apiRequest } from './client'
import { isTopicSummary, type TopicSummary } from './topics'

export interface PublicProfile {
  id: string
  displayName: string
  bio: string | null
  joinedAtUtc: string
  publishedTopicCount: number
  publicAnswerCount: number
  receivedStarCount: number
  followerCount: number
  followingCount: number
  isFollowedByViewer: boolean
  skills: ProfileSkill[]
  badges: ProfileBadge[]
  recentTopics: TopicSummary[]
}

export interface ProfileSkill { tagId: number; name: string; slug: string; topicCount: number }
export interface ProfileBadge { code: string; name: string; description: string }
export interface FollowStatus { isFollowing: boolean; followerCount: number }
export interface FollowMember { id: string; displayName: string; bio: string | null; publishedTopicCount: number; followedAtUtc: string }
export interface FollowMemberPage { items: FollowMember[]; page: number; pageSize: number; totalItems: number; totalPages: number }

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
    (data.bio !== null && typeof data.bio !== 'string') ||
    typeof data.joinedAtUtc !== 'string' ||
    typeof data.publishedTopicCount !== 'number' ||
    typeof data.publicAnswerCount !== 'number' ||
    typeof data.receivedStarCount !== 'number' ||
    typeof data.followerCount !== 'number' ||
    typeof data.followingCount !== 'number' ||
    typeof data.isFollowedByViewer !== 'boolean' ||
    !Array.isArray(data.skills) || !data.skills.every((skill) => isRecord(skill) &&
      typeof skill.tagId === 'number' && typeof skill.name === 'string' &&
      typeof skill.slug === 'string' && typeof skill.topicCount === 'number') ||
    !Array.isArray(data.badges) || !data.badges.every((badge) => isRecord(badge) &&
      typeof badge.code === 'string' && typeof badge.name === 'string' && typeof badge.description === 'string') ||
    !Array.isArray(data.recentTopics) ||
    !data.recentTopics.every(isTopicSummary)
  ) {
    throw new ApiError(500, 'Dữ liệu hồ sơ từ API không đúng định dạng.')
  }

  return data as unknown as PublicProfile
}

const parseFollowStatus = (data: unknown): FollowStatus => {
  if (!isRecord(data) || typeof data.isFollowing !== 'boolean' || typeof data.followerCount !== 'number')
    throw new ApiError(500, 'Trạng thái theo dõi không đúng định dạng.')
  return data as unknown as FollowStatus
}

export const followMember = async (userId: string): Promise<FollowStatus> =>
  parseFollowStatus(await apiRequest(`/api/profiles/${encodeURIComponent(userId)}/follow`, { method: 'PUT' }))

export const unfollowMember = async (userId: string): Promise<FollowStatus> =>
  parseFollowStatus(await apiRequest(`/api/profiles/${encodeURIComponent(userId)}/follow`, { method: 'DELETE' }))

export const getFollowMembers = async (
  userId: string,
  kind: 'followers' | 'following',
  page: number,
  signal?: AbortSignal,
): Promise<FollowMemberPage> => {
  const data = await apiRequest<unknown>(
    `/api/profiles/${encodeURIComponent(userId)}/${kind}?page=${page}&pageSize=20`,
    { signal },
  )
  if (!isRecord(data) || !Array.isArray(data.items) || !data.items.every((item) =>
    isRecord(item) && typeof item.id === 'string' && typeof item.displayName === 'string' &&
    (item.bio === null || typeof item.bio === 'string') && typeof item.publishedTopicCount === 'number' &&
    typeof item.followedAtUtc === 'string') || typeof data.page !== 'number' ||
    typeof data.pageSize !== 'number' || typeof data.totalItems !== 'number' || typeof data.totalPages !== 'number') {
    throw new ApiError(500, 'Danh sách theo dõi không đúng định dạng.')
  }
  return data as unknown as FollowMemberPage
}
