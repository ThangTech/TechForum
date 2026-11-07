import { afterEach, describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { useAuthStore } from '../auth/authStore'
import type { AuthSession } from '../types/auth'
import { queryClient, removeOtherUsersData, shouldRetryQuery } from './queryClient'
import { userKey } from './userScope'

const createSession = (userId: string): AuthSession => ({
  user: {
    id: userId,
    displayName: `Thành viên ${userId}`,
    bio: null,
    avatarUrl: null,
    email: `${userId}@techforum.local`,
    roles: ['Member'],
  },
  accessToken: 'access-token',
  accessTokenExpiresAtUtc: new Date(Date.now() + 900_000).toISOString(),
})

afterEach(() => {
  useAuthStore.getState().clearSession()
  queryClient.clear()
})

describe('shouldRetryQuery', () => {
  it.each([0, 500, 503])('retries once when the status is %i', (status) => {
    expect(shouldRetryQuery(0, new ApiError(status, 'Lỗi'))).toBe(true)
    expect(shouldRetryQuery(1, new ApiError(status, 'Lỗi'))).toBe(false)
  })

  it.each([400, 401, 403, 404, 409])('does not retry a %i answer', (status) => {
    expect(shouldRetryQuery(0, new ApiError(status, 'Lỗi'))).toBe(false)
  })

  it('retries an unknown error once', () => {
    expect(shouldRetryQuery(0, new Error('Không rõ'))).toBe(true)
    expect(shouldRetryQuery(1, new Error('Không rõ'))).toBe(false)
  })
})

describe('removeOtherUsersData', () => {
  it('keeps public data and the data of the current user only', () => {
    queryClient.setQueryData(['categories'], ['public'])
    queryClient.setQueryData(userKey('guest', 'topics'), ['guest data'])
    queryClient.setQueryData(userKey('member-1', 'notifications'), ['first user'])
    queryClient.setQueryData(userKey('member-2', 'notifications'), ['second user'])

    removeOtherUsersData('member-2')

    expect(queryClient.getQueryData(['categories'])).toEqual(['public'])
    expect(queryClient.getQueryData(userKey('guest', 'topics'))).toBeUndefined()
    expect(queryClient.getQueryData(userKey('member-1', 'notifications'))).toBeUndefined()
    expect(queryClient.getQueryData(userKey('member-2', 'notifications'))).toEqual(['second user'])
  })

  it('removes the data of every signed-in user when nobody is signed in', () => {
    queryClient.setQueryData(userKey('member-1', 'notifications'), ['first user'])
    queryClient.setQueryData(userKey('guest', 'topics'), ['guest data'])

    removeOtherUsersData(undefined)

    expect(queryClient.getQueryData(userKey('member-1', 'notifications'))).toBeUndefined()
    expect(queryClient.getQueryData(userKey('guest', 'topics'))).toEqual(['guest data'])
  })
})

describe('sign in and sign out', () => {
  it('removes the private data of a user when the session is cleared', () => {
    useAuthStore.getState().setSession(createSession('member-1'))
    queryClient.setQueryData(userKey('member-1', 'notifications'), ['private'])
    queryClient.setQueryData(['tags'], ['public'])

    useAuthStore.getState().clearSession()

    expect(queryClient.getQueryData(userKey('member-1', 'notifications'))).toBeUndefined()
    expect(queryClient.getQueryData(['tags'])).toEqual(['public'])
  })

  it('removes guest data when a user signs in', () => {
    queryClient.setQueryData(userKey('guest', 'topics', 'following'), ['guest data'])

    useAuthStore.getState().setSession(createSession('member-1'))

    expect(queryClient.getQueryData(userKey('guest', 'topics', 'following'))).toBeUndefined()
  })

  it('keeps the data when the same user only updates the profile', () => {
    useAuthStore.getState().setSession(createSession('member-1'))
    queryClient.setQueryData(userKey('member-1', 'notifications'), ['private'])

    useAuthStore.getState().setUser(createSession('member-1').user)

    expect(queryClient.getQueryData(userKey('member-1', 'notifications'))).toEqual(['private'])
  })
})
