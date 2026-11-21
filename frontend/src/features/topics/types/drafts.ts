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

// What the write form shows about the automatic draft next to its buttons.
export type DraftStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: string }
  | { kind: 'error' }
