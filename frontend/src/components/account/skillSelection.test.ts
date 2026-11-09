import { describe, expect, it } from 'vitest'
import { hasSameIds } from './skillSelection'

describe('hasSameIds', () => {
  it('is true for the same ids in any order', () => {
    expect(hasSameIds([1, 2, 3], [3, 1, 2])).toBe(true)
    expect(hasSameIds([], [])).toBe(true)
  })

  it('is false when an id was added, removed or replaced', () => {
    expect(hasSameIds([1, 2], [1])).toBe(false)
    expect(hasSameIds([1], [1, 2])).toBe(false)
    expect(hasSameIds([1, 3], [1, 2])).toBe(false)
  })
})
