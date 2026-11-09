import { describe, expect, it } from 'vitest'
import { getHashTargetId, getScrollBlock } from './scrollTarget'

describe('getHashTargetId', () => {
  it('gives the id after the hash', () => {
    expect(getHashTargetId('#topic-list')).toBe('topic-list')
    expect(getHashTargetId('#header-search')).toBe('header-search')
  })

  it('decodes a percent-encoded id', () => {
    expect(getHashTargetId('#cau-hoi%20hay')).toBe('cau-hoi hay')
  })

  it('keeps the text when the encoding is broken', () => {
    expect(getHashTargetId('#abc%E0%A4%A')).toBe('abc%E0%A4%A')
  })

  it('gives nothing when there is no target', () => {
    expect(getHashTargetId('')).toBeNull()
    expect(getHashTargetId('#')).toBeNull()
    expect(getHashTargetId('topic-list')).toBeNull()
  })
})

describe('getScrollBlock', () => {
  it('centres a box to type in and puts other targets at the top', () => {
    expect(getScrollBlock('INPUT')).toBe('center')
    expect(getScrollBlock('textarea')).toBe('center')
    expect(getScrollBlock('DIV')).toBe('start')
    expect(getScrollBlock('SECTION')).toBe('start')
  })
})
