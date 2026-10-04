export const getSafeReturnUrl = (
  value: string | null,
  fallback = '/',
  origin = window.location.origin,
) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  try {
    const url = new URL(value, origin)
    return url.origin === origin
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback
  } catch {
    return fallback
  }
}

export const createAuthUrl = (path: '/login' | '/register', returnUrl: string) => {
  const params = new URLSearchParams({ returnUrl })
  return `${path}?${params.toString()}`
}
