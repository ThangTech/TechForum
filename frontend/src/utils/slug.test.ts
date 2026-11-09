import { describe, expect, it } from 'vitest'
import { isValidSlug, toSlug } from './slug'

describe('toSlug', () => {
  it('makes a lower case address with dashes', () => {
    expect(toSlug('Spring Boot', 60)).toBe('spring-boot')
    expect(toSlug('ASP.NET Core', 60)).toBe('asp-net-core')
  })

  it('removes Vietnamese accents and turns đ into d', () => {
    expect(toSlug('Cơ sở dữ liệu', 60)).toBe('co-so-du-lieu')
    expect(toSlug('Đồ án tốt nghiệp', 60)).toBe('do-an-tot-nghiep')
  })

  it('does not leave dashes at the ends or doubled', () => {
    expect(toSlug('  --React   &   Redux--  ', 60)).toBe('react-redux')
    expect(toSlug('C++', 60)).toBe('c')
  })

  it('cuts to the maximum length without a dash at the end', () => {
    expect(toSlug('abc def ghi', 7)).toBe('abc-def')
    expect(toSlug('abc def ghi', 8)).toBe('abc-def')
  })

  it('gives an empty text when there is nothing usable', () => {
    expect(toSlug('', 60)).toBe('')
    expect(toSlug('+++', 60)).toBe('')
  })

  it('always gives an address that passes the check', () => {
    for (const name of ['Spring Boot', 'Cơ sở dữ liệu', 'Node.js 22', 'Trí tuệ nhân tạo (AI)']) {
      expect(isValidSlug(toSlug(name, 60), 60)).toBe(true)
    }
  })
})

describe('isValidSlug', () => {
  it('accepts lower case letters, digits and single dashes', () => {
    expect(isValidSlug('react', 60)).toBe(true)
    expect(isValidSlug('node-js-22', 60)).toBe(true)
  })

  it('refuses what the API refuses', () => {
    expect(isValidSlug('', 60)).toBe(false)
    expect(isValidSlug('Spring', 60)).toBe(false)
    expect(isValidSlug('spring boot', 60)).toBe(false)
    expect(isValidSlug('cơ-sở', 60)).toBe(false)
    expect(isValidSlug('-react', 60)).toBe(false)
    expect(isValidSlug('react-', 60)).toBe(false)
    expect(isValidSlug('re--act', 60)).toBe(false)
  })

  it('refuses an address that is too long', () => {
    expect(isValidSlug('a'.repeat(61), 60)).toBe(false)
    expect(isValidSlug('a'.repeat(60), 60)).toBe(true)
  })
})
