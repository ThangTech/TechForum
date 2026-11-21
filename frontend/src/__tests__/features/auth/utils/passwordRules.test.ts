import { describe, expect, it } from 'vitest'
import { getLoginNotice, isStrongPassword } from '../../../../features/auth/utils/passwordRules'

describe('isStrongPassword', () => {
  it('accepts 8 to 100 characters with upper, lower, digit and sign', () => {
    expect(isStrongPassword('Abcdef1!')).toBe(true)
  })

  it('refuses a password that misses one kind of character or has a bad length', () => {
    expect(isStrongPassword('abcdef1!')).toBe(false)
    expect(isStrongPassword('ABCDEF1!')).toBe(false)
    expect(isStrongPassword('Abcdefg!')).toBe(false)
    expect(isStrongPassword('Abcdefg1')).toBe(false)
    expect(isStrongPassword('Ab1!')).toBe(false)
    expect(isStrongPassword(`Ab1!${'x'.repeat(97)}`)).toBe(false)
  })
})

describe('getLoginNotice', () => {
  it('reads the text that another page left for the login page', () => {
    expect(getLoginNotice({ notice: 'Đã đổi mật khẩu.' })).toBe('Đã đổi mật khẩu.')
    expect(getLoginNotice({ notice: 3 })).toBeNull()
    expect(getLoginNotice(null)).toBeNull()
  })
})
