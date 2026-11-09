import { describe, expect, it } from 'vitest'
import { exploreLinks, getAccountLinks, takeFirst, toTopicList } from './footerLogic'

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
  it('points every link to a different place', () => {
    const paths = exploreLinks.map((link) => link.to)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('sends the search link to the search box of the header and the others to pages of the site', () => {
    const search = exploreLinks.find((link) => link.label === 'Tìm kiếm')
    expect(search?.to).toBe('#header-search')
    expect(exploreLinks.filter((link) => link !== search).every((link) => link.to.startsWith('/'))).toBe(true)
  })
})

describe('toTopicList', () => {
  it('opens a page at its list', () => {
    expect(toTopicList('/articles', 'categoryId=2')).toBe('/articles?categoryId=2#topic-list')
  })
})

describe('takeFirst', () => {
  it('cuts a long list and accepts a missing one', () => {
    expect(takeFirst([1, 2, 3, 4], 2)).toEqual([1, 2])
    expect(takeFirst([1], 5)).toEqual([1])
    expect(takeFirst(undefined, 3)).toEqual([])
  })
})
