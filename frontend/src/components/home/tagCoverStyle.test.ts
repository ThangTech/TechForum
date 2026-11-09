import { describe, expect, it } from 'vitest'
import { getInitials, getTagCover, hashText } from './tagCoverStyle'

describe('getTagCover', () => {
  it('draws the atom for React and a short label for other known tags', () => {
    expect(getTagCover({ slug: 'react', name: 'React' })).toMatchObject({ symbol: 'react', label: 'React' })
    expect(getTagCover({ slug: 'typescript', name: 'TypeScript' })).toMatchObject({ symbol: 'text', label: 'TS' })
    expect(getTagCover({ slug: 'aspnet-core', name: 'ASP.NET Core' }).label).toBe('.NET')
  })

  it('ignores the case of the slug', () => {
    expect(getTagCover({ slug: 'React', name: 'React' }).symbol).toBe('react')
  })

  it('gives a tag that is not known the same colour every time', () => {
    const first = getTagCover({ slug: 'machine-learning', name: 'Machine Learning' })
    const second = getTagCover({ slug: 'machine-learning', name: 'Machine Learning' })
    expect(first).toEqual(second)
    expect(first.label).toBe('ML')
    expect(first.background).toContain('hsl(')
  })

  it('gives different tags different colours', () => {
    const one = getTagCover({ slug: 'kubernetes', name: 'Kubernetes' }).background
    const two = getTagCover({ slug: 'rust', name: 'Rust' }).background
    expect(one).not.toBe(two)
  })
})

describe('getInitials', () => {
  it('takes the first letters of the first two words, in capitals', () => {
    expect(getInitials('machine learning')).toBe('ML')
    expect(getInitials('Go')).toBe('GO')
    expect(getInitials('  Spring   Boot  ')).toBe('SB')
  })

  it('does not fail on an empty name', () => {
    expect(getInitials('   ')).toBe('#')
  })
})

describe('hashText', () => {
  it('is stable and never negative', () => {
    expect(hashText('react')).toBe(hashText('react'))
    expect(hashText('một thẻ có dấu')).toBeGreaterThanOrEqual(0)
  })
})
