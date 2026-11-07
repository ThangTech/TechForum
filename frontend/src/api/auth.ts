import type {
  AuthSession,
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../types/auth'
import { ApiError, apiRequest, type ApiRequestInit } from './client'

const isCurrentUser = (value: unknown): value is CurrentUser => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const user = value as Record<string, unknown>
  return (
    typeof user.id === 'string' &&
    typeof user.displayName === 'string' &&
    (user.bio === null || typeof user.bio === 'string') &&
    (user.avatarUrl === null || typeof user.avatarUrl === 'string') &&
    typeof user.email === 'string' &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === 'string')
  )
}

const isAuthSession = (value: unknown): value is AuthSession => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const session = value as Record<string, unknown>
  return (
    isCurrentUser(session.user) &&
    typeof session.accessToken === 'string' &&
    session.accessToken.length > 0 &&
    typeof session.accessTokenExpiresAtUtc === 'string' &&
    !Number.isNaN(Date.parse(session.accessTokenExpiresAtUtc))
  )
}

const requestUser = async (path: string, init?: ApiRequestInit): Promise<CurrentUser> => {
  const data: unknown = await apiRequest(path, init)

  if (!isCurrentUser(data)) {
    throw new ApiError(500, 'Dữ liệu tài khoản từ API không đúng định dạng.')
  }

  return data
}

// Login, register and refresh answer with an access token. They never send a Bearer token themselves.
const requestSession = async (path: string, init: ApiRequestInit): Promise<AuthSession> => {
  const data: unknown = await apiRequest(path, { ...init, skipAuth: true })

  if (!isAuthSession(data)) {
    throw new ApiError(500, 'Dữ liệu phiên đăng nhập từ API không đúng định dạng.')
  }

  return data
}

export const getCurrentUser = (signal?: AbortSignal) => {
  return requestUser('/api/auth/me', { signal })
}

export const login = (input: LoginInput) => {
  return requestSession('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export const register = (input: RegisterInput) => {
  return requestSession('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// The browser sends the refresh cookie; the body is empty.
export const refreshSession = () => {
  return requestSession('/api/auth/refresh', { method: 'POST' })
}

export const logout = () => {
  return apiRequest<void>('/api/auth/logout', { method: 'POST', skipAuth: true })
}

export const updateProfile = (input: UpdateProfileInput) => {
  return requestUser('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export const changePassword = (input: ChangePasswordInput) => {
  return requestUser('/api/auth/password', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export const updateAvatar = (file: File) => {
  const body = new FormData()
  body.append('file', file)
  return requestUser('/api/auth/avatar', { method: 'POST', body })
}

export const deleteAvatar = () => requestUser('/api/auth/avatar', { method: 'DELETE' })

export const requestPasswordReset = (email: string) => apiRequest<{ message: string }>('/api/auth/forgot-password', {
  method: 'POST', body: JSON.stringify({ email }),
})

export const resetPassword = (email: string, token: string, newPassword: string) => apiRequest<void>('/api/auth/reset-password', {
  method: 'POST', body: JSON.stringify({ email, token, newPassword }),
})
