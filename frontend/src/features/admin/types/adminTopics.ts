import type { TopicAuthor, TopicCategory, TopicType } from '../../topics/types/topics'

export type TopicVisibility = '' | 'visible' | 'draft' | 'hidden' | 'deleted' | 'reported' | 'autohidden'

export type AdminTopicSort = '' | 'reports'

export type ModerationAction = 'hide' | 'restore' | 'lock' | 'unlock' | 'pin' | 'unpin' | 'move'

export interface AdminTopic {
  id: string
  title: string
  type: TopicType
  category: TopicCategory
  author: TopicAuthor
  status: 'draft' | 'published'
  createdAtUtc: string
  publishedAtUtc: string | null
  isDeleted: boolean
  isHiddenByModerator: boolean
  isDiscussionLocked: boolean
  isPinned: boolean
  isAutoHidden: boolean
  pendingReportCount: number
}

export interface AdminTopicPage {
  items: AdminTopic[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
