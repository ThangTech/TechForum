import { describe, expect, it } from 'vitest'
import { readChoice, readFilterFields, withChanges, withPage } from '../../../shared/utils/searchParams'

const form = (values: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

describe('readFilterFields', () => {
  it('keeps the filled fields, trimmed, and drops the empty ones and the page', () => {
    const next = readFilterFields(form({ keyword: '  react ', status: '', page: '4' }), ['keyword', 'status'])
    expect(next.toString()).toBe('keyword=react')
  })
})

describe('withPage', () => {
  it('writes a page after the first and removes page 1', () => {
    const params = new URLSearchParams('keyword=a')
    expect(withPage(params, 3).toString()).toBe('keyword=a&page=3')
    expect(withPage(new URLSearchParams('keyword=a&page=3'), 1).toString()).toBe('keyword=a')
  })
})

describe('withChanges', () => {
  it('changes some filters, removes the empty ones and goes back to page 1', () => {
    const params = new URLSearchParams('keyword=a&type=article&page=2')
    expect(withChanges(params, { keyword: 'b', type: '' }).toString()).toBe('keyword=b')
  })

  it('can keep the page', () => {
    expect(withChanges(new URLSearchParams('page=2'), { type: 'question' }, false).toString()).toBe('page=2&type=question')
  })
})

describe('readChoice', () => {
  it('accepts only the allowed values', () => {
    expect(readChoice('locked', ['locked', 'unlocked'])).toBe('locked')
    expect(readChoice('deleted', ['locked', 'unlocked'])).toBe('')
    expect(readChoice(null, ['locked'])).toBe('')
  })
})
