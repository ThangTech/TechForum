// The score of a post or an answer (the sum of the votes) and the vote of the signed-in member:
// 1 = upvote, -1 = downvote, 0 = none.
export interface VoteState {
  score: number
  myVote: number
  // True for a new post or answer: the score is hidden (0) for the first hours.
  scoreHidden: boolean
}
