import type { TopicType } from './topics'

// The automatic draft of the write form. topicId is null for a new topic, or the id of the topic that is edited.
export interface Draft {
  id: string
  topicId: string | null
  title: string
  summary: string
  bodyHtml: string
  type: TopicType
  categoryId: string | null
  tagIds: string[]
  media: { id: string; path: string; contentType: string }[]
  updatedAtUtc: string
}
