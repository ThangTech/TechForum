import type { TopicAuthor, TopicCategory, TopicTag, TopicType } from '../../topics/types/topics'

export interface BookmarkStatus { count: number; hasBookmark: boolean }

export interface SavedTopic {
  id: string
  title: string
  summary: string
  type: TopicType
  category: TopicCategory
  author: TopicAuthor
  tags: TopicTag[]
  publishedAtUtc: string
  savedAtUtc: string
}

export interface SavedTopicPage {
  items: SavedTopic[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
