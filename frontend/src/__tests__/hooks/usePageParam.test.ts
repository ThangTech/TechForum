import { describe, expect, it } from 'vitest'
import { readPageParam } from '../../hooks/usePageParam'

describe('readPageParam', () => {
  it('reads a whole number from 1 up', () => {
    expect(readPageParam('1')).toBe(1)
    expect(readPageParam('27')).toBe(27)
  })

  it('gives page 1 when the address has no page or a bad one', () => {
    expect(readPageParam(null)).toBe(1)
    expect(readPageParam('')).toBe(1)
    expect(readPageParam('0')).toBe(1)
    expect(readPageParam('-3')).toBe(1)
    expect(readPageParam('2.5')).toBe(1)
    expect(readPageParam('abc')).toBe(1)
  })

  it('gives page 1 for a number larger than the API accepts', () => {
    expect(readPageParam('2147483647')).toBe(2147483647)
    expect(readPageParam('2147483648')).toBe(1)
  })
})
