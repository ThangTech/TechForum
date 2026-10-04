import { ApiError, apiRequest } from './client'
import type { Tag } from './tags'

export interface SkillMember { id: string; displayName: string; topicCount: number }
export interface SkillCommunity {
  tag: Tag
  topicCount: number
  memberCount: number
  members: SkillMember[]
  page: number
  pageSize: number
  totalPages: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export const getSkillCommunity = async (tagId: number, page: number, signal?: AbortSignal): Promise<SkillCommunity> => {
  const data = await apiRequest<unknown>(`/api/tags/${tagId}/community?page=${page}&pageSize=20`, { signal })
  if (!isRecord(data) || !isRecord(data.tag) || typeof data.tag.id !== 'number' ||
      typeof data.tag.name !== 'string' || typeof data.tag.slug !== 'string' ||
      (data.tag.description !== null && typeof data.tag.description !== 'string') ||
      typeof data.topicCount !== 'number' || typeof data.memberCount !== 'number' ||
      !Array.isArray(data.members) || !data.members.every((member) => isRecord(member) &&
        typeof member.id === 'string' && typeof member.displayName === 'string' && typeof member.topicCount === 'number') ||
      typeof data.page !== 'number' || typeof data.pageSize !== 'number' || typeof data.totalPages !== 'number')
    throw new ApiError(500, 'Dữ liệu cộng đồng kỹ năng không đúng định dạng.')
  return data as unknown as SkillCommunity
}
