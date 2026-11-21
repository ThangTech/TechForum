export type TopicType = 'article' | 'question'

export type QuestionStatus = 'unanswered' | 'unsolved' | 'solved'

export type TopicFeedMode = 'latest' | 'following' | 'weekly' | 'hot' | 'top'

// The time of the posts in the tab "Top".
export type TopicRange = 'day' | 'week' | 'month' | 'all'

export interface TopicCategory { id: string; name: string; slug: string }

export interface TopicAuthor { id: string; displayName: string }

export interface TopicTag { id: string; name: string; slug: string }

export interface TopicMedia { id: string; path: string; contentType: string }

export interface TopicDiscussion {
  answerCount: number
  hasAcceptedAnswer: boolean
  lastActivityAtUtc: string | null
  starCount: number
  bookmarkCount: number
}

export interface TopicSummary {
  id: string
  title: string
  slug: string
  summary: string
  type: TopicType
  category: TopicCategory
  author: TopicAuthor
  tags: TopicTag[]
  publishedAtUtc: string
  isPinned: boolean
  isDiscussionLocked: boolean
  viewCount: number
  shareCount: number
  discussion?: TopicDiscussion | null
  // Address of the first picture of the topic (for example /media/images/abc.png), empty when it has none.
  coverImageUrl?: string | null
  // The vote score (0 while it is hidden for a new post).
  score?: number
  scoreHidden?: boolean
}

export interface TopicDetail extends TopicSummary {
  bodyHtml: string
  createdAtUtc: string
  updatedAtUtc: string | null
}

export interface TopicPage {
  items: TopicSummary[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface TopicFilters {
  page?: number
  pageSize?: number
  keyword?: string
  type?: 'Article' | 'Question'
  categoryId?: string
  tagId?: string
  sort?: 'discussion' | 'weekly' | 'hot' | 'top'
  // For sort=top.
  range?: TopicRange
  questionStatus?: QuestionStatus
}

export interface CreateTopicInput {
  title: string
  summary: string
  bodyHtml: string
  type: TopicType
  categoryId: string
  tagIds: string[]
  mediaIds: string[]
  publish: boolean
}

export interface OwnTopic {
  id: string
  title: string
  slug: string
  summary: string
  bodyHtml: string
  type: TopicType
  status: 'draft' | 'published'
  category: TopicCategory
  tags: TopicTag[]
  media: TopicMedia[]
  createdAtUtc: string
  publishedAtUtc: string | null
}

export interface OwnTopicSummary {
  id: string
  title: string
  summary: string
  type: TopicType
  status: 'draft' | 'published'
  category: TopicCategory
  tags: TopicTag[]
  createdAtUtc: string
  updatedAtUtc: string | null
  publishedAtUtc: string | null
  isHiddenByModerator: boolean
  isDiscussionLocked: boolean
}

export interface OwnTopicPage {
  items: OwnTopicSummary[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
