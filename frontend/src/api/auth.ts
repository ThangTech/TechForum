import type { CurrentUser, LoginInput, RegisterInput } from '../types/auth'
import { ApiError, apiRequest } from './client'

function isCurrentUser(value: unknown): value is CurrentUser {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const user = value as Record<string, unknown>
  return (
    typeof user.id === 'string' &&
    typeof user.displayName === 'string' &&
    typeof user.email === 'string' &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === 'string')
  )
}

async function requestUser(path: string, init?: RequestInit): Promise<CurrentUser> {
  const data: unknown = await apiRequest(path, init)

  if (!isCurrentUser(data)) {
    throw new ApiError(500, 'Dữ liệu tài khoản từ API không đúng định dạng.')
  }

  return data
}

export function getCurrentUser(signal?: AbortSignal) {
  return requestUser('/api/auth/me', { signal })
}

export function login(input: LoginInput) {
  return requestUser('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function register(input: RegisterInput) {
  return requestUser('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function logout() {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' })
}
