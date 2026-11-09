import { describe, expect, it } from 'vitest'
import { exploreLinks, formatCount, getAccountLinks, getSystemState, takeFirst } from './footerLogic'

describe('getAccountLinks', () => {
  it('gives a guest the way in and no page of a member', () => {
    const paths = getAccountLinks(false).map((link) => link.to)
    expect(paths).toContain('/login')
    expect(paths).toContain('/register')
    expect(paths).not.toContain('/write')
  })

  it('gives a member the pages of their own and no login link', () => {
    const paths = getAccountLinks(true).map((link) => link.to)
    expect(paths).toEqual(expect.arrayContaining(['/write', '/my-topics', '/saved', '/activity', '/notifications']))
    expect(paths).not.toContain('/login')
  })
})

describe('exploreLinks', () => {
  it('points every link to a different page of the site', () => {
    const paths = exploreLinks.map((link) => link.to)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths.every((path) => path.startsWith('/'))).toBe(true)
  })
})

describe('getSystemState', () => {
  it('turns the state of the request into the state of the system', () => {
    expect(getSystemState('pending')).toBe('checking')
    expect(getSystemState('success')).toBe('ok')
    expect(getSystemState('error')).toBe('down')
  })
})

describe('takeFirst', () => {
  it('cuts a long list and accepts a missing one', () => {
    expect(takeFirst([1, 2, 3, 4], 2)).toEqual([1, 2])
    expect(takeFirst([1], 5)).toEqual([1])
    expect(takeFirst(undefined, 3)).toEqual([])
  })
})

describe('formatCount', () => {
  it('groups the thousands the Vietnamese way', () => {
    expect(formatCount(1234)).toBe('1.234')
    expect(formatCount(0)).toBe('0')
  })
})
