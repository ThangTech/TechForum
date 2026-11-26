import { ApiError, apiRequest } from '../../../shared/api/client'

import { isRecord } from '../../../shared/api/guards'
import type { CommunitySummary, SkillCommunity } from '../types/skills'

export const getSkillCommunity = async (tagId: string, page: number, signal?: AbortSignal): Promise<SkillCommunity> => {
  const data = await apiRequest<unknown>(`/api/tags/${tagId}/community?page=${page}&pageSize=20`, { signal })
  if (!isRecord(data) || !isRecord(data.tag) || typeof data.tag.id !== 'string' ||
      typeof data.tag.name !== 'string' || typeof data.tag.slug !== 'string' ||
      (data.tag.description !== null && typeof data.tag.description !== 'string') ||
      typeof data.topicCount !== 'number' || typeof data.memberCount !== 'number' ||
      !Array.isArray(data.members) || !data.members.every((member) => isRecord(member) &&
        typeof member.id === 'string' && typeof member.displayName === 'string' && typeof member.topicCount === 'number') ||
      typeof data.page !== 'number' || typeof data.pageSize !== 'number' || typeof data.totalPages !== 'number')
    throw new ApiError(500, 'Dữ liệu cộng đồng kỹ năng không đúng định dạng.')
  return data as unknown as SkillCommunity
}

export const getCommunities = async (signal?: AbortSignal): Promise<CommunitySummary[]> => {
  const data = await apiRequest<unknown>('/api/communities', { signal })
  if (!Array.isArray(data) || !data.every((item) => isRecord(item) && isRecord(item.tag) &&
      typeof item.tag.id === 'string' && typeof item.tag.name === 'string' && typeof item.tag.slug === 'string' &&
      (item.tag.description === null || typeof item.tag.description === 'string') &&
      typeof item.topicCount === 'number' && typeof item.memberCount === 'number'))
    throw new ApiError(500, 'Dữ liệu cộng đồng không đúng định dạng.')
  return data as CommunitySummary[]
}
