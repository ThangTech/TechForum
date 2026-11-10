import { describe, expect, it } from 'vitest'
import { hasSameIds } from './skillSelection'

describe('hasSameIds', () => {
  it('is true for the same ids in any order', () => {
    expect(hasSameIds(['t1', 't2', 't3'], ['t3', 't1', 't2'])).toBe(true)
    expect(hasSameIds([], [])).toBe(true)
  })

  it('is false when an id was added, removed or replaced', () => {
    expect(hasSameIds(['t1', 't2'], ['t1'])).toBe(false)
    expect(hasSameIds(['t1'], ['t1', 't2'])).toBe(false)
    expect(hasSameIds(['t1', 't3'], ['t1', 't2'])).toBe(false)
  })
})
