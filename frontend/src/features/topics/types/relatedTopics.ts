import type { TopicAuthor, TopicCategory, TopicType } from './topics'

export interface RelatedTopic {
  id: string
  title: string
  summary: string
  type: TopicType
  category: TopicCategory
  author: TopicAuthor
  publishedAtUtc: string
  sharedTagCount: number
  isSameCategory: boolean
}
