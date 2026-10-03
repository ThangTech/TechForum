export function getSafeReturnUrl(value: string | null, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback
  } catch {
    return fallback
  }
}

export function createAuthUrl(path: '/dang-nhap' | '/dang-ky', returnUrl: string) {
  const params = new URLSearchParams({ returnUrl })
  return `${path}?${params.toString()}`
}
