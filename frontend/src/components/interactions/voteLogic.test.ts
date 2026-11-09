import { describe, expect, it } from 'vitest'
import { formatScore, getNextVote } from './voteLogic'

describe('getNextVote', () => {
  it('sets the vote of the arrow that is pressed', () => {
    expect(getNextVote(0, 1)).toBe(1)
    expect(getNextVote(0, -1)).toBe(-1)
  })

  it('takes the vote back when the arrow that is already on is pressed again', () => {
    expect(getNextVote(1, 1)).toBe(0)
    expect(getNextVote(-1, -1)).toBe(0)
  })

  it('changes the vote when the other arrow is pressed', () => {
    expect(getNextVote(1, -1)).toBe(-1)
    expect(getNextVote(-1, 1)).toBe(1)
  })
})

describe('formatScore', () => {
  it('shows a sign for a positive score only', () => {
    expect(formatScore(3)).toBe('+3')
    expect(formatScore(0)).toBe('0')
    expect(formatScore(-2)).toBe('-2')
  })
})
