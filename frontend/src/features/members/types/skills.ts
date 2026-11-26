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

// Một ô ở trang Cộng đồng: số bài công khai có thẻ này và số thành viên đã đăng chúng.
export interface CommunitySummary {
  tag: { id: string; name: string; slug: string; description: string | null }
  topicCount: number
  memberCount: number
}
