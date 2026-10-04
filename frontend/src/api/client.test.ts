import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from './client'

const jsonResponse = (value: unknown, status = 200) => new Response(
  JSON.stringify(value),
  { status, headers: { 'Content-Type': 'application/json' } },
)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRequest', () => {
  it('adds antiforgery token and credentials to a write request', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-token' }))
      .mockResolvedValueOnce(jsonResponse({ saved: true }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/api/example', {
      method: 'PUT',
      body: JSON.stringify({ value: 1 }),
    })).resolves.toEqual({ saved: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [, request] = fetchMock.mock.calls[1] as [string, RequestInit]
    const headers = request.headers as Headers
    expect(request.credentials).toBe('include')
    expect(headers.get('X-CSRF-TOKEN')).toBe('csrf-token')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('returns undefined for a successful empty response', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-token' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

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
      message: 'Dữ liệu chưa hợp lệ',
      fieldErrors: { displayName: ['Tên hiển thị quá ngắn.'] },
    })
  })
})
