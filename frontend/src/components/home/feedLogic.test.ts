import { describe, expect, it } from 'vitest'
import { describeFeed, feedTabs, getFeedSort, parseFeed, parseRange, showsScore, topRanges } from './feedLogic'

describe('parseFeed', () => {
  it('accepts every tab of the feed', () => {
    for (const [feed] of feedTabs) expect(parseFeed(feed)).toBe(feed)
  })

  it('gives "latest" for anything else', () => {
    expect(parseFeed(null)).toBe('latest')
    expect(parseFeed('')).toBe('latest')
    expect(parseFeed('best')).toBe('latest')
  })
})

describe('parseRange', () => {
  it('accepts the four times of "Top"', () => {
    for (const [range] of topRanges) expect(parseRange(range)).toBe(range)
  })

  it('gives this week for anything else', () => {
    expect(parseRange(null)).toBe('week')
    expect(parseRange('year')).toBe('week')
  })
})

describe('getFeedSort', () => {
  it('asks the API to sort for weekly, hot and top only', () => {
    expect(getFeedSort('weekly')).toBe('weekly')
    expect(getFeedSort('hot')).toBe('hot')
    expect(getFeedSort('top')).toBe('top')
    expect(getFeedSort('latest')).toBeUndefined()
    expect(getFeedSort('following')).toBeUndefined()
  })

  it('keeps the fixed sort of a page such as "Thảo luận"', () => {
    expect(getFeedSort('latest', 'discussion')).toBe('discussion')
  })
})

describe('showsScore', () => {
  it('shows the score on the tabs that order by it', () => {
    expect(showsScore('hot')).toBe(true)
    expect(showsScore('top')).toBe(true)
    expect(showsScore('latest')).toBe(false)
    expect(showsScore('weekly')).toBe(false)
  })
})

describe('describeFeed', () => {
  it('tells how each tab is ordered', () => {
    expect(describeFeed('hot', 'week')).toContain('hạ dần')
    expect(describeFeed('top', 'day')).toContain('hôm nay')
    expect(describeFeed('top', 'all')).toContain('mọi thời đại')
    expect(describeFeed('latest', 'week')).toContain('mới nhất')
  })

  it('tells that the score of a new post is hidden', () => {
    expect(describeFeed('hot', 'week')).toContain('2 giờ')
    expect(describeFeed('top', 'week')).toContain('2 giờ')
  })
})
