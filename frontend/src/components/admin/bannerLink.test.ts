import { describe, expect, it } from 'vitest'
import { isValidBannerLink } from './bannerLink'

describe('isValidBannerLink', () => {
  it('accepts an empty link, a path of the site and an http or https address', () => {
    expect(isValidBannerLink('')).toBe(true)
    expect(isValidBannerLink('   ')).toBe(true)
    expect(isValidBannerLink('/topics/5')).toBe(true)
    expect(isValidBannerLink('https://example.com/khoa-hoc')).toBe(true)
    expect(isValidBannerLink('http://example.com')).toBe(true)
  })

  it('refuses what the API refuses', () => {
    expect(isValidBannerLink('//example.com')).toBe(false)
    expect(isValidBannerLink('/a\\b')).toBe(false)
    expect(isValidBannerLink('example.com')).toBe(false)
    expect(isValidBannerLink('topics/5')).toBe(false)
    expect(isValidBannerLink('javascript:alert(1)')).toBe(false)
    expect(isValidBannerLink('ftp://example.com')).toBe(false)
  })

  it('refuses a link that is longer than 500 characters', () => {
    expect(isValidBannerLink(`/${'a'.repeat(500)}`)).toBe(false)
    expect(isValidBannerLink(`/${'a'.repeat(499)}`)).toBe(true)
  })
})
