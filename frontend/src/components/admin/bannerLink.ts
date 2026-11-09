// The same rule as the API: empty, a path inside the site ("/topics/5", but not "//host"), or an http/https address.
export const isValidBannerLink = (link: string): boolean => {
  const value = link.trim()
  if (value === '') return true
  if (value.length > 500) return false
  if (value.startsWith('/')) return !value.startsWith('//') && !value.includes('\\')
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const bannerLinkRuleMessage = 'Dùng đường dẫn trong trang như /topics/5, hoặc địa chỉ đầy đủ như https://example.com.'
