import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, configureApiAuth } from './client'

const jsonResponse = (value: unknown, status = 200) => new Response(
  JSON.stringify(value),
  { status, headers: { 'Content-Type': 'application/json' } },
)

const getHeaders = (fetchMock: ReturnType<typeof vi.fn>, callIndex: number) => {
  const [, request] = fetchMock.mock.calls[callIndex] as [string, RequestInit]
  return request.headers as Headers
}

afterEach(() => {
  configureApiAuth(null)
  vi.unstubAllGlobals()
})

describe('apiRequest', () => {
  it('sends a write request once, with credentials and JSON headers and no CSRF token', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ saved: true }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/api/example', {
      method: 'PUT',
      body: JSON.stringify({ value: 1 }),
    })).resolves.toEqual({ saved: true })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = getHeaders(fetchMock, 0)
    expect(request.credentials).toBe('include')
    expect(headers.get('X-CSRF-TOKEN')).toBeNull()
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('returns undefined for a successful empty response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })))

    await expect(apiRequest('/api/example', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('maps validation problem details to ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({
      title: 'Dữ liệu chưa hợp lệ',
      errors: { displayName: ['Tên hiển thị quá ngắn.'] },
    }, 400)))

    const request = apiRequest('/api/example')
    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({
      status: 400,
      // With no "detail", the first message of a field is shown: it says what is wrong.
      message: 'Tên hiển thị quá ngắn.',
      fieldErrors: { displayName: ['Tên hiển thị quá ngắn.'] },
    })
  })

  it('never shows the English title of ASP.NET for a validation error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({
      title: 'One or more validation errors occurred.',
      errors: { title: ['The Title field is required.'] },
    }, 400)))

    await expect(apiRequest('/api/example')).rejects.toMatchObject({
      status: 400,
      message: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.',
    })
  })

  it('maps a network failure to an ApiError with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')))

    await expect(apiRequest('/api/example')).rejects.toMatchObject({ status: 0 })
  })
})

describe('apiRequest with a login session', () => {
  it('sends the access token as a Bearer header', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    configureApiAuth({
      getAccessToken: async () => 'access-1',
      refreshAccessToken: vi.fn(),
    })

    await apiRequest('/api/example')

    expect(getHeaders(fetchMock, 0).get('Authorization')).toBe('Bearer access-1')
  })

  it('sends no Authorization header when the user is signed out', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    configureApiAuth({
      getAccessToken: async () => null,
      refreshAccessToken: vi.fn(),
    })

    await apiRequest('/api/example')

    expect(getHeaders(fetchMock, 0).has('Authorization')).toBe(false)
  })

  it('refreshes once after a 401 and sends the same request again with the new token', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ title: 'Bạn cần đăng nhập' }, 401))
      .mockResolvedValueOnce(jsonResponse({ saved: true }))
    vi.stubGlobal('fetch', fetchMock)
    const refreshAccessToken = vi.fn().mockResolvedValue('access-2')
    configureApiAuth({ getAccessToken: async () => 'access-1', refreshAccessToken })

    await expect(apiRequest('/api/example', {
      method: 'POST',
      body: JSON.stringify({ value: 1 }),
    })).resolves.toEqual({ saved: true })

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(getHeaders(fetchMock, 0).get('Authorization')).toBe('Bearer access-1')
    expect(getHeaders(fetchMock, 1).get('Authorization')).toBe('Bearer access-2')
    const [, retryRequest] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(retryRequest.body).toBe(JSON.stringify({ value: 1 }))
  })

  it('throws the 401 error when the session cannot be refreshed', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ title: 'Bạn cần đăng nhập' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    configureApiAuth({
      getAccessToken: async () => 'access-1',
      refreshAccessToken: vi.fn().mockResolvedValue(null),
    })

    await expect(apiRequest('/api/example')).rejects.toMatchObject({
      status: 401,
      message: 'Bạn cần đăng nhập',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not retry more than once when the new token is also rejected', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ title: 'Bạn cần đăng nhập' }, 401))
      .mockResolvedValueOnce(jsonResponse({ title: 'Phiên đăng nhập không còn hiệu lực' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    const refreshAccessToken = vi.fn().mockResolvedValue('access-2')
    configureApiAuth({ getAccessToken: async () => 'access-1', refreshAccessToken })

    await expect(apiRequest('/api/example')).rejects.toMatchObject({ status: 401 })
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('skipAuth sends no token and never refreshes, so a wrong password is not retried', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ title: 'Đăng nhập không thành công' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    const getAccessToken = vi.fn().mockResolvedValue('access-1')
    const refreshAccessToken = vi.fn()
    configureApiAuth({ getAccessToken, refreshAccessToken })

    await expect(apiRequest('/api/auth/login', {
      method: 'POST',
      body: '{}',
      skipAuth: true,
    })).rejects.toMatchObject({ status: 401 })

    expect(getAccessToken).not.toHaveBeenCalled()
    expect(refreshAccessToken).not.toHaveBeenCalled()
    expect(getHeaders(fetchMock, 0).has('Authorization')).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
