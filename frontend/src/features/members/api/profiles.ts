import { ApiError, apiRequest } from '../../../shared/api/client'
import { isTopicSummary } from '../../topics/api/topics'

import { hasPaging, isRecord } from '../../../shared/api/guards'
import type { FollowMemberPage, FollowStatus, PublicProfile, SkillTag } from '../types/profiles'
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
    (data.avatarUrl !== null && typeof data.avatarUrl !== 'string') ||
    typeof data.joinedAtUtc !== 'string' ||
    typeof data.publishedTopicCount !== 'number' ||
    typeof data.publicAnswerCount !== 'number' ||
    typeof data.receivedStarCount !== 'number' ||
    typeof data.followerCount !== 'number' ||
    typeof data.followingCount !== 'number' ||
    typeof data.isFollowedByViewer !== 'boolean' ||
    typeof data.reputation !== 'number' ||
    !Array.isArray(data.skills) || !data.skills.every((skill) => isRecord(skill) &&
      typeof skill.tagId === 'string' && typeof skill.name === 'string' &&
      typeof skill.slug === 'string' && typeof skill.topicCount === 'number' && typeof skill.isChosen === 'boolean') ||
    !Array.isArray(data.badges) || !data.badges.every((badge) => isRecord(badge) &&
      typeof badge.code === 'string' && typeof badge.name === 'string' && typeof badge.description === 'string') ||
    !Array.isArray(data.recentTopics) ||
    !data.recentTopics.every(isTopicSummary)
  ) {
    throw new ApiError(500, 'Dữ liệu hồ sơ từ API không đúng định dạng.')
  }

  return data as unknown as PublicProfile
}

const isSkillTag = (value: unknown): value is SkillTag =>
  isRecord(value) && typeof value.tagId === 'string' && typeof value.name === 'string' && typeof value.slug === 'string'

const parseSkillTags = (data: unknown): SkillTag[] => {
  if (!Array.isArray(data) || !data.every(isSkillTag)) {
    throw new ApiError(500, 'Danh sách kỹ năng từ API không đúng định dạng.')
  }
  return data
}

// The skills that the signed-in member chose.
export const getMySkills = async (signal?: AbortSignal): Promise<SkillTag[]> =>
  parseSkillTags(await apiRequest<unknown>('/api/profiles/me/skills', { signal }))

// Replaces the whole list: a skill that is not in tagIds is removed.
export const saveMySkills = async (tagIds: string[]): Promise<SkillTag[]> =>
  parseSkillTags(await apiRequest<unknown>('/api/profiles/me/skills', { method: 'PUT', body: JSON.stringify({ tagIds }) }))

const parseFollowStatus =(data: unknown): FollowStatus => {
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
    typeof item.followedAtUtc === 'string') || !hasPaging(data)) {
    throw new ApiError(500, 'Danh sách theo dõi không đúng định dạng.')
  }
  return data as unknown as FollowMemberPage
}
