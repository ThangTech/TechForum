// The same rule as the backend: 8 to 100 characters, with an upper-case letter, a lower-case letter, a digit and a sign.
export const isStrongPassword = (password: string) =>
  password.length >= 8 &&
  password.length <= 100 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^a-zA-Z0-9]/.test(password)

export const passwordRuleMessage = 'Mật khẩu cần 8–100 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.'

// A message that another page leaves for the login page (for example after a password change), or null.
export const getLoginNotice = (state: unknown): string | null => {
  if (typeof state !== 'object' || state === null || !('notice' in state)) return null
  return typeof state.notice === 'string' ? state.notice : null
}
