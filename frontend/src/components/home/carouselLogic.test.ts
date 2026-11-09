import { describe, expect, it } from 'vitest'
import { getSwipeDirection, isInternalLink, stepIndex } from './carouselLogic'

describe('stepIndex', () => {
  it('moves to the next and the previous slide', () => {
    expect(stepIndex(0, 3, 1)).toBe(1)
    expect(stepIndex(2, 3, -1)).toBe(1)
  })

  it('goes round at both ends', () => {
    expect(stepIndex(2, 3, 1)).toBe(0)
    expect(stepIndex(0, 3, -1)).toBe(2)
  })

  it('stays on the first slide when there are no slides', () => {
    expect(stepIndex(0, 0, 1)).toBe(0)
  })

  it('stays put when there is only one slide', () => {
    expect(stepIndex(0, 1, 1)).toBe(0)
    expect(stepIndex(0, 1, -1)).toBe(0)
  })
})

describe('isInternalLink', () => {
  it('accepts a path of the site', () => {
    expect(isInternalLink('/topics/5')).toBe(true)
  })

  it('refuses addresses of other sites', () => {
    expect(isInternalLink('https://example.com')).toBe(false)
    expect(isInternalLink('//example.com/x')).toBe(false)
    expect(isInternalLink('topics/5')).toBe(false)
  })
})

describe('getSwipeDirection', () => {
  it('tells which way the finger moved', () => {
    expect(getSwipeDirection(200, 100)).toBe(-1)
    expect(getSwipeDirection(100, 200)).toBe(1)
  })

  it('ignores a small move', () => {
    expect(getSwipeDirection(100, 120)).toBe(0)
    expect(getSwipeDirection(100, 100)).toBe(0)
  })
})
