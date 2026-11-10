import { ApiError, apiRequest } from './client'

// The score of a post or an answer (the sum of the votes) and the vote of the signed-in member:
// 1 = upvote, -1 = downvote, 0 = none.
export interface VoteState {
  score: number
  myVote: number
  // True for a new post or answer: the score is hidden (0) for the first hours.
  scoreHidden: boolean
}

export const parseVoteState = (data: unknown): VoteState => {
  if (
    typeof data !== 'object' || data === null ||
    typeof (data as Record<string, unknown>).score !== 'number' ||
    typeof (data as Record<string, unknown>).myVote !== 'number'
  ) {
    throw new ApiError(500, 'Dữ liệu bình chọn từ API không đúng định dạng.')
  }
  const { score, myVote, scoreHidden } = data as VoteState
  return { score, myVote, scoreHidden: scoreHidden === true }
}

export const getTopicVote = async (topicId: string, signal?: AbortSignal): Promise<VoteState> =>
  parseVoteState(await apiRequest(`/api/topics/${topicId}/vote`, { signal }))

// value: 1 = upvote, -1 = downvote, 0 = take the vote back.
export const setTopicVote = async (topicId: string, value: number): Promise<VoteState> =>
  parseVoteState(await apiRequest(`/api/topics/${topicId}/vote`, { method: 'PUT', body: JSON.stringify({ value }) }))

export const setAnswerVote = async (topicId: string, answerId: string, value: number): Promise<VoteState> =>
  parseVoteState(await apiRequest(`/api/topics/${topicId}/answers/${answerId}/vote`, { method: 'PUT', body: JSON.stringify({ value }) }))
