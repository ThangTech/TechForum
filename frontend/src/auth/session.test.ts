import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiError as ApiErrorType } from '../api/client'
import type { AuthSession } from '../types/auth'

const createSession = (accessToken: string, expiresAt: number): AuthSession => ({
  user: {
    id: 'member-1',
    displayName: 'Thành viên A',
    bio: null,
    avatarUrl: null,
    email: 'member.a@techforum.local',
    roles: ['Member'],
  },
  accessToken,
  accessTokenExpiresAtUtc: new Date(expiresAt).toISOString(),
})

type RefreshSession = () => Promise<AuthSession>

// The session module keeps state in module variables, so every test loads a fresh copy.
// The factory receives the ApiError class of that copy, so instanceof checks work.
const loadModules = async (
  createRefreshSession: (ApiError: typeof ApiErrorType) => RefreshSession,
) => {
  vi.resetModules()
  const client = await import('../api/client')
  vi.doMock('../api/auth', () => ({ refreshSession: createRefreshSession(client.ApiError) }))
  const session = await import('./session')
  const store = await import('./authStore')
  return { ...client, ...session, ...store }
}

const jsonResponse = (value: unknown, status = 200) => new Response(
  JSON.stringify(value),
  { status, headers: { 'Content-Type': 'application/json' } },
)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.doUnmock('../api/auth')
  vi.unstubAllGlobals()
})

describe('refreshAccessToken', () => {
  it('sends one refresh request when many requests need a new token at the same time', async () => {
    const refreshSession = vi.fn().mockResolvedValue(createSession('access-2', Date.now() + 900_000))
    const { refreshAccessToken, useAuthStore } = await loadModules(() => refreshSession)

    const results = await Promise.all([refreshAccessToken(), refreshAccessToken(), refreshAccessToken()])

    expect(refreshSession).toHaveBeenCalledTimes(1)
    expect(results).toEqual(['access-2', 'access-2', 'access-2'])
    expect(useAuthStore.getState().accessToken).toBe('access-2')
    expect(useAuthStore.getState().user?.id).toBe('member-1')
  })

  it('can refresh again after the first refresh finished', async () => {
    const refreshSession = vi.fn()
      .mockResolvedValueOnce(createSession('access-2', Date.now() + 900_000))
      .mockResolvedValueOnce(createSession('access-3', Date.now() + 900_000))
    const { refreshAccessToken } = await loadModules(() => refreshSession)

    expect(await refreshAccessToken()).toBe('access-2')
    expect(await refreshAccessToken()).toBe('access-3')
    expect(refreshSession).toHaveBeenCalledTimes(2)
  })

  it.each([401, 423])('clears the session when the server answers %i', async (status) => {
    const { refreshAccessToken, useAuthStore } = await loadModules((ApiError) =>
      vi.fn().mockRejectedValue(new ApiError(status, 'Phiên đăng nhập đã hết hạn')))
    useAuthStore.getState().setSession(createSession('access-1', Date.now() + 900_000))

    expect(await refreshAccessToken()).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('keeps the session when the server cannot be reached', async () => {
    const { refreshAccessToken, useAuthStore } = await loadModules((ApiError) =>
      vi.fn().mockRejectedValue(new ApiError(0, 'Không thể kết nối')))
    useAuthStore.getState().setSession(createSession('access-1', Date.now() + 900_000))

    expect(await refreshAccessToken()).toBeNull()
    expect(useAuthStore.getState().accessToken).toBe('access-1')
  })
})

describe('initializeSession', () => {
  it('restores the session from the refresh cookie and then finishes loading', async () => {
    const refreshSession = vi.fn().mockResolvedValue(createSession('restored', Date.now() + 900_000))
    const { initializeSession, useAuthStore } = await loadModules(() => refreshSession)
    expect(useAuthStore.getState().isLoading).toBe(true)

    initializeSession()
    await vi.waitFor(() => expect(useAuthStore.getState().isLoading).toBe(false))

    expect(useAuthStore.getState().user?.displayName).toBe('Thành viên A')
    expect(useAuthStore.getState().accessToken).toBe('restored')
  })

  it('finishes loading as a guest when there is no refresh cookie', async () => {
    const { initializeSession, useAuthStore } = await loadModules((ApiError) =>
      vi.fn().mockRejectedValue(new ApiError(401, 'Phiên đăng nhập đã hết hạn')))

    initializeSession()
    await vi.waitFor(() => expect(useAuthStore.getState().isLoading).toBe(false))

    expect(useAuthStore.getState().user).toBeNull()
  })

  it('makes the first API request wait for the restore, so it is not sent as a guest', async () => {
    let finishRestore: (session: AuthSession) => void = () => undefined
    const refreshSession = vi.fn().mockReturnValue(new Promise<AuthSession>((resolve) => {
      finishRestore = resolve
    }))
    const { initializeSession, apiRequest } = await loadModules(() => refreshSession)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    initializeSession()
    const request = apiRequest('/api/topics/1/answers')
    await Promise.resolve()
    expect(fetchMock).not.toHaveBeenCalled()

    finishRestore(createSession('restored', Date.now() + 900_000))
    await request

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer restored')
  })

  it('refreshes the access token one minute before it expires', async () => {
    const refreshSession = vi.fn()
      .mockResolvedValueOnce(createSession('first', Date.now() + 900_000))
      .mockResolvedValueOnce(createSession('second', Date.now() + 1_800_000))
    const { initializeSession, useAuthStore } = await loadModules(() => refreshSession)

    initializeSession()
    await vi.waitFor(() => expect(useAuthStore.getState().accessToken).toBe('first'))
    expect(refreshSession).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(13 * 60_000)
    expect(refreshSession).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(2 * 60_000)
    expect(refreshSession).toHaveBeenCalledTimes(2)
    expect(useAuthStore.getState().accessToken).toBe('second')
  })
})
