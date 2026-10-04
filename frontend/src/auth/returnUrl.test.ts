import { describe, expect, it } from 'vitest'
import { createAuthUrl, getSafeReturnUrl } from './returnUrl'

const origin = 'http://localhost:5173'

describe('getSafeReturnUrl', () => {
  it('keeps an internal path with query and hash', () => {
    expect(getSafeReturnUrl('/topics/12?tab=answers#answer-3', '/', origin))
      .toBe('/topics/12?tab=answers#answer-3')
  })

  it.each([
    null,
    '',
    'https://evil.example/phishing',
    '//evil.example/phishing',
    '/\\evil.example/phishing',
  ])('rejects an unsafe return URL: %s', (value) => {
    expect(getSafeReturnUrl(value, '/account', origin)).toBe('/account')
  })
})

describe('createAuthUrl', () => {
  it('encodes the internal return path', () => {
    expect(createAuthUrl('/login', '/topics/12?tab=answers'))
      .toBe('/login?returnUrl=%2Ftopics%2F12%3Ftab%3Danswers')
  })
})
