import type { Tag } from '../../catalog/types/tags'

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
