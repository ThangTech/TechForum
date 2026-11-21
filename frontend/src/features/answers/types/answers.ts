import type { TopicAuthor } from '../../topics/types/topics'

export interface Answer {
  id: string
  topicId: string
  parentAnswerId: string | null
  replyingTo: TopicAuthor | null
  bodyHtml: string
  author: TopicAuthor
  createdAtUtc: string
  updatedAtUtc: string | null
  isAccepted: boolean
  helpfulCount: number
  isHelpful: boolean
  // The vote score of the answer and the vote of the member who reads it (1, -1 or 0).
  score: number
  myVote: number
  // True while the answer is new: the score is hidden (0) for the first hours.
  scoreHidden: boolean
}

export type AnswerSort = 'oldest' | 'helpful' | 'score'

export interface AnswerHelpfulState {
  helpfulCount: number
  isHelpful: boolean
}

export interface AnswerPage {
  items: Answer[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
