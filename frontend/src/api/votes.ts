import { ApiError, apiRequest } from './client'

// The score of a post or an answer (the sum of the votes) and the vote of the signed-in member:
// 1 = upvote, -1 = downvote, 0 = none.
export interface VoteState {
  score: number
  myVote: number
}

export const parseVoteState = (data: unknown): VoteState => {
  if (
    typeof data !== 'object' || data === null ||
    typeof (data as Record<string, unknown>).score !== 'number' ||
    typeof (data as Record<string, unknown>).myVote !== 'number'
  ) {
    throw new ApiError(500, 'Dữ liệu bình chọn từ API không đúng định dạng.')
  }
  const { score, myVote } = data as VoteState
  return { score, myVote }
}

export const getTopicVote = async (topicId: number, signal?: AbortSignal): Promise<VoteState> =>
  parseVoteState(await apiRequest(`/api/topics/${topicId}/vote`, { signal }))

// value: 1 = upvote, -1 = downvote, 0 = take the vote back.
export const setTopicVote = async (topicId: number, value: number): Promise<VoteState> =>
  parseVoteState(await apiRequest(`/api/topics/${topicId}/vote`, { method: 'PUT', body: JSON.stringify({ value }) }))

export const setAnswerVote = async (topicId: number, answerId: number, value: number): Promise<VoteState> =>
  parseVoteState(await apiRequest(`/api/topics/${topicId}/answers/${answerId}/vote`, { method: 'PUT', body: JSON.stringify({ value }) }))
