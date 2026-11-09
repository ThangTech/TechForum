export type VoteDirection = 1 | -1

// The vote that a click sets: pressing the arrow that is already on takes the vote back (0), any other press sets it.
export const getNextVote = (currentVote: number, direction: VoteDirection): number =>
  currentVote === direction ? 0 : direction

// The score as shown: a plus sign for a positive score so it reads as a change ("+3"), "0" for zero.
export const formatScore = (score: number): string => (score > 0 ? `+${score}` : String(score))
